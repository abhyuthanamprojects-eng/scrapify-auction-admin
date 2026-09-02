import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radio,
  Gavel,
  CheckSquare,
  TriangleAlert,
  Truck,
  Building2,
  Users,
  ShieldCheck,
  Wallet,
  BarChart3,
  ShieldAlert,
  Lock,
  SlidersHorizontal,
  Settings,
  Activity,
  ScrollText,
  Coins,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { roleCan, type Permission } from "@/lib/ops/roles";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavGroup = { title: string; permission: Permission; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    permission: "view.operations",
    items: [
      { label: "Command Center", to: "/", icon: LayoutDashboard, exact: true },
      { label: "Live Control Room", to: "/control-room", icon: Radio },
      { label: "Events & Auctions", to: "/events", icon: Gavel },
      { label: "Approvals", to: "/approvals", icon: CheckSquare },
      { label: "Exceptions", to: "/exceptions", icon: TriangleAlert },
    ],
  },
  {
    title: "Fulfilment",
    permission: "view.fulfilment",
    items: [{ label: "Orders & Disputes", to: "/fulfilment", icon: Truck }],
  },
  {
    title: "Customers",
    permission: "view.customers",
    items: [
      { label: "Customers", to: "/customers", icon: Building2 },
      { label: "Organizations", to: "/organizations", icon: Building2 },
    ],
  },
  {
    title: "Vendors",
    permission: "view.vendors",
    items: [
      { label: "Vendor Master", to: "/vendors", icon: Users },
      { label: "Compliance & Ranking", to: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    title: "Finance",
    permission: "view.finance",
    items: [
      { label: "Finance Console", to: "/finance", icon: Wallet },
      { label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Risk & Security",
    permission: "view.risk",
    items: [
      { label: "Risk & Fraud", to: "/risk", icon: ShieldAlert },
      { label: "Security", to: "/security", icon: Lock },
    ],
  },
  {
    title: "Configuration",
    permission: "view.config",
    items: [
      { label: "Platform Config", to: "/configuration", icon: SlidersHorizontal },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
  {
    title: "System",
    permission: "view.system",
    items: [
      { label: "Staff & RBAC", to: "/users", icon: Users },
      { label: "System Health", to: "/system", icon: Activity },
      { label: "Audit Log", to: "/audit-log", icon: ScrollText },
      { label: "Access Tokens", to: "/tokens", icon: Coins },
    ],
  },
];

export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function AdminSidebar({
  collapsed,
  onToggle,
  variant = "desktop",
}: {
  collapsed: boolean;
  onToggle: () => void;
  variant?: "desktop" | "mobile";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role] = useRole();
  const isMobile = variant === "mobile";
  const showLabels = isMobile || !collapsed;
  const groups = NAV_GROUPS.filter((g) => roleCan(role, g.permission));

  return (
    <aside
      className={cn(
        "gradient-navy text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200 relative flex flex-col overflow-hidden",
        isMobile ? "h-dvh w-full" : cn("sticky top-0 h-screen shrink-0", collapsed ? "w-16" : "w-64"),
      )}
      aria-label="Primary"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sidebar-primary/40 to-transparent" />
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border/60 relative shrink-0">
        {showLabels ? (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md gradient-gold flex items-center justify-center shadow-lg shadow-black/30 ring-1 ring-white/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg italic tracking-tight text-white">Scrapify</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-primary">Operations Console</div>
            </div>
          </div>
        ) : (
          <div className="h-8 w-8 mx-auto rounded-md gradient-gold flex items-center justify-center shadow-lg shadow-black/30 ring-1 ring-white/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              "p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
              collapsed && "absolute -right-3 top-5 bg-sidebar border border-sidebar-border shadow-md",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="admin-sidebar-nav"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav id="admin-sidebar-nav" className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3" aria-label="Admin navigation">
        {groups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {showLabels && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
                {group.title}
              </p>
            )}
            {!showLabels && <div className="mx-3 my-2 h-px bg-sidebar-border/60" />}
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as string}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
                    active
                      ? "bg-gradient-to-r from-sidebar-primary/20 via-sidebar-accent/60 to-transparent text-white shadow-inner"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
                    !showLabels && "justify-center px-0",
                  )}
                  title={!showLabels ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full gradient-gold shadow-[0_0_12px_rgba(201,163,77,0.6)]" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-primary",
                    )}
                    aria-hidden="true"
                  />
                  {showLabels && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {showLabels && (
        <div className="shrink-0 p-3 border-t border-sidebar-border/60">
          <div className="rounded-xl border border-sidebar-primary/20 bg-sidebar-accent/40 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              <p className="text-xs font-medium text-white">Signed in as {role}</p>
            </div>
            <p className="mt-1 text-[10px] text-sidebar-foreground/60">Permissions applied to navigation</p>
          </div>
        </div>
      )}
    </aside>
  );
}
