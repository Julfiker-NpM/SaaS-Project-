"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { PageMotion } from "@/components/flowpm/page-motion";
import { ProjectDetailClient } from "./project-detail-client";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { orgId, authReady, memberRole } = useFlowAuth();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-flowpm-muted">Loading…</div>
    );
  }

  if (!orgId) {
    return (
      <PageMotion>
        <p className="text-sm text-flowpm-body">You need an active workspace to open this project.</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm font-medium text-flowpm-primary hover:underline">
          Go to dashboard
        </Link>
      </PageMotion>
    );
  }

  if (!projectId) {
    return (
      <PageMotion>
        <p className="text-sm text-flowpm-body">This project link is invalid.</p>
        <Link href="/projects" className="mt-3 inline-block text-sm font-medium text-flowpm-primary hover:underline">
          ← All projects
        </Link>
      </PageMotion>
    );
  }

  return <ProjectDetailClient orgId={orgId} projectId={projectId} memberRole={memberRole} />;
}
