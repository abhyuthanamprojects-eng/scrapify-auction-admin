import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, Field, FieldGrid, RiskDot, Section, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import {
  customers,
  disputes,
  events,
  fmtDate,
  fmtDay,
  fmtMoney,
  getCustomer,
  orders,
  settlements,
  type CustomerUser,
} from "@/lib/ops/data";

export const Route = createFileRoute("/customers/$id")({
  loader: ({ params }) => {
    const c = getCustomer(params.id);
    if (!c) throw notFound();
    return { name: c.name, industry: c.industry };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Customer unavailable — Scrapify Operations Console" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.name} — Customer Record` },
        { name: "description", content: `Account record for ${loaderData.name}: business units, users, approval matrix, events, finance and disputes.` },
        { property: "og:title", content: `${loaderData.name} — Customer Record` },
        { property: "og:description", content: `${loaderData.industry} customer account with commercial performance and open exposure.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CustomerRecord,
});

const TABS = ["Overview", "Business Units", "Users", "Approval Matrix", "Events", "Finance", "Disputes", "Fulfilment", "Health"] as const;
type Tab = (typeof TABS)[number];

function CustomerRecord() {
  const { id } = Route.useParams();
  const customer = getCustomer(id) ?? customers[0];
  const [tab, setTab] = useState<Tab>("Overview");

  const custEvents = events.filter((e) => e.customerId === customer.id);
  const custSettlements = settlements.filter((s) => s.customerName === customer.name);
  const custDisputes = disputes.filter((d) => d.customerName === customer.name);
  const custOrders = orders.filter((o) => o.customerName === customer.name);

  const userColumns: Column<CustomerUser>[] = [
    { key: "n", header: "Name", render: (u) => u.name, sortValue: (u) => u.name },
    { key: "e", header: "Email", render: (u) => <span className="text-xs text-muted-foreground">{u.email}</span> },
    { key: "r", header: "Role", render: (u) => u.role, sortValue: (u) => u.role },
    { key: "s", header: "Status", render: (u) => <StatusPill value={u.status} /> },
    { key: "l", header: "Last login", render: (u) => fmtDate(u.lastLogin), sortValue: (u) => u.lastLogin },
  ];

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`${customer.id} · ${customer.legalEntity} · ${customer.industry} · onboarded ${fmtDay(customer.since)}`}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Status" value={<StatusPill value={customer.status} />} />
        <StatCard label="GMV" value={fmtMoney(customer.gmv)} />
        <StatCard label="Savings" value={fmtMoney(customer.savings)} hint="reverse events" />
        <StatCard label="Realisation" value={fmtMoney(customer.realisation)} hint="forward events" />
        <StatCard label="Settlement due" value={fmtMoney(customer.pendingSettlement)} tone="warn" />
        <StatCard label="Health" value={`${customer.healthScore}/100`} tone={customer.healthScore < 55 ? "danger" : "good"} />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Section title="Account profile" className="lg:col-span-2">
            <FieldGrid cols={3}>
              <Field label="Legal entity" value={customer.legalEntity} />
              <Field label="Industry" value={customer.industry} />
              <Field label="Plan" value={customer.plan} />
              <Field label="Head office" value={customer.city} />
              <Field label="Customer since" value={fmtDay(customer.since)} />
              <Field label="Categories" value={customer.categories.join(", ")} />
              <Field label="Business units" value={customer.businessUnits.length} />
              <Field label="Facilities" value={customer.facilities.length} />
              <Field label="Users" value={customer.users.length} />
            </FieldGrid>
          </Section>
          <Section title="Account health">
            <div className="space-y-3 text-sm">
              <Field label="Churn risk" value={<RiskDot level={customer.churnRisk} />} />
              <Field label="CSAT" value={`${customer.csat} / 5`} />
              <Field label="Support tickets" value={customer.supportTickets} />
              <Field label="Open disputes" value={customer.openDisputes} />
              <Field label="Last event" value={fmtDay(customer.lastEvent)} />
            </div>
          </Section>
        </div>
      )}

      {tab === "Business Units" && (
        <Section title="Business units & facilities">
          <DataTable
            rows={customer.facilities}
            columns={[
              { key: "n", header: "Facility", render: (f) => f.name, sortValue: (f) => f.name },
              { key: "t", header: "Type", render: (f) => f.type },
              { key: "c", header: "City", render: (f) => f.city, sortValue: (f) => f.city },
              { key: "o", header: "Contact", render: (f) => f.contact },
            ]}
            searchable={false}
            exportName={`${customer.id}-facilities`}
          />
        </Section>
      )}

      {tab === "Users" && (
        <Section title="Customer users" description="Portal access, roles and last activity">
          <DataTable rows={customer.users} columns={userColumns} exportName={`${customer.id}-users`} />
        </Section>
      )}

      {tab === "Approval Matrix" && (
        <Section title="Approval matrix" description="Value thresholds and approver tiers applied to this customer's events">
          <DataTable
            rows={customer.approvalMatrix.map((a) => ({ ...a, id: a.tier }))}
            columns={[
              { key: "t", header: "Tier", render: (a) => a.tier },
              { key: "th", header: "Threshold", align: "right", render: (a) => fmtMoney(a.threshold) },
              { key: "ap", header: "Approver", render: (a) => a.approver },
              { key: "sla", header: "SLA", render: (a) => `${a.sla}h` },
            ]}
            searchable={false}
          />
        </Section>
      )}

      {tab === "Events" && (
        <Section title="Events" description="All auctions and RFx run by this customer">
          <DataTable
            rows={custEvents}
            columns={[
              {
                key: "n",
                header: "Event",
                render: (e) => (
                  <Link to="/events/$id" params={{ id: e.id }} className="text-primary hover:underline">
                    {e.name}
                  </Link>
                ),
                sortValue: (e) => e.name,
              },
              { key: "s", header: "Status", render: (e) => <StatusPill value={e.status} /> },
              { key: "d", header: "Direction", render: (e) => e.direction },
              { key: "v", header: "Value", align: "right", render: (e) => fmtMoney(e.currentPrice), sortValue: (e) => e.currentPrice },
              { key: "t", header: "Start", render: (e) => fmtDay(e.startAt), sortValue: (e) => e.startAt },
            ]}
            exportName={`${customer.id}-events`}
          />
        </Section>
      )}

      {tab === "Finance" && (
        <Section title="Settlements" description="Amounts owed to and by this customer">
          <DataTable
            rows={custSettlements}
            columns={[
              { key: "id", header: "Settlement", render: (s) => s.id },
              { key: "e", header: "Event", render: (s) => s.eventId },
              { key: "g", header: "Gross", align: "right", render: (s) => fmtMoney(s.gross), sortValue: (s) => s.gross },
              { key: "f", header: "Fee", align: "right", render: (s) => fmtMoney(s.fee) },
              { key: "n", header: "Net", align: "right", render: (s) => fmtMoney(s.net) },
              { key: "a", header: "Age", align: "right", render: (s) => `${s.ageDays}d`, sortValue: (s) => s.ageDays },
              { key: "s", header: "Status", render: (s) => <StatusPill value={s.status} /> },
            ]}
            exportName={`${customer.id}-settlements`}
            empty="No settlements recorded."
          />
        </Section>
      )}

      {tab === "Disputes" && (
        <Section title="Disputes">
          <DataTable
            rows={custDisputes}
            columns={[
              { key: "id", header: "Dispute", render: (d) => d.id },
              { key: "c", header: "Category", render: (d) => d.category },
              { key: "v", header: "Vendor", render: (d) => d.vendorName },
              { key: "a", header: "Amount", align: "right", render: (d) => fmtMoney(d.amount), sortValue: (d) => d.amount },
              { key: "s", header: "Stage", render: (d) => <StatusPill value={d.stage} /> },
              { key: "sev", header: "Severity", render: (d) => <StatusPill value={d.severity} /> },
            ]}
            empty="No disputes for this customer."
          />
        </Section>
      )}

      {tab === "Fulfilment" && (
        <Section title="Fulfilment">
          <DataTable
            rows={custOrders}
            columns={[
              { key: "id", header: "Order", render: (o) => o.id },
              { key: "v", header: "Vendor", render: (o) => o.vendorName },
              { key: "m", header: "Mode", render: (o) => o.mode },
              { key: "s", header: "Status", render: (o) => <StatusPill value={o.status} /> },
              { key: "d", header: "Scheduled", render: (o) => fmtDay(o.scheduled), sortValue: (o) => o.scheduled },
            ]}
            empty="No fulfilment records."
          />
        </Section>
      )}

      {tab === "Health" && (
        <Section title="Health signals" description="Inputs to the account health score">
          <FieldGrid cols={3}>
            <Field label="Health score" value={`${customer.healthScore}/100`} />
            <Field label="Churn risk" value={<RiskDot level={customer.churnRisk} />} />
            <Field label="CSAT" value={customer.csat} />
            <Field label="Active events" value={customer.activeEvents} />
            <Field label="Completed events" value={customer.completedEvents} />
            <Field label="Support tickets" value={customer.supportTickets} />
            <Field label="Open disputes" value={customer.openDisputes} />
            <Field label="Settlement due" value={fmtMoney(customer.pendingSettlement)} />
            <Field label="Savings delivered" value={fmtMoney(customer.savings)} />
          </FieldGrid>
        </Section>
      )}
    </>
  );
}
