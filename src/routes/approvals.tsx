import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import { ageLabel, fmtDate, fmtMoney } from "@/lib/ops/data";
import { useVendors } from "@/lib/vendors-store";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";
import { adminApi } from "@/lib/api-client";
import { useAuctionsState, type Auction } from "@/lib/auctions-store";

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
  approvalId?: number;
  title: string;
  context: string;
  amount: number;
  raisedAt: string;
  sla: number;
  tier: string;
  eventId?: string;
};

function approvalRows(payload: any): any[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.data?.items,
    payload?.data?.approvals,
    payload?.items,
    payload?.approvals,
    payload?.results,
  ];
  return candidates.find(Array.isArray) ?? [];
}

function approvalBucket(row: any): "award" | "finance" | "other" {
  const value = String(row.queue ?? row.type ?? row.approval_type ?? row.kind ?? row.category ?? "").toLowerCase();
  if (value.includes("award") || value.includes("winner")) return "award";
  if (value.includes("finance") || value.includes("refund") || value.includes("settlement") || value.includes("emd")) return "finance";
  return "other";
}

function Approvals() {
  const [role] = useRole();
  const [tab, setTab] = useState<Tab>("Event Publishing");
  const [selected, setSelected] = useState<Row | null>(null);
  const [reason, setReason] = useState("");
  const { vendors: apiVendors, loading: vendorsLoading } = useVendors();
  const { auctions, loading: auctionsLoading, refetch: refetchAuctions } = useAuctionsState();
  const [apiApprovalRows, setApiApprovalRows] = useState<any[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);

  const canApprove = roleCan(role, "act.approve");
  const canKyb = roleCan(role, "act.kyb");
  const canFinance = roleCan(role, "act.refund");

  const pendingEventCount = auctions.filter((a) => ["Pending Approval", "Sent Back"].includes(a.status)).length;
  const pendingAwardCount = apiApprovalRows.filter((row) => approvalBucket(row) === "award").length;
  const pendingVendorCount = apiVendors.filter((v) => v.status === "Pending").length;
  const pendingFinanceCount = apiApprovalRows.filter((row) => approvalBucket(row) === "finance").length;

  useEffect(() => {
    let active = true;
    setApprovalsLoading(true);
    setApprovalsError(null);
    void adminApi.getApprovals({ status: "pending" })
      .then((response) => {
        if (active) setApiApprovalRows(approvalRows(response));
      })
      .catch((cause) => {
        if (active) {
          setApiApprovalRows([]);
          setApprovalsError(cause instanceof Error ? cause.message : "Unable to load approval queues from the API.");
        }
      })
      .finally(() => { if (active) setApprovalsLoading(false); });
    return () => { active = false; };
  }, []);

  // The dashboard can surface a non-default queue (for example Vendor KYB),
  // while this page initially opens on Event Publishing. Once API data has
  // loaded, show the first queue that actually has work instead of an empty
  // table that makes the dashboard count look incorrect.
  useEffect(() => {
    if (vendorsLoading || auctionsLoading || approvalsLoading || tab !== "Event Publishing") return;
    if (pendingEventCount > 0) return;
    if (pendingAwardCount > 0) return setTab("Award Decisions");
    if (pendingVendorCount > 0) return setTab("Vendor KYB");
    if (pendingFinanceCount > 0) return setTab("Finance Maker-Checker");
  }, [
    pendingAwardCount,
    pendingEventCount,
    pendingFinanceCount,
    pendingVendorCount,
    tab,
    vendorsLoading,
    auctionsLoading,
    approvalsLoading,
  ]);

  const rows: Row[] = useMemo(() => {
    if (tab === "Event Publishing")
      return auctions
        .filter((a) => ["Pending Approval", "Sent Back"].includes(a.status))
        .map((a: Auction) => ({
          id: a.id,
          title: a.title,
          context: `${a.company} · ${a.category} · ${a.location}`,
          amount: a.reservePriceInr,
          raisedAt: a.submittedAt,
          sla: 24,
          tier: "L1",
          eventId: a.id,
        }));
    if (tab === "Award Decisions")
      return apiApprovalRows
        .filter((approval) => approvalBucket(approval) === "award")
        .map((approval) => ({
          id: String(approval.code ?? approval.reference ?? approval.id),
          approvalId: Number(approval.id),
          title: String(approval.title ?? approval.name ?? approval.subject ?? "Award decision"),
          context: String(approval.context ?? approval.description ?? approval.reason ?? "Awaiting award decision"),
          amount: Number(approval.amount ?? approval.amount_inr ?? 0),
          raisedAt: String(approval.created_at ?? approval.raised_at ?? approval.submitted_at ?? ""),
          sla: Number(approval.sla_hours ?? approval.sla ?? 48),
          tier: String(approval.tier ?? "L2"),
          eventId: approval.auction_code ?? approval.event_id ?? approval.auction?.code,
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
    return apiApprovalRows
      .filter((approval) => approvalBucket(approval) === "finance")
      .map((approval) => ({
        id: String(approval.code ?? approval.reference ?? approval.id),
        approvalId: Number(approval.id),
        title: String(approval.title ?? approval.name ?? approval.subject ?? "Finance approval"),
        context: String(approval.context ?? approval.description ?? approval.reason ?? "Awaiting finance decision"),
        amount: Number(approval.amount ?? approval.amount_inr ?? 0),
        raisedAt: String(approval.created_at ?? approval.raised_at ?? approval.submitted_at ?? ""),
        sla: Number(approval.sla_hours ?? approval.sla ?? 72),
        tier: String(approval.tier ?? "Checker"),
        eventId: approval.auction_code ?? approval.event_id ?? approval.auction?.code,
      }));
  }, [tab, apiVendors, auctions, apiApprovalRows]);

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

  async function decide(kind: "Approve" | "Reject" | "Send Back") {
    if (!allowed) return toast.error(`Your role (${role}) cannot action this queue.`);
    if (kind !== "Approve" && reason.trim().length < 8) return toast.error("A reason is mandatory for reject and send-back.");

    if ((tab === "Award Decisions" || tab === "Finance Maker-Checker") && !selected?.approvalId) {
      return toast.error("This approval row has no API approval identifier; no decision was recorded.");
    }
    
    try {
      if (tab === "Event Publishing" && selected?.eventId) {
        if (kind === "Approve") await adminApi.approveAuction(selected.eventId);
        else if (kind === "Reject") await adminApi.rejectAuction(selected.eventId, reason);
        else if (kind === "Send Back") await adminApi.sendBackAuction(selected.eventId, reason);
      } else if (tab === "Vendor KYB" && selected?.id) {
        if (kind === "Approve") await adminApi.approveVendor(selected.id);
        else if (kind === "Reject") await adminApi.rejectVendor(selected.id, reason);
      } else if (selected?.approvalId) {
        const decision = kind === "Approve" ? "approved" : kind === "Reject" ? "rejected" : "escalated";
        await adminApi.decideApproval(selected.approvalId, decision, reason.trim() || undefined);
      }
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "The approval action failed.");
      return;
    }

    toast.success(`${kind} recorded for ${selected?.id}`, { description: "Audit entry created with before/after state." });
    if (tab === "Event Publishing") await refetchAuctions();
    if (tab === "Award Decisions" || tab === "Finance Maker-Checker") {
      const response = await adminApi.getApprovals({ status: "pending" });
      setApiApprovalRows(approvalRows(response));
    }
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
        <StatCard label="Event publishing" value={pendingEventCount} tone="warn" />
        <StatCard label="Award decisions" value={pendingAwardCount} tone="warn" />
        <StatCard label="Vendor KYB" value={pendingVendorCount} tone="warn" />
        <StatCard label="Finance checks" value={pendingFinanceCount} tone="warn" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        {approvalsError && <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">Approval API unavailable: {approvalsError}</div>}
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
