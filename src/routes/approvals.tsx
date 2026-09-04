import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import { ageLabel, events, fmtDate, fmtMoney, refunds, type AuctionEvent } from "@/lib/ops/data";
import { useVendors } from "@/lib/vendors-store";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — Scrapify Operations Console" },
      { name: "description", content: "Every decision waiting on an admin: event publishing, award approvals, KYB verification and finance maker-checker." },
      { property: "og:title", content: "Approvals — Scrapify Operations Console" },
      { property: "og:description", content: "One queue for event, award, vendor and finance approvals with SLA tracking and mandatory reasons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Approvals,
});

const TABS = ["Event Publishing", "Award Decisions", "Vendor KYB", "Finance Maker-Checker"] as const;
type Tab = (typeof TABS)[number];

type Row = {
  id: string;
  title: string;
  context: string;
  amount: number;
  raisedAt: string;
  sla: number;
  tier: string;
  eventId?: string;
};

function Approvals() {
  const [role] = useRole();
  const [tab, setTab] = useState<Tab>("Event Publishing");
  const [selected, setSelected] = useState<Row | null>(null);
  const [reason, setReason] = useState("");
  const { vendors: apiVendors, loading: vendorsLoading } = useVendors();

  const canApprove = roleCan(role, "act.approve");
  const canKyb = roleCan(role, "act.kyb");
  const canFinance = roleCan(role, "act.refund");

  const rows: Row[] = useMemo(() => {
    if (tab === "Event Publishing")
      return events
        .filter((e) => ["Draft Review", "Ready to Publish"].includes(e.status))
        .map((e: AuctionEvent) => ({
          id: e.id,
          title: e.name,
          context: `${e.customerName} · ${e.category} · ${e.template}`,
          amount: e.value,
          raisedAt: e.createdAt,
          sla: 24,
          tier: e.approvals[0]?.tier ?? "L1",
          eventId: e.id,
        }));
    if (tab === "Award Decisions")
      return events
        .filter((e) => e.award && (e.award.state === "Pending Approval" || e.award.state === "Winner Acceptance Pending"))
        .map((e) => ({
          id: `AWD-${e.id}`,
          title: `Award ${e.name}`,
          context: `${e.award!.winner} at ${fmtMoney(e.award!.amount)} · runner-up ${e.award!.runnerUp}`,
          amount: e.award!.amount,
          raisedAt: e.endAt,
          sla: 48,
          tier: "L2",
          eventId: e.id,
        }));
    if (tab === "Vendor KYB")
      return apiVendors
        .filter((v) => v.status === "Pending")
        .map((v) => ({
          id: v.id,
          title: v.companyName,
          context: `${v.location} · ${v.materialInterest.join(", ")} · ${v.documents.length} documents`,
          amount: 0,
          raisedAt: v.createdAt,
          sla: 24,
          tier: "Compliance",
        }));
    return refunds
      .filter((r) => r.status === "Queued" || r.status === "On Hold" || r.status === "Failed")
      .map((r) => ({
        id: r.id,
        title: `Refund ${r.vendorName}`,
        context: `${r.reason} · ${r.eventId}${r.failureReason ? ` · ${r.failureReason}` : ""}`,
        amount: r.amount,
        raisedAt: r.dueDate,
        sla: 72,
        tier: "Checker",
        eventId: r.eventId,
      }));
  }, [tab, apiVendors]);

  const allowed = tab === "Vendor KYB" ? canKyb : tab === "Finance Maker-Checker" ? canFinance : canApprove;

  const columns: Column<Row>[] = [
    { key: "t", header: "Item", render: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title },
    { key: "c", header: "Context", render: (r) => <span className="text-xs text-muted-foreground">{r.context}</span> },
    { key: "a", header: "Value", align: "right", render: (r) => (r.amount ? fmtMoney(r.amount) : "—"), sortValue: (r) => r.amount },
    { key: "tier", header: "Tier", render: (r) => r.tier },
    { key: "age", header: "Waiting", render: (r) => ageLabel(r.raisedAt), sortValue: (r) => r.raisedAt },
    { key: "sla", header: "SLA", render: (r) => <StatusPill value={`${r.sla}h`} tone="info" /> },
    {
      key: "link",
      header: "Event",
      render: (r) =>
        r.eventId ? (
          <Link to="/events/$id" params={{ id: r.eventId }} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            {r.eventId}
          </Link>
        ) : (
          "—"
        ),
    },
  ];

  function decide(kind: "Approve" | "Reject" | "Send Back") {
    if (!allowed) return toast.error(`Your role (${role}) cannot action this queue.`);
    if (kind !== "Approve" && reason.trim().length < 8) return toast.error("A reason is mandatory for reject and send-back.");
    toast.success(`${kind} recorded for ${selected?.id}`, { description: "Audit entry created with before/after state." });
    setSelected(null);
    setReason("");
  }

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Maker-checker across the platform. Each queue is permission-gated and every decision is written to the audit trail with a reason."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Event publishing" value={events.filter((e) => ["Draft Review", "Ready to Publish"].includes(e.status)).length} tone="warn" />
        <StatCard label="Award decisions" value={events.filter((e) => e.award?.state === "Pending Approval").length} tone="warn" />
        <StatCard label="Vendor KYB" value={apiVendors.filter((v) => v.status === "Pending").length} tone="warn" />
        <StatCard label="Finance checks" value={refunds.filter((r) => r.status !== "Refunded").length} tone="warn" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
          {!allowed && <span className="text-xs text-accent">Read-only for the {role} role</span>}
        </div>
        <DataTable rows={rows} columns={columns} exportName="approvals" onRowClick={setSelected} empty="Nothing waiting in this queue." />
      </div>

      <DetailDrawer
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={selected?.context}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => decide("Send Back")} disabled={!allowed}>
              Send back
            </Button>
            <Button variant="destructive" onClick={() => decide("Reject")} disabled={!allowed}>
              Reject
            </Button>
            <Button onClick={() => decide("Approve")} disabled={!allowed}>
              Approve
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Reference" value={selected.id} />
              <Field label="Tier" value={selected.tier} />
              <Field label="Value" value={selected.amount ? fmtMoney(selected.amount) : "—"} />
              <Field label="Raised" value={fmtDate(selected.raisedAt)} />
              <Field label="SLA" value={`${selected.sla}h`} />
              <Field label="Waiting" value={ageLabel(selected.raisedAt)} />
            </FieldGrid>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Decision reason (mandatory for reject / send back)
              </label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1" />
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
