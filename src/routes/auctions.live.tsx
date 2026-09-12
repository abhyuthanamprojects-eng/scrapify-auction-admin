import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Camera,
  Clock3,
  Gauge,
  Gavel,
  Image as ImageIcon,
  Play,
  Radio,
  ShieldCheck,
  Square,
  Users,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";

export const Route = createFileRoute("/auctions/live")({ component: LiveMonitor });

type LiveState = {
  auction_id?: number;
  code: string;
  auction_code?: string;
  title?: string;
  company?: string;
  category?: string | null;
  location?: string | null;
  status: string;
  direction: "forward" | "reverse";
  starting_price_inr?: number | null;
  current_highest_inr: number | null;
  current_lowest_inr?: number | null;
  bidders: number;
  server_time: string;
  total_bids?: number;
  participant_count?: number;
  eligible_participants?: number;
  connected_participants?: number | null;
  last_bid_at?: string | null;
  starting_price_inr?: number | null;
  bid_increment_inr?: number | null;
  hard_end_at?: string | null;
  initial_slot_minutes?: number;
  continuation_slot_minutes?: number;
  maximum_auction_duration_minutes?: number;
  configuration?: {
    initial_slot_minutes?: number;
    continuation_slot_minutes?: number;
    maximum_auction_duration_minutes?: number;
    bid_cutoff_ms?: number;
  };
  slots?: Array<{
    id: number;
    sequence: number;
    type: string;
    started_at?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    cutoff_at?: string | null;
    status: string;
    close_reason?: string | null;
    bid_count?: number;
    closing_price_inr?: number | null;
  }>;
  audit_events?: Array<{
    id?: string;
    at?: string | null;
    action: string;
    entity_type?: string | null;
    user?: string | null;
    role?: string | null;
  }>;
  active_slot?: { id: number; sequence: number; type: string; ends_at: string } | null;
  participants?: Array<{
    id?: string | number;
    name?: string;
    alias?: string;
    status?: string;
    connection_state?: string;
    last_seen_at?: string | null;
    bid_count?: number;
    current_rank?: number | null;
  }>;
};

type AuctionSummary = {
  code: string;
  title: string;
  company: string;
  status: string;
  direction: string;
  category?: string;
  location?: string;
  quantity?: string;
  image?: string | null;
};

