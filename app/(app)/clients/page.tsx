"use client";

import { useFlowAuth } from "@/context/flowpm-auth-context";
import { ClientsPageClient } from "@/components/flowpm/clients-page-client";

export default function ClientsPage() {
  const { orgId, authReady, memberRole } = useFlowAuth();

  if (!authReady) {
    return <p className="text-sm text-flowpm-muted">Loading…</p>;
  }
  if (!orgId) {
    return <p className="text-sm text-flowpm-muted">You need an active workspace.</p>;
  }

  return <ClientsPageClient orgId={orgId} memberRole={memberRole} />;
}
