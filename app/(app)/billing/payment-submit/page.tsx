"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFlowAuth } from "@/context/flowpm-auth-context";
import {
  PaymentSubmitClient,
  normalizeGateway,
  normalizePlan,
} from "@/components/flowpm/payment-submit-client";

function PaymentSubmitInner() {
  const searchParams = useSearchParams();
  const { orgId, firebaseUser, authReady } = useFlowAuth();
  const gateway = normalizeGateway(searchParams.get("gateway"));
  const plan = normalizePlan(searchParams.get("plan"));

  if (!authReady) {
    return <p className="text-sm text-flowpm-muted">Loading…</p>;
  }
  if (!orgId || !firebaseUser) {
    return <p className="text-sm text-flowpm-muted">Sign in and open this link from your workspace.</p>;
  }
  if (!gateway || !plan) {
    return (
      <p className="text-sm text-flowpm-muted">
        Invalid link. Open <strong>Settings → Manage subscription</strong> and choose bKash or Nagad again.
      </p>
    );
  }

  return <PaymentSubmitClient orgId={orgId} gateway={gateway} plan={plan} userId={firebaseUser.uid} />;
}

export default function PaymentSubmitPage() {
  return (
    <Suspense fallback={<p className="text-sm text-flowpm-muted">Loading…</p>}>
      <PaymentSubmitInner />
    </Suspense>
  );
}
