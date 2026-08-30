import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { Auction, AuctionStatus } from "@/lib/auctions-store";

const BUCKETS: Array<{
  label: "Completed" | "Pending" | "Upcoming" | "Failed";
  statuses: AuctionStatus[];
  color: string;
  chip: string;
}> = [
  { label: "Completed", statuses: ["Closed"], color: "#2E7D32", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { label: "Pending", statuses: ["Pending Approval", "Sent Back"], color: "var(--accent)", chip: "bg-accent/10 text-accent ring-accent/30" },
  { label: "Upcoming", statuses: ["Approved", "Published", "Live"], color: "var(--primary)", chip: "bg-primary/10 text-primary ring-primary/30" },
  { label: "Failed", statuses: ["Rejected", "Cancelled"], color: "#DC2626", chip: "bg-red-50 text-red-700 ring-red-200" },
];

export function AuctionOverviewChart({ auctions }: { auctions: Auction[] }) {
  const data = useMemo(
    () =>
      BUCKETS.map((b) => ({
        name: b.label,
        value: auctions.filter((a) => b.statuses.includes(a.status)).length,
        color: b.color,
        chip: b.chip,
      })),
    [auctions],
  );

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section className="card-premium p-5 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" /> Auction Overview
        </div>
        <div className="text-xs text-muted-foreground">
          Total <span className="font-semibold text-foreground">{total}</span> auctions
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 content-start">
          {data.map((d) => (
            <div key={d.name} className="rounded-xl border border-border bg-background p-4">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ${d.chip}`}>
                {d.name}
              </span>
              <div className="mt-2 font-display text-3xl text-foreground">{d.value}</div>
              <div className="text-xs text-muted-foreground">
                {total ? Math.round((d.value / total) * 100) : 0}% of all auctions
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-7 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}