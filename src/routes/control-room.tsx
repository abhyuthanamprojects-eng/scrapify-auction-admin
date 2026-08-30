import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pause, Play, TimerReset, OctagonMinus, ShieldAlert, Activity } from "lucide-react";
import { DetailDrawer, Field, FieldGrid, RiskDot, Section, StatCard, StatusPill } from "@/components/ops/ops-ui";
import { countdown, fmtDate, fmtMoney, liveEvents, type AuctionEvent } from "@/lib/ops/data";

export const Route = createFileRoute("/control-room")({
  head: () => ({
    meta: [
      { title: "Live Control Room — Scrapify Operations Console" },
      { name: "description", content: "Monitor every live auction with bid integrity signals, extensions, pause and emergency hold controls." },
      { property: "og:title", content: "Live Control Room — Scrapify Operations Console" },
      { property: "og:description", content: "Real-time supervision of running auctions with intervention controls and full audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ControlRoom,
});

type Action = "Pause" | "Resume" | "Extend" | "End Now" | "Emergency Hold" | "Reverse Bid";

function ControlRoom() {
  const [selected, setSelected] = useState<AuctionEvent | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [held, setHeld] = useState<Record<string, boolean>>({});

  function commit() {
    if (!selected || !action) return;
    if (reason.trim().length < 8) {
      toast.error("A reason of at least 8 characters is required and will be written to the audit log.");
      return;
    }
    if (action === "Emergency Hold") setHeld((h) => ({ ...h, [selected.id]: true }));
    if (action === "Resume") setHeld((h) => ({ ...h, [selected.id]: false }));
    toast.success(`${action} applied to ${selected.id}`, { description: "Recorded in the audit log with your reason." });
    setAction(null);
    setReason("");
  }

  return (
    <>
      <PageHeader
        title="Live Control Room"
        description="Supervise every running event. All interventions require a reason and are written to the immutable audit trail."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Live events" value={liveEvents.length} tone="live" icon={Activity} />
        <StatCard label="Total live value" value={fmtMoney(liveEvents.reduce((a, e) => a + e.currentPrice, 0))} />
        <StatCard label="Active bidders" value={liveEvents.reduce((a, e) => a + e.participants.filter((p) => p.connected).length, 0)} />
        <StatCard label="Integrity alerts" value={liveEvents.reduce((a, e) => a + e.alerts.length, 0)} tone="warn" icon={ShieldAlert} />
        <StatCard label="Unstable connections" value={liveEvents.filter((e) => e.connectionHealth !== "Healthy").length} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {liveEvents.map((e) => {
          const top = [...e.bids].reverse().slice(0, 6);
          return (
            <section key={e.id} className="card-premium p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill value={held[e.id] ? "On Hold" : "Live"} />
                    <span className="text-[11px] text-muted-foreground">{e.id}</span>
                  </div>
                  <Link to="/events/$id" params={{ id: e.id }} className="mt-1 block font-display text-lg leading-tight hover:text-primary">
                    {e.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {e.customerName} · {e.direction} auction · {e.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Ends in</p>
                  <p className="font-display text-2xl text-accent">{countdown(e.endAt)}</p>
                  <p className="text-[11px] text-muted-foreground">{e.extensions} extensions · anti-snipe {e.antiSnipe}m</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Current price" value={fmtMoney(e.currentPrice)} />
                <Field label="Reserve" value={fmtMoney(e.reserve)} />
                <Field label="Bids / velocity" value={`${e.bidCount} · ${e.bidVelocity}/hr`} />
                <Field label="Integrity score" value={`${e.integrityScore}/100`} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <RiskDot level={e.risk} />
                <span className="text-muted-foreground">Connection: {e.connectionHealth}</span>
                <span className="text-muted-foreground">
                  {e.participants.filter((p) => p.connected).length}/{e.participants.length} connected
                </span>
              </div>

              {e.alerts.length > 0 && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {e.alerts.map((a) => (
                    <p key={a}>⚠ {a}</p>
                  ))}
                </div>
              )}

              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground">Bidder</th>
                      <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground">Server time</th>
                      <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((b) => (
                      <tr key={b.seq} className="border-t border-border/60">
                        <td className="px-2 py-1.5 font-medium">
                          {b.alias} <span className="text-muted-foreground">({b.vendorId})</span>
                        </td>
                        <td className="px-2 py-1.5">{fmtMoney(b.amount)}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{fmtDate(b.serverTime)}</td>
                        <td className="px-2 py-1.5">
                          <StatusPill value={b.status === "Accepted" ? b.ipRisk : b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["Pause", "Resume", "Extend", "End Now", "Emergency Hold", "Reverse Bid"] as Action[]).map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={a === "Emergency Hold" || a === "End Now" ? "destructive" : "outline"}
                    className="h-8 gap-1.5 rounded-full text-xs"
                    onClick={() => {
                      setSelected(e);
                      setAction(a);
                      setReason("");
                    }}
                  >
                    {a === "Pause" && <Pause className="h-3 w-3" />}
                    {a === "Resume" && <Play className="h-3 w-3" />}
                    {a === "Extend" && <TimerReset className="h-3 w-3" />}
                    {a === "End Now" && <OctagonMinus className="h-3 w-3" />}
                    {a}
                  </Button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <DetailDrawer
        open={!!action}
        onOpenChange={(v) => !v && setAction(null)}
        title={`${action ?? ""} — ${selected?.id ?? ""}`}
        subtitle={selected?.name}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button onClick={commit}>Confirm {action}</Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Customer" value={selected.customerName} />
              <Field label="Current price" value={fmtMoney(selected.currentPrice)} />
              <Field label="Participants" value={selected.participants.length} />
              <Field label="Ends in" value={countdown(selected.endAt)} />
            </FieldGrid>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Reason (mandatory, audited)</label>
              <Textarea
                value={reason}
                onChange={(ev) => setReason(ev.target.value)}
                rows={4}
                placeholder="Explain why this intervention is necessary…"
                className="mt-1"
              />
            </div>
            <Section title="Impact preview" description="What participants will see">
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                <li>All connected bidders receive an instant in-room notice.</li>
                <li>Email, SMS and push notifications dispatch from the matching template.</li>
                <li>The action, before/after state and your reason are written to the audit log.</li>
              </ul>
            </Section>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
