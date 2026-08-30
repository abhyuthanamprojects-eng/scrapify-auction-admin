import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChipTabs, DataTable, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import {
  fmtDay,
  fmtMoney,
  invoices,
  payments,
  reconItems,
  refunds,
  securities,
  settlements,
  type Invoice,
  type Payment,
  type ReconItem,
  type Refund,
  type Security,
  type Settlement,
} from "@/lib/ops/data";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance Console — Scrapify Operations Console" },
      { name: "description", content: "Securities, payments, refunds, settlements, invoices and reconciliation exceptions with maker-checker controls." },
      { property: "og:title", content: "Finance Console — Scrapify Operations Console" },
      { property: "og:description", content: "Platform money movement: EMD held, refund SLA, settlement ageing and provider reconciliation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinanceConsole,
});

const TABS = ["Securities / EMD", "Payments", "Refunds", "Settlements", "Invoices", "Reconciliation"] as const;
type Tab = (typeof TABS)[number];

function FinanceConsole() {
  const [role] = useRole();
  const canRefund = roleCan(role, "act.refund");
  const canForfeit = roleCan(role, "act.forfeit");
  const [tab, setTab] = useState<Tab>("Securities / EMD");

  const eventLink = (id: string) => (
    <Link to="/events/$id" params={{ id }} className="text-primary hover:underline">
      {id}
    </Link>
  );

  const securityColumns: Column<Security>[] = [
    { key: "v", header: "Vendor", render: (s) => s.vendorName, sortValue: (s) => s.vendorName },
    { key: "e", header: "Event", render: (s) => eventLink(s.eventId) },
    { key: "a", header: "Amount", align: "right", render: (s) => fmtMoney(s.amount), sortValue: (s) => s.amount },
    { key: "m", header: "Mode", render: (s) => s.mode, sortValue: (s) => s.mode },
    { key: "st", header: "State", render: (s) => <StatusPill value={s.state} />, sortValue: (s) => s.state },
    { key: "si", header: "Held since", render: (s) => fmtDay(s.since), sortValue: (s) => s.since },
    {
      key: "act",
      header: "",
      render: (s) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!canRefund} onClick={() => toast.success(`Refund initiated for ${s.id}`)}>
            Refund
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={!canForfeit} onClick={() => toast.success(`Forfeiture queued for ${s.id}`)}>
            Forfeit
          </Button>
        </div>
      ),
      align: "right",
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: "id", header: "Payment", render: (p) => p.id, sortValue: (p) => p.id },
    { key: "t", header: "Type", render: (p) => p.type, sortValue: (p) => p.type },
    { key: "e", header: "Event", render: (p) => eventLink(p.eventId) },
    { key: "party", header: "Party", render: (p) => <span className="text-xs text-muted-foreground">{p.vendorName} / {p.customerName}</span> },
    { key: "a", header: "Amount", align: "right", render: (p) => fmtMoney(p.amount), sortValue: (p) => p.amount },
    { key: "pr", header: "Provider", render: (p) => p.provider, sortValue: (p) => p.provider },
    { key: "s", header: "Status", render: (p) => <StatusPill value={p.status} />, sortValue: (p) => p.status },
    { key: "d", header: "Date", render: (p) => fmtDay(p.at), sortValue: (p) => p.at },
  ];

  const refundColumns: Column<Refund>[] = [
    { key: "id", header: "Refund", render: (r) => r.id },
    { key: "v", header: "Vendor", render: (r) => r.vendorName, sortValue: (r) => r.vendorName },
    { key: "e", header: "Event", render: (r) => eventLink(r.eventId) },
    { key: "a", header: "Amount", align: "right", render: (r) => fmtMoney(r.amount), sortValue: (r) => r.amount },
    { key: "rs", header: "Reason", render: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span> },
    { key: "d", header: "Due", render: (r) => fmtDay(r.dueDate), sortValue: (r) => r.dueDate },
    { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} />, sortValue: (r) => r.status },
    { key: "f", header: "Failure", render: (r) => <span className="text-xs text-red-600">{r.failureReason ?? ""}</span> },
    {
      key: "act",
      header: "",
      align: "right",
      render: (r) => (
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!canRefund} onClick={() => toast.success(`Retry queued for ${r.id}`)}>
          Retry
        </Button>
      ),
    },
  ];

  const settlementColumns: Column<Settlement>[] = [
    { key: "id", header: "Settlement", render: (s) => s.id },
    { key: "c", header: "Customer", render: (s) => s.customerName, sortValue: (s) => s.customerName },
    { key: "e", header: "Event", render: (s) => eventLink(s.eventId) },
    { key: "g", header: "Gross", align: "right", render: (s) => fmtMoney(s.gross), sortValue: (s) => s.gross },
    { key: "f", header: "Platform fee", align: "right", render: (s) => fmtMoney(s.fee) },
    { key: "t", header: "GST", align: "right", render: (s) => fmtMoney(s.tax) },
    { key: "n", header: "Net payable", align: "right", render: (s) => fmtMoney(s.net), sortValue: (s) => s.net },
    { key: "a", header: "Age", align: "right", render: (s) => `${s.ageDays}d`, sortValue: (s) => s.ageDays },
    { key: "s", header: "Status", render: (s) => <StatusPill value={s.status} />, sortValue: (s) => s.status },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    { key: "id", header: "Invoice", render: (i) => i.id },
    { key: "p", header: "Party", render: (i) => i.party, sortValue: (i) => i.party },
    { key: "t", header: "Type", render: (i) => i.type, sortValue: (i) => i.type },
    { key: "a", header: "Amount", align: "right", render: (i) => fmtMoney(i.amount), sortValue: (i) => i.amount },
    { key: "g", header: "GST 18%", align: "right", render: (i) => fmtMoney(i.gst) },
    { key: "is", header: "Issued", render: (i) => fmtDay(i.issued), sortValue: (i) => i.issued },
    { key: "d", header: "Due", render: (i) => fmtDay(i.due), sortValue: (i) => i.due },
    { key: "s", header: "Status", render: (i) => <StatusPill value={i.status} />, sortValue: (i) => i.status },
  ];

  const reconColumns: Column<ReconItem>[] = [
    { key: "k", header: "Exception", render: (r) => <span className="font-medium">{r.kind}</span>, sortValue: (r) => r.kind },
    { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "p", header: "Platform", align: "right", render: (r) => fmtMoney(r.platformAmount) },
    { key: "pr", header: "Provider", align: "right", render: (r) => fmtMoney(r.providerAmount) },
    { key: "v", header: "Variance", align: "right", render: (r) => <span className={r.variance ? "font-medium text-red-600" : ""}>{fmtMoney(r.variance)}</span>, sortValue: (r) => r.variance },
    { key: "g", header: "Gateway", render: (r) => r.provider, sortValue: (r) => r.provider },
    { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} />, sortValue: (r) => r.status },
  ];

  const held = securities.filter((s) => s.state === "Held").reduce((a, s) => a + s.amount, 0);

  return (
    <>
      <PageHeader
        title="Finance Console"
        description="Every rupee the platform touches: securities held, payments collected, refunds owed, settlements due, invoices raised and provider reconciliation."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="EMD held" value={fmtMoney(held)} />
        <StatCard label="Forfeited" value={fmtMoney(securities.filter((s) => s.state === "Forfeited").reduce((a, s) => a + s.amount, 0))} tone="danger" />
        <StatCard label="Refunds pending" value={refunds.filter((r) => r.status !== "Refunded").length} tone="warn" />
        <StatCard label="Settlement due" value={fmtMoney(settlements.filter((s) => s.status !== "Paid").reduce((a, s) => a + s.net, 0))} tone="warn" />
        <StatCard label="Overdue invoices" value={invoices.filter((i) => i.status === "Overdue").length} tone="danger" />
        <StatCard label="Recon exceptions" value={reconItems.filter((r) => r.status !== "Resolved").length} tone="danger" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
          {!canRefund && <span className="text-xs text-accent">Finance actions are disabled for the {role} role</span>}
        </div>
        {tab === "Securities / EMD" && <DataTable rows={securities} columns={securityColumns} exportName="securities" pageSize={14} />}
        {tab === "Payments" && <DataTable rows={payments} columns={paymentColumns} exportName="payments" pageSize={14} />}
        {tab === "Refunds" && <DataTable rows={refunds} columns={refundColumns} exportName="refunds" pageSize={14} />}
        {tab === "Settlements" && <DataTable rows={settlements} columns={settlementColumns} exportName="settlements" pageSize={14} />}
        {tab === "Invoices" && <DataTable rows={invoices} columns={invoiceColumns} exportName="invoices" pageSize={14} />}
        {tab === "Reconciliation" && <DataTable rows={reconItems} columns={reconColumns} exportName="reconciliation" pageSize={14} />}
      </div>
    </>
  );
}
