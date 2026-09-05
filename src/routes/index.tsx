import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, Section, StatCard, StatusPill, RiskDot, type Column } from "@/components/ops/ops-ui";
import { ageLabel, countdown, fmtMoney, events, auditLog, type ExceptionItem } from "@/lib/ops/data";
import { useAuctions } from "@/lib/auctions-store";
import { useExceptions } from "@/lib/exceptions-store";
import { adminApi } from "@/lib/api-client";
import { generateDashboardData } from "@/lib/dashboard-aggregator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Scrapify Operations Console" },
      {
        name: "description",
        content: "Platform-wide auction operations: live events, exceptions, finance exposure and risk in one console.",
      },
      { property: "og:title", content: "Command Center — Scrapify Operations Console" },
      { property: "og:description", content: "Live auctions, exceptions, finance exposure and risk signals across every customer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

const PIE_COLORS = ["#1F3251", "#E65100", "#2E7D32", "#7C3AED", "#0891B2", "#B45309", "#BE123C"];

function CommandCenter() {
  const auctions = useAuctions();
  const exceptions = useExceptions();
  const [dashData, setDashData] = useState(generateDashboardData(auctions, [], {}, []));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const finance = await adminApi.getFinanceSummary();
        setDashData(generateDashboardData(auctions, [], finance, []));
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (auctions.length > 0) fetch();
  }, [auctions]);

  const { kpis: dashboardKpis, gmvSeries, auctionTypeMix, categoryMix, settlementAging, liveEvents } = dashData;
  const disputes: any[] = [];

  const exceptionColumns: Column<ExceptionItem>[] = [
    { key: "kind", header: "Exception", render: (r) => <span className="font-medium">{r.kind}</span>, sortValue: (r) => r.kind },
    { key: "entity", header: "Entity", render: (r) => <span className="text-muted-foreground">{r.entity}</span>, sortValue: (r) => r.entity },
    {
      key: "event",
      header: "Event",
      render: (r) =>
        r.eventId ? (
          <Link to="/events/$id" params={{ id: r.eventId }} className="text-primary hover:underline">
            {r.eventId}
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "sev", header: "Severity", render: (r) => <StatusPill value={r.severity} />, sortValue: (r) => r.severity },
    { key: "age", header: "Age", render: (r) => ageLabel(r.raisedAt), sortValue: (r) => r.raisedAt },
    { key: "owner", header: "Owner", render: (r) => r.owner, sortValue: (r) => r.owner },
    { key: "action", header: "Recommended action", render: (r) => <span className="text-muted-foreground">{r.recommended}</span> },
  ];

  const openExceptions = exceptions.filter((e: any) => e.status !== "Resolved") as any[];

  return (
    <>
      <PageHeader
        title="Command Center"
        description="Everything happening across the platform right now — live events, decisions waiting on you, money at risk and integrity signals."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 mb-4">
        {dashboardKpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} hint={"hint" in k ? (k.hint as string) : undefined} tone={"tone" in k ? (k.tone as never) : "neutral"} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Section title="GMV & platform revenue" description="Forward vs reverse volume and fee income, last 12 months" className="lg:col-span-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gmvSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="fwd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(v: number) => fmtMoney(v)}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="forward" stroke="var(--primary)" fill="url(#fwd)" strokeWidth={2} name="Forward GMV" />
                <Area type="monotone" dataKey="reverse" stroke="var(--accent)" fill="url(#rev)" strokeWidth={2} name="Reverse GMV" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Auction type mix" description="Events by template">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={auctionTypeMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2}>
                  {auctionTypeMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Section title="Success rate & competition" description="Closed-won rate vs average participants">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gmvSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Line type="monotone" dataKey="successRate" stroke="#2E7D32" strokeWidth={2} dot={false} name="Success %" />
                <Line type="monotone" dataKey="avgParticipants" stroke="var(--accent)" strokeWidth={2} dot={false} name="Avg participants" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Category concentration" description="Events per category">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryMix} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={9} interval={0} angle={-35} height={50} textAnchor="end" stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--primary)" maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Settlement ageing" description="Outstanding settlements by age bucket">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={settlementAging} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--accent)" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Section
          title="Live now"
          description={`${liveEvents.length} auctions running`}
          className="lg:col-span-2"
          actions={
            <Link to="/control-room" className="text-xs font-medium text-primary hover:underline">
              Open control room →
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {liveEvents.map((e) => (
              <Link
                key={e.id}
                to="/events/$id"
                params={{ id: e.id }}
                className="rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{e.name}</p>
                  <StatusPill value="Live" />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {e.customerName} · {e.direction} · {e.category}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Current</p>
                    <p className="font-semibold">{fmtMoney(e.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Bidders</p>
                    <p className="font-semibold">{e.participants}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Hours left</p>
                    <p className="font-semibold text-accent">{(e as any).endAt ? countdown((e as any).endAt) : `${e.hoursLeft ?? 0}h`}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Recent admin actions" description="Last 8 audited operations">
          <ol className="space-y-3">
            {auditLog.slice(0, 8).map((a) => (
              <li key={a.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <p className="text-sm">
                  <span className="font-medium">{a.actor}</span>{" "}
                  <span className="text-muted-foreground">{a.action.toLowerCase()}</span>{" "}
                  <span className="font-medium">{a.entityId}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {a.role} · {ageLabel(a.at)} ago
                </p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section
        title="Needs attention"
        description={`${openExceptions.length} open exceptions across auctions, compliance, finance, fulfilment and risk`}
        actions={
          <Link to="/exceptions" className="text-xs font-medium text-primary hover:underline">
            View all exceptions →
          </Link>
        }
      >
        <DataTable rows={openExceptions} columns={exceptionColumns} exportName="needs-attention" pageSize={8} />
      </Section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Escalated disputes" description="Highest-severity open disputes">
          <ul className="space-y-3">
            {disputes
              .filter((d) => d.stage !== "Closed")
              .slice(0, 5)
              .map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.issue}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {d.customerName} vs {d.vendorName} · {d.eventId}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill value={d.severity} />
                    <p className="mt-1 text-[11px] text-muted-foreground">{fmtMoney(d.amount)}</p>
                  </div>
                </li>
              ))}
          </ul>
        </Section>

        <Section title="Pipeline by status" description="All events by operational status">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from(new Set(events.map((e) => e.status))).map((s) => (
              <div key={s} className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="font-display text-xl">{events.filter((e) => e.status === s).length}</p>
                <p className="text-[11px] text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
