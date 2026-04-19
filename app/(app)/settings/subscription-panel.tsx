"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  getPlanLimits,
  normalizeBillingTier,
  planDisplayLabel,
  PRICING_TIERS,
  stripeCheckoutUrl,
  subscriptionUpgradeHint,
} from "@/lib/flowpm/plan-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { bdBkashCheckoutUrl, bdNagadCheckoutUrl } from "@/lib/flowpm/bd-payments";
import { Label } from "@/components/ui/label";

function usageBar(current: number, max: number | null) {
  if (max == null) return null;
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-flowpm-muted">
        {current} of {max} used
        {current >= max ? <span className="font-medium text-flowpm-warning"> — at limit</span> : null}
      </p>
    </div>
  );
}

const STORED_PLAN_OPTIONS = [
  { value: "free", label: "Starter (free)" },
  { value: "pro", label: "Pro" },
  { value: "agency", label: "Ultra (agency)" },
] as const;

function planSelectOptions(current: string): { value: string; label: string }[] {
  const base: { value: string; label: string }[] = STORED_PLAN_OPTIONS.map((o) => ({ ...o }));
  if (!base.some((o) => o.value === current)) base.unshift({ value: current, label: `${current} (current)` });
  return base;
}

export function SubscriptionPanel(props: {
  orgId: string;
  plan: string;
  canManageBilling: boolean;
  onPlanChanged?: () => void | Promise<void>;
}) {
  const { orgId, plan, canManageBilling, onPlanChanged } = props;
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [seatCount, setSeatCount] = useState(0);
  const [adminPlan, setAdminPlan] = useState(plan);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  useEffect(() => {
    setAdminPlan(plan);
  }, [plan]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = getFirebaseDb();
      try {
        const [projSnap, memSnap, invSnap] = await Promise.all([
          getDocs(collection(db, "organizations", orgId, "projects")),
          getDocs(collection(db, "organizations", orgId, "members")),
          getDocs(collection(db, "organizations", orgId, "invites")),
        ]);
        if (!cancelled) {
          setProjectCount(projSnap.size);
          setSeatCount(memSnap.size + invSnap.size);
        }
      } catch {
        if (!cancelled) {
          setProjectCount(0);
          setSeatCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const limits = useMemo(() => getPlanLimits(plan), [plan]);
  const currentTier = normalizeBillingTier(plan);
  const label = planDisplayLabel(plan);
  const portalUrl =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL?.trim() : "";
  const proCheckout = stripeCheckoutUrl("pro");
  const agencyCheckout = stripeCheckoutUrl("agency");
  const bkashUrl = bdBkashCheckoutUrl();
  const nagadUrl = bdNagadCheckoutUrl();
  const adminPlanOptions = useMemo(() => planSelectOptions(plan), [plan]);

  async function saveAdminPlan() {
    if (!canManageBilling) return;
    setAdminSaving(true);
    setAdminMessage(null);
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "organizations", orgId), { plan: adminPlan });
      setAdminMessage("Plan updated for this workspace.");
      await onPlanChanged?.();
    } catch {
      setAdminMessage("Could not update plan. You need owner or admin access.");
    } finally {
      setAdminSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-flowpm-border shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-2">
          <div>
            <CardTitle className="font-heading text-lg">Your subscription</CardTitle>
            <p className="mt-1 text-sm text-flowpm-muted">Usage against your current plan limits.</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              currentTier === "starter"
                ? "bg-[#f5f0e8] text-flowpm-dark dark:bg-white/10 dark:text-flowpm-body"
                : currentTier === "pro"
                  ? "bg-flowpm-primary text-white"
                  : "bg-[#1a1a2e] text-white dark:bg-black",
            )}
          >
            {label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {loading ? (
            <p className="text-flowpm-muted">Loading usage…</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-flowpm-body">Projects</p>
                {limits.maxProjects != null ? (
                  <>
                    {usageBar(projectCount, limits.maxProjects)}
                    <p className="mt-1 text-xs text-flowpm-muted">
                      Your plan allows up to {limits.maxProjects} active projects.
                    </p>
                  </>
                ) : (
                  <p className="text-flowpm-muted">
                    {projectCount} project{projectCount === 1 ? "" : "s"} — no project cap on this plan.
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <p className="font-medium text-flowpm-body">Seats (members + pending invites)</p>
                {limits.maxMembers != null ? (
                  <>
                    {usageBar(seatCount, limits.maxMembers)}
                    <p className="mt-1 text-xs text-flowpm-muted">
                      Each member and each pending invite counts toward this limit.
                    </p>
                  </>
                ) : (
                  <p className="text-flowpm-muted">
                    {seatCount} seat{seatCount === 1 ? "" : "s"} in use — unlimited seats on this plan.
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="font-medium text-flowpm-body">Stripe billing portal</p>
            <p className="text-xs text-flowpm-muted">{subscriptionUpgradeHint()}</p>
            <div className="flex flex-wrap gap-2">
              {portalUrl && canManageBilling ? (
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "inline-flex h-10 items-center justify-center px-4 bg-flowpm-primary hover:bg-flowpm-primary-hover",
                  )}
                >
                  Manage subscription
                </a>
              ) : (
                <Button type="button" variant="outline" className="h-10" disabled>
                  Manage subscription
                </Button>
              )}
            </div>
            {portalUrl && canManageBilling ? (
              <p className="text-xs text-flowpm-muted">Opens Stripe customer billing in a new tab.</p>
            ) : null}
            {!canManageBilling ? (
              <p className="text-xs text-flowpm-muted">Only owners and admins can open billing.</p>
            ) : null}
          </div>

          {canManageBilling ? (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="font-medium text-flowpm-body">Bangladesh mobile banking (bKash / Nagad)</p>
                <p className="text-xs text-flowpm-muted">
                  After a customer pays through your merchant checkout, set the workspace plan below (or automate with
                  a secure server webhook from the gateway). Add public checkout URLs in environment variables so these
                  buttons go live.
                </p>
                <div className="flex flex-wrap gap-2">
                  {bkashUrl ? (
                    <a
                      href={bkashUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "inline-flex h-10 items-center justify-center px-4 bg-[#E2136E] text-white hover:opacity-90",
                      )}
                    >
                      Pay with bKash
                    </a>
                  ) : (
                    <Button type="button" variant="outline" className="h-10" disabled title="Set NEXT_PUBLIC_BKASH_CHECKOUT_URL">
                      Pay with bKash
                    </Button>
                  )}
                  {nagadUrl ? (
                    <a
                      href={nagadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "inline-flex h-10 items-center justify-center px-4 bg-[#f7941d] text-[#1a1a1a] hover:opacity-90",
                      )}
                    >
                      Pay with Nagad
                    </a>
                  ) : (
                    <Button type="button" variant="outline" className="h-10" disabled title="Set NEXT_PUBLIC_NAGAD_CHECKOUT_URL">
                      Pay with Nagad
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-flowpm-muted">
                  Env: <code className="rounded bg-flowpm-canvas px-1 font-mono">NEXT_PUBLIC_BKASH_CHECKOUT_URL</code>,{" "}
                  <code className="rounded bg-flowpm-canvas px-1 font-mono">NEXT_PUBLIC_NAGAD_CHECKOUT_URL</code>
                </p>
              </div>

              <Separator />
              <div className="space-y-3">
                <p className="font-medium text-flowpm-body">Admin: workspace plan (Firestore)</p>
                <p className="text-xs text-flowpm-muted">
                  Owners and admins can set <code className="rounded bg-flowpm-canvas px-1 font-mono">plan</code> on the
                  organization after manual or gateway-confirmed payment. This updates limits immediately for everyone
                  in the workspace.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="admin-plan">Stored plan value</Label>
                    <select
                      id="admin-plan"
                      className="flex h-10 w-full rounded-md border border-flowpm-border bg-flowpm-surface px-3 text-sm text-flowpm-body shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowpm-primary"
                      value={adminPlan}
                      onChange={(e) => setAdminPlan(e.target.value)}
                    >
                      {adminPlanOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover"
                    disabled={adminSaving || adminPlan === plan}
                    onClick={() => void saveAdminPlan()}
                  >
                    {adminSaving ? "Saving…" : "Apply plan"}
                  </Button>
                </div>
                {adminMessage ? <p className="text-xs text-flowpm-muted">{adminMessage}</p> : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 dark:border-white/10">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-[#e8e4dc]">Plans</h2>
        <p className="mt-1 text-sm text-[#a8a8b8]">Choose the tier that fits your team. Prices in BDT (৳). Upgrade anytime.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier;
            const showProCta = tier.id === "pro" && currentTier === "starter" && canManageBilling;
            const showAgencyFromPro = tier.id === "agency" && currentTier === "pro" && canManageBilling;
            const showAgencyFromStarter = tier.id === "agency" && currentTier === "starter" && canManageBilling;

            let cta: ReactNode = null;
            if (isCurrent) {
              cta = (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-10 w-full rounded-lg border-white/20 bg-transparent text-[#e8e4dc] hover:bg-white/5"
                  disabled
                >
                  Current plan
                </Button>
              );
            } else if (tier.id === "starter") {
              cta = (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-4 h-10 w-full text-[#a8a8b8] hover:bg-white/5 hover:text-[#e8e4dc]"
                  disabled
                >
                  Downgrade via support
                </Button>
              );
            } else if (tier.id === "pro" && showProCta) {
              const url = proCheckout;
              cta = url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#5DCAA5] text-sm font-medium text-[#04342C] hover:opacity-90",
                  )}
                >
                  Upgrade to Pro
                </a>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  className="mt-4 h-10 w-full rounded-lg bg-[#5DCAA5] text-[#04342C] hover:opacity-90"
                  disabled
                  title={subscriptionUpgradeHint()}
                >
                  Upgrade to Pro
                </Button>
              );
            } else if (tier.id === "pro" && currentTier === "agency") {
              cta = (
                <p className="mt-4 text-center text-xs text-[#a8a8b8]">
                  You&apos;re on Ultra (includes Pro features).
                </p>
              );
            } else if (tier.id === "agency" && (showAgencyFromPro || showAgencyFromStarter) && canManageBilling) {
              const url = agencyCheckout;
              cta = url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/15 bg-[#1a1a1a] text-sm font-medium text-white hover:bg-white/10",
                  )}
                >
                  Upgrade to Ultra
                </a>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  className="mt-4 h-10 w-full rounded-lg border border-white/15 bg-[#1a1a1a] text-white hover:bg-white/10"
                  disabled
                  title={subscriptionUpgradeHint()}
                >
                  Upgrade to Ultra
                </Button>
              );
            } else if (!canManageBilling && !isCurrent) {
              cta = (
                <p className="mt-4 text-center text-xs text-flowpm-muted">Ask an admin to change plans.</p>
              );
            }

            return (
              <div
                key={tier.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-lg",
                  tier.id === "pro" && "ring-2 ring-[#5DCAA5]/75 lg:scale-[1.02]",
                )}
              >
                <div className={cn("border-b border-white/10 px-4 py-4", tier.headerClass)}>
                  <p className="font-heading text-lg font-semibold">{tier.name}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-1">
                    <span className="text-2xl font-bold">{tier.priceLine}</span>
                    <span className="text-sm opacity-90">{tier.priceSub}</span>
                  </p>
                </div>
                <div className="flex flex-1 flex-col bg-[#0c0c0c] px-4 pb-4 pt-4">
                  <ul className="flex-1 space-y-2.5 text-sm text-[#e8e4dc]/90">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-0.5 shrink-0 font-mono text-[#5DCAA5]" aria-hidden>
                          —
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {cta}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3 rounded-xl border border-[#5DCAA5]/25 bg-[#5DCAA5]/10 p-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#5DCAA5]" aria-hidden />
          <div className="text-sm text-[#e8e4dc]">
            <p className="font-medium text-[#5DCAA5]">Pricing tip</p>
            <p className="mt-1 text-xs text-[#a8a8b8]">
              Offer <strong className="text-[#e8e4dc]">annual billing</strong> with two months free (about a 17%
              discount) to improve cash flow. Many teams choose annual when it&apos;s visible at checkout.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[#a8a8b8]">
          After payment, set <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-[#e8e4dc]">plan</code> on
          the organization in Firestore (e.g. <code className="font-mono">pro</code>,{" "}
          <code className="font-mono">agency</code> for Ultra) or automate with Stripe webhooks.
        </p>
      </div>
    </div>
  );
}
