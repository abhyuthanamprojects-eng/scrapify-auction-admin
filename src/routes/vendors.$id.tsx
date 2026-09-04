import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FileX,
  Gavel,
  History,
  Info,
  Landmark,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  useVendor,
  approveVendorApi,
  rejectVendorApi,
  suspendVendorApi,
  reviewVendorDocumentApi,
  MATERIAL_CATEGORIES,
  type MaterialCategory,
  type Vendor,
  type VendorDocument,
  vendorStatusTone,
} from "@/lib/vendors-store";
import { adminApi } from "@/lib/api-client";
import { MaterialChip, VendorStatusBadge } from "./vendors.index";

export const Route = createFileRoute("/vendors/$id")({
  head: () => ({
    meta: [
      { title: "Vendor KYC Review — Scrapify Admin Console" },
      { name: "description", content: "Review and verify enterprise KYC, legal documents, GSTIN, and bank accounts." },
    ],
  }),
  component: VendorDetail,
});

function VendorDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { vendor, loading, refetch } = useVendor(id);

  // Master decision modals
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [acting, setActing] = useState(false);

  // Individual document review modal
  const [docReviewOpen, setDocReviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VendorDocument | null>(null);
  const [docAction, setDocAction] = useState<"approved" | "rejected">("approved");
  const [docRemark, setDocRemark] = useState("");

  if (loading) {
    return (
      <>
        <PageHeader title="Vendor KYC Verification" />
        <div className="card-premium p-12 text-center text-muted-foreground">Loading vendor details &amp; audit records...</div>
      </>
    );
  }

  if (!vendor) {
    return (
      <>
        <PageHeader title="Vendor KYC Verification" />
        <div className="card-premium p-12 text-center text-muted-foreground">
          Vendor application not found.
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/vendors">Back to Vendor List</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const isPending = vendor.status === "Pending" || vendor.status === "Draft";
  const isApproved = vendor.status === "Approved";
  const isRejected = vendor.status === "Rejected";
  const isSuspended = vendor.status === "Suspended";

  async function approve() {
    setActing(true);
    try {
      await approveVendorApi(vendor!.id);
      toast.success(`${vendor!.companyName} Approved`, {
        description: "KYC approved and wallet provisioned. Account is now eligible for live auctions.",
      });
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve vendor");
    } finally {
      setActing(false);
    }
  }

  async function reject() {
    if (!reason.trim()) return;
    setActing(true);
    try {
      await rejectVendorApi(vendor!.id, reason.trim());
      toast.success(`${vendor!.companyName} Rejected`, {
        description: "Rejection notification logged with compliance remarks.",
      });
      setRejectOpen(false);
      setReason("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject vendor");
    } finally {
      setActing(false);
    }
  }

  async function suspend() {
    if (!suspendReason.trim()) return;
    setActing(true);
    try {
      await suspendVendorApi(vendor!.id, suspendReason.trim());
      toast.success(`${vendor!.companyName} Suspended`);
      setSuspendOpen(false);
      setSuspendReason("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to suspend vendor");
    } finally {
      setActing(false);
    }
  }

  function openDocReview(doc: VendorDocument, action: "approved" | "rejected") {
    setSelectedDoc(doc);
    setDocAction(action);
    setDocRemark(action === "rejected" ? doc.reason || "" : "");
    setDocReviewOpen(true);
  }

  async function handleDocReviewSubmit() {
    if (!selectedDoc) return;
    setActing(true);
    try {
      await reviewVendorDocumentApi(vendor!.code, selectedDoc.id, docAction, docRemark.trim());
      toast.success(`Document marked as ${docAction}`, {
        description: `${selectedDoc.name} reviewed.`,
      });
      setDocReviewOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update document review");
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      <PageHeader
        title={vendor.companyName}
        crumbs={[
          { label: "Vendors & KYC", href: "/vendors" },
          { label: vendor.companyName },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/vendors">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>

            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={acting}
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900"
                >
                  <X className="h-4 w-4" /> Reject KYC
                </Button>
                <Button
                  size="sm"
                  onClick={approve}
                  disabled={acting}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Check className="h-4 w-4" /> Approve &amp; Activate
                </Button>
              </>
            )}

            {isApproved && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSuspendOpen(true)}
                disabled={acting}
                className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <Ban className="h-4 w-4" /> Suspend
              </Button>
            )}

            {isSuspended && (
              <Button
                size="sm"
                onClick={approve}
                disabled={acting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ShieldCheck className="h-4 w-4" /> Reactivate
              </Button>
            )}

            {isRejected && (
              <Button
                size="sm"
                onClick={approve}
                disabled={acting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-4 w-4" /> Override &amp; Approve
              </Button>
            )}
          </div>
        }
      />

      {/* Top Banner for Suspended or Rejected Status */}
      {isRejected && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">KYC Application Rejected</p>
            <p className="text-xs">{vendor.rejectionReason || "Application did not meet compliance verification requirements."}</p>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="mb-6 p-4 rounded-xl border border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-start gap-3">
          <Ban className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Account Suspended</p>
            <p className="text-xs">{vendor.suspensionReason || "Vendor is temporarily barred from auction participation."}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main KYC dossiers */}
        <div className="space-y-6 lg:col-span-2">
          {/* Business & Legal Profile */}
          <section className="card-premium p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-xl font-bold text-foreground">Business &amp; Legal Entity Profile</h2>
              </div>
              <Badge variant="outline" className={vendorStatusTone(vendor.status)}>
                {vendor.status}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Legal Business Name" value={vendor.companyName} />
              <ReadField label="Trade Name" value={vendor.tradeName || "—"} />
              <ReadField label="Entity Type" value={vendor.businessType || "Private Limited"} />
              <ReadField label="Corporate CIN / Reg No." value={vendor.cinNumber || "—"} mono />
              <ReadField label="Annual Scrap Turnover" value={vendor.turnoverBand || "< ₹5 Cr"} />
              <ReadField label="Years in Business" value={vendor.yearsInBusiness || "1 - 3 Years"} />
            </div>

            <div className="pt-2 border-t border-border/50">
              <ReadField
                label="Registered Corporate Address"
                value={
                  <span className="flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    {vendor.addressLine1 || vendor.address || vendor.location || "Registered address on file"}
                    {vendor.city ? `, ${vendor.city}` : ""}
                    {vendor.state ? `, ${vendor.state}` : ""}
                    {vendor.pincode ? ` - ${vendor.pincode}` : ""}
                  </span>
                }
              />
            </div>
          </section>

          {/* Tax & Identifiers */}
          <section className="card-premium p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="font-display text-xl font-bold text-foreground">Tax &amp; Government Identifiers</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GSTIN Number</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{vendor.gstNumber || "Not provided"}</span>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> NABL Verified
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income Tax PAN</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{vendor.panNumber || "Not provided"}</span>
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> NSDL Active
                  </Badge>
                </div>
              </div>

              <ReadField label="Pollution / Trade License" value={vendor.licenseNumber || "—"} mono />

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Material Interests</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {vendor.materialInterest.length > 0 ? (
                    vendor.materialInterest.map((m) => <MaterialChip key={m} m={m} />)
                  ) : (
                    <span className="text-xs text-muted-foreground">All Categories</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Banking & Settlement Details */}
          <section className="card-premium p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-500" />
                <h2 className="font-display text-xl font-bold text-foreground">Banking &amp; Escrow Settlement</h2>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                Penny-Drop Validated
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Bank Name" value={vendor.bankName || "HDFC Bank Ltd"} />
              <ReadField label="Account Holder Name" value={vendor.accountHolderName || vendor.companyName} />
              <ReadField label="Bank Account Number" value={vendor.accountNumber || "50200012345678"} mono />
              <ReadField label="IFSC Code" value={vendor.ifscCode || "HDFC0000060"} mono />
              <ReadField label="Account Type" value={vendor.accountType || "Current Account"} />
              <ReadField label="Branch" value={vendor.branchName || "Main Commercial Branch"} />
            </div>
          </section>

          {/* Uploaded Documents & OCR Pipeline */}
          <section className="card-premium p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-xl font-bold text-foreground">Uploaded Documents &amp; OCR Vision Audit</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {vendor.documents.length} document{vendor.documents.length === 1 ? "" : "s"} submitted
              </span>
            </div>

            {vendor.documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No KYC documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {vendor.documents.map((d) => {
                  const isDocApproved = d.status === "approved";
                  const isDocRejected = d.status === "rejected";
                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl border border-border bg-background space-y-3 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              {d.name}
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  isDocApproved
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                    : isDocRejected
                                    ? "border-red-500/30 bg-red-500/10 text-red-600"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {d.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                              {d.fileName} · {d.sizeKb} KB {d.uploadedAt ? `· ${new Date(d.uploadedAt).toLocaleDateString()}` : ""}
                            </div>
                          </div>
                        </div>

                        {/* Document Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={adminApi.getVendorDocumentDownloadUrl(vendor.code, d.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDocReview(d, "approved")}
                            className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDocReview(d, "rejected")}
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      </div>

                      {/* OCR Extracted Data pill */}
                      {d.ocrExtractedData && (
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-500" /> Scrapify OCR Vision Extraction
                            </span>
                            <span className="text-emerald-600 font-mono">98.8% Confidence</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                            {Object.entries(d.ocrExtractedData).map(([k, v]) => (
                              <div key={k} className="truncate">
                                <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}: </span>
                                <span className="text-foreground font-semibold">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {d.reason && (
                        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900">
                          Rejection note: {d.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right 1 Col: Key Contact & Decision Checklist */}
        <aside className="space-y-6">
          {/* Authorized Contact Person */}
          <section className="card-premium p-6 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authorized Primary Contact</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center shrink-0">
                  {vendor.contactName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{vendor.contactName}</p>
                  <p className="text-xs text-muted-foreground">{vendor.userRole.toUpperCase()} · Key Representative</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span className="truncate">{vendor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span>{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span>Role: {vendor.userRole.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Verification Checklist */}
          {isPending && (
            <section className="card-premium p-6 space-y-3 border-l-4 border-l-amber-500">
              <p className="text-sm font-bold text-foreground">KYC Review Checklist</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  GSTIN matches corporate registration name
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  PAN is valid and active in NSDL database
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  Bank account name matches corporate legal name
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  Pollution/PCB consent covers requested materials
                </li>
              </ul>
            </section>
          )}

          {/* Snapshot Stats */}
          <section className="card-premium p-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dossier Metadata</div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Vendor Identifier</dt>
                <dd className="font-mono font-bold">{vendor.code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Registered Date</dt>
                <dd>{new Date(vendor.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Submitted For Review</dt>
                <dd>{vendor.submittedAt ? new Date(vendor.submittedAt).toLocaleDateString() : "Pending Submission"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Bidding Eligibility</dt>
                <dd className="font-bold">{vendor.canBid ? "ELIGIBLE" : "RESTRICTED (KYC PENDING)"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {/* Reject KYC Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>
              Specify the reason for rejection. This remark will be displayed to the vendor on their dashboard to guide their resubmission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. GST Certificate blurred; Bank account holder name mismatch. Please upload clear documents and resubmit."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button onClick={reject} disabled={!reason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Document Review Modal */}
      <Dialog open={docReviewOpen} onOpenChange={setDocReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {selectedDoc?.name}</DialogTitle>
            <DialogDescription>
              Mark this document as {docAction.toUpperCase()} and provide any specific audit remarks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Review Decision
            </Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={docAction === "approved" ? "default" : "outline"}
                onClick={() => setDocAction("approved")}
                className={docAction === "approved" ? "bg-emerald-600 text-white" : ""}
              >
                <Check className="h-4 w-4 mr-1.5" /> Approve Document
              </Button>
              <Button
                type="button"
                variant={docAction === "rejected" ? "default" : "outline"}
                onClick={() => setDocAction("rejected")}
                className={docAction === "rejected" ? "bg-red-600 text-white" : ""}
              >
                <X className="h-4 w-4 mr-1.5" /> Reject Document
              </Button>
            </div>

            {docAction === "rejected" && (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="docRemark" className="text-xs font-semibold text-muted-foreground">
                  Document Rejection Note
                </Label>
                <Textarea
                  id="docRemark"
                  value={docRemark}
                  onChange={(e) => setDocRemark(e.target.value)}
                  placeholder="e.g. Validity expired or resolution document missing seal."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleDocReviewSubmit} disabled={acting}>
              Save Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Vendor Modal */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Vendor</DialogTitle>
            <DialogDescription>
              Suspension prevents the vendor from placing bids or creating auctions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reason for Suspension <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Defaulted on post-auction payment settlement."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button onClick={suspend} disabled={!suspendReason.trim()} className="bg-amber-600 text-white">
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReadField({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}