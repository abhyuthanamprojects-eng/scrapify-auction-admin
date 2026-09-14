import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MessageSquare, X, Trash2, MapPin, Calendar, Phone, Mail, User, FileText, Image as ImageIcon, FileSpreadsheet, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

  async function saveConfiguration() {
    try {
      await adminApi.updateAuctionConfiguration(a.id, config);
      toast.success("Auction-specific configuration saved. It will freeze when published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save auction configuration.");
    }
  }

  function approve() {
    updateAuction(a!.id, { status: "Approved" });
    toast.success(`Auction ${a!.id} approved and moved to Publish queue.`);
    navigate({ to: "/auctions" });
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

          <Section title="Terms">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{a.terms}</p>
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
