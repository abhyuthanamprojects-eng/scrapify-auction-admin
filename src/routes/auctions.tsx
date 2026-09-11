import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const Route = createFileRoute("/auctions")({
  head: () => ({
    meta: [
      { title: "Auctions — Scrapify Admin" },
      { name: "description", content: "Review, publish and monitor auctions." },
      { property: "og:title", content: "Auctions — Scrapify Admin" },
      {
        property: "og:description",
        content: "Review, publish and monitor auctions across the platform.",
      },
    ],
  }),
  component: AuctionsLayout,
});

const TABS = [
  { to: "/auctions", label: "Approval Queue", exact: true },
  { to: "/auctions/publish", label: "Publish", exact: false },
  { to: "/auctions/live", label: "Live Monitor", exact: false },
];

function AuctionsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLiveMonitor = pathname === "/auctions/live";
  // Hide tabs on deep detail pages
  const isDetail =
    /^\/auctions\/[^/]+$/.test(pathname) &&
    pathname !== "/auctions" &&
    pathname !== "/auctions/publish" &&
    pathname !== "/auctions/live";

  if (isLiveMonitor) {
    return (
      <div className="relative min-h-dvh">
        <Link
          to="/auctions"
          aria-label="Close live auction control"
          title="Close live auction control"
          className="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-slate-300 shadow-xl backdrop-blur transition hover:border-cyan-300/50 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <X className="h-5 w-5" />
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Auctions"
        description="Review submitted auctions, publish approved ones and monitor live rooms."
      />
      {!isDetail && (
        <div className="mb-6 flex items-center gap-1 p-1 rounded-xl bg-muted/40 ring-1 ring-border w-fit">
          {TABS.map((t) => {
            const active = t.exact
              ? pathname === t.to
              : pathname === t.to || pathname.startsWith(t.to + "/");
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-background text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      )}
      <Outlet />
    </>
  );
}
