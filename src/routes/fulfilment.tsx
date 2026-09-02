import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, Section, StatCard, StatusPill, Timeline, type Column } from "@/components/ops/ops-ui";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/fulfilment")({
  head: () => ({
    meta: [
      { title: "Fulfilment & Disputes — Scrapify Operations Console" },
      { name: "description", content: "Track pickups, deliveries and service execution after award, plus the full dispute resolution workflow." },
      { property: "og:title", content: "Fulfilment & Disputes — Scrapify Operations Console" },
      { property: "og:description", content: "Post-award delivery tracking, acceptance, SLA breaches and dispute case management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fulfilment,
});

/* ---------- inline formatting helpers ---------- */
const fmtMoney = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/* ---------- types ---------- */
type Order = {
  id: string;
  eventId: string;
  customerName: string;
  vendorName: string;
  category: string;
  value: number;
  mode: string;
  scheduled: string;
  status: string;
  acceptance: string;
  variance: number;
  slaBreached: boolean;
  evidence: boolean;
};

type DisputeTimeline = { at: string; who: string; note: string };

type Dispute = {
  id: string;
  eventId: string;
  customerName: string;
  vendorName: string;
  category: string;
  amount: number;
  issue: string;
  raisedAt: string;
  stage: string;
  owner: string;
  severity: string;
  timeline: DisputeTimeline[];
};

const TABS = ["Orders", "Exceptions", "Disputes"] as const;
type Tab = (typeof TABS)[number];

/* ---------- map API responses ---------- */
function mapOrder(raw: any): Order {
  return {
    id: raw.id ?? raw.code ?? "",
    eventId: raw.auction_id ?? raw.event_id ?? raw.eventId ?? "",
    customerName: raw.customer_name ?? raw.customerName ?? raw.auction_title ?? "",
    vendorName: raw.vendor_name ?? raw.vendorName ?? "",
    category: raw.category ?? "",
    value: Number(raw.value ?? raw.amount ?? 0),
    mode: raw.mode ?? raw.fulfilment_mode ?? "Pickup",
    scheduled: raw.scheduled ?? raw.scheduled_at ?? raw.created_at ?? "",
    status: raw.status ?? "Scheduled",
    acceptance: raw.acceptance ?? raw.acceptance_status ?? "Pending",
    variance: Number(raw.variance ?? raw.quantity_variance ?? 0),
    slaBreached: Boolean(raw.sla_breached ?? raw.slaBreached ?? false),
    evidence: Boolean(raw.evidence ?? raw.evidence_uploaded ?? false),
  };
}

function mapDispute(raw: any): Dispute {
  return {
    id: raw.id ?? raw.code ?? "",
    eventId: raw.auction_id ?? raw.event_id ?? raw.eventId ?? "",
    customerName: raw.customer_name ?? raw.customerName ?? "",
    vendorName: raw.vendor_name ?? raw.vendorName ?? "",
    category: raw.category ?? raw.type ?? "",
    amount: Number(raw.amount ?? raw.disputed_amount ?? 0),
    issue: raw.issue ?? raw.description ?? raw.summary ?? "",
    raisedAt: raw.raised_at ?? raw.raisedAt ?? raw.created_at ?? "",
    stage: raw.stage ?? raw.status ?? "New",
    owner: raw.owner ?? raw.assigned_to ?? "",
    severity: raw.severity ?? raw.priority ?? "Medium",
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline.map((t: any) => ({ at: t.at ?? t.created_at ?? "", who: t.who ?? t.actor ?? "", note: t.note ?? t.message ?? "" }))
      : [],
  };
}

function Fulfilment() {
  const [tab, setTab] = useState<Tab>("Orders");
  const [order, setOrder] = useState<Order | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fulfilRes, dispRes] = await Promise.all([
        adminApi.getFulfilments(),
        adminApi.getDisputes(),
      ]);
      const rawOrders = Array.isArray(fulfilRes?.data) ? fulfilRes.data : Array.isArray(fulfilRes) ? fulfilRes : [];
      const rawDisputes = Array.isArray(dispRes?.data) ? dispRes.data : Array.isArray(dispRes) ? dispRes : [];
      setOrders(rawOrders.map(mapOrder));
      setDisputes(rawDisputes.map(mapDispute));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load fulfilment data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const orderColumns: Column<Order>[] = [
    { key: "id", header: "Order", render: (o) => <span className="font-medium">{o.id}</span>, sortValue: (o) => o.id },
    {
      key: "e",
      header: "Event",
      render: (o) => (
        <Link to="/events/$id" params={{ id: o.eventId }} className="text-primary hover:underline" onClick={(ev) => ev.stopPropagation()}>
          {o.eventId}
        </Link>
      ),
    },
    { key: "c", header: "Customer", render: (o) => o.customerName, sortValue: (o) => o.customerName },
    { key: "v", header: "Vendor", render: (o) => o.vendorName, sortValue: (o) => o.vendorName },
    { key: "m", header: "Mode", render: (o) => o.mode, sortValue: (o) => o.mode },
    { key: "val", header: "Value", align: "right", render: (o) => fmtMoney(o.value), sortValue: (o) => o.value },
    { key: "s", header: "Status", render: (o) => <StatusPill value={o.status} />, sortValue: (o) => o.status },
    { key: "a", header: "Acceptance", render: (o) => <StatusPill value={o.acceptance} /> },
    { key: "sla", header: "SLA", render: (o) => (o.slaBreached ? <StatusPill value="Overdue" /> : <StatusPill value="Success" />) },
    { key: "d", header: "Scheduled", render: (o) => fmtDay(o.scheduled), sortValue: (o) => o.scheduled },
  ];

  const disputeColumns: Column<Dispute>[] = [
    { key: "id", header: "Case", render: (d) => <span className="font-medium">{d.id}</span>, sortValue: (d) => d.id },
    { key: "c", header: "Category", render: (d) => d.category, sortValue: (d) => d.category },
    { key: "p", header: "Parties", render: (d) => <span className="text-xs text-muted-foreground">{d.customerName} vs {d.vendorName}</span> },
    { key: "a", header: "Amount", align: "right", render: (d) => fmtMoney(d.amount), sortValue: (d) => d.amount },
    { key: "st", header: "Stage", render: (d) => <StatusPill value={d.stage} />, sortValue: (d) => d.stage },
    { key: "sev", header: "Severity", render: (d) => <StatusPill value={d.severity} />, sortValue: (d) => d.severity },
    { key: "o", header: "Owner", render: (d) => d.owner, sortValue: (d) => d.owner },
    { key: "r", header: "Raised", render: (d) => fmtDay(d.raisedAt), sortValue: (d) => d.raisedAt },
  ];

  const exceptionOrders = orders.filter((o) => o.status === "Exception" || o.status === "Overdue" || o.variance > 0);

  if (error) {
    return (
      <>
        <PageHeader
          title="Fulfilment & Disputes"
          description="What happens after the hammer falls: pickup and delivery execution, acceptance, quantity variance, SLA breaches and dispute resolution."
        />
        <div className="card-premium flex flex-col items-center justify-center gap-3 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchData}>Retry</Button>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Fulfilment & Disputes"
          description="What happens after the hammer falls: pickup and delivery execution, acceptance, quantity variance, SLA breaches and dispute resolution."
        />
        <div className="card-premium flex items-center justify-center p-10">
          <p className="text-sm text-muted-foreground">Loading fulfilment data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Fulfilment & Disputes"
        description="What happens after the hammer falls: pickup and delivery execution, acceptance, quantity variance, SLA breaches and dispute resolution."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Open orders" value={orders.filter((o) => o.status !== "Completed").length} />
        <StatCard label="In progress" value={orders.filter((o) => o.status === "In Progress").length} />
        <StatCard label="Overdue" value={orders.filter((o) => o.status === "Overdue").length} tone="danger" />
        <StatCard label="Exceptions" value={orders.filter((o) => o.status === "Exception").length} tone="warn" />
        <StatCard label="Open disputes" value={disputes.filter((d) => d.stage !== "Closed").length} tone="warn" />
        <StatCard label="Disputed value" value={fmtMoney(disputes.filter((d) => d.stage !== "Closed").reduce((a, d) => a + d.amount, 0))} />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
        {tab === "Orders" && <DataTable rows={orders} columns={orderColumns} exportName="orders" onRowClick={setOrder} />}
        {tab === "Exceptions" && <DataTable rows={exceptionOrders} columns={orderColumns} exportName="fulfilment-exceptions" onRowClick={setOrder} />}
        {tab === "Disputes" && <DataTable rows={disputes} columns={disputeColumns} exportName="disputes" onRowClick={setDispute} />}
      </div>

      <DetailDrawer
        open={!!order}
        onOpenChange={(v) => !v && setOrder(null)}
        title={order?.id ?? ""}
        subtitle={order ? `${order.customerName} → ${order.vendorName}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.success("Reminder sent to vendor")}>
              Send reminder
            </Button>
            <Button onClick={() => toast.success("Fulfilment marked complete")}>Mark complete</Button>
          </div>
        }
      >
        {order && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Event" value={order.eventId} />
              <Field label="Category" value={order.category} />
              <Field label="Mode" value={order.mode} />
              <Field label="Value" value={fmtMoney(order.value)} />
              <Field label="Scheduled" value={fmtDate(order.scheduled)} />
              <Field label="Status" value={<StatusPill value={order.status} />} />
              <Field label="Acceptance" value={<StatusPill value={order.acceptance} />} />
              <Field label="Quantity variance" value={`${order.variance}%`} />
              <Field label="Evidence uploaded" value={order.evidence ? "Yes" : "Missing"} />
            </FieldGrid>
            <Section title="Execution checklist">
              <ul className="space-y-2 text-sm">
                {["Gate pass issued", "Weighbridge / GRN captured", "Photographic evidence", "Acceptance confirmation", "Invoice raised"].map((s, i) => (
                  <li key={s} className="flex items-center justify-between">
                    <span>{s}</span>
                    <StatusPill value={i < 3 ? "Completed" : "Pending"} />
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </DetailDrawer>

      <DetailDrawer
        open={!!dispute}
        onOpenChange={(v) => !v && setDispute(null)}
        title={dispute ? `${dispute.id} · ${dispute.category}` : ""}
        subtitle={dispute ? `${dispute.customerName} vs ${dispute.vendorName}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.success("Evidence request sent to both parties")}>
              Request evidence
            </Button>
            <Button onClick={() => toast.success("Decision recorded and both parties notified")}>Record decision</Button>
          </div>
        }
      >
        {dispute && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Amount" value={fmtMoney(dispute.amount)} />
              <Field label="Stage" value={<StatusPill value={dispute.stage} />} />
              <Field label="Severity" value={<StatusPill value={dispute.severity} />} />
              <Field label="Owner" value={dispute.owner} />
              <Field label="Event" value={dispute.eventId} />
              <Field label="Raised" value={fmtDate(dispute.raisedAt)} />
            </FieldGrid>
            <Section title="Issue">
              <p className="text-sm text-muted-foreground">{dispute.issue}</p>
            </Section>
            <Section title="Case timeline">
              <Timeline items={dispute.timeline.map((t) => ({ at: fmtDate(t.at), who: t.who, note: t.note }))} />
            </Section>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
