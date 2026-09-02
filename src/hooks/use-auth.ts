import { useEffect, useState, useCallback } from "react";
import { type AdminRole } from "@/lib/ops/roles";
import { toast } from "sonner";

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

const DEFAULT_USER: StaffUser = {
  id: "USR-001",
  name: "R. Iyer",
  email: "r.iyer@scrapifyauctions.com",
  phone: "+91 98765 43210",
  employeeId: "STF-2026-0042",
  role: "Super Admin",
  department: "Platform Operations & Governance",
  status: "active",
  mfaEnabled: true,
  lastLogin: "2 minutes ago (IP: 103.21.144.8)",
  permissions: [
    "view.operations",
    "view.fulfilment",
    "view.customers",
    "view.vendors",
    "view.finance",
    "view.risk",
    "view.config",
    "view.system",
    "act.auctionControl",
    "act.approve",
    "act.kyb",
    "act.refund",
    "act.forfeit",
    "act.security",
    "act.config",
    "act.export",
  ],
};

const USER_KEY = "scrapify_admin_user_session";
const TOKEN_KEY = "scrapify_admin_token";
const AUTH_EVENT = "scrapify:admin:auth";

export function getStoredUser(): StaffUser {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return DEFAULT_USER;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return "demo-admin-session-token";
  return window.localStorage.getItem(TOKEN_KEY) || "demo-admin-session-token";
}

export function setStoredSession(user: StaffUser, token: string = "demo-admin-session-token") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem("admin.role.v2", user.role);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user, token } }));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem("admin.role.v2");
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
}

export function useAuth() {
  const [user, setUser] = useState<StaffUser>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getStoredUser());
      setToken(getStoredToken());
    };
    window.addEventListener(AUTH_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, handleAuthChange);
  }, []);

  const login = useCallback(async (identifier: string, role: AdminRole = "Super Admin", customName?: string) => {
    const mappedUser: StaffUser = {
      id: `USR-${Math.floor(Math.random() * 900 + 100)}`,
      name: customName || (role === "Super Admin" ? "R. Iyer" : role === "Compliance" ? "Ananya Sharma" : role === "Finance" ? "Vikram Malhotra" : "Dev Ops Lead"),
      email: identifier.includes("@") ? identifier : `${identifier.toLowerCase()}@scrapifyauctions.com`,
      phone: "+91 98765 43210",
      employeeId: `STF-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      role: role,
      department: role === "Finance" ? "Treasury & Escrow" : role === "Compliance" ? "KYB & Risk Oversight" : "Operations Control",
      status: "active",
      mfaEnabled: true,
      lastLogin: "Just now",
      permissions: DEFAULT_USER.permissions,
    };

    setStoredSession(mappedUser, `tok_${Date.now()}`);
    setUser(mappedUser);
    toast.success(`Welcome back, ${mappedUser.name}! Signed in as ${mappedUser.role}.`);
    return mappedUser;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    toast.info("Signed out from Scrapify Operations Console.");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const updateProfile = useCallback((updated: Partial<StaffUser>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      setStoredSession(next);
      toast.success("Profile details updated successfully.");
      return next;
    });
  }, []);

  return {
    user,
    role: user.role,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    updateProfile,
  };
}
