import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, FilterSelect, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";
import { allDocuments, documentBucket, fmtDay, vendors, type VendorDocument, type Vendor } from "@/lib/ops/data";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & Vendor Ranking — Scrapify Operations Console" },
      { name: "description", content: "Verify KYB documents, track expiries by category and region, and manage the vendor performance ranking model." },
      { property: "og:title", content: "Compliance & Vendor Ranking — Scrapify Operations Console" },
      { property: "og:description", content: "Document verification queue, expiry tracking and vendor ranking tiers with override controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Compliance,
});

const DOC_TABS = ["Pending Verification", "Expiring 7 Days", "Expiring 30 Days", "Expiring 60 Days", "Expired", "Rejected", "Verified"] as const;
const TOP_TABS = ["Documents", "Vendor Ranking"] as const;

function Compliance() {
  const [role] = useRole();
  const canAct = roleCan(role, "act.kyb");
  const [top, setTop] = useState<(typeof TOP_TABS)[number]>("Documents");
  const [bucket, setBucket] = useState<(typeof DOC_TABS)[number]>("Pending Verification");
  const [type, setType] = useState("All");
  const [doc, setDoc] = useState<VendorDocument | null>(null);
  const [reason, setReason] = useState("");

  const docTypes = Array.from(new Set(allDocuments.map((d) => d.type)));

  const docs = useMemo(
    () => allDocuments.filter((d) => documentBucket(d) === bucket && (type === "All" || d.type === type)),
    [bucket, type],
  );

  const counts = DOC_TABS.reduce(
    (acc, b) => ({ ...acc, [b]: allDocuments.filter((d) => documentBucket(d) === b).length }),
    {} as Record<(typeof DOC_TABS)[number], number>,
  );

  const docColumns: Column<VendorDocument>[] = [
    {
      key: "v",
      header: "Vendor",
      render: (d) => (
        <Link to="/vendors/$id" params={{ id: d.vendorId }} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
          {d.vendorName}
        </Link>
      ),
      sortValue: (d) => d.vendorName,
    },
    { key: "t", header: "Document", render: (d) => <span className="font-medium">{d.type}</span>, sortValue: (d) => d.type },
    { key: "n", header: "Number", render: (d) => <span className="text-xs text-muted-foreground">{d.number}</span> },
    { key: "sc", header: "Scope", render: (d) => <span className="text-xs text-muted-foreground">{d.categoryScope} · {d.regionScope}</span> },
    { key: "e", header: "Expiry", render: (d) => fmtDay(d.expiryDate), sortValue: (d) => d.expiryDate },
    { key: "m", header: "OCR match", render: (d) => <StatusPill value={d.mismatch ? "Medium" : "Success"} /> },
    { key: "s", header: "Status", render: (d) => <StatusPill value={d.status} />, sortValue: (d) => d.status },
  ];

  const rankColumns: Column<Vendor>[] = [
    {
      key: "n",
      header: "Vendor",
      render: (v) => (
        <Link to="/vendors/$id" params={{ id: v.id }} className="font-medium text-primary hover:underline">
          {v.name}
        </Link>
      ),
      sortValue: (v) => v.name,
    },
    { key: "r", header: "Tier", render: (v) => <StatusPill value={v.rank} tone={v.rank.startsWith("A") ? "good" : v.rank.startsWith("D") ? "warn" : "info"} />, sortValue: (v) => v.rank },
    {
      key: "s",
      header: "Score",
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted">
            <div className={`h-1.5 rounded-full ${v.rankScore > 80 ? "bg-emerald-500" : v.rankScore > 60 ? "bg-accent" : "bg-red-500"}`} style={{ width: `${v.rankScore}%` }} />
          </div>
          <span className="text-xs">{v.rankScore}</span>
        </div>
      ),
      sortValue: (v) => v.rankScore,
    },
    { key: "p", header: "Participation", align: "right", render: (v) => v.events, sortValue: (v) => v.events },
    { key: "w", header: "Win rate", align: "right", render: (v) => `${v.winRate}%`, sortValue: (v) => v.winRate },
    { key: "otp", header: "On-time payment", align: "right", render: (v) => `${v.onTimePayment}%`, sortValue: (v) => v.onTimePayment },
    { key: "otd", header: "On-time delivery", align: "right", render: (v) => `${v.onTimeDelivery}%`, sortValue: (v) => v.onTimeDelivery },
    { key: "d", header: "Defaults", align: "right", render: (v) => v.defaults, sortValue: (v) => v.defaults },
    { key: "di", header: "Disputes", align: "right", render: (v) => v.disputes, sortValue: (v) => v.disputes },
  ];

  return (
    <>
      <PageHeader
        title="Compliance & Vendor Ranking"
        description="Document verification with OCR cross-check, category and region scoping, expiry monitoring, and the performance model that ranks vendors."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Pending verification" value={counts["Pending Verification"]} tone="warn" />
        <StatCard label="Expiring ≤7 days" value={counts["Expiring 7 Days"]} tone="danger" />
        <StatCard label="Expiring ≤30 days" value={counts["Expiring 30 Days"]} tone="warn" />
        <StatCard label="Expired" value={counts.Expired} tone="danger" />
        <StatCard label="A-preferred vendors" value={vendors.filter((v) => v.rank === "A Preferred").length} tone="good" />
        <StatCard label="Watchlist vendors" value={vendors.filter((v) => v.rank === "D New / Watchlist").length} tone="warn" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ChipTabs tabs={TOP_TABS} value={top} onChange={setTop} />
          {!canAct && top === "Documents" && <span className="text-xs text-accent">Read-only for the {role} role</span>}
        </div>

        {top === "Documents" ? (
          <>
            <div className="mb-3">
              <ChipTabs tabs={DOC_TABS} value={bucket} onChange={setBucket} counts={counts} />
            </div>
            <DataTable
              rows={docs}
              columns={docColumns}
              exportName="compliance-documents"
              onRowClick={setDoc}
              toolbar={<FilterSelect label="Type" value={type} options={docTypes} onChange={setType} />}
              empty="Nothing in this bucket."
            />
          </>
        ) : (
          <DataTable rows={vendors} columns={rankColumns} exportName="vendor-ranking" pageSize={14} />
        )}
      </div>

      <DetailDrawer
        open={!!doc}
        onOpenChange={(v) => !v && setDoc(null)}
        title={doc ? `${doc.type} — ${doc.vendorName}` : ""}
        subtitle={doc?.number}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              disabled={!canAct}
              onClick={() => {
                if (reason.trim().length < 8) return toast.error("A rejection reason is mandatory.");
                toast.success("Document rejected — vendor notified");
                setDoc(null);
                setReason("");
              }}
            >
              Reject
            </Button>
            <Button
              disabled={!canAct}
              onClick={() => {
                toast.success("Document verified");
                setDoc(null);
              }}
            >
              Verify
            </Button>
          </div>
        }
      >
        {doc && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Issuer" value={doc.issuer} />
              <Field label="Issued" value={fmtDay(doc.issueDate)} />
              <Field label="Expires" value={fmtDay(doc.expiryDate)} />
              <Field label="Category scope" value={doc.categoryScope} />
              <Field label="Region scope" value={doc.regionScope} />
              <Field label="Status" value={<StatusPill value={doc.status} />} />
            </FieldGrid>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">OCR cross-check</p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Extracted</p>
                  <p className="font-mono">{doc.ocrValue}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Entered</p>
                  <p className="font-mono">{doc.enteredValue}</p>
                </div>
              </div>
              <p className={`mt-2 text-xs ${doc.mismatch ? "text-red-600" : "text-emerald-700"}`}>
                {doc.mismatch ? "Mismatch detected — manual verification required." : "Values reconcile."}
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Document preview · {doc.file}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Reason (required to reject)</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1" />
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
