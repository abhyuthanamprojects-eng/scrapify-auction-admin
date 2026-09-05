import { useEffect, useState } from "react";
import { ADMIN_ROLES, roleCan, type AdminRole, type Permission } from "@/lib/ops/roles";

export type { AdminRole };
export { ADMIN_ROLES };

const KEY = "admin.role.v2";
const EVT = "admin:role";

function isRole(v: string | null): v is AdminRole {
  return !!v && (ADMIN_ROLES as readonly string[]).includes(v);
}

export function getRole(): AdminRole {
  if (typeof window === "undefined") return "Super Admin";
  const v = window.sessionStorage.getItem(KEY);
  return isRole(v) ? v : "Super Admin";
}

export function setRole(role: AdminRole) {
  window.sessionStorage.setItem(KEY, role);
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useRole(): [AdminRole, (r: AdminRole) => void] {
  const [role, set] = useState<AdminRole>("Super Admin");
  useEffect(() => {
    set(getRole());
    const onChange = () => set(getRole());
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);
  return [role, (r) => setRole(r)];
}

export function useCan(): (p: Permission) => boolean {
  const [role] = useRole();
  return (p: Permission) => roleCan(role, p);
}
