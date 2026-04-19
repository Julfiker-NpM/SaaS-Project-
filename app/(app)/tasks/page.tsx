"use client";

import { useFlowAuth } from "@/context/flowpm-auth-context";
import { TasksPageClient } from "@/components/flowpm/tasks-page-client";

export default function TasksPage() {
  const { orgId, authReady, memberRole } = useFlowAuth();

  if (!authReady) {
    return <p className="text-sm text-flowpm-muted">Loading…</p>;
  }
  if (!orgId) {
    return <p className="text-sm text-flowpm-muted">You need an active workspace.</p>;
  }

  return <TasksPageClient orgId={orgId} memberRole={memberRole} />;
}
