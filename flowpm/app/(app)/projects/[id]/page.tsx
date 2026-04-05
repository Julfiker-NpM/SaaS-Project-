"use client";

import { useParams } from "next/navigation";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { ProjectDetailClient } from "./project-detail-client";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { orgId } = useFlowAuth();

  if (!orgId || !projectId) return null;

  return <ProjectDetailClient orgId={orgId} projectId={projectId} />;
}
