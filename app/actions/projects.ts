"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/org";
import { requireUserId } from "@/app/actions/auth";

export type ProjectFormState = { error?: string } | null;

export async function createProjectAction(_prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const userId = await requireUserId();
  const member = await getMembershipForUser(userId);
  if (!member) return { error: "No workspace found." };

  const name = String(formData.get("name") ?? "").trim();
  const clientName = String(formData.get("client") ?? "").trim();
  const dueRaw = String(formData.get("due") ?? "").trim();

  if (name.length < 2) return { error: "Project name is required." };

  let clientId: string | undefined;
  if (clientName) {
    const existing = await prisma.client.findFirst({
      where: { orgId: member.orgId, name: clientName },
    });
    if (existing) clientId = existing.id;
    else {
      const c = await prisma.client.create({
        data: { orgId: member.orgId, name: clientName },
      });
      clientId = c.id;
    }
  }

  let dueDate: Date | undefined;
  if (dueRaw) {
    const d = new Date(dueRaw);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }

  const project = await prisma.project.create({
    data: {
      orgId: member.orgId,
      name,
      clientId,
      createdById: userId,
      dueDate: dueDate ?? null,
    },
  });

  redirect(`/projects/${project.id}`);
}
