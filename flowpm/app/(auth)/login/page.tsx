import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const uid = await getSessionUserId();
  if (uid) {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user) redirect("/dashboard");
  }

  const raw = searchParams.next;
  const nextPath =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  return <LoginForm nextPath={nextPath} />;
}
