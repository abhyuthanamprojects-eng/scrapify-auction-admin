import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DataTable, Field, FieldGrid, RiskDot, Section, StatCard, StatusPill, Timeline, type Column } from "@/components/ops/ops-ui";
import {
  auditLog,
  countdown,
  disputes,
  fmtDate,
  fmtDay,
  fmtMoney,
  getEvent,
  getVendor,
  notificationLogs,
  orders,
  payments,
  refunds,
  securities,
  settlements,
  type Bid,
  type Participant,
} from "@/lib/ops/data";

export const Route = createFileRoute("/events/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { eventName: event.name, customerName: event.customerName };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Event unavailable — Scrapify Operations Console" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.eventName} — Event Workspace` },
        { name: "description", content: `Full operational workspace for ${loaderData.eventName} (${loaderData.customerName}): bids, participants, approvals, finance and audit.` },
        { property: "og:title", content: `${loaderData.eventName} — Event Workspace` },
        { property: "og:description", content: `Operational record for ${loaderData.eventName} across bidding, award, finance and fulfilment.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EventWorkspace,
});

const TABS = [
  "Summary",
  "Configuration",
  "Lots & Items",
  "Participants",
  "Qualification",
  "Documents",
  "Clarifications",
  "Bids",
  "Bid Integrity",
  "Approvals",
  "Award",
  "Finance",
  "Fulfilment",
  "Disputes",
  "Notifications",
  "Risk",
  "Audit",
  "Timeline",
] as const;
type Tab = (typeof TABS)[number];

