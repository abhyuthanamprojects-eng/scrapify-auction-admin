import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auctionStatusTone, formatInr, useAuctions, type AuctionStatus } from "@/lib/auctions-store";
import { AuctionOverviewChart } from "@/components/admin/auction-overview-chart";

export const Route = createFileRoute("/auctions/")({
  component: ApprovalQueue,
});

function ApprovalQueue() {
  const auctions = useAuctions();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AuctionStatus | "all">("Pending Approval");

  const rows = useMemo(() => {
    let list = auctions.filter((a) =>
      ["Pending Approval", "Sent Back", "Rejected", "Approved"].includes(a.status),
    );
    if (status !== "all") list = list.filter((a) => a.status === status);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (a) => a.id.toLowerCase().includes(t) || a.company.toLowerCase().includes(t) || a.title.toLowerCase().includes(t),
      );
    }
    return list;
  }, [auctions, q, status]);

  return (
    <>
      <AuctionOverviewChart auctions={auctions} />

      <div className="card-premium p-4 mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
          <Filter className="h-3.5 w-3.5" /> Approval Queue
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search auction ID, company or title…" className="pl-9" />
          </div>
          <div className="md:col-span-4">
            <Select value={status} onValueChange={(v) => setStatus(v as AuctionStatus | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Sent Back">Sent Back</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
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
                <th className="px-5 py-3 font-semibold">Company / Plant / Warehouse</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Submitted By</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold">Reserve Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">No auctions match these filters.</td></tr>
              )}
              {rows.map((a) => {
                const t = auctionStatusTone(a.status);
                return (
                  <tr key={a.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">{a.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{a.company}</div>
                      <div className="text-xs text-muted-foreground">{a.plant} · {a.warehouse}</div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{a.category}</td>
                    <td className="px-5 py-4">{a.submittedBy}</td>
                    <td className="px-5 py-4 text-muted-foreground">{new Date(a.submittedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-semibold">{formatInr(a.reservePriceInr)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild size="sm" className="gap-1.5">
                        <Link to="/auctions/$id" params={{ id: a.id }}>
                          <ShieldCheck className="h-3.5 w-3.5" /> Review
                        </Link>
                      </Button>
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