import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Download, FileSpreadsheet, TrendingUp, Trophy, Layers, FileText, Gavel, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { auctionStatusTone, formatInr, useAuctions, type AuctionCategory } from "@/lib/auctions-store";
import { toast } from "sonner";
import { generateH1Report } from "@/lib/h1-report";
import { generateAllBidReport, generateAllBidderReport } from "@/lib/bid-reports";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Auction Reports — Scrapify Admin" },
      { name: "description", content: "Auction performance reports with filters and exports." },
      { property: "og:title", content: "Auction Reports — Scrapify Admin" },
      { property: "og:description", content: "Auction performance reports with filters and exports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const auctions = useAuctions();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState<AuctionCategory | "all">("all");
  const [org, setOrg] = useState<string>("all");
  const [status, setStatus] = useState<"Live" | "Closed" | "Cancelled" | "all">("all");

  const orgs = useMemo(() => Array.from(new Set(auctions.map((a) => a.company))).sort(), [auctions]);

  const rows = useMemo(() => {
    let list = auctions.filter((a) => ["Live", "Closed", "Cancelled"].includes(a.status));
    if (status !== "all") list = list.filter((a) => a.status === status);
    if (category !== "all") list = list.filter((a) => a.category === category);
    if (org !== "all") list = list.filter((a) => a.company === org);
    if (from) list = list.filter((a) => new Date(a.submittedAt) >= new Date(from));
    if (to) list = list.filter((a) => new Date(a.submittedAt) <= new Date(to));
    return list;
  }, [auctions, status, category, org, from, to]);

  const summary = useMemo(() => {
    const total = rows.length;
    const value = rows.reduce((s, a) => s + (a.finalPriceInr ?? a.currentHighestInr ?? 0), 0);
    const savings = rows.length
      ? rows.reduce((s, a) => {
          const final = a.finalPriceInr ?? a.currentHighestInr ?? a.reservePriceInr;
          return s + (final - a.reservePriceInr) / a.reservePriceInr;
        }, 0) / rows.length
      : 0;
    const catCounts = new Map<string, number>();
    rows.forEach((a) => catCounts.set(a.category, (catCounts.get(a.category) ?? 0) + 1));
    const top = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { total, value, savings: savings * 100, top };
  }, [rows]);

  function exportCsv() {
    const h = ["Auction ID", "Category", "Location", "Starting Price", "Final Price", "Bidders", "Winner", "Status", "Closed Date"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const body = rows.map((a) =>
      [
        a.id, a.category, a.location, String(a.startingPriceInr),
        String(a.finalPriceInr ?? a.currentHighestInr ?? 0),
        String(a.bidders ?? 0), a.winner ?? "—", a.status,
        a.closedAt ? new Date(a.closedAt).toLocaleDateString() : "—",
      ].map(esc).join(","),
    );
    const csv = [h.map(esc).join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scrapify-auction-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported.");
  }

  function exportAllH1() {
    if (!rows.length) return toast.error("No auctions match these filters.");
    rows.forEach((a, i) => setTimeout(() => generateH1Report(a), i * 350));
    toast.success(`Generating ${rows.length} H1 summary PDF${rows.length > 1 ? "s" : ""}…`);
  }

  function exportAll(kind: "bids" | "bidders") {
    if (!rows.length) return toast.error("No auctions match these filters.");
    const fn = kind === "bids" ? generateAllBidReport : generateAllBidderReport;
    rows.forEach((a, i) => setTimeout(() => fn(a), i * 350));
    toast.success(`Generating ${rows.length} ${kind === "bids" ? "All Bid" : "All Bidder"} PDF${rows.length > 1 ? "s" : ""}…`);
  }

  return (
    <>
      <PageHeader
        title="Auction Reports"
        description="Performance across live, closed and cancelled auctions."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportAllH1} className="gap-2">
              <FileText className="h-4 w-4" /> H1 Report (PDF)
            </Button>
            <Button variant="outline" onClick={() => exportAll("bids")} className="gap-2">
              <Gavel className="h-4 w-4" /> All Bid Report (PDF)
            </Button>
            <Button variant="outline" onClick={() => exportAll("bidders")} className="gap-2">
              <Users className="h-4 w-4" /> All Bidder Report (PDF)
            </Button>
            <Button onClick={exportCsv} className="gap-2">
              <Download className="h-4 w-4" /> Export Excel/CSV
            </Button>
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-foreground">Report fields are a draft</div>
          <div className="text-muted-foreground">Please confirm exact requirements with client, as the shared Admin Flow document did not specify them.</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <SummaryCard icon={<Layers className="h-4 w-4" />} label="Total Auctions" value={String(summary.total)} />
        <SummaryCard icon={<FileSpreadsheet className="h-4 w-4" />} label="Value Realized" value={formatInr(summary.value)} />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Avg Savings vs Reserve" value={`${summary.savings >= 0 ? "+" : ""}${summary.savings.toFixed(1)}%`} tone={summary.savings >= 0 ? "positive" : "negative"} />
        <SummaryCard icon={<Trophy className="h-4 w-4" />} label="Most Active Category" value={summary.top} />
      </div>

      <div className="card-premium p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as AuctionCategory | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["Ferrous", "Non-Ferrous", "E-Waste", "Paper", "Plastic", "Rubber"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Organization</label>
            <Select value={org} onValueChange={setOrg}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {orgs.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as "Live" | "Closed" | "Cancelled" | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 font-semibold">Auction ID</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Starting Price</th>
                <th className="px-5 py-3 font-semibold">Final Price</th>
                <th className="px-5 py-3 font-semibold">Bidders</th>
                <th className="px-5 py-3 font-semibold">Winner</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Closed</th>
                <th className="px-5 py-3 font-semibold text-right">Reports</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="px-5 py-16 text-center text-muted-foreground">No auctions match these filters.</td></tr>}
              {rows.map((a) => {
                const t = auctionStatusTone(a.status);
                return (
                  <tr key={a.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">{a.id}</td>
                    <td className="px-5 py-4">{a.category}</td>
                    <td className="px-5 py-4 text-muted-foreground">{a.location}</td>
                    <td className="px-5 py-4">{formatInr(a.startingPriceInr)}</td>
                    <td className="px-5 py-4 font-semibold">{formatInr(a.finalPriceInr ?? a.currentHighestInr ?? 0)}</td>
                    <td className="px-5 py-4">{a.bidders ?? 0}</td>
                    <td className="px-5 py-4">{a.winner ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}>
                        <span className={`h-1 w-1 rounded-full ${t.dot}`} /> {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{a.closedAt ? new Date(a.closedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => generateH1Report(a)} title="H1 Summary Report">
                          <FileText className="h-3.5 w-3.5" /> H1
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => generateAllBidReport(a)} title="All Bid Report">
                          <Gavel className="h-3.5 w-3.5" /> Bids
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => generateAllBidderReport(a)} title="All Bidder Report">
                          <Users className="h-3.5 w-3.5" /> Bidders
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-2 text-2xl font-display ${tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-700" : ""}`}>{value}</div>
    </div>
  );
}