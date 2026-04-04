import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const uid = await getSessionUserId();
  if (uid) {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user) redirect("/dashboard");
  }

  return <SignupForm />;
}
