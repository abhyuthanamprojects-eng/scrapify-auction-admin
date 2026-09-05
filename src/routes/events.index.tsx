import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, FilterSelect, ChipTabs, StatCard, StatusPill, RiskDot, type Column } from "@/components/ops/ops-ui";
import { CATEGORIES, EVENT_STATUSES, EVENT_TEMPLATES, ageLabel, countdown, fmtDay, fmtMoney } from "@/lib/ops/data";
import { useAuctionEvents, type AuctionEvent } from "@/lib/events-store";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events & Auctions — Scrapify Operations Console" },
      { name: "description", content: "Every forward auction, reverse auction, RFQ and RFP across all customers in one filterable workspace." },
      { property: "og:title", content: "Events & Auctions — Scrapify Operations Console" },
      { property: "og:description", content: "Filter auctions by status, direction, category, customer and risk, then open the full event workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsIndex,
});

const TABS = ["All", "Needs Action", "Live", "Scheduled", "Draft", "Closed"] as const;
type Tab = (typeof TABS)[number];

const NEEDS_ACTION: string[] = [
  "Draft Review",
  "Awaiting Decision",
  "Below Reserve",
  "Low Competition",
  "Technical Exception",
  "Payment Pending",
  "Winner Default",
  "Fulfilment Exception",
  "Disputed",
];

function EventsIndex() {
  const navigate = useNavigate();
  const events = useAuctionEvents();
  const customers = Array.from(new Set(events.map(e => e.customerName)));
  const liveEvents = events.filter(e => e.status === "Live");

  const [tab, setTab] = useState<Tab>("All");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [template, setTemplate] = useState("All");
  const [customer, setCustomer] = useState("All");
  const [direction, setDirection] = useState("All");

  const rows = useMemo(
    () =>
      events.filter((e) => {
        if (tab === "Needs Action" && !NEEDS_ACTION.includes(e.status)) return false;
        if (tab === "Live" && e.status !== "Live") return false;
        if (tab === "Scheduled" && e.status !== "Scheduled") return false;
        if (tab === "Draft" && !["Draft Review", "Ready to Publish"].includes(e.status)) return false;
        if (tab === "Closed" && !["Closed", "Cancelled"].includes(e.status)) return false;
        if (status !== "All" && e.status !== status) return false;
        if (category !== "All" && e.category !== category) return false;
        if (template !== "All" && e.template !== template) return false;
        if (customer !== "All" && e.customerName !== customer) return false;
        if (direction !== "All" && e.direction !== direction) return false;
        return true;
      }),
    [tab, status, category, template, customer, direction],
  );

  const columns: Column<AuctionEvent>[] = [
    {
      key: "event",
      header: "Event",
      render: (e) => (
        <div className="min-w-[220px]">
          <p className="font-medium leading-tight">{e.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {e.id} · {e.kind} · {e.template}
          </p>
        </div>
      ),
      sortValue: (e) => e.name,
    },
    { key: "customer", header: "Customer", render: (e) => e.customerName, sortValue: (e) => e.customerName },
    { key: "cat", header: "Category", render: (e) => <span className="text-muted-foreground">{e.category}</span>, sortValue: (e) => e.category },
    { key: "dir", header: "Direction", render: (e) => <StatusPill value={e.direction} tone={e.direction === "Forward" ? "info" : "purple"} />, sortValue: (e) => e.direction },
    { key: "status", header: "Status", render: (e) => <StatusPill value={e.status} />, sortValue: (e) => e.status },
    { key: "value", header: "Value", align: "right", render: (e) => fmtMoney(e.currentPrice), sortValue: (e) => e.currentPrice },
    { key: "parts", header: "Bidders", align: "right", render: (e) => `${e.participants.length} · ${e.bidCount} bids`, sortValue: (e) => e.participants.length },
    { key: "risk", header: "Risk", render: (e) => <RiskDot level={e.risk} />, sortValue: (e) => e.risk },
    {
      key: "time",
      header: "Timing",
      render: (e) => (
        <div className="text-xs">
          <p>{e.status === "Live" ? `ends in ${countdown(e.endAt)}` : fmtDay(e.startAt)}</p>
          <p className="text-muted-foreground">created {ageLabel(e.createdAt)} ago</p>
        </div>
      ),
      sortValue: (e) => e.startAt,
    },
    { key: "owner", header: "Owner", render: (e) => e.owner, sortValue: (e) => e.owner },
  ];

  return (
    <>
      <PageHeader
        title="Events & Auctions"
        description="Forward sales, reverse procurement, transport lanes, service contracts, RFIs, RFQs and RFPs — one governed pipeline."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total events" value={events.length} />
        <StatCard label="Live" value={liveEvents.length} tone="live" />
        <StatCard label="Needs action" value={events.filter((e) => NEEDS_ACTION.includes(e.status)).length} tone="warn" />
        <StatCard label="Scheduled" value={events.filter((e) => e.status === "Scheduled").length} />
        <StatCard label="Pipeline value" value={fmtMoney(events.reduce((a, e) => a + e.value, 0))} />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          exportName="events"
          searchKeys={(e) => `${e.id} ${e.name} ${e.customerName} ${e.category} ${e.owner}`}
          onRowClick={(e) => navigate({ to: "/events/$id", params: { id: e.id } })}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Status" value={status} options={EVENT_STATUSES} onChange={setStatus} />
              <FilterSelect label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
              <FilterSelect label="Template" value={template} options={EVENT_TEMPLATES} onChange={setTemplate} />
              <FilterSelect label="Customer" value={customer} options={customers} onChange={setCustomer} />
              <FilterSelect label="Direction" value={direction} options={["Forward", "Reverse"]} onChange={setDirection} />
            </div>
          }
        />
      </div>
    </>
  );
}
