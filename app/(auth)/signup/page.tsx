"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureWorkspaceForSignedInUser } from "@/lib/firebase/ensure-workspace-for-user";
import { SignupForm } from "./signup-form";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import { FirebaseEnvMissingMessage } from "@/components/flowpm/firebase-env-missing-message";

export default function SignupPage() {
  const router = useRouter();
  const { firebaseUser, loading, orgId, org, configMissing, authReady, refreshProfile } = useFlowAuth();
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getRedirectResult(getFirebaseAuth());
        if (cancelled || !result?.user) return;
        await ensureWorkspaceForSignedInUser(result.user);
        await refreshProfile();
        if (!cancelled) {
          router.replace("/dashboard");
          router.refresh();
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Could not finish sign-in. Try again.";
          setRedirectError(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, refreshProfile]);

  useEffect(() => {
    if (configMissing || !authReady) return;
    if (!loading && firebaseUser && orgId && org) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [configMissing, authReady, loading, firebaseUser, orgId, org, router]);

  if (configMissing) {
    return <FirebaseEnvMissingMessage />;
  }

  if (!authReady || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-flowpm-muted">Loading…</div>
    );
  }

  if (firebaseUser && orgId && org) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-flowpm-muted">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {redirectError ? (
        <p className="rounded-lg border border-flowpm-border bg-flowpm-surface px-3 py-2 text-center text-xs text-flowpm-danger">
          {redirectError}
        </p>
      ) : null}
      <SignupForm />
    </div>
  );
}
