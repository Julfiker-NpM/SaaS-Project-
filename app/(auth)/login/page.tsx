"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { FirebaseEnvMissingMessage } from "@/components/flowpm/firebase-env-missing-message";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, loading, configMissing } = useFlowAuth();

  const raw = searchParams.get("next");
  const nextPath =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  useEffect(() => {
    if (configMissing) return;
    if (!loading && firebaseUser) {
      router.replace(nextPath);
    }
  }, [loading, firebaseUser, router, nextPath, configMissing]);

  if (configMissing) {
    return <FirebaseEnvMissingMessage />;
  }

  if (loading || firebaseUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-flowpm-muted">Loading…</div>
    );
  }

  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-flowpm-muted">Loading…</div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
