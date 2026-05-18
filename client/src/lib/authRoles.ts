/** Normalize API/UI role strings for comparison (e.g. "Super Admin" → super_admin). */
export function normalizeRoleKey(role: string | undefined): string {
  return (role ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function isSuperAdminRole(roleName: string | undefined): boolean {
  const key = normalizeRoleKey(roleName);
  return key === "super_admin";
}
