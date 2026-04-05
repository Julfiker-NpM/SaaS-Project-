/** Workspace role from `organizations/{orgId}/members/{uid}`. */
export function canMutateWorkspaceContent(role: string | null | undefined): boolean {
  const r = String(role ?? "").toLowerCase();
  return r === "owner" || r === "admin" || r === "member";
}

export function isOrgAdminRole(role: string | null | undefined): boolean {
  const r = String(role ?? "").toLowerCase();
  return r === "owner" || r === "admin";
}

export function isViewerRole(role: string | null | undefined): boolean {
  return String(role ?? "").toLowerCase() === "viewer";
}
