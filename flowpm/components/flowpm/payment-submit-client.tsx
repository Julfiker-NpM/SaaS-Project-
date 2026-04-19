"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { PRICING_TIERS } from "@/lib/flowpm/plan-limits";
import { bdBkashCheckoutUrl, bdNagadCheckoutUrl } from "@/lib/flowpm/bd-payments";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type PaymentGateway = "bkash" | "nagad";
export type PaymentPlan = "pro" | "agency";

export function normalizeGateway(s: string | null): PaymentGateway | null {
  const g = String(s ?? "").toLowerCase();
  if (g === "bkash" || g === "nagad") return g;
  return null;
}

export function normalizePlan(s: string | null): PaymentPlan | null {
  const p = String(s ?? "").toLowerCase();
  if (p === "pro" || p === "agency") return p;
  return null;
}

export function PaymentSubmitClient(props: {
  orgId: string;
  gateway: PaymentGateway;
  plan: PaymentPlan;
  userId: string;
}) {
  const { orgId, gateway, plan, userId } = props;
  const router = useRouter();
  const db = getFirebaseDb();
  const [payerPhone, setPayerPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  const tier = useMemo(() => PRICING_TIERS.find((t) => t.id === plan), [plan]);
  const label = plan === "agency" ? "Ultra" : "Pro";
  const gatewayLabel = gateway === "bkash" ? "bKash" : "Nagad";
  const bkashMerchant =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BKASH_MERCHANT_NUMBER?.trim() ?? "" : "";
  const nagadMerchant =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_NAGAD_MERCHANT_NUMBER?.trim() ?? "" : "";
  const merchantNo = gateway === "bkash" ? bkashMerchant : nagadMerchant;
  const checkoutUrl = gateway === "bkash" ? bdBkashCheckoutUrl() : bdNagadCheckoutUrl();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = payerPhone.replace(/\s+/g, "").trim();
    const txn = transactionId.trim();
    if (phone.length < 10 || phone.length > 22) {
      setError("Enter the mobile number you paid from (at least 10 digits).");
      return;
    }
    if (txn.length < 6) {
      setError("Enter the transaction ID from your payment receipt.");
      return;
    }
    setPending(true);
    try {
      const payload: Record<string, unknown> = {
        gateway,
        plan,
        payerPhone: phone,
        transactionId: txn,
        submittedByUid: userId,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const n = note.trim();
      if (n) payload.note = n;
      await addDoc(collection(db, "organizations", orgId, "paymentSubmissions"), payload);
      setOk(true);
      window.setTimeout(() => router.push("/settings"), 1800);
    } catch {
      setError("Could not send. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageMotion>
      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-sm text-flowpm-muted">
          <Link href="/settings" className="text-flowpm-primary hover:underline">
            ← Settings
          </Link>
        </p>
        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Confirm {gatewayLabel} payment — {label}
            </CardTitle>
            <p className="text-sm text-flowpm-muted">
              After you pay, enter the number you paid from and the transaction ID. An admin will verify and upgrade
              your workspace plan.
            </p>
            {tier ? (
              <p className="mt-2 text-sm font-medium text-flowpm-body">
                Plan amount (reference): {tier.priceLine} {tier.priceSub}
              </p>
            ) : null}
            {merchantNo ? (
              <p className="mt-2 rounded-lg border border-flowpm-border bg-flowpm-canvas/60 px-3 py-2 text-sm text-flowpm-body">
                Pay to this number: <span className="font-mono font-semibold">{merchantNo}</span>
              </p>
            ) : null}
            {checkoutUrl ? (
              <p className="mt-3 text-sm">
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center px-3")}
                >
                  Open online checkout
                </a>
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            {ok ? (
              <p className="text-sm text-[#0F6E56]">Submitted. Redirecting to Settings…</p>
            ) : (
              <form onSubmit={(ev) => void onSubmit(ev)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payerPhone">Your {gatewayLabel} number (the account you paid from)</Label>
                  <Input
                    id="payerPhone"
                    className="h-10 font-mono"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    required
                    minLength={10}
                    maxLength={22}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="txn">Transaction ID</Label>
                  <Input
                    id="txn"
                    className="h-10 font-mono"
                    placeholder="From SMS or app receipt"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    minLength={6}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    className="h-10"
                    placeholder="Workspace name or extra detail"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                  />
                </div>
                {error ? <p className="text-xs text-flowpm-danger">{error}</p> : null}
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-10 w-full bg-flowpm-primary hover:bg-flowpm-primary-hover sm:w-auto"
                >
                  {pending ? "Submitting…" : "Submit for review"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageMotion>
  );
}
