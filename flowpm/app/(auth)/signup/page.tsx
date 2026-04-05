"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "./signup-form";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { FirebaseEnvMissingMessage } from "@/components/flowpm/firebase-env-missing-message";

export default function SignupPage() {
  const router = useRouter();
  const { firebaseUser, loading, configMissing } = useFlowAuth();

  useEffect(() => {
    if (configMissing) return;
    if (!loading && firebaseUser) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, router, configMissing]);

  if (configMissing) {
    return <FirebaseEnvMissingMessage />;
  }

  if (loading || firebaseUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-flowpm-muted">Loading…</div>
    );
  }

  return <SignupForm />;
}
