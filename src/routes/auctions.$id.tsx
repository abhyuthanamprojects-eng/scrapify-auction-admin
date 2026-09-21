import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MessageSquare, X, Trash2, MapPin, Calendar, Phone, Mail, User, FileText, Image as ImageIcon, FileSpreadsheet, Download, ChevronDown, ChevronUp, Loader2, Eye, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { auctionStatusTone, formatInr, getAuction, updateAuction, type Auction } from "@/lib/auctions-store";
import { adminApi } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auctions/$id")({
  component: AuctionReview,
});

function AuctionReview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const a = getAuction(id);
  const [modal, setModal] = useState<null | "sendback" | "reject" | "archive">(null);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<any>(null);
  const [settlement, setSettlement] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [config, setConfig] = useState({ rfq_mode: "DOCUMENT", emd_type: "PERCENTAGE", emd_percentage: 10, minimum_participants: 3, initial_slot_minutes: 30, continuation_slot_minutes: 2, bid_cutoff_ms: 500, maximum_auction_duration_minutes: 120, auction_edit_lock_hours: 3 });
  const [templateReview, setTemplateReview] = useState<any>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [parsedItemsOpen, setParsedItemsOpen] = useState(false);
  const [parsedItemsLoading, setParsedItemsLoading] = useState(false);

  // Auction documents
  const [auctionDocs, setAuctionDocs] = useState<any[]>([]);
  const [auctionDocsLoading, setAuctionDocsLoading] = useState(false);

  // Document review dialog
  const [docReviewOpen, setDocReviewOpen] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState("verified");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Document download busy state
  const [docDownloading, setDocDownloading] = useState<number | null>(null);

  // Approve confirmation dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveDocsChecked, setApproveDocsChecked] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approving, setApproving] = useState(false);

  if (!a) {
    return (
      <div className="card-premium p-12 text-center">
        <p className="text-muted-foreground">Auction not found.</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/auctions">Back</Link></Button>
      </div>
    );
  }

  const t = auctionStatusTone(a.status);
  const canArchive = ["Super Admin", "Admin"].includes(user?.role ?? "")
    && !["Live", "Closed", "Cancelled"].includes(a.status);

  useEffect(() => {
    if (!['Closed', 'Live', 'closed', 'live'].includes(a.status)) return;
    Promise.allSettled([adminApi.getAuctionResult(a.id), adminApi.getAuctionSettlement(a.id), adminApi.getAwards(a.id)]).then(([resultResponse, settlementResponse, awardsResponse]) => {
      if (resultResponse.status === 'fulfilled') setResult(resultResponse.value?.data ?? resultResponse.value);
      if (settlementResponse.status === 'fulfilled') setSettlement(settlementResponse.value?.data ?? settlementResponse.value);
      if (awardsResponse.status === 'fulfilled') setAwards(awardsResponse.value?.data ?? []);
    });
  }, [a.id, a.status]);

  useEffect(() => {
    if (!(a as any).template_id) return;
    adminApi.getAuctionTemplateReview(a.id)
      .then((res: any) => setTemplateReview(res?.data ?? res))
      .catch(() => {});
  }, [a.id]);

  // Fetch auction documents
  useEffect(() => {
    setAuctionDocsLoading(true);
    adminApi.getAuctionDocuments(a.id)
      .then((res: any) => setAuctionDocs(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setAuctionDocs([]))
      .finally(() => setAuctionDocsLoading(false));
  }, [a.id]);

  async function loadParsedItems() {
    if (parsedItemsOpen) { setParsedItemsOpen(false); return; }
    setParsedItemsLoading(true);
    try {
      const res = await adminApi.getAuctionParsedItems(a.id);
      setParsedItems(Array.isArray(res) ? res : res?.data ?? []);
      setParsedItemsOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load parsed items.");
    } finally {
      setParsedItemsLoading(false);
    }
  }

  async function downloadOriginal(uploadId: number | string, filename: string) {
    try {
      const blob = await adminApi.downloadSourceFile(a.id, uploadId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "source-file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    }
  }

  function openDocReview(doc: any) {
    setReviewingDoc(doc);
    setReviewStatus("verified");
    setReviewRemarks("");
    setDocReviewOpen(true);
  }

  async function submitDocReview() {
    if (!reviewingDoc) return;
    setReviewSubmitting(true);
    try {
      await adminApi.reviewAuctionDocument(a.id, reviewingDoc.id, {
        status: reviewStatus,
        review_remarks: reviewRemarks.trim() || undefined,
      });
      toast.success(`Document marked as ${reviewStatus.replace(/_/g, " ")}`);
      setDocReviewOpen(false);
      // Refresh docs
      const res = await adminApi.getAuctionDocuments(a.id);
      setAuctionDocs(Array.isArray(res) ? res : res?.data ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to review document");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function downloadAuctionDoc(doc: any) {
    setDocDownloading(doc.id);
    try {
      const blob = await adminApi.downloadAuctionDocument(a.id, doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.original_filename || doc.file_name || `${doc.doc_type}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.message ?? "Download failed");
    } finally {
      setDocDownloading(null);
    }
  }

  function openApproveDialog() {
    setApproveDocsChecked(false);
    setApproveRemarks("");
    setApproveDialogOpen(true);
  }

  async function confirmApprove() {
    setApproving(true);
    try {
      await adminApi.approveAuction(a.id, {
        documents_verified: true,
        remarks: approveRemarks.trim() || undefined,
      });
      updateAuction(a.id, { status: "Approved" });
      toast.success(`Auction ${a.id} approved and moved to Publish queue.`);
      setApproveDialogOpen(false);
      navigate({ to: "/auctions" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve auction");
    } finally {
      setApproving(false);
    }
  }

  async function saveConfiguration() {
    try {
      await adminApi.updateAuctionConfiguration(a.id, config);
      toast.success("Auction-specific configuration saved. It will freeze when published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save auction configuration.");
    }
  }

  function approve() {
    openApproveDialog();
  }
  async function submitModal() {
    if (!reason.trim()) return toast.error("A reason is required.");
    if (modal === "sendback") {
      updateAuction(a!.id, { status: "Sent Back", reviewComment: reason });
      toast.success("Sent back to seller with your comments.");
    } else if (modal === "reject") {
      updateAuction(a!.id, { status: "Rejected", reviewComment: reason });
      toast.success("Auction rejected. Seller notified.");
    } else if (modal === "archive") {
      try {
        await adminApi.archiveAuction(a!.id, reason);
        updateAuction(a!.id, { status: "Cancelled", reviewComment: reason });
        toast.success("Auction archived. Its history remains retained for audit.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Auction could not be archived.");
        return;
      }
    }
    setModal(null);
    setReason("");
    navigate({ to: "/auctions" });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/auctions"><ArrowLeft className="h-4 w-4" /> Back to queue</Link>
        </Button>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
          {a.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-muted-foreground">{a.id}</div>
                <h2 className="text-2xl font-display mt-1">{a.title}</h2>
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {a.location}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Reserve</div>
                <div className="text-xl font-semibold">{formatInr(a.reservePriceInr)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Info label="Company" value={a.company} />
              <Info label="Plant" value={a.plant} />
              <Info label="Warehouse" value={a.warehouse} />
              <Info label="Category" value={a.category} />
              <Info label="Lot Type" value={a.lotType} />
              <Info label="Starting Price" value={formatInr(a.startingPriceInr)} />
            </div>
          </div>

          <Section title="Location Trail">
            <p className="text-sm text-muted-foreground">
              {a.company} → {a.plant} → {a.warehouse} → <span className="text-foreground">{a.location}</span>
            </p>
          </Section>

          {a.lotType === "Lot-wise" && a.subLots.length > 0 && (
            <Section title="Lot Details">
              <div className="divide-y divide-border">
                {a.subLots.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">{s.id}</div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Reserve</div>
                      <div className="font-semibold">{formatInr(s.reservePriceInr)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Inspection">
            <p className="text-sm text-muted-foreground">{a.inspection}</p>
          </Section>

          <Section title="Schedule" icon={<Calendar className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Starts" value={new Date(a.scheduleStart).toLocaleString()} />
              <Info label="Ends" value={new Date(a.scheduleEnd).toLocaleString()} />
            </div>
          </Section>

          <Section title="Auction Terms & Conditions">
            {Array.isArray(a.terms_conditions) && a.terms_conditions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Admin-published terms</h3>
                {a.terms_conditions.map((term: any) => (
                  <div key={term.id ?? term.title} className="rounded-lg border border-border p-3">
                    <p className="font-semibold">{term.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{term.content}</p>
                  </div>
                ))}
              </div>
            )}
            {String(a.terms ?? "").trim() && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Seller-added terms</h3>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{a.terms}</p>
              </div>
            )}
            {(!Array.isArray(a.terms_conditions) || a.terms_conditions.length === 0) && !String(a.terms ?? "").trim() && (
              <p className="text-sm text-muted-foreground">No terms published for this auction.</p>
            )}
          </Section>

          {result && (
            <Section title="Immutable Auction Result">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Result status" value={result.status ?? "—"} />
                <Info label="Terms version" value={String(result.terms_version_id ?? "—")} />
                <Info label="Config snapshot" value={String(result.config_snapshot_id ?? "—")} />
                <Info label="Final value" value={result.final_value == null ? "—" : formatInr(Number(result.final_value))} />
                <Info label="H1/L1 vendor" value={String(result.winner_vendor_id ?? "—")} />
                <Info label="H2/L2 vendor" value={String(result.second_rank_vendor_id ?? "—")} />
              </div>
              <div className="mt-4 overflow-x-auto rounded-md border">
                <table className="w-full text-left text-xs"><thead><tr className="border-b bg-muted/40"><th className="p-2">Rank</th><th className="p-2">Vendor</th><th className="p-2">Bid</th><th className="p-2">Server received</th></tr></thead><tbody>
              {(result.ranking_snapshot ?? []).map((row: any) => <tr key={`${row.rank}-${row.bid_id}`} className="border-b last:border-0"><td className="p-2 font-semibold">{row.rank}</td><td className="p-2">{row.vendor_id}</td><td className="p-2">{formatInr(Number(row.amount))}</td><td className="p-2 text-muted-foreground">{row.server_received_at ? new Date(row.server_received_at).toLocaleString() : "—"}</td></tr>)}
                </tbody></table>
              </div>
              {settlement?.ledger && <>
                <p className="mt-3 text-xs text-muted-foreground">Settlement ledger: {settlement.ledger.length} immutable entries; EMD status is tracked separately from the close result.</p>
                <div className="mt-4 space-y-2">
                  {settlement.ledger.map((entry: any) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-xs">
                    <span><b>{entry.operation_type}</b> · ₹{Number(entry.amount).toLocaleString("en-IN")} · {entry.status}</span>
                    {entry.operation_type === "EMD_REFUND_QUEUED" && entry.status !== "completed" && <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={async () => { const method = window.prompt("Refund method", "MANUAL"); const amount = window.prompt("Refund amount (INR)", String(entry.amount)); if (!method || !amount) return; try { await adminApi.startRefund(entry.id, { refund_method: method, amount: Number(amount) }); toast.success("Refund marked processing."); } catch (e) { toast.error(e instanceof Error ? e.message : "Refund could not be started."); } }}>Start refund</Button>
                      <Button size="sm" onClick={async () => { const reference = window.prompt("Manual refund reference (required)"); if (!reference) return; try { await adminApi.completeRefund(entry.id, reference); toast.success("Refund completion recorded."); } catch (e) { toast.error(e instanceof Error ? e.message : "Refund could not be completed."); } }}>Confirm refund</Button>
                    </div>}
                    {entry.operation_type === "EMD_RETAIN_PRIMARY" && entry.status !== "completed" && <Button size="sm" variant="outline" onClick={async () => { const amount = window.prompt("Approved deduction amount (INR)", String(entry.amount)); const why = window.prompt("Reason for the deduction"); if (!amount || !why) return; try { await adminApi.applyLossAdjustment(entry.id, Number(amount), why, "ACTUAL_LOSS_ONLY"); toast.success("Loss adjustment approved and bounded by the locked EMD."); } catch (e) { toast.error(e instanceof Error ? e.message : "Loss adjustment could not be applied."); } }}>Approve loss adjustment</Button>}
                  </div>)}
                </div>
              </>}
            </Section>
          )}

          {!["Published", "Live", "Closed", "Cancelled"].includes(a.status) && (
            <Section title="Auction Configuration">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ConfigInput label="RFQ Mode" value={config.rfq_mode} onChange={(v) => setConfig({ ...config, rfq_mode: v })} />
                <ConfigInput label="EMD Type" value={config.emd_type} onChange={(v) => setConfig({ ...config, emd_type: v })} />
                <ConfigInput label="EMD %" type="number" value={config.emd_percentage} onChange={(v) => setConfig({ ...config, emd_percentage: Number(v) })} />
                <ConfigInput label="Minimum Participants" type="number" value={config.minimum_participants} onChange={(v) => setConfig({ ...config, minimum_participants: Number(v) })} />
                <ConfigInput label="Initial Slot (min)" type="number" value={config.initial_slot_minutes} onChange={(v) => setConfig({ ...config, initial_slot_minutes: Number(v) })} />
                <ConfigInput label="Continuation Slot (min)" type="number" value={config.continuation_slot_minutes} onChange={(v) => setConfig({ ...config, continuation_slot_minutes: Number(v) })} />
                <ConfigInput label="Bid Cutoff (ms)" type="number" value={config.bid_cutoff_ms} onChange={(v) => setConfig({ ...config, bid_cutoff_ms: Number(v) })} />
                <ConfigInput label="Maximum Duration (min)" type="number" value={config.maximum_auction_duration_minutes} onChange={(v) => setConfig({ ...config, maximum_auction_duration_minutes: Number(v) })} />
                <ConfigInput label="Seller Edit Lock (hours)" type="number" value={config.auction_edit_lock_hours} onChange={(v) => setConfig({ ...config, auction_edit_lock_hours: Number(v) })} />
              </div>
              <Button onClick={saveConfiguration} className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">Save Auction Configuration</Button>
            </Section>
          )}

          {templateReview && (
            <Section title="Template / Excel Review" icon={<FileSpreadsheet className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Template" value={templateReview.template?.name ?? "—"} />
                <Info label="Version" value={templateReview.template?.version ?? "—"} />
                <Info label="Template Code" value={templateReview.template?.template_code ?? "—"} />
                <Info label="Status" value={templateReview.template?.status ?? "—"} />
              </div>
              {templateReview.upload && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Upload Info</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Filename" value={templateReview.upload.original_filename ?? "—"} />
                    <Info label="File Hash" value={templateReview.upload.file_hash ? String(templateReview.upload.file_hash).substring(0, 12) + "..." : "—"} />
                    <Info label="Size" value={templateReview.upload.file_size ? `${(Number(templateReview.upload.file_size) / 1024).toFixed(1)} KB` : "—"} />
                    <Info label="Upload Status" value={templateReview.upload.status ?? "—"} />
                    <Info label="Uploaded" value={templateReview.upload.created_at ? new Date(templateReview.upload.created_at).toLocaleString() : "—"} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadOriginal(templateReview.upload.id, templateReview.upload.original_filename)}>
                      <Download className="h-3.5 w-3.5" /> Download Original
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={loadParsedItems} disabled={parsedItemsLoading}>
                      {parsedItemsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {parsedItemsLoading ? "Loading..." : parsedItemsOpen ? "Hide Parsed Items" : "View Parsed Items"}
                    </Button>
                  </div>
                </div>
              )}
              {parsedItemsOpen && parsedItems.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        {Object.keys(parsedItems[0]).map((k) => <th key={k} className="p-2 whitespace-nowrap">{k}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {Object.values(item).map((v, j) => <td key={j} className="p-2 whitespace-nowrap">{v == null ? "—" : String(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {parsedItemsOpen && parsedItems.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">No parsed items found.</p>
              )}
              {Array.isArray(templateReview.versions) && templateReview.versions.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Submission Version History</div>
                  <div className="space-y-1">
                    {templateReview.versions.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-md border p-2 text-xs">
                        <span className="font-mono">{v.version ?? v.id}</span>
                        <span className="text-muted-foreground">{v.created_at ? new Date(v.created_at).toLocaleString() : ""}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${v.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{v.status ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Auction Documents Section */}
          <Section title="Auction Documents" icon={<FileCheck className="h-4 w-4" />}>
            {auctionDocsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
              </div>
            ) : auctionDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No auction documents uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {auctionDocs.map((doc: any) => {
                  const statusColors: Record<string, string> = {
                    pending_review: "border-amber-500/30 bg-amber-500/10 text-amber-600",
                    verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                    changes_required: "border-orange-500/30 bg-orange-500/10 text-orange-600",
                    rejected: "border-red-500/30 bg-red-500/10 text-red-600",
                    not_applicable: "border-gray-400/30 bg-gray-400/10 text-gray-500",
                  };
                  const docTypeLabels: Record<string, string> = {
                    catalog: "Catalog PDF",
                    tnc: "Terms & Conditions PDF",
                    photographs: "Photographs PDF",
                  };
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground flex items-center gap-2">
                            {docTypeLabels[doc.doc_type] || doc.doc_type}
                            <Badge variant="outline" className={`text-[10px] ${statusColors[doc.status] || statusColors.pending_review}`}>
                              {(doc.status || "pending_review").replace(/_/g, " ").toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                            {doc.original_filename || doc.file_name || "—"}
                            {doc.file_size ? ` · ${(Number(doc.file_size) / 1024).toFixed(1)} KB` : ""}
                            {doc.created_at ? ` · ${new Date(doc.created_at).toLocaleDateString()}` : ""}
                          </div>
                          {doc.review_remarks && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Remarks: {doc.review_remarks}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={docDownloading !== null}
                          onClick={() => downloadAuctionDoc(doc)}
                          className="h-8 px-3 text-xs"
                        >
                          {docDownloading === doc.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}
                          {docDownloading === doc.id ? "Downloading..." : "Download"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDocReview(doc)}
                          className="h-8 px-3 text-xs"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" /> Review
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Material list status from template review */}
            {templateReview?.upload && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Material List (Template Upload)</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {templateReview.upload.original_filename || "—"}
                        {templateReview.upload.file_size ? ` · ${(Number(templateReview.upload.file_size) / 1024).toFixed(1)} KB` : ""}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${
                    templateReview.upload.status === "processed" || templateReview.upload.status === "active"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                  }`}>
                    {(templateReview.upload.status || "pending").toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}
          </Section>

          <Section title="Photo Gallery" icon={<ImageIcon className="h-4 w-4" />}>
            {a.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos uploaded.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {a.photos.map((src, i) => (
                  <div key={i} className="aspect-video overflow-hidden rounded-lg ring-1 ring-border bg-muted">
                    <img src={src} alt={`Auction photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {a.reviewComment && (
            <Section title="Previous Admin Comment" icon={<FileText className="h-4 w-4" />}>
              <p className="text-sm text-muted-foreground italic">"{a.reviewComment}"</p>
            </Section>
          )}
        </div>

        <div className="space-y-4">
          <Section title="Contact" icon={<User className="h-4 w-4" />}>
            <div className="space-y-2 text-sm">
              <div className="font-medium">{a.contact.name}</div>
              <div className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {a.contact.phone}</div>
              <div className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {a.contact.email}</div>
            </div>
          </Section>

          {a.status === "Pending Approval" || a.status === "Sent Back" ? (
            <div className="card-premium p-5 space-y-2 sticky top-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Actions</div>
              <Button onClick={approve} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button onClick={() => setModal("sendback")} variant="outline" className="w-full gap-2 border-accent text-accent hover:bg-accent/10">
                <MessageSquare className="h-4 w-4" /> Send Back for Changes
              </Button>
              <Button onClick={() => setModal("reject")} variant="outline" className="w-full gap-2 border-red-300 text-red-700 hover:bg-red-50">
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          ) : (
            <div className="card-premium p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Status</div>
              <p className="text-sm">This auction is <span className="font-medium">{a.status}</span> — no review actions available.</p>
              {canArchive && (
                <Button
                  onClick={() => setModal("archive")}
                  variant="outline"
                  className="mt-4 w-full gap-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Archive auction
                </Button>
              )}
            </div>
          )}
                </div>
                {awards.length > 0 && <div className="mt-4 rounded-md border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Winner / fallback state controls</div>
                  <div className="space-y-2">
                    {awards.map((award: any) => <div key={award.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span><b>{award.rank}</b> · vendor {award.winner_vendor_id} · {award.status} · ₹{Number(award.award_amount).toLocaleString("en-IN")}</span>
                      {award.status === "offered" && <Button size="sm" onClick={async () => { try { await adminApi.adminAcceptAward(award.id); toast.success("Winner acceptance recorded and order created."); } catch (e) { toast.error(e instanceof Error ? e.message : "Acceptance could not be recorded."); } }}>Mark accepted</Button>}
                      {['offered', 'declined'].includes(award.status) && <Button size="sm" variant="outline" onClick={async () => { const why = window.prompt("Default reason (required)"); if (!why) return; const forfeit = window.confirm("Apply full EMD forfeiture if the frozen policy permits it?"); try { await adminApi.defaultWinner(award.id, why, forfeit); toast.success("Winner default recorded; fallback policy evaluated."); } catch (e) { toast.error(e instanceof Error ? e.message : "Winner default could not be recorded."); } }}>Mark default / start fallback</Button>}
                    </div>)}
                  </div>
                </div>}
                {settlement?.result && <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { try { await adminApi.releaseFallbackEmd(a.id); toast.success("Second-rank EMD release recorded."); } catch (e) { toast.error(e instanceof Error ? e.message : "Fallback EMD could not be released."); } }}>Release second-rank EMD</Button>
                  <Button size="sm" onClick={async () => { try { await adminApi.completeSettlement(a.id); toast.success("Settlement completed."); } catch (e) { toast.error(e instanceof Error ? e.message : "Settlement cannot be completed yet."); } }}>Complete settlement</Button>
                </div>}
              </div>

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal === "sendback" ? "Send Back for Changes" : modal === "reject" ? "Reject Auction" : "Archive Auction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (required)</label>
            {modal === "archive" && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                <div><b>Auction:</b> {a.id}</div>
                <div><b>Title:</b> {a.title}</div>
                <div><b>Current status:</b> {a.status}</div>
                <div className="mt-1">This archives the record as cancelled; bidding, EMD, settlement and audit history are retained.</div>
              </div>
            )}
            <Textarea rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={modal === "sendback" ? "Explain what needs to change…" : "Explain why this auction is being rejected…"} />
            <p className="text-xs text-muted-foreground">{modal === "archive" ? "The reason is recorded in the immutable audit trail." : "This message will be sent to the submitter."}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={submitModal} className={modal === "reject" || modal === "archive" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-accent hover:bg-accent/90 text-accent-foreground"}>
              {modal === "sendback" ? "Send Back" : modal === "reject" ? "Reject" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auction Document Review Dialog */}
      <Dialog open={docReviewOpen} onOpenChange={setDocReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              Review this auction document and set its verification status.
            </DialogDescription>
          </DialogHeader>
          {reviewingDoc && (
            <div className="space-y-4 py-2">
              <div className="rounded-md border border-border p-3 text-sm">
                <div className="font-medium">
                  {({ catalog: "Catalog PDF", tnc: "Terms & Conditions PDF", photographs: "Photographs PDF" } as Record<string, string>)[reviewingDoc.doc_type] || reviewingDoc.doc_type}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  {reviewingDoc.original_filename || reviewingDoc.file_name || "—"}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification Status
                </Label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="verified">Verified</option>
                  <option value="changes_required">Changes Required</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Review Remarks
                </Label>
                <Textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Optional remarks about this document..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocReviewOpen(false)}>Cancel</Button>
            <Button
              onClick={submitDocReview}
              disabled={reviewSubmitting}
              className={reviewStatus === "rejected" ? "bg-red-600 hover:bg-red-700 text-white" : reviewStatus === "changes_required" ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {reviewSubmitting ? "Submitting..." : `Mark as ${reviewStatus.replace(/_/g, " ")}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auction Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Auction Approval</DialogTitle>
            <DialogDescription>
              Review all required auction documents before approving. Approval moves this auction to the Publish queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Document verification status summary */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Required Document Verification
              </Label>
              <div className="mt-2 space-y-1.5">
                {(() => {
                  const isForward = (a as any).auction_type === "forward" || (a as any).type === "forward";
                  const docTypeLabels: Record<string, string> = {
                    catalog: "Catalog PDF",
                    tnc: "Terms & Conditions PDF",
                    photographs: "Photographs PDF",
                  };
                  const requiredTypes = isForward ? ["catalog", "photographs"] : ["catalog"];
                  const allTypes = ["catalog", "tnc", "photographs"];
                  const statusColors: Record<string, string> = {
                    pending_review: "border-amber-500/30 bg-amber-500/10 text-amber-600",
                    verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                    changes_required: "border-orange-500/30 bg-orange-500/10 text-orange-600",
                    rejected: "border-red-500/30 bg-red-500/10 text-red-600",
                    not_applicable: "border-gray-400/30 bg-gray-400/10 text-gray-500",
                  };

                  return allTypes.map((docType) => {
                    const doc = auctionDocs.find((d: any) => d.doc_type === docType);
                    const isRequired = requiredTypes.includes(docType);
                    const status = doc?.status || (isRequired ? "not_uploaded" : "not_applicable");
                    return (
                      <div key={docType} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          {docTypeLabels[docType]}
                          {isRequired && <span className="text-red-500 text-[10px]">*</span>}
                        </span>
                        {doc ? (
                          <Badge variant="outline" className={`text-[10px] ${statusColors[status] || statusColors.pending_review}`}>
                            {status.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-gray-400/30 bg-gray-400/10 text-gray-500">
                            {isRequired ? "NOT UPLOADED" : "N/A"}
                          </Badge>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* Material list status */}
                {templateReview?.upload && (
                  <div className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      Material List
                      {((a as any).auction_type === "forward" || (a as any).type === "forward") && <span className="text-red-500 text-[10px]">*</span>}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${
                      templateReview.upload.status === "processed" || templateReview.upload.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }`}>
                      {(templateReview.upload.status || "PENDING").toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Verification checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={approveDocsChecked}
                onChange={(e) => setApproveDocsChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-foreground">
                I have verified all auction documents and confirm they meet requirements.
              </span>
            </label>

            {/* Optional remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Approval Remarks (optional)
              </Label>
              <Textarea
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                placeholder="e.g. All documents reviewed and verified. Ready for publication."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmApprove}
              disabled={!approveDocsChecked || approving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {approving ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
function ConfigInput({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="space-y-1"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span><input className="h-9 w-full rounded-md border bg-background px-2 text-sm" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="card-premium p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

export type _A = Auction;
