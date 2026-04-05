"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, getDocs } from "firebase/firestore";
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

export function SubscriptionPanel(props: {
  orgId: string;
  plan: string;
  canManageBilling: boolean;
}) {
  const { orgId, plan, canManageBilling } = props;
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [seatCount, setSeatCount] = useState(0);

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
            <p className="font-medium text-flowpm-body">Billing portal</p>
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
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-flowpm-dark">Plans</h2>
        <p className="mt-1 text-sm text-flowpm-muted">Choose the tier that fits your team. Upgrade anytime.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier;
            const showProCta = tier.id === "pro" && currentTier === "starter" && canManageBilling;
            const showAgencyFromPro = tier.id === "agency" && currentTier === "pro" && canManageBilling;
            const showAgencyFromStarter = tier.id === "agency" && currentTier === "starter" && canManageBilling;

            let cta: ReactNode = null;
            if (isCurrent) {
              cta = (
                <Button type="button" variant="outline" className="mt-4 h-9 w-full" disabled>
                  Current plan
                </Button>
              );
            } else if (tier.id === "starter") {
              cta = (
                <Button type="button" variant="ghost" className="mt-4 h-9 w-full text-flowpm-muted" disabled>
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
                    "mt-4 inline-flex h-9 w-full items-center justify-center bg-flowpm-primary hover:bg-flowpm-primary-hover",
                  )}
                >
                  Upgrade to Pro
                </a>
              ) : (
                <Button type="button" variant="default" className="mt-4 h-9 w-full" disabled title={subscriptionUpgradeHint()}>
                  Upgrade to Pro
                </Button>
              );
            } else if (tier.id === "pro" && currentTier === "agency") {
              cta = (
                <p className="mt-4 text-center text-xs text-flowpm-muted">You&apos;re on Agency (includes Pro features).</p>
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
                    "mt-4 inline-flex h-9 w-full items-center justify-center bg-[#1a1a2e] text-white hover:opacity-90 dark:bg-black",
                  )}
                >
                  Upgrade to Agency
                </a>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  className="mt-4 h-9 w-full bg-[#1a1a2e] text-white hover:opacity-90 dark:bg-black"
                  disabled
                  title={subscriptionUpgradeHint()}
                >
                  Upgrade to Agency
                </Button>
              );
            } else if (!canManageBilling && !isCurrent) {
              cta = (
                <p className="mt-4 text-center text-xs text-flowpm-muted">Ask an admin to change plans.</p>
              );
            }

            return (
              <Card
                key={tier.id}
                className={cn(
                  "flex flex-col overflow-hidden border-flowpm-border shadow-card",
                  tier.id === "pro" && "ring-2 ring-flowpm-primary/40 lg:scale-[1.02]",
                )}
              >
                <div className={cn("border-b px-4 py-4", tier.headerClass)}>
                  <p className="font-heading text-lg font-semibold">{tier.name}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{tier.priceLine}</span>
                    <span className="text-sm opacity-90">{tier.priceSub}</span>
                  </p>
                </div>
                <CardContent className="flex flex-1 flex-col pt-4">
                  <ul className="flex-1 space-y-2 text-sm text-flowpm-body">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-flowpm-primary/70" aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {cta}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 dark:bg-emerald-950/30">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
          <div className="text-sm text-flowpm-body">
            <p className="font-medium text-emerald-900 dark:text-emerald-100">Pricing tip</p>
            <p className="mt-1 text-xs text-flowpm-muted dark:text-emerald-200/80">
              Offer <strong className="text-flowpm-body dark:text-emerald-100">annual billing</strong> with two months
              free (about a 17% discount) to improve cash flow. Many SaaS products see 30–40% of customers choose annual
              when it&apos;s visible at checkout.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-flowpm-muted">
          After payment, set <code className="rounded bg-flowpm-canvas px-1 py-0.5 font-mono text-[10px]">plan</code> on
          the organization in Firestore (e.g. <code className="font-mono">pro</code>,{" "}
          <code className="font-mono">agency</code>) or automate with Stripe webhooks.
        </p>
      </div>
    </div>
  );
}
