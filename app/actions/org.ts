"use server";

import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";

export type OrgFormState = { error?: string; ok?: boolean } | null;

export async function updateWorkspaceAction(_prev: OrgFormState, formData: FormData): Promise<OrgFormState> {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) return { error: "No workspace found." };
  if (member.role !== "owner" && member.role !== "admin") {
    return { error: "You do not have permission to change workspace settings." };
  }

  const name = String(formData.get("orgName") ?? "").trim();
  if (name.length < 2) return { error: "Workspace name is required." };

  await prisma.organization.update({
    where: { id: member.orgId },
    data: { name },
  });

  return { ok: true };
}
