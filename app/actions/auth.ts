"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { getSessionUser } from "@/lib/session-user";
import { slugify } from "@/lib/slug";

export type AuthFormState = { error?: string } | null;

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base);
  for (let n = 0; n < 1000; n++) {
    const candidate = n === 0 ? root : `${root}-${n}`;
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const orgName = String(formData.get("org") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Enter your name." };
  if (orgName.length < 2) return { error: "Enter an organization name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = await uniqueOrgSlug(orgName);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name, email, passwordHash },
    });
    const org = await tx.organization.create({
      data: { name: orgName, slug, ownerId: u.id },
    });
    await tx.orgMember.create({
      data: { orgId: org.id, userId: u.id, role: "owner", joinedAt: new Date() },
    });
    return u;
  });

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return { error: "Invalid email or password." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password." };

  await setSessionCookie(user.id);
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  return user.id;
}
