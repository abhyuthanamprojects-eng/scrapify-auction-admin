import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Gavel, Play, RefreshCw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/auctions/live")({ component: LiveMonitor });

type LiveState = {
  code: string; status: string; direction: "forward" | "reverse";
  current_highest_inr: number | null; bidders: number; server_time: string;
  actual_started_at?: string | null; hard_end_at?: string | null;
  active_slot?: { id: number; sequence: number; type: string; starts_at: string; ends_at: string; cutoff_at: string; status: string } | null;
};
type AuctionSummary = { code: string; title: string; company: string; status: string; direction: string };

function countdown(iso?: string | null, offset = 0) {
  if (!iso) return "—";
  const total = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now() - offset) / 1000));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function LiveMonitor() {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<LiveState | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const loadAuctions = useCallback(async () => {
    const response = await adminApi.getAuctions({ status: "published,approved,live" });
    const rows = Array.isArray(response?.data) ? response.data : [];
    setAuctions(rows.map((a: any) => ({ code: a.code ?? a.id, title: a.title, company: a.company, status: a.status, direction: a.direction })));
    if (!selected && rows[0]) setSelected(rows[0].code ?? rows[0].id);
  }, [selected]);

  const loadState = useCallback(async () => {
    if (!selected) return;
    const [liveResponse, readinessResponse, bidsResponse] = await Promise.all([adminApi.getLiveState(selected), adminApi.getAuctionReadiness(selected), adminApi.getBids(selected)]);
    const next = liveResponse?.data ?? liveResponse;
    setState(next);
    setReadiness(readinessResponse?.data ?? readinessResponse);
    setBids(Array.isArray(bidsResponse?.data) ? bidsResponse.data : []);
    if (next?.server_time) setOffset(new Date(next.server_time).getTime() - Date.now());
  }, [selected]);

  useEffect(() => { loadAuctions().catch((e) => toast.error(e.message)); }, [loadAuctions]);
  useEffect(() => {
    if (!selected) return;
    loadState().catch((e) => toast.error(e.message));
    const timer = window.setInterval(() => loadState().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [selected, loadState]);

  const selectedSummary = useMemo(() => auctions.find((a) => a.code === selected), [auctions, selected]);
  const busy = async (work: () => Promise<unknown>, message: string) => {
    setLoading(true);
    try { await work(); await loadAuctions(); await loadState(); toast.success(message); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Server action failed"); }
    finally { setLoading(false); }
  };

  if (!selected || !selectedSummary) return <div className="card-premium p-12 text-center text-muted-foreground">No published or live auctions are available from the API.</div>;
  const active = state?.active_slot;
  const live = state?.status === "live";
  const ready = Boolean(readiness?.ready);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-2xl">Live Control</h1><p className="text-sm text-muted-foreground">Authoritative auction state from the backend.</p></div><Button variant="outline" disabled={loading} onClick={() => busy(loadState, "State refreshed")}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button></div>
    <div className="flex flex-wrap gap-2">{auctions.map((a) => <Button key={a.code} size="sm" variant={a.code === selected ? "default" : "outline"} onClick={() => setSelected(a.code)}>{a.code} · {a.status}</Button>)}</div>
    <section className="card-premium space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-xs text-muted-foreground">{selectedSummary.code}</div><h2 className="font-display text-xl">{selectedSummary.title}</h2><p className="text-sm text-muted-foreground">{selectedSummary.company} · {selectedSummary.direction}</p></div><div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">{state?.status ?? selectedSummary.status}</div></div>
      {!live && <div className={`rounded-lg p-3 text-sm ${ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}><strong>{ready ? "READY" : "NOT READY"}</strong>{!ready && <span className="ml-2">{(readiness?.reasons ?? []).join(", ") || "Readiness details unavailable"}</span>}</div>}
      <div className="grid gap-3 sm:grid-cols-4"><Metric label="Current value" value={state?.current_highest_inr == null ? "—" : `₹${Number(state.current_highest_inr).toLocaleString("en-IN")}`} /><Metric label="Participants" value={String(state?.bidders ?? readiness?.eligible_participants ?? 0)} /><Metric label="Slot remaining" value={countdown(active?.ends_at, offset)} /><Metric label="Server time" value={state?.server_time ? new Date(state.server_time).toLocaleTimeString() : "—"} /></div>
      {active && <div className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-5"><Info label="Slot" value={`#${active.sequence} ${active.type}`} /><Info label="Slot ID" value={String(active.id)} /><Info label="Ends" value={new Date(active.ends_at).toLocaleString()} /><Info label="Cutoff" value={new Date(active.cutoff_at).toLocaleString()} /><Info label="Hard end" value={state?.hard_end_at ? new Date(state.hard_end_at).toLocaleString() : "—"} /></div>}
      <div className="overflow-hidden rounded-lg border"><div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider">Accepted bids · server order</div><div className="max-h-64 overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-2">Server time</th><th className="px-3 py-2">Slot</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Reference</th></tr></thead><tbody>{bids.map((bid) => <tr key={bid.id} className="border-b"><td className="px-3 py-2 text-xs">{bid.at ? new Date(bid.at).toLocaleTimeString() : "—"}</td><td className="px-3 py-2">{bid.slot_id ?? "—"}</td><td className="px-3 py-2 font-semibold">₹{Number(bid.amount_inr ?? bid.amount ?? 0).toLocaleString("en-IN")}</td><td className="px-3 py-2 font-mono text-xs text-muted-foreground">{bid.id ?? "—"}</td></tr>)}{bids.length === 0 && <tr><td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">No accepted bids.</td></tr>}</tbody></table></div></div>
      <div className="flex flex-wrap gap-2">{!live && <Button disabled={loading || !ready} onClick={() => busy(() => adminApi.goLive(selected), "Auction started")}><Play className="mr-2 h-4 w-4" /> Start auction</Button>}{live && active && <Button variant="outline" disabled={loading} onClick={() => busy(() => adminApi.closeSlot(selected, active.id, reason || "ADMIN_FORCE_CLOSE"), "Current slot closed")}><Square className="mr-2 h-4 w-4" /> Close current slot</Button>}{live && !active && <Button variant="outline" disabled={loading} onClick={() => busy(() => adminApi.startNextSlot(selected), "Next slot started")}><ArrowRight className="mr-2 h-4 w-4" /> Start next slot</Button>}{live && <Button variant="destructive" disabled={loading} onClick={() => { if (window.confirm("Close this auction now?")) busy(() => adminApi.closeAuction(selected), "Auction closed"); }}><Gavel className="mr-2 h-4 w-4" /> Close auction</Button>}</div>
      {live && active && <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional slot close reason" />}
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-muted/40 p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>; }
