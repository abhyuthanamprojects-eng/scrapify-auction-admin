import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";
import { Check, Image as ImageIcon, MessageSquare, Pencil, Trash2, X } from "lucide-react";
import {
  DataTable,
  Field,
  FieldGrid,
  RiskDot,
  Section,
  StatCard,
  StatusPill,
  Timeline,
  type Column,
} from "@/components/ops/ops-ui";
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
  loader: async ({ params }) => {
    const localEvent = getEvent(params.id);
    if (localEvent) {
      return {
        event: localEvent,
        eventName: localEvent.name,
        customerName: localEvent.customerName,
      };
    }

    try {
      const response = await adminApi.getAuction(params.id);
      const payload = response?.data?.data ?? response?.data ?? response;
      if (!payload) throw notFound();
      const event = mapApiAuction(payload, params.id);
      return { event, eventName: event.name, customerName: event.customerName };
    } catch (error) {
      if (error && typeof error === "object" && "isNotFound" in error) throw error;
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Event unavailable — Scrapify Operations Console" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.eventName} — Event Workspace` },
        {
          name: "description",
          content: `Full operational workspace for ${loaderData.eventName} (${loaderData.customerName}): bids, participants, approvals, finance and audit.`,
        },
        { property: "og:title", content: `${loaderData.eventName} — Event Workspace` },
        {
          property: "og:description",
          content: `Operational record for ${loaderData.eventName} across bidding, award, finance and fulfilment.`,
        },
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
  const { event } = Route.useLoaderData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Summary");
  const [note, setNote] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "changes" | "reject" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editPhotoFiles, setEditPhotoFiles] = useState<File[]>([]);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const normalizedStatus = String(event.status).toLowerCase().replaceAll("_", " ");
  const requiresReview = [
    "pending approval",
    "under review",
    "changes requested",
    "sent back",
  ].includes(normalizedStatus);
  const canOpenLiveControls = ["approved", "published", "live"].includes(normalizedStatus);

  const openEdit = () => {
    const raw = event.raw ?? {};
    const value = (key: string, fallback = "") => raw[key] == null ? fallback : String(raw[key]);
    const warehouseDetails = raw.warehouse_details ?? {};
    setEditForm({
      title: value("title", event.name),
      description: value("description"),
      company: value("company", event.customerName),
      plant: value("plant"),
      warehouse: value("warehouse"),
      location: value("location"),
      direction: value("direction", "forward"),
      lot_type: value("lot_type", "single"),
      warehouse_address: warehouseDetails.address == null ? "" : String(warehouseDetails.address),
      warehouse_city: warehouseDetails.city == null ? "" : String(warehouseDetails.city),
      warehouse_state: warehouseDetails.state == null ? "" : String(warehouseDetails.state),
      warehouse_pincode: warehouseDetails.pincode == null ? "" : String(warehouseDetails.pincode),
      warehouse_contact: warehouseDetails.contact == null ? "" : String(warehouseDetails.contact),
      category: value("category", event.category),
      quantity: value("quantity"),
      uom: value("uom", "MT"),
      reserve_price: value("reserve_price", String(event.reserve ?? "")),
      starting_price: value("starting_price", String(event.currentPrice ?? "")),
      bid_increment: value("bid_increment", String(event.increment ?? "")),
      emd_amount: value("emd_amount"),
      schedule_start: value("schedule_start", event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : ""),
      schedule_end: value("schedule_end", event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : ""),
      payment_terms: value("payment_terms"),
      lifting_period: value("lifting_period"),
      lifting_unit: value("lifting_unit", "Days"),
      contact_name: value("contact_name"),
      contact_phone: value("contact_phone"),
      contact_email: value("contact_email"),
      terms: value("terms"),
      inspection: value("inspection"),
      inspection_date: value("inspection_date"),
      inspection_time: value("inspection_time"),
      inspection_location: value("inspection_location"),
    });
    setEditPhotos(Array.isArray(event.photos) ? event.photos : []);
    setEditPhotoFiles([]);
    setEditOpen(true);
  };

  const setEdit = (key: string, value: string) => setEditForm((current) => ({ ...current, [key]: value }));

  const saveEdit = async () => {
    if (!editForm.title?.trim() || !editForm.category?.trim()) {
      toast.error("Auction title and category are required.");
      return;
    }
    setEditSaving(true);
    try {
      await adminApi.updateAuction(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        company: editForm.company.trim() || null,
        plant: editForm.plant.trim() || null,
        warehouse: editForm.warehouse.trim() || null,
        location: editForm.location.trim() || null,
        direction: editForm.direction || "forward",
        lot_type: editForm.lot_type || "single",
        warehouse_details: {
          address: editForm.warehouse_address.trim() || null,
          city: editForm.warehouse_city.trim() || null,
          state: editForm.warehouse_state.trim() || null,
          pincode: editForm.warehouse_pincode.trim() || null,
          contact: editForm.warehouse_contact.trim() || null,
        },
        category: editForm.category.trim(),
        quantity: editForm.quantity.trim() || null,
        uom: editForm.uom || "MT",
        reserve_price: Number(editForm.reserve_price) || 0,
        starting_price: Number(editForm.starting_price) || 0,
        bid_increment: Number(editForm.bid_increment) || 0,
        emd_amount: Number(editForm.emd_amount) || 0,
        schedule_start: editForm.schedule_start ? new Date(editForm.schedule_start).toISOString() : null,
        schedule_end: editForm.schedule_end ? new Date(editForm.schedule_end).toISOString() : null,
        payment_terms: editForm.payment_terms.trim() || null,
        lifting_period: editForm.lifting_period.trim() || null,
        lifting_unit: editForm.lifting_unit || "Days",
        contact_name: editForm.contact_name.trim() || null,
        contact_phone: editForm.contact_phone.trim() || null,
        contact_email: editForm.contact_email.trim() || null,
        terms: editForm.terms.trim() || null,
        inspection: editForm.inspection.trim() || null,
        inspection_date: editForm.inspection_date || null,
        inspection_time: editForm.inspection_time || null,
        inspection_location: editForm.inspection_location.trim() || null,
        photos: editPhotos,
      });
      await Promise.all(editPhotoFiles.map((file) => adminApi.uploadAuctionPhoto(id, file)));
      toast.success("Auction details and images updated.");
      setEditOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auction could not be updated.");
    } finally {
      setEditSaving(false);
    }
  };

  const submitReviewAction = async () => {
    if (!reviewAction) return;
    if (
      (reviewAction === "changes" || reviewAction === "reject") &&
      reviewComment.trim().length < 3
    ) {
      toast.error("Add a clear comment before continuing.");
      return;
    }
    setReviewSubmitting(true);
    try {
      if (reviewAction === "approve") await adminApi.approveAuction(id);
      if (reviewAction === "changes") await adminApi.sendBackAuction(id, reviewComment.trim());
      if (reviewAction === "reject") await adminApi.rejectAuction(id, reviewComment.trim());
      toast.success(
        reviewAction === "approve"
          ? "Auction approved."
          : reviewAction === "changes"
            ? "Changes requested from the seller."
            : "Auction rejected.",
      );
      setReviewAction(null);
      setReviewComment("");
      await navigate({ to: "/events" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The review action could not be completed.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const eventSecurities = securities.filter((s) => s.eventId === event.id);
  const eventPayments = payments.filter((p) => p.eventId === event.id);
  const eventRefunds = refunds.filter((r) => r.eventId === event.id);
  const eventSettlements = settlements.filter((s) => s.eventId === event.id);
  const eventOrders = orders.filter((o) => o.eventId === event.id);
  const eventDisputes = disputes.filter((d) => d.eventId === event.id);
  const eventAudit = auditLog.filter((a) => a.entityId === event.id);

  const participantColumns: Column<Participant & { id: string }>[] = [
    {
      key: "alias",
      header: "Alias",
      render: (p) => <span className="font-medium">{p.alias}</span>,
      sortValue: (p) => p.alias,
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (p) => (
        <Link
          to="/vendors/$id"
          params={{ id: p.vendorId }}
          className="text-primary hover:underline"
        >
          {getVendor(p.vendorId)?.name ?? p.vendorId}
        </Link>
      ),
      sortValue: (p) => getVendor(p.vendorId)?.name ?? "",
    },
    {
      key: "qual",
      header: "Qualified",
      render: (p) => <StatusPill value={p.qualified ? "Approved" : "Pending"} />,
      sortValue: (p) => String(p.qualified),
    },
    {
      key: "docs",
      header: "Documents",
      render: (p) => <StatusPill value={p.documentsOk ? "Verified" : "Pending Verification"} />,
    },
    {
      key: "sec",
      header: "Security",
      render: (p) => (
        <StatusPill
          value={p.securityPaid ? "Paid" : "Pending"}
          tone={p.securityPaid ? "good" : "warn"}
        />
      ),
    },
    {
      key: "bids",
      header: "Bids",
      align: "right",
      render: (p) => p.bidCount,
      sortValue: (p) => p.bidCount,
    },
    { key: "risk", header: "Risk", render: (p) => <RiskDot level={p.risk} /> },
    {
      key: "ip",
      header: "IP / Device",
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.ip} · {p.device}
        </span>
      ),
    },
  ];

  const bidColumns: Column<Bid & { id: string }>[] = [
    { key: "seq", header: "#", render: (b) => b.seq, sortValue: (b) => b.seq },
    {
      key: "alias",
      header: "Bidder",
      render: (b) => `${b.alias} (${b.vendorId})`,
      sortValue: (b) => b.alias,
    },
    {
      key: "amt",
      header: "Amount",
      align: "right",
      render: (b) => fmtMoney(b.amount),
      sortValue: (b) => b.amount,
    },
    { key: "prev", header: "Previous", align: "right", render: (b) => fmtMoney(b.previousPrice) },
    { key: "step", header: "Step", align: "right", render: (b) => fmtMoney(b.step) },
    {
      key: "time",
      header: "Server time",
      render: (b) => fmtDate(b.serverTime),
      sortValue: (b) => b.serverTime,
    },
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
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
              <Pencil className="size-4" /> Edit auction
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Event summary exported")}
            >
              Export
            </Button>
            {requiresReview ? (
              <Button
                size="sm"
                onClick={() => setReviewAction("approve")}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Check className="size-4" /> Approve
              </Button>
            ) : canOpenLiveControls ? (
              <Button
                size="sm"
                onClick={() => navigate({ to: `/auctions/live?auction=${encodeURIComponent(id)}` })}
                className="gap-1.5"
              >
                Open live controls
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info("Live control is available after approval.")}
              >
                Live control unavailable
              </Button>
            )}
          </div>
        }
      />

      {requiresReview && (
        <section className="mb-5 rounded-2xl border border-orange-200 bg-orange-50/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                Review required
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-foreground">
                Seller submitted this auction for approval.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review configuration, lots, documents, commercial values, and compliance details
                before recording a decision.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setReviewAction("changes")}
                className="gap-1.5 border-orange-300 text-orange-800 hover:bg-orange-100"
              >
                <MessageSquare className="size-4" /> Request changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setReviewAction("reject")}
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              >
                <X className="size-4" /> Reject
              </Button>
              <Button
                onClick={() => setReviewAction("approve")}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Check className="size-4" /> Approve
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Status" value={<StatusPill value={event.status} />} />
        <StatCard
          label="Current price"
          value={fmtMoney(event.currentPrice)}
          hint={`reserve ${fmtMoney(event.reserve)}`}
        />
        <StatCard label="Bids" value={event.bidCount} hint={`${event.bidVelocity}/hr`} />
        <StatCard label="Participants" value={event.participants.length} />
        <StatCard
          label="Integrity"
          value={`${event.integrityScore}/100`}
          tone={event.integrityScore < 70 ? "warn" : "neutral"}
        />
        <StatCard
          label={event.status === "Live" ? "Ends in" : "Ended"}
          value={event.status === "Live" ? countdown(event.endAt) : fmtDay(event.endAt)}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/70 p-2 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
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
              <Field
                label="Customer"
                value={
                  <Link
                    to="/customers/$id"
                    params={{ id: event.customerId }}
                    className="text-primary hover:underline"
                  >
                    {event.customerName}
                  </Link>
                }
              />
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
          <Section title="Auction images" icon={<ImageIcon className="size-4" />}>
            {event.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {event.photos.map((photo: string, index: number) => (
                  <img
                    key={`${photo}-${index}`}
                    src={photo}
                    alt={`${event.name} photo ${index + 1}`}
                    className="aspect-video w-full rounded-lg object-cover ring-1 ring-border"
                  />
                ))}
              </div>
            )}
          </Section>
          <Section title="Operational risk">
            <div className="space-y-3">
              <RiskDot level={event.risk} />
              <p className="text-sm text-muted-foreground">
                Connection health: {event.connectionHealth}
              </p>
              {event.alerts.length ? (
                event.alerts.map((a) => (
                  <div
                    key={a}
                    className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
                  >
                    {a}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No integrity alerts raised for this event.
                </p>
              )}
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add an internal note…"
              />
              <Button
                size="sm"
                onClick={() => {
                  toast.success("Internal note added");
                  setNote("");
                }}
              >
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
            <Field
              label="Inspection"
              value={event.inspection.required ? event.inspection.window : "Not required"}
            />
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
              {
                key: "qty",
                header: "Quantity",
                align: "right",
                render: (l) => `${l.qty} ${l.unit}`,
                sortValue: (l) => l.qty,
              },
              {
                key: "base",
                header: "Base price",
                align: "right",
                render: (l) => fmtMoney(l.basePrice),
                sortValue: (l) => l.basePrice,
              },
              {
                key: "cur",
                header: "Current",
                align: "right",
                render: (l) => fmtMoney(l.currentPrice),
                sortValue: (l) => l.currentPrice,
              },
              { key: "h1", header: "Leading", render: (l) => l.h1 ?? "—" },
            ]}
            searchable={false}
            exportName={`${event.id}-lots`}
          />
        </Section>
      )}

      {(tab === "Participants" || tab === "Qualification") && (
        <Section
          title={tab}
          description="Invitation, acceptance, qualification, documents and security status"
        >
          <DataTable
            rows={event.participants.map((p) => ({ ...p, id: p.vendorId }))}
            columns={participantColumns}
            exportName={`${event.id}-participants`}
          />
        </Section>
      )}

      {tab === "Documents" && (
        <Section
          title="Event documents"
          description="Terms, inspection reports and vendor submissions"
        >
          <ul className="divide-y divide-border">
            {[
              "Terms & Conditions",
              "Inspection Report",
              "Lot Photographs",
              "Compliance Annexure",
              "Award Letter Template",
            ].map((d) => (
              <li key={d} className="flex items-center justify-between py-2.5 text-sm">
                <span>{d}</span>
                <div className="flex items-center gap-3">
                  <StatusPill value="Verified" />
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => toast.success(`${d} downloaded`)}
                  >
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
                  <p className="mt-2 text-sm">
                    {c.answer ?? <span className="text-accent">Awaiting answer</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === "Bids" && (
        <Section title="Bid history" description="Server-timed, immutable bid ledger">
          <DataTable
            rows={event.bids.map((b) => ({ ...b, id: String(b.seq) }))}
            columns={bidColumns}
            exportName={`${event.id}-bids`}
            pageSize={15}
          />
        </Section>
      )}

      {tab === "Bid Integrity" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Section title="Integrity score">
            <p className="font-display text-5xl">{event.integrityScore}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Composite of timing, IP, device and pattern signals
            </p>
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
              <li
                key={a.tier}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {a.tier} · {a.approver}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SLA {a.sla}h {a.at ? `· actioned ${fmtDay(a.at)}` : ""}
                  </p>
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
                {
                  key: "v",
                  header: "Vendor",
                  render: (s) => s.vendorName,
                  sortValue: (s) => s.vendorName,
                },
                {
                  key: "a",
                  header: "Amount",
                  align: "right",
                  render: (s) => fmtMoney(s.amount),
                  sortValue: (s) => s.amount,
                },
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
                rows={[
                  ...eventRefunds.map((r) => ({
                    id: r.id,
                    label: `Refund · ${r.vendorName}`,
                    amount: r.amount,
                    status: r.status,
                  })),
                  ...eventSettlements.map((s) => ({
                    id: s.id,
                    label: `Settlement · ${s.customerName}`,
                    amount: s.net,
                    status: s.status,
                  })),
                ]}
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
        <Section
          title="Fulfilment"
          description="Pickup, delivery or service execution against this award"
        >
          <DataTable
            rows={eventOrders}
            columns={[
              { key: "id", header: "Order", render: (o) => o.id },
              { key: "v", header: "Vendor", render: (o) => o.vendorName },
              { key: "m", header: "Mode", render: (o) => o.mode },
              { key: "s", header: "Status", render: (o) => <StatusPill value={o.status} /> },
              {
                key: "a",
                header: "Acceptance",
                render: (o) => <StatusPill value={o.acceptance} />,
              },
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
                    <p className="text-sm font-medium">
                      {d.category} · {fmtMoney(d.amount)}
                    </p>
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
              {
                key: "r",
                header: "Recipient",
                render: (n) => <span className="text-xs text-muted-foreground">{n.recipient}</span>,
              },
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
            <Field
              label="High-risk bidders"
              value={
                event.participants.filter((p) => p.risk === "High" || p.risk === "Critical").length
              }
            />
            <Field
              label="Unverified documents"
              value={event.participants.filter((p) => !p.documentsOk).length}
            />
            <Field
              label="Unpaid securities"
              value={event.participants.filter((p) => !p.securityPaid).length}
            />
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
              {
                key: "ba",
                header: "Before → After",
                render: (a) => (
                  <span className="text-xs text-muted-foreground">
                    {a.before} → {a.after}
                  </span>
                ),
              },
              {
                key: "why",
                header: "Reason",
                render: (a) => <span className="text-xs text-muted-foreground">{a.reason}</span>,
              },
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
              {
                at: fmtDate(event.createdAt),
                who: event.owner,
                note: "Event created from template and sent for draft review.",
              },
              {
                at: fmtDate(event.startAt),
                who: "System",
                note: "Event opened to qualified participants.",
              },
              {
                at: fmtDate(event.bids[0]?.serverTime ?? event.startAt),
                who: "Bidder A",
                note: "First bid received.",
              },
              {
                at: fmtDate(event.endAt),
                who: "System",
                note: event.status === "Live" ? "Scheduled close." : "Event closed.",
              },
              ...(event.award
                ? [
                    {
                      at: fmtDate(event.award.acceptanceDeadline),
                      who: "Operations",
                      note: `Award ${event.award.state.toLowerCase()} — ${event.award.winner}.`,
                    },
                  ]
                : []),
            ]}
          />
        </Section>
      )}

      <Dialog open={reviewAction !== null} onOpenChange={(open) => !open && setReviewAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve"
                ? "Approve auction"
                : reviewAction === "changes"
                  ? "Request changes"
                  : "Reject auction"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? `Confirm approval for ${event.id}. The backend will record the authoritative lifecycle transition.`
                : reviewAction === "changes"
                  ? "Add the seller-visible correction request. This will send the auction back for revision."
                  : "Add the required rejection reason. The auction will remain retained for audit history."}
            </DialogDescription>
          </DialogHeader>
          {reviewAction !== "approve" && (
            <Textarea
              rows={5}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder={
                reviewAction === "changes"
                  ? "Explain exactly what the seller must correct…"
                  : "Explain why this auction is being rejected…"
              }
              autoFocus
            />
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReviewAction(null)}
              disabled={reviewSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitReviewAction()}
              disabled={reviewSubmitting}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {reviewSubmitting
                ? "Saving…"
                : reviewAction === "approve"
                  ? "Confirm approval"
                  : reviewAction === "changes"
                    ? "Send request"
                    : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit auction</DialogTitle>
            <DialogDescription>
              Operations-only editing. Changes are saved to the auction record and images are
              stored on the server for listing and detail pages.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {[
              ["title", "Auction title"],
              ["company", "Company / facility"],
              ["plant", "Plant / unit"],
              ["warehouse", "Warehouse"],
              ["location", "Location"],
              ["direction", "Direction (forward/reverse)"],
              ["lot_type", "Lot type (single/lot_wise)"],
              ["warehouse_address", "Warehouse address"],
              ["warehouse_city", "Warehouse city"],
              ["warehouse_state", "Warehouse state"],
              ["warehouse_pincode", "Warehouse pincode"],
              ["warehouse_contact", "Warehouse contact"],
              ["category", "Category"],
              ["quantity", "Quantity"],
              ["uom", "Unit"],
              ["reserve_price", "Reserve price (₹)"],
              ["starting_price", "Starting price (₹)"],
              ["bid_increment", "Bid increment (₹)"],
              ["emd_amount", "EMD amount (₹)"],
              ["schedule_start", "Scheduled start"],
              ["schedule_end", "Scheduled end"],
              ["payment_terms", "Payment terms"],
              ["lifting_period", "Lifting period"],
              ["lifting_unit", "Lifting unit"],
              ["contact_name", "Contact person"],
              ["contact_phone", "Contact phone"],
              ["contact_email", "Contact email"],
              ["inspection_date", "Inspection date"],
              ["inspection_time", "Inspection time"],
              ["inspection_location", "Inspection location"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1.5 text-sm font-medium">
                {label}
                <Input
                  type={key.includes("price") || key === "quantity" || key === "emd_amount" || key === "lifting_period" ? "number" : key.includes("schedule") ? "datetime-local" : key === "inspection_date" ? "date" : key === "inspection_time" ? "time" : key === "contact_email" ? "email" : "text"}
                  value={editForm[key] ?? ""}
                  onChange={(e) => setEdit(key, e.target.value)}
                />
              </label>
            ))}
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              Description
              <Textarea value={editForm.description ?? ""} onChange={(e) => setEdit("description", e.target.value)} rows={3} />
            </label>
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              Seller / auction terms
              <Textarea value={editForm.terms ?? ""} onChange={(e) => setEdit("terms", e.target.value)} rows={3} />
            </label>
            <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
              Inspection details
              <Textarea value={editForm.inspection ?? ""} onChange={(e) => setEdit("inspection", e.target.value)} rows={2} />
            </label>
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="size-4" /> Auction images</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {editPhotos.map((photo) => (
                  <div key={photo} className="relative overflow-hidden rounded-lg border">
                    <img src={photo} alt="Auction" className="aspect-video w-full object-cover" />
                    <button type="button" className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow" onClick={() => setEditPhotos((current) => current.filter((item) => item !== photo))} aria-label="Remove image">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setEditPhotoFiles(Array.from(e.target.files ?? []))} />
              {editPhotoFiles.length > 0 && <p className="text-xs text-muted-foreground">{editPhotoFiles.length} new image(s) selected.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
            <Button onClick={() => void saveEdit()} disabled={editSaving}>{editSaving ? "Saving…" : "Save auction changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function mapApiAuction(auction: any, fallbackId: string): any {
  const status = String(auction.status ?? "").toLowerCase();
  const normalizedStatus = status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
  const reserve = Number(auction.reserve_price_inr ?? auction.reserve ?? 0);
  const currentPrice = Number(auction.current_highest_inr ?? auction.current_price ?? reserve);
  const customer = auction.customer ?? {};

  const apiOrigin = (import.meta.env.VITE_API_BASE_URL || "https://api.scrapifyauctions.com/api/v1")
    .replace(/\/api\/v1\/?$/, "");
  const photoUrl = (value: any): string | null => {
    const raw = typeof value === "string"
      ? value
      : value?.url ?? value?.image_url ?? value?.path;
    if (!raw || typeof raw !== "string") return null;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(raw)) {
      return `${apiOrigin}${raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, "")}`;
    }
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${apiOrigin}/${raw.replace(/^\//, "")}`;
  };

  return {
    id: auction.code ?? fallbackId,
    raw: auction,
    name: auction.title ?? auction.name ?? fallbackId,
    kind: auction.kind ?? "Auction",
    template: auction.template ?? "Standard",
    customerId: customer.id ?? auction.customer_id ?? "",
    customerName: customer.company_name ?? customer.name ?? auction.customer_name ?? "Customer",
    category: auction.category ?? "—",
    direction:
      String(auction.direction ?? "forward").toLowerCase() === "reverse" ? "Reverse" : "Forward",
    status: normalizedStatus || "Pending",
    currentPrice,
    reserve,
    bidCount: Number(auction.bids_count ?? auction.bid_count ?? 0),
    bidVelocity: Number(auction.bid_velocity ?? 0),
    participants: [],
    bids: [],
    risk: "high",
    startAt: auction.published_at ?? auction.schedule_start ?? auction.created_at ?? "",
    endAt: auction.schedule_end ?? auction.closed_at ?? "",
    createdAt: auction.created_at ?? "",
    owner: auction.owner?.name ?? auction.owner_name ?? "—",
    extensions: auction.extensions ?? 0,
    emdPercent: Number(auction.emd_percentage ?? auction.emd_percent ?? 0),
    increment: Number(auction.bid_increment_inr ?? auction.increment ?? 0),
    antiSnipe: Number(auction.anti_snipe_minutes ?? auction.anti_snipe ?? 0),
    termsVersion: auction.terms_version ?? "—",
    integrityScore: Number(auction.integrity_score ?? 0),
    lots: auction.lots ?? [],
    inspection: auction.inspection ?? null,
    clarifications: auction.clarifications ?? [],
    approvals: auction.approvals ?? [],
    award: auction.award ?? null,
    connectionHealth: auction.connection_health ?? "Unknown",
    alerts: auction.alerts ?? [],
    photos: (Array.isArray(auction.photos) ? auction.photos : [])
      .map(photoUrl)
      .filter((photo): photo is string => Boolean(photo)),
  };
}
