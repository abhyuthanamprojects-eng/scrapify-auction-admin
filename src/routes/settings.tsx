import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Scrapify Auctions Admin" },
      {
        name: "description",
        content:
          "Platform configuration, security policies, payment gateways, and notification settings.",
      },
      { property: "og:title", content: "Platform Settings — Scrapify Auctions Admin" },
      {
        property: "og:description",
        content:
          "Platform configuration, security policies, payment gateways, and notification settings.",
      },
    ],
  }),
  component: SettingsLayout,
});

const TABS = [
  { to: "/settings/platform", label: "Platform & API" },
  { to: "/settings/otp", label: "OTP & Email" },
  { to: "/settings/integrations", label: "Integrations" },
  { to: "/settings/kyb", label: "Business Verification" },
  { to: "/settings/auctions", label: "Auctions & EMD" },
  { to: "/settings/security", label: "Security" },
  { to: "/settings/notifications", label: "Notifications" },
];

function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-full space-y-5 bg-background p-4 sm:p-6 lg:p-8">
      <div className="border-b border-border/70 pb-4">
        <PageHeader
          title="Platform Settings & Governance"
          description="Configure global API connectivity, anti-sniping timers, payment escrow parameters, and security policies."
        />
      </div>

      <nav
        aria-label="Settings sections"
        className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card p-3 shadow-sm"
      >
        {TABS.map((tab) => {
          const active = pathname === tab.to || pathname.startsWith(tab.to + "/");
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                active
                  ? "border-[color:var(--auction)] bg-orange-50 text-[color:var(--auction)]"
                  : "border-border/70 text-muted-foreground hover:border-[color:var(--auction)] hover:bg-orange-50 hover:text-[color:var(--auction)]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
