import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { ChipTabs, DataTable, FilterSelect, RiskDot, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import { customers, fmtDay, fmtMoney, type Customer } from "@/lib/ops/data";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Scrapify Operations Console" },
      { name: "description", content: "Every customer organisation on the platform with health, GMV, settlement exposure and open disputes." },
      { property: "og:title", content: "Customers — Scrapify Operations Console" },
      { property: "og:description", content: "Customer accounts, plans, health scores and commercial exposure in one master list." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersIndex,
});

const TABS = ["All", "Active", "Onboarding", "At Risk", "Suspended"] as const;
type Tab = (typeof TABS)[number];

function CustomersIndex() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("All");
  const [industry, setIndustry] = useState("All");
  const [plan, setPlan] = useState("All");

  const industries = Array.from(new Set(customers.map((c) => c.industry)));

  const rows = useMemo(
    () =>
      customers.filter((c) => {
        if (tab === "Active" && c.status !== "Active") return false;
        if (tab === "Onboarding" && c.status !== "Onboarding") return false;
        if (tab === "Suspended" && c.status !== "Suspended") return false;
        if (tab === "At Risk" && !(c.churnRisk === "High" || c.churnRisk === "Critical" || c.healthScore < 55)) return false;
        if (industry !== "All" && c.industry !== industry) return false;
        if (plan !== "All" && c.plan !== plan) return false;
        return true;
      }),
    [tab, industry, plan],
  );

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div>
          <p className="font-medium leading-tight">{c.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {c.id} · {c.industry} · {c.city}
          </p>
        </div>
      ),
      sortValue: (c) => c.name,
    },
    { key: "status", header: "Status", render: (c) => <StatusPill value={c.status} />, sortValue: (c) => c.status },
    { key: "plan", header: "Plan", render: (c) => c.plan, sortValue: (c) => c.plan },
    { key: "events", header: "Events", align: "right", render: (c) => `${c.activeEvents} live / ${c.completedEvents}`, sortValue: (c) => c.activeEvents },
    { key: "gmv", header: "GMV", align: "right", render: (c) => fmtMoney(c.gmv), sortValue: (c) => c.gmv },
    { key: "settle", header: "Settlement due", align: "right", render: (c) => fmtMoney(c.pendingSettlement), sortValue: (c) => c.pendingSettlement },
    { key: "disp", header: "Disputes", align: "right", render: (c) => c.openDisputes, sortValue: (c) => c.openDisputes },
    {
      key: "health",
      header: "Health",
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted">
            <div
              className={`h-1.5 rounded-full ${c.healthScore > 70 ? "bg-emerald-500" : c.healthScore > 50 ? "bg-accent" : "bg-red-500"}`}
              style={{ width: `${c.healthScore}%` }}
            />
          </div>
          <span className="text-xs">{c.healthScore}</span>
        </div>
      ),
      sortValue: (c) => c.healthScore,
    },
    { key: "churn", header: "Churn risk", render: (c) => <RiskDot level={c.churnRisk} />, sortValue: (c) => c.churnRisk },
    { key: "last", header: "Last event", render: (c) => fmtDay(c.lastEvent), sortValue: (c) => c.lastEvent },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer organisations, their business units, commercial performance and account health across every category they trade in."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Active" value={customers.filter((c) => c.status === "Active").length} tone="good" />
        <StatCard label="Onboarding" value={customers.filter((c) => c.status === "Onboarding").length} tone="warn" />
        <StatCard label="Total GMV" value={fmtMoney(customers.reduce((a, c) => a + c.gmv, 0))} />
        <StatCard label="Settlement exposure" value={fmtMoney(customers.reduce((a, c) => a + c.pendingSettlement, 0))} tone="warn" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          exportName="customers"
          onRowClick={(c) => navigate({ to: "/customers/$id", params: { id: c.id } })}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Industry" value={industry} options={industries} onChange={setIndustry} />
              <FilterSelect label="Plan" value={plan} options={["Enterprise", "Growth", "Pilot"]} onChange={setPlan} />
            </div>
          }
        />
      </div>
    </>
  );
}
