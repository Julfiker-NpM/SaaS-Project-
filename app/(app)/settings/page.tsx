"use client";

import { PageMotion } from "@/components/flowpm/page-motion";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { isOrgAdminRole } from "@/lib/flowpm/access";
import { WorkspaceForm } from "./workspace-form";
import { PaymentRequestsPanel } from "@/components/flowpm/payment-requests-panel";

export default function SettingsPage() {
  const { org, orgId, memberRole } = useFlowAuth();
  const canAdmin = isOrgAdminRole(memberRole);

  if (!orgId || !org) {
    return <p className="text-sm text-flowpm-muted">Loading…</p>;
  }

  return (
    <PageMotion>
      <p className="mb-6 text-sm text-flowpm-muted">Workspace name, plan, and subscription usage.</p>
      <WorkspaceForm
        orgId={orgId}
        orgName={org.name}
        plan={org.plan}
        canEditOrgSettings={canAdmin}
        canManageBilling={canAdmin}
      />
      {canAdmin ? (
        <div className="mt-8">
          <PaymentRequestsPanel orgId={orgId} />
        </div>
      ) : null}
    </PageMotion>
  );
}
