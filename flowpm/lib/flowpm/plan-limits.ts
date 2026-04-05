/** Free plan caps (enforced in UI; align with future Stripe / billing). */
export const FREE_PLAN_MAX_PROJECTS = 10;
export const FREE_PLAN_MAX_MEMBERS = 15;

export function isFreePlan(plan: string | null | undefined): boolean {
  const p = String(plan ?? "free").toLowerCase();
  return p === "free" || p === "";
}

export function freePlanProjectLimitMessage(limit: number): string {
  return `Free plan is limited to ${limit} projects. Upgrade to Pro in Settings → Billing when available, or archive old projects.`;
}

export function freePlanMemberLimitMessage(limit: number): string {
  return `Free plan is limited to ${limit} workspace members. Upgrade to Pro in Settings when you need more seats.`;
}
