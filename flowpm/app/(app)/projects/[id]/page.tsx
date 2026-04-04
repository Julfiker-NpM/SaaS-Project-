import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";
import { ProjectDetailClient, type BoardColumn } from "./project-detail-client";

const STATUS_ORDER = ["todo", "in_progress", "review", "done"] as const;
const STATUS_LABELS: Record<(typeof STATUS_ORDER)[number], string> = {
  todo: "Todo",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) notFound();

  const project = await prisma.project.findFirst({
    where: { id: params.id, orgId: member.orgId },
    include: { tasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });

  if (!project) notFound();

  const columns: BoardColumn[] = STATUS_ORDER.map((status) => ({
    id: status,
    title: STATUS_LABELS[status],
    tasks: project.tasks
      .filter((t) => t.status === status)
      .map((t) => ({ id: t.id, title: t.title })),
  }));

  return (
    <ProjectDetailClient projectId={project.id} name={project.name} columns={columns} />
  );
}