function countdown(iso?: string | null, offset = 0, now = Date.now()) {
  if (!iso) return "—";
  const total = Math.max(0, Math.floor((new Date(iso).getTime() - now - offset) / 1000));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function money(value: number | null | undefined) {
  return value == null ? "—" : `₹${Number(value).toLocaleString("en-IN")}`;
}

function LiveMonitor() {
  const [role] = useRole();
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("auction");
  });
  const [state, setState] = useState<LiveState | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [offset, setOffset] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [stale, setStale] = useState(false);
  const canControl = roleCan(role, "act.auctionControl");

  const loadAuctions = useCallback(async () => {
    const response = await adminApi.getAuctions({ status: "published,approved,live" });
    const rows = Array.isArray(response?.data) ? response.data : [];
    const normalizedRows = rows.map((a: any) => ({
      code: a.code ?? a.id,
      title: a.title ?? "Untitled auction",
      company: a.company ?? a.customer_name ?? "—",
      status: a.status ?? "unknown",
      direction: a.direction ?? "forward",
      category: a.category ?? a.material_category,
      location: a.location,
      quantity: a.quantity ?? a.lot_quantity,
      image: a.image_url ?? a.cover_image_url ?? a.thumbnail_url ?? a.photos?.[0] ?? null,
    }));
    const liveRows = normalizedRows.filter((a) => a.status.toLowerCase() === "live");
    const visibleRows = liveRows.length > 0 ? liveRows : normalizedRows;
    setAuctions(visibleRows);
    if ((!selected || !visibleRows.some((a) => a.code === selected)) && visibleRows[0]) {
      setSelected(visibleRows[0].code);
    }
  }, [selected]);

  const loadState = useCallback(async () => {
    if (!selected) return;
    try {
      const [liveResponse, readinessResponse, bidsResponse] = await Promise.all([
        adminApi.getLiveState(selected),
        adminApi.getAuctionReadiness(selected),
        adminApi.getBids(selected),
      ]);
      const next = liveResponse?.data ?? liveResponse;
      setState(next);
      setReadiness(readinessResponse?.data ?? readinessResponse);
      setBids(Array.isArray(bidsResponse?.data) ? bidsResponse.data : []);
      if (next?.server_time) setOffset(new Date(next.server_time).getTime() - Date.now());
      setStale(false);
    } catch (error) {
      setStale(true);
      throw error;
    }
  }, [selected]);

  useEffect(() => {
    loadAuctions().catch((e) => toast.error(e.message));
  }, [loadAuctions]);
  useEffect(() => {
    if (!selected) return;
    loadState().catch((e) => toast.error(e.message));
    const timer = window.setInterval(() => loadState().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [selected, loadState]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedSummary = useMemo(
    () => auctions.find((a) => a.code === selected),
    [auctions, selected],
  );
  const busy = async (work: () => Promise<unknown>, message: string) => {
    setLoading(true);
    try {
      await work();
      await loadAuctions();
      await loadState();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Server action failed");
    } finally {
      setLoading(false);
    }
  };

  if (!selected || !selectedSummary)
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#08111f] p-8 text-center text-slate-400">
        <div>
          <Radio className="mx-auto mb-4 h-10 w-10 text-cyan-400" />
          <p className="text-lg font-semibold text-white">No auction rooms available</p>
          <p className="mt-1 text-sm">
            The live auction list will appear when the API returns published or live auctions.
          </p>
        </div>
      </div>
    );

  const active = state?.active_slot;
  const live = state?.status === "live";
  const ready = Boolean(readiness?.ready);
  const currentPrice =
    state?.direction === "reverse" ? state.current_lowest_inr : state?.current_highest_inr;
  const bidCount = state?.total_bids ?? bids.length;
  const participantCount = state?.participant_count ?? state?.bidders ?? null;
  const eligibleCount = state?.eligible_participants ?? readiness?.eligible_participants ?? null;
  const connectedCount = state?.connected_participants ?? null;
  const auctionTimeLeft = countdown(state?.hard_end_at, offset, clock);
  const slotTimeLeft = countdown(active?.ends_at, offset, clock);
  const hardEndPassed = Boolean(
    state?.hard_end_at && new Date(state.hard_end_at).getTime() <= clock + offset,
  );
  const initialSlotMinutes =
    state?.initial_slot_minutes ?? state?.configuration?.initial_slot_minutes;
  const continuationSlotMinutes =
    state?.continuation_slot_minutes ?? state?.configuration?.continuation_slot_minutes;
  const maximumDurationMinutes =
    state?.maximum_auction_duration_minutes ??
    state?.configuration?.maximum_auction_duration_minutes;
  const canStartNextSlot = live && !active && !hardEndPassed;
  const participants = state?.participants ?? [];

  return (
    <div className="relative h-dvh overflow-hidden bg-[#08111f] text-slate-100">
      {stale && (
        <div className="absolute inset-x-0 top-0 z-30 border-b border-amber-300/30 bg-amber-950/90 px-4 py-2 text-center text-xs font-semibold text-amber-100">
          Live state is stale. Retrying the server connection; displayed values are the last
          confirmed snapshot.
        </div>
      )}
      <div className="grid h-dvh min-h-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#0d1b30] p-4 lg:h-dvh lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {auctions.some((a) => a.status.toLowerCase() === "live")
                  ? "Live rooms"
                  : "Auction rooms"}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {auctions.length} monitored
              </div>
            </div>
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="max-h-[calc(100dvh-6rem)] space-y-2 overflow-y-auto pr-1">
            {auctions.map((auction) => {
              const isSelected = auction.code === selected;
              const isLive = auction.status.toLowerCase() === "live";
              return (
                <button
                  key={auction.code}
                  type="button"
                  onClick={() => setSelected(auction.code)}
                  className={`group w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.12)]" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isLive ? "animate-pulse bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-amber-300"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {auction.title}
                      </div>
                      <div className="mt-1 truncate font-mono text-[10px] text-slate-500">
                        {auction.code}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                        <span>{auction.status}</span>
                        <span>{auction.direction}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_35%),linear-gradient(135deg,#0b1729_0%,#111d31_55%,#0a1322_100%)] p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                <span>{selectedSummary.code}</span>
                <span className="text-slate-700">/</span>
                <span>{selectedSummary.company}</span>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {selectedSummary.title}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {selectedSummary.category ?? "Auction lot"} · {selectedSummary.direction} auction{" "}
                {selectedSummary.location ? `· ${selectedSummary.location}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Syncing every 5
              seconds
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-5">
              <section className="relative overflow-hidden rounded-3xl border border-cyan-200/15 bg-[#13243d]/90 shadow-2xl shadow-black/30">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.11),transparent_35%,rgba(124,58,237,0.1))]" />
                <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_250px] md:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      <Gauge className="h-4 w-4 text-cyan-300" /> Current market state
                    </div>
                    <div className="mt-4 flex items-end gap-3">
                      <div className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
                        {money(currentPrice)}
                      </div>
                      <div className="mb-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                        {state?.direction === "reverse" ? "L1 lowest" : "H1 highest"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4 text-violet-300" /> {participantCount}{" "}
                        participants
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-amber-300" /> {bidCount} accepted bids
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-300/25 bg-black/20 p-4 text-center shadow-[inset_0_0_30px_rgba(245,158,11,0.06)]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/70">
                      Auction hard end
                    </div>
                    <div className="mt-2 font-mono text-3xl font-bold tracking-wider text-amber-200 sm:text-4xl">
                      {auctionTimeLeft}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {active
                        ? `Slot ${active.sequence}: ${slotTimeLeft} remaining`
                        : live
                          ? "Maximum live window"
                          : "Not started"}
                    </div>
                  </div>
                </div>
                <div className="relative grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
                  <DarkMetric icon={<Users />} label="Eligible" value={eligibleCount == null ? "—" : String(eligibleCount)} />
                  <DarkMetric icon={<Wifi />} label="Connected" value={connectedCount == null ? "Unavailable" : String(connectedCount)} />
                  <DarkMetric
                    icon={<Clock3 />}
                    label="Last bid"
                    value={
                      state?.last_bid_at ? new Date(state.last_bid_at).toLocaleTimeString() : "—"
                    }
                  />
                  <DarkMetric
                    icon={<ShieldCheck />}
                    label="Readiness"
                    value={live ? "Live" : ready ? "Ready" : "Blocked"}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0e1b2f]/90 p-4 shadow-2xl shadow-black/20 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Bid stream
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Accepted bids · server order
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live feed
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#142640] text-left text-[10px] uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Server time</th>
                          <th className="px-4 py-3">Slot</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.map((bid) => (
                          <tr key={bid.id} className="border-t border-white/10 text-slate-300">
                            <td className="px-4 py-3 text-xs">
                              {bid.at ? new Date(bid.at).toLocaleTimeString() : "—"}
                            </td>
                            <td className="px-4 py-3">{bid.slot_id ?? "—"}</td>
                            <td className="px-4 py-3 font-semibold text-white">
                              ₹{Number(bid.amount_inr ?? bid.amount ?? 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                              {bid.id ?? "—"}
                            </td>
                          </tr>
                        ))}
                        {bids.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                              No accepted bids returned by the auction service.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0e1b2f]/90 p-4 shadow-2xl shadow-black/20 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
                      Participant monitor
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-white">Participant monitor</h3>
                  </div>
                  <div className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-xs font-semibold text-violet-200">
                    {participantCount == null ? "—" : String(participantCount) + " total"}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10">
                  {participants.length > 0 ? (
                    <div className="divide-y divide-white/10">
                      {participants.map((participant, index) => (
                        <div
                          key={participant.id ?? participant.alias ?? index}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {participant.name ?? participant.alias ?? `Participant ${index + 1}`}
                            </div>
                            <div className="mt-1 truncate font-mono text-[10px] text-slate-500">
                              {participant.alias ?? participant.id ?? "—"}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-[10px] uppercase tracking-wider text-slate-400">
                            <div
                              className={
                                participant.connection_state === "connected"
                                  ? "text-emerald-300"
                                  : "text-amber-300"
                              }
                            >
                              {participant.connection_state ?? participant.status ?? "unknown"}
                            </div>
                            <div className="mt-1">
                              {participant.last_seen_at
                                ? new Date(participant.last_seen_at).toLocaleTimeString()
                                : "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-7 text-center text-sm text-slate-500">
                      {participantCount != null && participantCount > 0
                        ? "Participant roster is not included in the live-state response."
                        : "Presence data is not available in the current API snapshot."}
                    </div>
                  )}
                </div>
              </section>

              <section className="grid gap-5 rounded-3xl border border-white/10 bg-[#0e1b2f]/90 p-4 shadow-2xl shadow-black/20 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                    Frozen configuration
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-white">Rules used by this auction</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <DarkInfo label="Initial slot" value={initialSlotMinutes == null ? "—" : `${initialSlotMinutes} min`} />
                    <DarkInfo label="Continuation" value={continuationSlotMinutes == null ? "—" : `${continuationSlotMinutes} min`} />
                    <DarkInfo label="Hard maximum" value={maximumDurationMinutes == null ? "—" : `${maximumDurationMinutes} min`} />
                    <DarkInfo label="Bid cutoff" value={state?.configuration?.bid_cutoff_ms == null ? "—" : `${state.configuration.bid_cutoff_ms} ms`} />
                    <DarkInfo label="Starting price" value={money(state?.starting_price_inr)} />
                    <DarkInfo label="Bid increment" value={money(state?.bid_increment_inr)} />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
                    Slot history
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-white">Persisted transitions</h3>
                  <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
                    {(state?.slots ?? []).map((slot) => (
                      <div key={slot.id} className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white">Slot {slot.sequence} · {slot.type}</span>
                          <span className="uppercase tracking-wider text-slate-400">{slot.status}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-500">
                          <span>{slot.bid_count ?? 0} bids</span>
                          <span>closing {money(slot.closing_price_inr)}</span>
                          {slot.close_reason && <span>{slot.close_reason}</span>}
                        </div>
                      </div>
                    ))}
                    {(state?.slots ?? []).length === 0 && <div className="text-sm text-slate-500">Slot history unavailable.</div>}
                  </div>
                </div>
                <div className="xl:col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Immutable audit timeline
                  </div>
                  <div className="mt-3 max-h-44 overflow-y-auto rounded-2xl border border-white/10">
                    {(state?.audit_events ?? []).map((event) => (
                      <div key={event.id ?? `${event.action}-${event.at}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs last:border-b-0">
                        <span className="font-semibold text-white">{event.action}</span>
                        <span className="text-slate-500">{event.user ?? "System"} · {event.role ?? "—"}</span>
                        <span className="font-mono text-slate-500">{event.at ? new Date(event.at).toLocaleString() : "—"}</span>
                      </div>
                    ))}
                    {(state?.audit_events ?? []).length === 0 && <div className="px-3 py-5 text-center text-sm text-slate-500">No audit events returned for this auction.</div>}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0e1b2f]/90 shadow-2xl shadow-black/20">
                <div className="relative h-44 overflow-hidden bg-[radial-gradient(circle_at_35%_30%,rgba(34,211,238,0.32),transparent_26%),linear-gradient(135deg,#162f4f,#101827)]">
                  {selectedSummary.image ? (
                    <img
                      src={selectedSummary.image}
                      alt={`${selectedSummary.title} auction`}
                      className="h-full w-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="h-10 w-10 text-cyan-300/60" />
                      <span className="mt-2 text-xs">No auction image supplied</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1b2f] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs font-semibold text-white">
                    <Camera className="h-4 w-4 text-cyan-300" /> Auction media
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Auction details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DarkInfo label="Status" value={state?.status ?? selectedSummary.status} />
                    <DarkInfo label="Direction" value={selectedSummary.direction} />
                    <DarkInfo label="Quantity" value={selectedSummary.quantity ?? "—"} />
                    <DarkInfo label="Bid increment" value={money(state?.bid_increment_inr)} />
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <DarkInfo
                      label="Server time"
                      value={
                        state?.server_time ? new Date(state.server_time).toLocaleString() : "—"
                      }
                    />
                    <div className="mt-3">
                      <DarkInfo
                        label="Hard end"
                        value={
                          state?.hard_end_at ? new Date(state.hard_end_at).toLocaleString() : "—"
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              {canControl ? (
                <section className="rounded-3xl border border-cyan-300/20 bg-[#10243c]/95 p-5 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-cyan-300/10 p-2 text-cyan-300">
                      <Gavel className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                        Operator controls
                      </div>
                      <h3 className="mt-1 font-semibold text-white">Control this room</h3>
                    </div>
                  </div>
                  {!live && (
                    <div
                      className={`mb-4 rounded-xl border p-3 text-xs ${ready ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-amber-300/20 bg-amber-400/10 text-amber-200"}`}
                    >
                      <strong>{ready ? "READY TO START" : "NOT READY"}</strong>
                      {!ready && (
                        <span className="ml-2 text-amber-100/70">
                          {(readiness?.reasons ?? []).join(", ") || "Readiness details unavailable"}
                        </span>
                      )}
                    </div>
                  )}
                  {live && (
                    <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">
                          Initial slot
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {initialSlotMinutes == null ? "—" : String(initialSlotMinutes) + " min"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">
                          Continuation
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {continuationSlotMinutes == null ? "—" : String(continuationSlotMinutes) + " min"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">
                          Hard maximum
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {maximumDurationMinutes == null ? "—" : String(maximumDurationMinutes / 60) + " hr"}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    {!live && (
                      <Button
                        disabled={loading || !ready}
                        onClick={() => busy(() => adminApi.goLive(selected), "Auction started")}
                        className="h-11 justify-start bg-cyan-400 font-bold text-[#07111e] hover:bg-cyan-300"
                      >
                        <Play className="mr-2 h-4 w-4" /> Start auction / go live
                      </Button>
                    )}
                    {live && active && (
                      <Button
                        variant="outline"
                        disabled={loading || !reason.trim()}
                        onClick={() =>
                          window.confirm("Close slot " + active.sequence + "? Reason: " + reason.trim())
                            && busy(
                              () => adminApi.closeSlot(selected, active.id, reason.trim()),
                              "Current slot closed",
                            )
                        }
                        className="h-11 justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Square className="mr-2 h-4 w-4" /> Close current slot
                      </Button>
                    )}
                    {canStartNextSlot && (
                      <Button
                        variant="outline"
                        disabled={loading}
                        onClick={() =>
                          busy(() => adminApi.startNextSlot(selected), "Next slot started")
                        }
                        className="h-11 justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        <ArrowRight className="mr-2 h-4 w-4" /> Start next slot
                      </Button>
                    )}
                    {live && active && (
                      <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/80">
                        Slot {active.sequence} · {active.type || "active"} · {slotTimeLeft}{" "}
                        remaining. Close this slot before starting the next one.
                      </div>
                    )}
                    {live && !active && hardEndPassed && (
                      <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                        The two-hour hard end has been reached. No further slot can be started.
                      </div>
                    )}
                    {live && (
                      <Button
                        variant="destructive"
                        disabled={loading}
                        onClick={() => {
                          if (!reason.trim()) {
                            toast.error("Enter a reason before closing the auction.");
                            return;
                          }
                          if (window.confirm("Close this auction now? Reason: " + reason.trim()))
                            busy(() => adminApi.closeAuction(selected, reason.trim()), "Auction closed");
                        }}
                        className="h-11 justify-start"
                      >
                        <Gavel className="mr-2 h-4 w-4" /> Close auction
                      </Button>
                    )}
                  </div>
                  {live && (
                    <Input
                      className="mt-3 border-white/15 bg-black/20 text-white placeholder:text-slate-500"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required reason for slot or auction closure"
                    />
                  )}
                </section>
              ) : (
                <section className="rounded-3xl border border-white/10 bg-[#0e1b2f]/90 p-5 text-sm text-slate-400">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-violet-300" /> Audit-only view
                  </div>
                  <p className="mt-2">
                    You can monitor the authoritative timer, participants, readiness, and bid
                    stream, but controller actions are restricted by your role.
                  </p>
                </section>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function DarkMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0e1b2f] p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
function DarkInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-200">{value}</div>
    </div>
  );
}
