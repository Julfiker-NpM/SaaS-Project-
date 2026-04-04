import { PageMotion } from "@/components/flowpm/page-motion";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";
import { WorkspaceForm } from "./workspace-form";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) {
    return <p className="text-sm text-flowpm-muted">No workspace found.</p>;
  }

  const org = await prisma.organization.findUnique({
    where: { id: member.orgId },
    select: { name: true, plan: true },
  });

  if (!org) {
    return <p className="text-sm text-flowpm-muted">Organization missing.</p>;
  }

  return (
    <PageMotion>
      <p className="mb-6 text-sm text-flowpm-muted">Workspace name and billing.</p>
      <WorkspaceForm orgName={org.name} plan={org.plan} />
    </PageMotion>
  );
}
