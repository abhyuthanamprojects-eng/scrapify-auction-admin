import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Info, Plus, ShieldCheck } from "lucide-react";
import { useOrganizations, statusTone, type OrgStatus } from "@/lib/organizations-store";
import { useRole } from "@/hooks/use-role";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/organizations/")({
  head: () => ({
    meta: [
      { title: "Organizations — Scrapify Admin" },
      { name: "description", content: "Manage seller organizations, approvals and compliance." },
      { property: "og:title", content: "Organizations — Scrapify Admin" },
      { property: "og:description", content: "Manage seller organizations, approvals and compliance." },
    ],
  }),
  component: OrganizationsList,
});

const TABS: Array<{ id: "all" | "queue"; label: string }> = [
  { id: "all", label: "All Organizations" },
  { id: "queue", label: "Super Admin Queue" },
];

function OrganizationsList() {
  const orgs = useOrganizations();
  const [role] = useRole();
  const isSuper = role === "Super Admin";
  const [tab, setTab] = useState<"all" | "queue">("all");

  const pendingCount = useMemo(
    () => orgs.filter((o) => o.status === "Pending Super Admin Approval").length,
    [orgs],
  );

  const rows = useMemo(() => {
    if (isSuper && tab === "queue") {
      return orgs.filter((o) => o.status === "Pending Super Admin Approval");
    }
    // Regular Admin: hide pending super-admin items from their action list
    if (!isSuper) return orgs.filter((o) => o.status !== "Pending Super Admin Approval");
    return orgs;
  }, [orgs, isSuper, tab]);

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Seller organizations and division-level approvals."
        actions={
          <Button asChild className="gap-2">
            <Link to="/organizations/new">
              <Plus className="h-4 w-4" /> New Organization
            </Link>
          </Button>
        }
      />

      <div className="card-premium p-4 mb-6 flex items-start gap-3 border-l-4 border-l-accent">
        <div className="mt-0.5 h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
          <Info className="h-4 w-4 text-accent" />
        </div>
        <div className="text-sm">
          <p className="text-foreground font-medium">Two-tier approval hierarchy</p>
          <p className="text-muted-foreground mt-0.5">
            Organization approval requires <span className="font-semibold text-foreground">Super Admin</span>. Vendor approval
            (separate module) only requires <span className="font-semibold text-foreground">Admin</span>.
          </p>
        </div>
      </div>

      {isSuper && (
        <div className="mb-4 flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ring-1 ${
                tab === t.id
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background text-muted-foreground ring-border hover:text-foreground"
              }`}
            >
              {t.label}
              {t.id === "queue" && pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent text-white text-[10px] font-semibold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 font-semibold">Company Name</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold text-center">Units</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    No organizations to show.
                  </td>
                </tr>
              )}
              {rows.map((o) => {
                const tone = statusTone(o.status);
                const canReview = isSuper && o.status === "Pending Super Admin Approval";
                return (
                  <tr key={o.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{o.companyName}</div>
                      <div className="text-xs text-muted-foreground">{o.id}</div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{o.location}</td>
                    <td className="px-5 py-4 text-center font-medium">{o.totalUnits}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {o.status === "Draft" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/organizations/$id" params={{ id: o.id }}>Continue</Link>
                        </Button>
                      ) : canReview ? (
                        <Button asChild size="sm" className="gap-1.5">
                          <Link to="/organizations/$id" params={{ id: o.id }}>
                            <ShieldCheck className="h-3.5 w-3.5" /> Review
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/organizations/$id" params={{ id: o.id }}>View</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function StatusBadge({ status }: { status: OrgStatus }) {
  const t = statusTone(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {status}
    </span>
  );
}