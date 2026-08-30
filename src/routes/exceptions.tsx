import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, FilterSelect, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import { ageLabel, exceptions, fmtDate, type ExceptionItem } from "@/lib/ops/data";

export const Route = createFileRoute("/exceptions")({
  head: () => ({
    meta: [
      { title: "Exception Queue — Scrapify Operations Console" },
      { name: "description", content: "Every operational exception across auctions, compliance, finance, fulfilment and risk with SLA and recommended action." },
      { property: "og:title", content: "Exception Queue — Scrapify Operations Console" },
      { property: "og:description", content: "Triage exceptions by severity, ownership and SLA breach with one-click resolution paths." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Exceptions,
});

const TABS = ["Open", "In Progress", "Resolved", "All"] as const;
type Tab = (typeof TABS)[number];

function Exceptions() {
  const [tab, setTab] = useState<Tab>("Open");
  const [severity, setSeverity] = useState("All");
  const [kind, setKind] = useState("All");
  const [selected, setSelected] = useState<ExceptionItem | null>(null);
  const [reason, setReason] = useState("");

  const kinds = Array.from(new Set(exceptions.map((e) => e.kind)));

  const rows = useMemo(
    () =>
      exceptions.filter((e) => {
        if (tab !== "All" && e.status !== tab) return false;
        if (severity !== "All" && e.severity !== severity) return false;
        if (kind !== "All" && e.kind !== kind) return false;
        return true;
      }),
    [tab, severity, kind],
  );

  const breached = (e: ExceptionItem) => Number(ageLabel(e.raisedAt).replace(/[^0-9]/g, "")) > 0 && e.slaHours < 24;

  const columns: Column<ExceptionItem>[] = [
    { key: "kind", header: "Exception", render: (e) => <span className="font-medium">{e.kind}</span>, sortValue: (e) => e.kind },
    { key: "entity", header: "Entity", render: (e) => e.entity, sortValue: (e) => e.entity },
    {
      key: "event",
      header: "Event",
      render: (e) =>
        e.eventId ? (
          <Link to="/events/$id" params={{ id: e.eventId }} className="text-primary hover:underline">
            {e.eventId}
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "sev", header: "Severity", render: (e) => <StatusPill value={e.severity} />, sortValue: (e) => e.severity },
    { key: "age", header: "Age", render: (e) => <span className={breached(e) ? "text-red-600 font-medium" : ""}>{ageLabel(e.raisedAt)}</span>, sortValue: (e) => e.raisedAt },
    { key: "sla", header: "SLA", render: (e) => `${e.slaHours}h`, sortValue: (e) => e.slaHours },
    { key: "owner", header: "Owner", render: (e) => e.owner, sortValue: (e) => e.owner },
    { key: "status", header: "Status", render: (e) => <StatusPill value={e.status} />, sortValue: (e) => e.status },
    { key: "rec", header: "Recommended action", render: (e) => <span className="text-xs text-muted-foreground">{e.recommended}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Exception Queue"
        description="A single triage surface for everything that deviated from the happy path — with owner, SLA and a recommended next action."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={exceptions.filter((e) => e.status === "Open").length} tone="warn" />
        <StatCard label="Critical" value={exceptions.filter((e) => e.severity === "Critical" && e.status !== "Resolved").length} tone="danger" />
        <StatCard label="In progress" value={exceptions.filter((e) => e.status === "In Progress").length} />
        <StatCard label="Resolved" value={exceptions.filter((e) => e.status === "Resolved").length} tone="good" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          exportName="exceptions"
          onRowClick={setSelected}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Severity" value={severity} options={["Critical", "High", "Medium", "Low"]} onChange={setSeverity} />
              <FilterSelect label="Type" value={kind} options={kinds} onChange={setKind} />
            </div>
          }
        />
      </div>

      <DetailDrawer
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={selected?.kind ?? ""}
        subtitle={selected ? `${selected.id} · ${selected.entity}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (reason.trim().length < 8) return toast.error("Add a resolution note before closing this exception.");
                toast.success("Exception resolved and audited");
                setSelected(null);
                setReason("");
              }}
            >
              Resolve
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Severity" value={<StatusPill value={selected.severity} />} />
              <Field label="Status" value={<StatusPill value={selected.status} />} />
              <Field label="Owner" value={selected.owner} />
              <Field label="SLA" value={`${selected.slaHours}h`} />
              <Field label="Raised" value={fmtDate(selected.raisedAt)} />
              <Field label="Age" value={ageLabel(selected.raisedAt)} />
            </FieldGrid>
            <div className="rounded-lg border border-accent/25 bg-accent/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Recommended action</p>
              <p className="mt-1 text-sm">{selected.recommended}</p>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Resolution note (audited)</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1" />
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
