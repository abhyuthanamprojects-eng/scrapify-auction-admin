export const ADMIN_ROLES = [
  "Super Admin",
  "Operations",
  "Auction Manager",
  "Compliance",
  "Finance",
  "Support",
  "Security",
  "Auditor",
  "Customer Success",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type Permission =
  | "view.operations"
  | "view.fulfilment"
  | "view.customers"
  | "view.vendors"
  | "view.finance"
  | "view.risk"
  | "view.config"
  | "view.system"
  | "act.auctionControl"
  | "act.approve"
  | "act.kyb"
  | "act.refund"
  | "act.forfeit"
  | "act.security"
  | "act.config"
  | "act.export";

const ALL: Permission[] = [
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
];

const VIEW_ALL: Permission[] = ALL.filter((p) => p.startsWith("view."));

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  "Super Admin": ALL,
  Operations: [
    ...VIEW_ALL.filter((p) => p !== "view.config"),
    "act.auctionControl",
    "act.approve",
    "act.export",
  ],
  "Auction Manager": [
    "view.operations",
    "view.fulfilment",
    "view.customers",
    "view.vendors",
    "view.system",
    "act.auctionControl",
    "act.approve",
    "act.export",
  ],
  Compliance: [
    "view.operations",
    "view.customers",
    "view.vendors",
    "view.risk",
    "view.system",
    "act.kyb",
    "act.export",
  ],
  Finance: [
    "view.operations",
    "view.fulfilment",
    "view.customers",
    "view.vendors",
    "view.finance",
    "view.system",
    "act.refund",
    "act.forfeit",
    "act.export",
  ],
  Support: ["view.operations", "view.fulfilment", "view.customers", "view.vendors", "view.system"],
  Security: [
    "view.operations",
    "view.customers",
    "view.vendors",
    "view.risk",
    "view.system",
    "act.security",
    "act.export",
  ],
  Auditor: [...VIEW_ALL, "act.export"],
  "Customer Success": ["view.operations", "view.fulfilment", "view.customers", "view.vendors", "view.system"],
};

export function roleCan(role: AdminRole, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
