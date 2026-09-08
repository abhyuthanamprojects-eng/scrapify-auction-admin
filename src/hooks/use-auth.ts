import { useEffect, useState, useCallback, useRef } from "react";
import { type AdminRole } from "@/lib/ops/roles";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId: string;
  role: AdminRole;
  department: string;
  avatar?: string;
  status: "active" | "suspended" | "pending_mfa";
  mfaEnabled: boolean;
  lastLogin?: string;
  permissions?: string[];
}

// Session-only storage keys — sessionStorage clears when the browser closes
const USER_KEY = "scrapify_admin_user_session";
const TOKEN_KEY = "scrapify_admin_token";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

function setStoredSession(user: StaffUser, token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem("admin.role.v2", user.role);
  adminApi.setToken(token);
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem("admin.role.v2");
  // Also clear any stale localStorage from old implementation
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem("admin.role.v2");
  adminApi.setToken(null);
}

const API_ROLE_TO_STAFF_ROLE: Record<string, AdminRole> = {
  super_admin: "Super Admin",
  admin: "Operations",
  operations: "Operations",
  procurement_manager: "Auction Manager",
  compliance: "Compliance",
  finance_manager: "Finance",
  technical_evaluator: "Operations",
  auditor: "Auditor",
};

function mapApiUserToStaff(apiUser: any): StaffUser {
  const apiRole = String(apiUser?.role ?? "").toLowerCase();
  const role = API_ROLE_TO_STAFF_ROLE[apiRole];

  if (!role) {
    throw new Error("This account is not authorized for the Admin Portal.");
  }

  return {
    id: String(apiUser.id ?? apiUser.code ?? ""),
    name: apiUser.name ?? apiUser.full_name ?? "Admin User",
    email: apiUser.email ?? "",
    phone: apiUser.phone ?? undefined,
    employeeId: apiUser.employee_id ?? apiUser.code ?? `STF-${apiUser.id}`,
    role,
    department: apiUser.department ?? "Administration",
    avatar: apiUser.avatar ?? undefined,
    status: apiUser.status === "active" ? "active" : "suspended",
    mfaEnabled: apiUser.mfa_enabled ?? false,
    lastLogin: apiUser.last_login_at ?? undefined,
    permissions: apiUser.permissions ?? [],
  };
}

export function useAuth() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const validatingRef = useRef(false);

  // On mount: validate any stored session against the real API
  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      setAuthStatus("unauthenticated");
      return;
    }

    // Token exists in sessionStorage — validate it
    if (validatingRef.current) return;
    validatingRef.current = true;
    adminApi.setToken(storedToken);

    adminApi.me()
      .then((res: any) => {
        const apiUser = res.user ?? res.data?.user ?? res.data ?? res;
        const validatedUser = mapApiUserToStaff(apiUser);
        // Never trust a role persisted in sessionStorage. The API response is
        // the authority for both identity and the staff role.
        setStoredSession(validatedUser, storedToken);
        setUser(validatedUser);
        setToken(storedToken);
        setAuthStatus("authenticated");
      })
      .catch(() => {
        // Token is invalid/expired — clear everything
        clearStoredSession();
        setUser(null);
        setToken(null);
        setAuthStatus("unauthenticated");
      })
      .finally(() => {
        validatingRef.current = false;
      });
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<StaffUser> => {
    // Call the REAL backend API
    const res = await adminApi.login(identifier, password);
    const apiToken = res.token;
    const apiUser = res.user ?? res.data;

    if (!apiToken) {
      throw new Error("Login failed: no token received from server.");
    }

    const staffUser = mapApiUserToStaff(apiUser);
    setStoredSession(staffUser, apiToken);
    setUser(staffUser);
    setToken(apiToken);
    setAuthStatus("authenticated");
    toast.success(`Welcome back, ${staffUser.name}! Signed in as ${staffUser.role}.`);
    return staffUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch {
      // Server logout may fail if token already expired — that's fine
    }
    clearStoredSession();
    setUser(null);
    setToken(null);
    setAuthStatus("unauthenticated");
    toast.info("Signed out from Scrapify Operations Console.");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const updateProfile = useCallback((updated: Partial<StaffUser>) => {
    setUser((prev) => {
      if (!prev || !token) return prev;
      const next = { ...prev, ...updated };
      setStoredSession(next, token);
      toast.success("Profile details updated successfully.");
      return next;
    });
  }, [token]);

  return {
    user,
    rawUser: user,
    role: (user?.role ?? null) as AdminRole | null,
    token,
    authStatus,
    isAuthenticated: authStatus === "authenticated",
    isChecking: authStatus === "checking",
    login,
    logout,
    updateProfile,
  };
}
