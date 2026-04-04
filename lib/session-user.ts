import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionUserId } from "@/lib/session";

export type SessionUser = { id: string; name: string | null; email: string };

/** One user lookup per request (shared by layout and RSC pages that call requireUserId). */
export const getSessionUser = cache(async (): Promise<SessionUser> => {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    await clearSessionCookie();
    redirect("/login");
  }
  return user;
});
