import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";
import { endOfUtcDay, formatRelativeShort, startOfUtcDay, startOfUtcMonth } from "@/lib/dates";
import { taskProgressPercent } from "@/lib/task-progress";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) {
    return (
      <p className="text-sm text-flowpm-muted">
        No workspace membership. Complete signup or contact support.
      </p>
    );
  }

  const orgId = member.orgId;
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = endOfUtcDay(now);
  const monthStart = startOfUtcMonth(now);
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const [
    activeProjects,
    projectsThisMonth,
    tasksDueToday,
    highPriorityDueToday,
    hoursAgg,
    memberCount,
    projectRows,
    myTasksRaw,
    comments,
  ] = await Promise.all([
    prisma.project.count({ where: { orgId, status: "active" } }),
    prisma.project.count({ where: { orgId, createdAt: { gte: monthStart } } }),
    prisma.task.count({
      where: {
        project: { orgId },
        dueDate: { gte: dayStart, lte: dayEnd },
        status: { not: "done" },
      },
    }),
    prisma.task.count({
      where: {
        project: { orgId },
        dueDate: { gte: dayStart, lte: dayEnd },
        status: { not: "done" },
        priority: "high",
      },
    }),
    prisma.timeEntry.aggregate({
      where: {
        project: { orgId },
        date: { gte: weekStart },
      },
      _sum: { hours: true },
    }),
    prisma.orgMember.count({ where: { orgId } }),
    prisma.project.findMany({
      where: { orgId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        tasks: { select: { status: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        project: { orgId },
        dueDate: { gte: dayStart, lte: dayEnd },
        status: { not: "done" },
      },
      take: 8,
      orderBy: { dueDate: "asc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.taskComment.findMany({
      where: { task: { project: { orgId } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        task: { select: { title: true } },
      },
    }),
  ]);

  const hoursWeek = hoursAgg._sum.hours ?? 0;

  const projects = projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    progress: taskProgressPercent(p.tasks),
    clientLabel: p.client?.name ?? "No client",
    color: p.color,
  }));

  const myTasks = myTasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    projectName: t.project.name,
    dueLabel: "Today",
  }));

  const activity = comments.map((c) => {
    const who = c.user.name?.trim() || c.user.email.split("@")[0] || "Someone";
    return {
      id: c.id,
      who,
      action: `commented on “${c.task.title}”`,
      when: formatRelativeShort(c.createdAt),
    };
  });

  return (
    <DashboardClient
      stats={{
        activeProjects,
        projectsThisMonth,
        tasksDueToday,
        highPriorityDueToday,
        hoursWeek,
        memberCount,
      }}
      projects={projects}
      myTasks={myTasks}
      activity={activity}
    />
  );
}
