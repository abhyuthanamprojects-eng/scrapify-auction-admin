import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  Clock3,
  FileCheck2,
  Gavel,
  Landmark,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Command Center — Scrapify Operations Console" }] }),
  component: CommandCenter,
});

type Metric = { key: string; label: string; hint: string; icon: LucideIcon; money?: boolean };
type Mix = { name: string; value: number };
type Dashboard = {
  kpis: Record<string, number>;
  monthly_volume: { month: string; gmv: number; auctions: number }[];
  auction_type_mix: Mix[];
  category_mix: Mix[];
  pipeline: Mix[];
  activity: { id: string; actor: string; action: string; at: string | null }[];
  needs_attention: { id: string; type: string; name: string; hours_waiting: number | null }[];
  live_events: {
    id: string;
    name: string;
    category: string;
    price: number;
    bidders: number;
    end_at: string | null;
  }[];
};
const primary: Metric[] = [
  {
    key: "emd_held",
    label: "EMD held",
    hint: "Currently locked in bidder wallets",
    icon: Wallet,
    money: true,
  },
  {
    key: "total_customers",
    label: "Total customers",
    hint: "Buyer & seller accounts · all statuses",
    icon: Users,
  },
  { key: "live_auctions", label: "Live auctions", hint: "Events accepting bids now", icon: Radio },
  {
    key: "settlement_due",
    label: "Settlement due",
    hint: "Outstanding order payments",
    icon: Landmark,
    money: true,
  },
];
const secondary: Metric[] = [
  {
    key: "active_customers",
    label: "Active customers",
    hint: "Active buyer & seller accounts",
    icon: Building2,
  },
  {
    key: "verified_vendors",
    label: "Verified vendors",
    hint: "Approved vendors",
    icon: BadgeCheck,
  },
  {
    key: "pending_kyb",
    label: "Pending KYB",
    hint: "Vendors pending or under review",
    icon: ShieldCheck,
  },
  { key: "auctions_today", label: "Auctions today", hint: "Scheduled to start today", icon: Gavel },
  {
    key: "upcoming_auctions",
    label: "Upcoming auctions",
    hint: "Approved or published future events",
    icon: CalendarDays,
  },
  { key: "open_rfqs", label: "Open RFQs", hint: "Open RFx packages", icon: FileCheck2 },
  {
    key: "pending_awards",
    label: "Pending awards",
    hint: "Awaiting approval or acceptance",
    icon: Trophy,
  },
  {
    key: "pending_approvals",
    label: "Pending approvals",
    hint: "Pending & escalated approval requests",
    icon: FileCheck2,
  },
  {
    key: "refunds_due",
    label: "Refunds due",
    hint: "EMD refunds pending or processing",
    icon: ArrowDownToLine,
  },
  {
    key: "open_disputes",
    label: "Open disputes",
    hint: "Unresolved dispute cases",
    icon: CircleAlert,
  },
  {
    key: "critical_security_alerts",
    label: "Critical security alerts",
    hint: "Unresolved critical risk flags",
    icon: ShieldAlert,
  },
  {
    key: "compliance_expiring",
    label: "Compliance expiring",
    hint: "Business verifications expiring in 30 days",
    icon: Clock3,
  },
];
const colors = ["#1F3251", "#E65100", "#2A4370", "#B45309", "#7C3AED", "#0891B2"];
const number = new Intl.NumberFormat("en-IN");
const money = (value: number) => "₹" + number.format(value);
const title = (value: string) => value.replaceAll("_", " ");

function Panel({
  title: heading,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card " +
        className
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-border">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-foreground">{heading}</h2>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-muted dark:text-muted-foreground">
      {children}
    </div>
  );
}

function ThreeDIcon({ index }: { index: 0 | 1 | 2 | 3 }) {
  const positions = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"] as const;
  return (
    <span
      aria-hidden="true"
      className="block h-12 w-12 bg-contain bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/dashboard-3d-icons.png')",
        backgroundPosition: positions[index],
        backgroundSize: "200% 200%",
      }}
    />
  );
}

function CompactThreeDIcon({ index }: { index: number }) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const position = `${(column / 3) * 100}% ${(row / 3) * 100}%`;
  return (
    <span
      aria-hidden="true"
      className="block h-9 w-9 bg-contain bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/dashboard-secondary-3d-icons.png')",
        backgroundPosition: position,
        backgroundSize: "400% 400%",
      }}
    />
  );
}

