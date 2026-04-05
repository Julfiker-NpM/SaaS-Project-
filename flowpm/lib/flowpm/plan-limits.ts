/**
 * Billing tiers — aligned with product pricing (Starter / Pro / Agency).
 * Enforced in UI; Firestore `organizations.plan` stores: free | pro | agency (aliases below).
 */

export type BillingTier = "starter" | "pro" | "agency";

/** Starter (free) — matches pricing sheet */
export const STARTER_MAX_PROJECTS = 2;
export const STARTER_MAX_MEMBERS = 3;

/** Pro — unlimited projects, capped seats */
export const PRO_MAX_MEMBERS = 15;

/** @deprecated Use STARTER_MAX_PROJECTS — kept for imports */
export const FREE_PLAN_MAX_PROJECTS = STARTER_MAX_PROJECTS;
/** @deprecated Use STARTER_MAX_MEMBERS */
export const FREE_PLAN_MAX_MEMBERS = STARTER_MAX_MEMBERS;

export type PlanLimitInfo = {
  maxProjects: number | null;
  maxMembers: number | null;
};

/** Map stored plan string to a billing tier */
export function normalizeBillingTier(plan: string | null | undefined): BillingTier {
  const p = String(plan ?? "free").toLowerCase().trim();
  if (p === "agency" || p === "enterprise") return "agency";
  if (p === "pro" || p === "business" || p === "team") return "pro";
  return "starter";
}

export function isFreePlan(plan: string | null | undefined): boolean {
  return normalizeBillingTier(plan) === "starter";
}

export function isProPlan(plan: string | null | undefined): boolean {
  return normalizeBillingTier(plan) === "pro";
}

export function isAgencyPlan(plan: string | null | undefined): boolean {
  return normalizeBillingTier(plan) === "agency";
}

export function planDisplayLabel(plan: string | null | undefined): string {
  const t = normalizeBillingTier(plan);
  if (t === "starter") return "Starter";
  if (t === "pro") return "Pro";
  return "Agency";
}

export function getPlanLimits(plan: string | null | undefined): PlanLimitInfo {
  const t = normalizeBillingTier(plan);
  if (t === "agency") return { maxProjects: null, maxMembers: null };
  if (t === "pro") return { maxProjects: null, maxMembers: PRO_MAX_MEMBERS };
  return { maxProjects: STARTER_MAX_PROJECTS, maxMembers: STARTER_MAX_MEMBERS };
}

export function canUseTimeTracking(plan: string | null | undefined): boolean {
  return normalizeBillingTier(plan) !== "starter";
}

export function canUseClientPortal(plan: string | null | undefined): boolean {
  return normalizeBillingTier(plan) !== "starter";
}

export function canUseInvoices(plan: string | null | undefined): boolean {
  return normalizeBillingTier(plan) !== "starter";
}

export function freePlanProjectLimitMessage(limit: number): string {
  return `Starter plan allows up to ${limit} projects. Upgrade under Settings → Subscription, or archive a project.`;
}

export function freePlanMemberLimitMessage(limit: number): string {
  return `Starter plan allows up to ${limit} workspace members. Upgrade under Settings → Subscription for more seats.`;
}

export function subscriptionUpgradeHint(): string {
  return "Connect Stripe checkout URLs in your environment to enable one-click upgrades, or use Manage subscription for the customer portal.";
}

/** UI copy for the pricing table (marketing / Settings). */
export const PRICING_TIERS = [
  {
    id: "starter" as const,
    name: "Starter",
    priceLine: "Free",
    priceSub: "Forever",
    headerClass:
      "bg-[#f5f0e8] text-flowpm-dark dark:bg-[#2a2635] dark:text-flowpm-body border-flowpm-border",
    features: [
      `Up to ${STARTER_MAX_PROJECTS} projects`,
      `${STARTER_MAX_MEMBERS} team members`,
      "Basic task management",
      "No time tracking",
      "No client portal",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    priceLine: "$19",
    priceSub: "/ month",
    headerClass: "bg-flowpm-primary text-white border-flowpm-primary",
    features: [
      "Unlimited projects",
      `Up to ${PRO_MAX_MEMBERS} members`,
      "Time tracking",
      "Basic reporting",
      "Client portal (up to 3 clients)",
      "Invoice generation",
    ],
  },
  {
    id: "agency" as const,
    name: "Agency",
    priceLine: "$49",
    priceSub: "/ month",
    headerClass: "bg-[#1a1a2e] text-white border-[#1a1a2e] dark:bg-black dark:border-flowpm-border",
    features: [
      "Unlimited everything",
      "Unlimited members",
      "Advanced reporting",
      "Unlimited clients",
      "White-label portal",
      "Priority support",
      "Custom domain",
    ],
  },
] as const;

export function stripeCheckoutUrl(tier: "pro" | "agency"): string {
  if (typeof process === "undefined") return "";
  const key =
    tier === "pro" ? "NEXT_PUBLIC_STRIPE_CHECKOUT_PRO_URL" : "NEXT_PUBLIC_STRIPE_CHECKOUT_AGENCY_URL";
  return String(process.env[key] ?? "").trim();
}
