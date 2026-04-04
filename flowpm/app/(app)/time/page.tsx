import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";
import { endOfUtcDay, startOfUtcDay } from "@/lib/dates";
import { TimeClient } from "./time-client";

export default async function TimePage() {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) {
    return <p className="text-sm text-flowpm-muted">No workspace found.</p>;
  }

  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = endOfUtcDay(now);
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const [todayRaw, weekAgg] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId,
        project: { orgId: member.orgId },
        date: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.timeEntry.aggregate({
      where: {
        userId,
        project: { orgId: member.orgId },
        date: { gte: weekStart },
      },
      _sum: { hours: true },
    }),
  ]);

  const todayEntries = todayRaw.map((e) => ({
    id: e.id,
    hours: e.hours,
    description: e.description,
    projectName: e.project.name,
    dateLabel: e.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const weekHours = weekAgg._sum.hours ?? 0;

  return <TimeClient todayEntries={todayEntries} weekHours={weekHours} />;
}