function CommandCenter() {
  const [months, setMonths] = useState(6);
  const { data, isPending, isError, isFetching, refetch, dataUpdatedAt } = useQuery<Dashboard>({
    queryKey: ["command-center"],
    queryFn: async () => {
      const result = await adminApi.getDashboardReports();
      if (!result?.kpis || !Array.isArray(result.monthly_volume))
        throw new Error("Dashboard data is unavailable.");
      return result;
    },
    refetchInterval: 60_000,
  });
  const value = (metric: Metric) => {
    const current = data?.kpis[metric.key];
    return current == null ? "—" : metric.money ? money(current) : number.format(current);
  };
  const exportReport = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value", "Definition"],
      ...[...primary, ...secondary].map((m) => [m.label, String(data.kpis[m.key] ?? ""), m.hint]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "scrapify-operations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const chartData = data?.monthly_volume.slice(-months) ?? [];
  const mix = data?.auction_type_mix.filter((item) => item.value > 0) ?? [];
  const chartTotal = chartData.reduce((sum, row) => sum + row.gmv, 0);

  return (
    <div className="-m-6 min-h-full bg-background p-4 text-slate-900 sm:p-6 lg:p-8 dark:text-foreground">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs text-slate-500 dark:text-muted-foreground">
            Admin / Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Command Center</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
            Your auction operations, customer activity and money at a glance.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[color:var(--auction)]">
            <span
              className={"h-1.5 w-1.5 rounded-full " + (isError ? "bg-red-500" : "bg-[color:var(--auction)]")}
            />
            {isPending
              ? "Loading dashboard…"
              : isError
                ? "Update unavailable"
                : "Updated " +
                  new Date(dataUpdatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) +
                  " · refreshes every minute"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm shadow-sm disabled:opacity-50 dark:border-border dark:bg-card"
          >
            <RefreshCw className={"h-4 w-4 " + (isFetching ? "animate-spin" : "")} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            disabled={!data}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[color:var(--auction)] px-4 text-sm font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Export report
          </button>
        </div>
      </div>
      {isError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Dashboard data could not be loaded. Check your API connection and reporting access, then
          click Refresh.{data && " Previously loaded values are shown below."}
        </div>
      )}
      <div aria-busy={isPending} className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map((metric, index) => (
          <article
            key={metric.key}
            title={metric.hint}
            className={
              "relative min-w-0 overflow-hidden rounded-[22px] border p-4 shadow-sm " +
              (index === 0
                ? "border-[color:var(--navy)] bg-gradient-to-br from-[color:var(--navy-2)] to-[color:var(--navy)] text-white"
                : index === 3
                  ? "border-[color:var(--auction)] bg-gradient-to-br from-orange-300 to-[color:var(--auction)] text-white"
                  : "border-slate-200 bg-white dark:border-border dark:bg-card")
            }
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider">{metric.label}</p>
              <span
                className={
                  "overflow-hidden rounded-xl p-1 " +
                  (index === 0 || index === 3 ? "bg-white/20" : "bg-orange-50 text-[color:var(--auction)]")
                }
              >
                <ThreeDIcon index={index as 0 | 1 | 2 | 3} />
              </span>
            </div>
            <p className="mt-3 break-words text-[clamp(1.35rem,2.1vw,2.1rem)] font-semibold leading-tight tracking-tight tabular-nums">
              {value(metric)}
            </p>
            <p className="mt-1.5 text-xs opacity-75">{metric.hint}</p>
            <div className="mt-3 border-t border-current/10 pt-2.5 text-xs opacity-80">
              Across the platform · current total
            </div>
          </article>
        ))}
      </div>
      <div
        aria-busy={isPending}
        className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6"
      >
        {secondary.map((metric, metricIndex) => (
          <article
            key={metric.key}
            title={metric.hint}
            className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-border dark:bg-card"
          >
            <span
              className={
                "shrink-0 rounded-xl p-2 " +
                (metric.key === "critical_security_alerts" || metric.key === "open_disputes"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-orange-50 text-[color:var(--auction)]")
              }
            >
              <CompactThreeDIcon index={metricIndex} />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-semibold leading-none tabular-nums">{value(metric)}</p>
              <h2 className="mt-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                {metric.label}
              </h2>
            </div>
          </article>
        ))}
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel
          title="Auction value & volume"
          description="Closed-auction GMV and completed auctions"
          className="lg:col-span-2"
          action={
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-border dark:bg-muted">
              {[3, 6, 12].map((period) => (
                <button
                  key={period}
                  onClick={() => setMonths(period)}
                  aria-pressed={months === period}
                  className={
                    "rounded-full px-3 py-1 text-xs " +
                    (months === period
                      ? "bg-white font-semibold text-[color:var(--navy)] shadow-sm"
                      : "text-slate-500")
                  }
                >
                  {period}M
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-2xl font-semibold tabular-nums">
              {data ? money(chartTotal) : "—"}
              <span className="ml-2 text-xs font-normal text-slate-500">in selected period</span>
            </p>
            <div className="flex gap-4 text-xs">
              <span className="text-[color:var(--navy)]">● GMV</span>
              <span className="text-[color:var(--auction)]">● Auctions</span>
            </div>
          </div>
          {!chartData.some((row) => row.auctions > 0) ? (
            <Empty>
              {isPending ? "Loading auction history…" : "No closed auctions in this period."}
            </Empty>
          ) : (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboard-gmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F3251" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#1F3251" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#e2e8e5" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    minTickGap={25}
                  />
                  <YAxis
                    yAxisId="money"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    width={55}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)
                    }
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, name: string) => [name === "GMV" ? money(v) : v, name]}
                  />
                  <Area
                    yAxisId="money"
                    type="monotone"
                    dataKey="gmv"
                    name="GMV"
                    stroke="#1F3251"
                    fill="url(#dashboard-gmv)"
                    strokeWidth={2.5}
                  />
                  <Area
                    yAxisId="count"
                    type="monotone"
                    dataKey="auctions"
                    name="Auctions"
                    stroke="#E65100"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel title="Auction mix" description="Distribution across auction directions">
          {!mix.length ? (
            <Empty>{isPending ? "Loading auctions…" : "No auctions available yet."}</Empty>
          ) : (
            <>
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {mix.map((item, i) => (
                        <Cell key={item.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-3xl tabular-nums">
                    {number.format(mix.reduce((sum, item) => sum + item.value, 0))}
                  </strong>
                  <span className="mt-1 text-xs text-slate-500">total auctions</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                {mix.map((item, i) => (
                  <span key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: colors[i % colors.length] }}
                    />
                    {item.name} <strong>{item.value}</strong>
                  </span>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Live auctions"
          description="Active events on the platform"
          action={
            <Link
              to="/control-room"
              className="flex items-center gap-1 text-xs font-medium text-[color:var(--auction)]"
            >
              Control room
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {!data?.live_events.length ? (
            <Empty>{isPending ? "Loading live events…" : "No auctions are live right now."}</Empty>
          ) : (
            <div className="space-y-3">
              {data.live_events.map((event) => (
                <Link
                  key={event.id}
                  to="/events/$id"
                  params={{ id: event.id }}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 hover:bg-orange-50 dark:border-border dark:hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.category} · {event.bidders} bidders
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{money(event.price)}</p>
                    <span className="text-[10px] font-medium text-[color:var(--auction)]">● LIVE</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
        <Panel
          title="Needs attention"
          description="Oldest auction and vendor reviews awaiting a decision"
          action={
            <Link
              to="/approvals"
              className="flex items-center gap-1 text-xs font-medium text-[color:var(--auction)]"
            >
              Approvals
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {!data?.needs_attention.length ? (
            <Empty>
              {isPending ? "Loading reviews…" : "No auction or vendor reviews pending."}
            </Empty>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-border">
              {data.needs_attention.map((item) => (
                <li
                  key={item.type + item.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.type} · {item.id}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs text-[color:var(--auction)]">
                    {item.hours_waiting == null
                      ? "Pending"
                      : Math.max(0, item.hours_waiting) + "h waiting"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Category concentration" description="Number of auctions per category">
          <Distribution rows={data?.category_mix ?? []} loading={isPending} />
        </Panel>
        <Panel title="Auction pipeline" description="All events by operational status">
          <Distribution rows={data?.pipeline ?? []} loading={isPending} />
        </Panel>
        <Panel title="Recent admin actions" description="Latest recorded operations">
          {!data?.activity.length ? (
            <Empty>{isPending ? "Loading activity…" : "No admin activity recorded yet."}</Empty>
          ) : (
            <ol className="space-y-4">
              {data.activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--auction)]" />
                  <div>
                    <p className="text-xs leading-relaxed">
                      <strong>{item.actor}</strong>{" "}
                      <span className="text-slate-500 dark:text-muted-foreground">
                        {item.action}
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {item.at ? new Date(item.at).toLocaleString() : "Time unavailable"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Distribution({ rows, loading }: { rows: Mix[]; loading: boolean }) {
  if (!rows.length) return <Empty>{loading ? "Loading data…" : "No records available yet."}</Empty>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div key={row.name}>
          <div className="mb-1.5 flex justify-between gap-2 text-xs">
            <span className="capitalize">{title(row.name)}</span>
            <strong className="tabular-nums">{number.format(row.value)}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: (row.value / max) * 100 + "%",
                background: colors[i % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
