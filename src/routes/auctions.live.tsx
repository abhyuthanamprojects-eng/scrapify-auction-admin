import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Clock, Gavel, Timer, StopCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatInr, updateAuction, useAuctions, type Auction } from "@/lib/auctions-store";

export const Route = createFileRoute("/auctions/live")({
  component: LiveMonitor,
});

function LiveMonitor() {
  const auctions = useAuctions();
  const live = useMemo(() => auctions.filter((a) => a.status === "Live"), [auctions]);
  const [openId, setOpenId] = useState<string | null>(null);
  const target = auctions.find((a) => a.id === openId);

  if (live.length === 0) {
    return (
      <div className="card-premium p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Gavel className="h-5 w-5 text-primary" />
        </div>
        <p className="text-muted-foreground">No auctions are live right now.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {live.map((a) => (
          <LiveCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />
        ))}
      </div>

      <Dialog open={openId !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-3xl">
          {target && <LiveDetail a={target} onClose={() => setOpenId(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function useCountdown(iso: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(iso).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function LiveCard({ a, onOpen }: { a: Auction; onOpen: () => void }) {
  const remaining = useCountdown(a.scheduleEnd);
  const highest = a.currentHighestInr ?? a.startingPriceInr;
  return (
    <button onClick={onOpen} className="card-premium p-5 text-left hover:ring-primary/30 transition-all relative overflow-hidden group">
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 ring-1 ring-primary/20">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> LIVE
      </div>
      <div className="text-xs font-mono text-muted-foreground">{a.id}</div>
      <div className="font-display text-lg mt-1 leading-tight">{a.title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{a.company} · {a.location}</div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Highest Bid" value={formatInr(highest)} accent />
        <Metric label="Bidders" value={String(a.bidders ?? 0)} icon={<Users className="h-3.5 w-3.5" />} />
        <Metric label="Ends In" value={remaining} icon={<Clock className="h-3.5 w-3.5" />} />
      </div>

      {a.lotType === "Lot-wise" && a.subLots.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/60 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sub-lots</div>
          {a.subLots.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.id} · {s.name}</span>
              <span className="font-semibold">{formatInr(s.currentBidInr ?? s.reservePriceInr)}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

function Metric({ label, value, accent, icon }: { label: string; value: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-lg p-2.5 ring-1 ${accent ? "bg-primary/5 ring-primary/20" : "bg-muted/40 ring-border"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function LiveDetail({ a, onClose }: { a: Auction; onClose: () => void }) {
  const remaining = useCountdown(a.scheduleEnd);
  const [modal, setModal] = useState<null | "extend" | "end">(null);
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(10);

  function extend() {
    if (!reason.trim()) return toast.error("Reason required.");
    const newEnd = new Date(new Date(a.scheduleEnd).getTime() + minutes * 60_000).toISOString();
    updateAuction(a.id, {
      scheduleEnd: newEnd,
      extensions: [...(a.extensions ?? []), { reason, minutes, at: new Date().toISOString() }],
    });
    toast.success(`Auction extended by ${minutes} min.`);
    setModal(null); setReason("");
  }
  function endNow() {
    updateAuction(a.id, {
      status: "Closed",
      closedAt: new Date().toISOString(),
      finalPriceInr: a.currentHighestInr,
      winner: a.bids[0]?.vendorName,
    });
    toast.success(`${a.id} closed manually.`);
    setModal(null);
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <div className="text-xs font-mono text-muted-foreground">{a.id}</div>
          <div>{a.title}</div>
        </DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Highest Bid" value={formatInr(a.currentHighestInr ?? a.startingPriceInr)} accent />
        <Metric label="Bidders" value={String(a.bidders ?? 0)} icon={<Users className="h-3.5 w-3.5" />} />
        <Metric label="Ends In" value={remaining} icon={<Clock className="h-3.5 w-3.5" />} />
      </div>

      <div className="rounded-lg ring-1 ring-border overflow-hidden">
        <div className="px-4 py-2 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">Bid History (unmasked)</div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase text-muted-foreground border-b border-border/60">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Sub-Lot</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {a.bids.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-xs">No bids yet.</td></tr>}
              {a.bids.map((b) => (
                <tr key={b.id} className="border-b border-border/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(b.at).toLocaleTimeString()}</td>
                  <td className="px-3 py-2"><div className="font-medium">{b.vendorName}</div><div className="text-[10px] font-mono text-muted-foreground">{b.vendorId}</div></td>
                  <td className="px-3 py-2 text-xs">{b.subLotId ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatInr(b.amountInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DialogFooter className="!justify-between">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal("extend")} className="gap-1.5 border-accent text-accent hover:bg-accent/10">
            <Timer className="h-4 w-4" /> Extend Auction
          </Button>
          <Button variant="outline" onClick={() => setModal("end")} className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50">
            <StopCircle className="h-4 w-4" /> End Auction Now
          </Button>
        </div>
      </DialogFooter>

      <Dialog open={modal === "extend"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Extend Auction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Extend by (minutes)</label>
              <Input type="number" min={1} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Technical issue reported by 2 bidders…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={extend} className="gap-1.5"><Timer className="h-4 w-4" /> Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "end"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>End Auction Now</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This closes the auction immediately and locks the current highest bid as the winning bid.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={endNow} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
              <X className="h-4 w-4" /> Confirm End
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}