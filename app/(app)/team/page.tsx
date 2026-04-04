import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) {
    return <p className="text-sm text-flowpm-muted">No workspace found.</p>;
  }

  const rows = await prisma.orgMember.findMany({
    where: { orgId: member.orgId },
    include: { user: true },
    orderBy: { id: "asc" },
  });

  const members = rows.map((r) => ({
    id: r.id,
    name: r.user.name ?? "",
    email: r.user.email,
    role: r.role,
  }));

  return <TeamClient members={members} />;
}
