import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";
import { taskProgressPercent } from "@/lib/task-progress";
import { ProjectsListClient } from "./projects-list-client";

export default async function ProjectsPage() {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) {
    return <p className="text-sm text-flowpm-muted">No workspace found.</p>;
  }

  const rows = await prisma.project.findMany({
    where: { orgId: member.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      tasks: { select: { status: true } },
    },
  });

  const projects = rows.map((p) => ({
    id: p.id,
    name: p.name,
    clientLabel: p.client?.name ?? "No client",
    status: p.status,
    progress: taskProgressPercent(p.tasks),
    dueLabel: p.dueDate
      ? p.dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—",
    color: p.color,
  }));

  return <ProjectsListClient projects={projects} />;
}