function EventWorkspace() {
  const { id } = Route.useParams();
  const event = getEvent(id)!;
  const [tab, setTab] = useState<Tab>("Summary");
  const [note, setNote] = useState("");

  const eventSecurities = securities.filter((s) => s.eventId === event.id);
  const eventPayments = payments.filter((p) => p.eventId === event.id);
  const eventRefunds = refunds.filter((r) => r.eventId === event.id);
  const eventSettlements = settlements.filter((s) => s.eventId === event.id);
  const eventOrders = orders.filter((o) => o.eventId === event.id);
  const eventDisputes = disputes.filter((d) => d.eventId === event.id);
  const eventAudit = auditLog.filter((a) => a.entityId === event.id);

  const participantColumns: Column<Participant & { id: string }>[] = [
    { key: "alias", header: "Alias", render: (p) => <span className="font-medium">{p.alias}</span>, sortValue: (p) => p.alias },
    {
      key: "vendor",
      header: "Vendor",
      render: (p) => (
        <Link to="/vendors/$id" params={{ id: p.vendorId }} className="text-primary hover:underline">
          {getVendor(p.vendorId)?.name ?? p.vendorId}
        </Link>
      ),
      sortValue: (p) => getVendor(p.vendorId)?.name ?? "",
    },
    { key: "qual", header: "Qualified", render: (p) => <StatusPill value={p.qualified ? "Approved" : "Pending"} />, sortValue: (p) => String(p.qualified) },
    { key: "docs", header: "Documents", render: (p) => <StatusPill value={p.documentsOk ? "Verified" : "Pending Verification"} /> },
    { key: "sec", header: "Security", render: (p) => <StatusPill value={p.securityPaid ? "Paid" : "Pending"} tone={p.securityPaid ? "good" : "warn"} /> },
    { key: "bids", header: "Bids", align: "right", render: (p) => p.bidCount, sortValue: (p) => p.bidCount },
    { key: "risk", header: "Risk", render: (p) => <RiskDot level={p.risk} /> },
    { key: "ip", header: "IP / Device", render: (p) => <span className="text-xs text-muted-foreground">{p.ip} · {p.device}</span> },
  ];

  const bidColumns: Column<Bid & { id: string }>[] = [
    { key: "seq", header: "#", render: (b) => b.seq, sortValue: (b) => b.seq },
    { key: "alias", header: "Bidder", render: (b) => `${b.alias} (${b.vendorId})`, sortValue: (b) => b.alias },
    { key: "amt", header: "Amount", align: "right", render: (b) => fmtMoney(b.amount), sortValue: (b) => b.amount },
    { key: "prev", header: "Previous", align: "right", render: (b) => fmtMoney(b.previousPrice) },
    { key: "step", header: "Step", align: "right", render: (b) => fmtMoney(b.step) },
    { key: "time", header: "Server time", render: (b) => fmtDate(b.serverTime), sortValue: (b) => b.serverTime },
    { key: "status", header: "Status", render: (b) => <StatusPill value={b.status} /> },
    { key: "risk", header: "IP risk", render: (b) => <RiskDot level={b.ipRisk} /> },
  ];

  return (
    <>
      <PageHeader
        title={event.name}
        description={`${event.id} · ${event.customerName} · ${event.direction} ${event.kind} · ${event.template}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Event summary exported")}>
              Export
            </Button>
            <Button size="sm" onClick={() => toast.success("Action queued", { description: "Recorded in the audit log." })}>
              Take action
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Status" value={<StatusPill value={event.status} />} />
        <StatCard label="Current price" value={fmtMoney(event.currentPrice)} hint={`reserve ${fmtMoney(event.reserve)}`} />
        <StatCard label="Bids" value={event.bidCount} hint={`${event.bidVelocity}/hr`} />
        <StatCard label="Participants" value={event.participants.length} />
        <StatCard label="Integrity" value={`${event.integrityScore}/100`} tone={event.integrityScore < 70 ? "warn" : "neutral"} />
        <StatCard label={event.status === "Live" ? "Ends in" : "Ended"} value={event.status === "Live" ? countdown(event.endAt) : fmtDay(event.endAt)} />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Summary" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Section title="Event snapshot" className="lg:col-span-2">
            <FieldGrid cols={3}>
              <Field label="Customer" value={<Link to="/customers/$id" params={{ id: event.customerId }} className="text-primary hover:underline">{event.customerName}</Link>} />
              <Field label="Owner" value={event.owner} />
              <Field label="Category" value={event.category} />
              <Field label="Direction" value={event.direction} />
              <Field label="Template" value={event.template} />
              <Field label="Terms version" value={event.termsVersion} />
              <Field label="Start" value={fmtDate(event.startAt)} />
              <Field label="End" value={fmtDate(event.endAt)} />
              <Field label="Extensions" value={event.extensions} />
              <Field label="Security" value={`${event.emdPercent}% EMD`} />
              <Field label="Increment" value={fmtMoney(event.increment)} />
              <Field label="Anti-snipe" value={`${event.antiSnipe} min`} />
            </FieldGrid>
          </Section>
          <Section title="Operational risk">
            <div className="space-y-3">
              <RiskDot level={event.risk} />
              <p className="text-sm text-muted-foreground">Connection health: {event.connectionHealth}</p>
              {event.alerts.length ? (
                event.alerts.map((a) => (
                  <div key={a} className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    {a}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No integrity alerts raised for this event.</p>
              )}
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add an internal note…" />
              <Button size="sm" onClick={() => { toast.success("Internal note added"); setNote(""); }}>
                Add note
              </Button>
            </div>
          </Section>
        </div>
      )}

      {tab === "Configuration" && (
        <Section title="Configuration" description="Rules the event engine enforces at runtime">
          <FieldGrid cols={3}>
            <Field label="Format" value={event.template} />
            <Field label="Bid step" value={fmtMoney(event.increment)} />
            <Field label="Anti-snipe window" value={`${event.antiSnipe} min`} />
            <Field label="Reserve" value={fmtMoney(event.reserve)} />
            <Field label="Security" value={`${event.emdPercent}%`} />
            <Field label="Visibility" value="Rank only (identities masked to bidders)" />
            <Field label="Approval chain" value={event.approvals.map((a) => a.tier).join(" → ")} />
            <Field label="Inspection" value={event.inspection.required ? event.inspection.window : "Not required"} />
            <Field label="Inspection contact" value={event.inspection.contact} />
          </FieldGrid>
        </Section>
      )}

      {tab === "Lots & Items" && (
        <Section title="Lots & items">
          <DataTable
            rows={event.lots}
            columns={[
              { key: "name", header: "Lot", render: (l) => l.name, sortValue: (l) => l.name },
              { key: "qty", header: "Quantity", align: "right", render: (l) => `${l.qty} ${l.unit}`, sortValue: (l) => l.qty },
              { key: "base", header: "Base price", align: "right", render: (l) => fmtMoney(l.basePrice), sortValue: (l) => l.basePrice },
              { key: "cur", header: "Current", align: "right", render: (l) => fmtMoney(l.currentPrice), sortValue: (l) => l.currentPrice },
              { key: "h1", header: "Leading", render: (l) => l.h1 ?? "—" },
            ]}
            searchable={false}
            exportName={`${event.id}-lots`}
          />
        </Section>
      )}

      {(tab === "Participants" || tab === "Qualification") && (
        <Section title={tab} description="Invitation, acceptance, qualification, documents and security status">
          <DataTable
            rows={event.participants.map((p) => ({ ...p, id: p.vendorId }))}
            columns={participantColumns}
            exportName={`${event.id}-participants`}
          />
        </Section>
      )}

      {tab === "Documents" && (
        <Section title="Event documents" description="Terms, inspection reports and vendor submissions">
          <ul className="divide-y divide-border">
            {["Terms & Conditions", "Inspection Report", "Lot Photographs", "Compliance Annexure", "Award Letter Template"].map((d) => (
              <li key={d} className="flex items-center justify-between py-2.5 text-sm">
                <span>{d}</span>
                <div className="flex items-center gap-3">
                  <StatusPill value="Verified" />
                  <button className="text-xs text-primary hover:underline" onClick={() => toast.success(`${d} downloaded`)}>
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === "Clarifications" && (
        <Section title="Clarifications" description="Vendor questions and platform answers">
          {event.clarifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clarifications raised.</p>
          ) : (
            <ul className="space-y-3">
              {event.clarifications.map((c) => (
                <li key={c.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{c.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.vendor} · {fmtDate(c.at)}
                  </p>
                  <p className="mt-2 text-sm">{c.answer ?? <span className="text-accent">Awaiting answer</span>}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === "Bids" && (
        <Section title="Bid history" description="Server-timed, immutable bid ledger">
          <DataTable rows={event.bids.map((b) => ({ ...b, id: String(b.seq) }))} columns={bidColumns} exportName={`${event.id}-bids`} pageSize={15} />
        </Section>
      )}

      {tab === "Bid Integrity" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Section title="Integrity score" >
            <p className="font-display text-5xl">{event.integrityScore}</p>
            <p className="mt-1 text-xs text-muted-foreground">Composite of timing, IP, device and pattern signals</p>
          </Section>
          <Section title="Signals" className="lg:col-span-2">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b border-border/60 pb-2">
                <span>Last-second bid clustering</span>
                <StatusPill value={event.bidCount > 25 ? "Medium" : "Low"} />
              </li>
              <li className="flex justify-between border-b border-border/60 pb-2">
                <span>Shared IP among bidders</span>
                <StatusPill value={event.alerts.length ? "High" : "Low"} />
              </li>
              <li className="flex justify-between border-b border-border/60 pb-2">
                <span>Abnormal bid jumps</span>
                <StatusPill value="Low" />
              </li>
              <li className="flex justify-between">
                <span>Rotation / alternating pattern</span>
                <StatusPill value={event.risk} />
              </li>
            </ul>
          </Section>
        </div>
      )}

      {tab === "Approvals" && (
        <Section title="Approval chain" description="Tiered approvals with SLA tracking">
          <ul className="space-y-3">
            {event.approvals.map((a) => (
              <li key={a.tier} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {a.tier} · {a.approver}
                  </p>
                  <p className="text-xs text-muted-foreground">SLA {a.sla}h {a.at ? `· actioned ${fmtDay(a.at)}` : ""}</p>
                </div>
                <StatusPill value={a.status} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === "Award" && (
        <Section title="Award" description="Winner, runner-up and acceptance state">
          {event.award ? (
            <FieldGrid cols={3}>
              <Field label="Winner" value={event.award.winner} />
              <Field label="Award amount" value={fmtMoney(event.award.amount)} />
              <Field label="State" value={<StatusPill value={event.award.state} />} />
              <Field label="Runner-up" value={event.award.runnerUp} />
              <Field label="Runner-up amount" value={fmtMoney(event.award.runnerUpAmount)} />
              <Field label="Acceptance deadline" value={fmtDate(event.award.acceptanceDeadline)} />
            </FieldGrid>
          ) : (
            <p className="text-sm text-muted-foreground">This event has not reached award stage.</p>
          )}
        </Section>
      )}

      {tab === "Finance" && (
        <div className="space-y-4">
          <Section title="Securities / EMD">
            <DataTable
              rows={eventSecurities}
              columns={[
                { key: "v", header: "Vendor", render: (s) => s.vendorName, sortValue: (s) => s.vendorName },
                { key: "a", header: "Amount", align: "right", render: (s) => fmtMoney(s.amount), sortValue: (s) => s.amount },
                { key: "m", header: "Mode", render: (s) => s.mode },
                { key: "s", header: "State", render: (s) => <StatusPill value={s.state} /> },
                { key: "r", header: "Reference", render: (s) => s.reference },
              ]}
              searchable={false}
              empty="No securities collected."
            />
          </Section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Payments">
              <DataTable
                rows={eventPayments}
                columns={[
                  { key: "t", header: "Type", render: (p) => p.type },
                  { key: "a", header: "Amount", align: "right", render: (p) => fmtMoney(p.amount) },
                  { key: "s", header: "Status", render: (p) => <StatusPill value={p.status} /> },
                ]}
                searchable={false}
                empty="No payments recorded."
              />
            </Section>
            <Section title="Refunds & settlement">
              <DataTable
                rows={[...eventRefunds.map((r) => ({ id: r.id, label: `Refund · ${r.vendorName}`, amount: r.amount, status: r.status })),
                  ...eventSettlements.map((s) => ({ id: s.id, label: `Settlement · ${s.customerName}`, amount: s.net, status: s.status }))]}
                columns={[
                  { key: "l", header: "Item", render: (r) => r.label },
                  { key: "a", header: "Amount", align: "right", render: (r) => fmtMoney(r.amount) },
                  { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
                ]}
                searchable={false}
                empty="Nothing outstanding."
              />
            </Section>
          </div>
        </div>
      )}

      {tab === "Fulfilment" && (
        <Section title="Fulfilment" description="Pickup, delivery or service execution against this award">
          <DataTable
            rows={eventOrders}
            columns={[
              { key: "id", header: "Order", render: (o) => o.id },
              { key: "v", header: "Vendor", render: (o) => o.vendorName },
              { key: "m", header: "Mode", render: (o) => o.mode },
              { key: "s", header: "Status", render: (o) => <StatusPill value={o.status} /> },
              { key: "a", header: "Acceptance", render: (o) => <StatusPill value={o.acceptance} /> },
              { key: "d", header: "Scheduled", render: (o) => fmtDay(o.scheduled) },
            ]}
            searchable={false}
            empty="No fulfilment record yet."
          />
        </Section>
      )}

      {tab === "Disputes" && (
        <Section title="Disputes">
          {eventDisputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No disputes raised for this event.</p>
          ) : (
            <ul className="space-y-3">
              {eventDisputes.map((d) => (
                <li key={d.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{d.category} · {fmtMoney(d.amount)}</p>
                    <StatusPill value={d.stage} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{d.issue}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === "Notifications" && (
        <Section title="Notification log" description="Every message dispatched for this event">
          <DataTable
            rows={notificationLogs.slice(0, 10)}
            columns={[
              { key: "t", header: "Template", render: (n) => n.template },
              { key: "c", header: "Channel", render: (n) => n.channel },
              { key: "r", header: "Recipient", render: (n) => <span className="text-xs text-muted-foreground">{n.recipient}</span> },
              { key: "s", header: "Status", render: (n) => <StatusPill value={n.status} /> },
              { key: "a", header: "Sent", render: (n) => fmtDate(n.at) },
            ]}
            searchable={false}
          />
        </Section>
      )}

      {tab === "Risk" && (
        <Section title="Risk assessment">
          <FieldGrid cols={3}>
            <Field label="Event risk" value={<RiskDot level={event.risk} />} />
            <Field label="High-risk bidders" value={event.participants.filter((p) => p.risk === "High" || p.risk === "Critical").length} />
            <Field label="Unverified documents" value={event.participants.filter((p) => !p.documentsOk).length} />
            <Field label="Unpaid securities" value={event.participants.filter((p) => !p.securityPaid).length} />
            <Field label="Connection health" value={event.connectionHealth} />
            <Field label="Alerts" value={event.alerts.length} />
          </FieldGrid>
        </Section>
      )}

      {tab === "Audit" && (
        <Section title="Audit trail" description="Every admin action on this record">
          <DataTable
            rows={eventAudit}
            columns={[
              { key: "at", header: "When", render: (a) => fmtDate(a.at), sortValue: (a) => a.at },
              { key: "who", header: "Actor", render: (a) => `${a.actor} (${a.role})` },
              { key: "act", header: "Action", render: (a) => a.action },
              { key: "ba", header: "Before → After", render: (a) => <span className="text-xs text-muted-foreground">{a.before} → {a.after}</span> },
              { key: "why", header: "Reason", render: (a) => <span className="text-xs text-muted-foreground">{a.reason}</span> },
            ]}
            searchable={false}
            empty="No admin actions recorded on this event."
          />
        </Section>
      )}

      {tab === "Timeline" && (
        <Section title="Lifecycle timeline">
          <Timeline
            items={[
              { at: fmtDate(event.createdAt), who: event.owner, note: "Event created from template and sent for draft review." },
              { at: fmtDate(event.startAt), who: "System", note: "Event opened to qualified participants." },
              { at: fmtDate(event.bids[0]?.serverTime ?? event.startAt), who: "Bidder A", note: "First bid received." },
              { at: fmtDate(event.endAt), who: "System", note: event.status === "Live" ? "Scheduled close." : "Event closed." },
              ...(event.award ? [{ at: fmtDate(event.award.acceptanceDeadline), who: "Operations", note: `Award ${event.award.state.toLowerCase()} — ${event.award.winner}.` }] : []),
            ]}
          />
        </Section>
      )}
    </>
  );
}
