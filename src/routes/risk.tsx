import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import { fmtDate, fraudAlerts, relatedParties, vendors, type FraudAlert, type RelatedParty } from "@/lib/ops/data";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk & Fraud — Scrapify Operations Console" },
      { name: "description", content: "Collusion signals, shared identity detection, bid pattern anomalies and related-party mapping across the marketplace." },
      { property: "og:title", content: "Risk & Fraud — Scrapify Operations Console" },
      { property: "og:description", content: "Investigate fraud alerts, restrict participation and map related parties with full evidence trails." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskConsole,
});

const TABS = ["Fraud Alerts", "Related Parties", "High-Risk Vendors"] as const;

function RiskConsole() {
  const [role] = useRole();
  const canAct = roleCan(role, "act.security");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Fraud Alerts");
  const [alert, setAlert] = useState<FraudAlert | null>(null);
  const [note, setNote] = useState("");

  const alertColumns: Column<FraudAlert>[] = [
    { key: "t", header: "Signal", render: (a) => <span className="font-medium">{a.type}</span>, sortValue: (a) => a.type },
    { key: "s", header: "Severity", render: (a) => <StatusPill value={a.severity} />, sortValue: (a) => a.severity },
    { key: "e", header: "Entities", render: (a) => <span className="text-xs text-muted-foreground">{a.entities.join(" · ")}</span> },
    {
      key: "ev",
      header: "Event",
      render: (a) => (
        <Link to="/events/$id" params={{ id: a.eventId }} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
          {a.eventId}
        </Link>
      ),
    },
    { key: "d", header: "Detected", render: (a) => fmtDate(a.detectedAt), sortValue: (a) => a.detectedAt },
    { key: "i", header: "Investigator", render: (a) => a.investigator, sortValue: (a) => a.investigator },
    { key: "st", header: "Status", render: (a) => <StatusPill value={a.status} />, sortValue: (a) => a.status },
  ];

  const relatedColumns: Column<RelatedParty>[] = [
    { key: "a", header: "Party A", render: (r) => r.a, sortValue: (r) => r.a },
    { key: "b", header: "Party B", render: (r) => r.b, sortValue: (r) => r.b },
    { key: "s", header: "Signal", render: (r) => r.signal, sortValue: (r) => r.signal },
    {
      key: "c",
      header: "Confidence",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted">
            <div className={`h-1.5 rounded-full ${r.confidence > 80 ? "bg-red-500" : "bg-accent"}`} style={{ width: `${r.confidence}%` }} />
          </div>
          <span className="text-xs">{r.confidence}%</span>
        </div>
      ),
      sortValue: (r) => r.confidence,
    },
    { key: "e", header: "Shared events", render: (r) => <span className="text-xs text-muted-foreground">{r.events.join(", ")}</span> },
    { key: "st", header: "Status", render: (r) => <StatusPill value={r.status} />, sortValue: (r) => r.status },
  ];

  const riskyVendors = vendors.filter((v) => v.riskScore > 60 || v.flags.length > 0 || v.defaults > 0);

  return (
    <>
      <PageHeader
        title="Risk & Fraud"
        description="Detection and investigation of collusion, shared identities, abnormal bidding and repeat defaults — with restriction and blocking controls."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open alerts" value={fraudAlerts.filter((a) => a.status === "Open").length} tone="warn" />
        <StatCard label="Critical" value={fraudAlerts.filter((a) => a.severity === "Critical").length} tone="danger" />
        <StatCard label="Escalated" value={fraudAlerts.filter((a) => a.status === "Escalated").length} tone="danger" />
        <StatCard label="Related-party links" value={relatedParties.filter((r) => r.status !== "Dismissed").length} tone="warn" />
        <StatCard label="High-risk vendors" value={riskyVendors.length} tone="warn" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
          {!canAct && <span className="text-xs text-accent">Investigation actions require a Security or Super Admin role</span>}
        </div>
        {tab === "Fraud Alerts" && <DataTable rows={fraudAlerts} columns={alertColumns} exportName="fraud-alerts" onRowClick={setAlert} />}
        {tab === "Related Parties" && <DataTable rows={relatedParties} columns={relatedColumns} exportName="related-parties" />}
        {tab === "High-Risk Vendors" && (
          <DataTable
            rows={riskyVendors}
            columns={[
              {
                key: "n",
                header: "Vendor",
                render: (v) => (
                  <Link to="/vendors/$id" params={{ id: v.id }} className="font-medium text-primary hover:underline">
                    {v.name}
                  </Link>
                ),
                sortValue: (v) => v.name,
              },
              { key: "r", header: "Risk score", align: "right", render: (v) => v.riskScore, sortValue: (v) => v.riskScore },
              { key: "s", header: "Status", render: (v) => <StatusPill value={v.status} /> },
              { key: "d", header: "Defaults", align: "right", render: (v) => v.defaults, sortValue: (v) => v.defaults },
              { key: "f", header: "Forfeitures", align: "right", render: (v) => v.forfeitures },
              { key: "fl", header: "Flags", render: (v) => <span className="text-xs text-red-600">{v.flags.join(", ") || "—"}</span> },
            ]}
            exportName="high-risk-vendors"
          />
        )}
      </div>

      <DetailDrawer
        open={!!alert}
        onOpenChange={(v) => !v && setAlert(null)}
        title={alert?.type ?? ""}
        subtitle={alert ? `${alert.id} · ${alert.entities.join(" · ")}` : undefined}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={!canAct} onClick={() => toast.success("Alert dismissed with note")}>
              Dismiss
            </Button>
            <Button variant="outline" disabled={!canAct} onClick={() => toast.success("Participation restricted pending review")}>
              Restrict
            </Button>
            <Button
              variant="destructive"
              disabled={!canAct}
              onClick={() => {
                if (note.trim().length < 8) return toast.error("Add investigation notes before blocking.");
                toast.success("Entities blocked and escalated to compliance");
                setAlert(null);
                setNote("");
              }}
            >
              Block
            </Button>
          </div>
        }
      >
        {alert && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Severity" value={<StatusPill value={alert.severity} />} />
              <Field label="Status" value={<StatusPill value={alert.status} />} />
              <Field label="Investigator" value={alert.investigator} />
              <Field label="Detected" value={fmtDate(alert.detectedAt)} />
            </FieldGrid>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{alert.evidence}</div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Investigation notes (audited)</label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="mt-1" />
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
