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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Check,
  Download,
  FileText,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  getVendor,
  MATERIAL_CATEGORIES,
  updateVendor,
  type MaterialCategory,
  type Vendor,
} from "@/lib/vendors-store";
import { MaterialChip, VendorStatusBadge } from "./vendors.index";

export const Route = createFileRoute("/vendors/$id")({
  head: () => ({
    meta: [
      { title: "Vendor — Scrapify Admin" },
      { name: "description", content: "Review a vendor's KYC, documents and auction history." },
    ],
  }),
  component: VendorDetail,
});

function VendorDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | undefined>();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setVendor(getVendor(id));
  }, [id]);

  if (!vendor) {
    return (
      <>
        <PageHeader title="Vendor" />
        <div className="card-premium p-12 text-center text-muted-foreground">
          Vendor not found.
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/vendors">Back to Vendors</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const refresh = () => setVendor(getVendor(id));

  function approve() {
    updateVendor(vendor!.id, { status: "Approved", rejectionReason: undefined });
    toast.success(`${vendor!.companyName} approved`, {
      description: "Vendor notified via email — login activated.",
    });
    refresh();
  }

  function reject() {
    if (!reason.trim()) return;
    updateVendor(vendor!.id, { status: "Rejected", rejectionReason: reason.trim() });
    toast.success(`${vendor!.companyName} rejected`, {
      description: "Rejection reason emailed to vendor.",
    });
    setRejectOpen(false);
    setReason("");
    refresh();
  }

  function suspend() {
    if (!suspendReason.trim()) return;
    updateVendor(vendor!.id, { status: "Suspended", suspensionReason: suspendReason.trim() });
    toast.success(`${vendor!.companyName} suspended`);
    setSuspendOpen(false);
    setSuspendReason("");
    refresh();
  }

  function reactivate() {
    updateVendor(vendor!.id, { status: "Approved", suspensionReason: undefined });
    toast.success(`${vendor!.companyName} reactivated`);
    refresh();
  }

  const isPending = vendor.status === "Pending";
  const isApproved = vendor.status === "Approved";
  const isSuspended = vendor.status === "Suspended";

  return (
    <>
      <PageHeader
        title={vendor.companyName}
        description={`${vendor.id} · Registered ${new Date(vendor.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/vendors"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            {(isApproved || isSuspended) && (
              <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {isPending && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  className="gap-2 text-red-700 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button onClick={approve} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </>
            )}
            {isApproved && (
              <Button
                variant="outline"
                onClick={() => setSuspendOpen(true)}
                className="gap-2 text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              >
                <Ban className="h-4 w-4" /> Suspend
              </Button>
            )}
            {isSuspended && (
              <Button onClick={reactivate} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="h-4 w-4" /> Reactivate
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <VendorStatusBadge status={vendor.status} />
        {vendor.status === "Rejected" && vendor.rejectionReason && (
          <span className="text-sm text-red-700">Reason: {vendor.rejectionReason}</span>
        )}
        {vendor.status === "Suspended" && vendor.suspensionReason && (
          <span className="text-sm text-amber-700">Suspended: {vendor.suspensionReason}</span>
        )}
        {isApproved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> Login activated · vendor notified via email
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: profile + docs */}
        <div className="lg:col-span-2 space-y-6">
          <section className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <h2 className="font-display text-2xl text-foreground">Vendor Profile</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ReadField label="Company Name" value={vendor.companyName} />
              <ReadField label="GST Number" value={vendor.gstNumber} mono />
              <ReadField label="Contact Name" value={vendor.contactName} />
              <ReadField
                label="Email"
                value={
                  <a href={`mailto:${vendor.email}`} className="text-primary hover:underline inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {vendor.email}
                  </a>
                }
              />
              <ReadField
                label="Phone"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.phone}
                  </span>
                }
              />
              <ReadField
                label="Location"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.location}
                  </span>
                }
              />
              <ReadField label="License Number" value={vendor.licenseNumber} mono />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Material Interest
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {vendor.materialInterest.map((m) => (
                    <MaterialChip key={m} m={m} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <h2 className="font-display text-2xl text-foreground">KYC & Compliance Documents</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {vendor.documents.length} document{vendor.documents.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Consolidated view — includes the License uploaded on this module and the KYC files
              (GST, PAN, Cancelled Cheque) submitted during bidder registration.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {vendor.documents.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-accent/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg gradient-navy text-white flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {d.fileName} · {d.sizeKb} KB
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 shrink-0"
                    onClick={() => toast.info("Preview not wired up in demo")}
                  >
                    <Download className="h-3.5 w-3.5" /> Preview
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {(isApproved || isSuspended) && (
            <section className="card-premium p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-accent" />
                <h2 className="font-display text-2xl text-foreground">Auction Participation</h2>
              </div>
              {vendor.participation.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  This vendor hasn't participated in any auctions yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                        <th className="px-4 py-2.5 font-semibold">Auction</th>
                        <th className="px-4 py-2.5 font-semibold">Date</th>
                        <th className="px-4 py-2.5 font-semibold text-center">Bids</th>
                        <th className="px-4 py-2.5 font-semibold">Outcome</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.participation.map((p) => (
                        <tr key={p.id} className="border-t border-border/60">
                          <td className="px-4 py-3 font-medium text-foreground">{p.auction}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(p.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3 text-center">{p.bids}</td>
                          <td className="px-4 py-3">
                            {p.won ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <Trophy className="h-3 w-3" /> Won
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Outbid</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {p.amountInr > 0 ? `₹ ${p.amountInr.toLocaleString("en-IN")}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right: summary */}
        <aside className="space-y-6">
          <section className="card-premium p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Snapshot</div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Vendor ID</dt>
                <dd className="font-mono">{vendor.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Registered</dt>
                <dd>{new Date(vendor.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Categories</dt>
                <dd>{vendor.materialInterest.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Documents</dt>
                <dd>{vendor.documents.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Auctions</dt>
                <dd>{vendor.participation.length}</dd>
              </div>
            </dl>
          </section>

          {isPending && (
            <div className="card-premium p-5 border-l-4 border-l-accent">
              <p className="text-sm font-medium text-foreground">Review checklist</p>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> Verify GST against government portal</li>
                <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> Confirm license validity dates</li>
                <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> Cross-check PAN and Cancelled Cheque</li>
                <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> Sanity-check material interest with license scope</li>
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Reject modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject vendor</DialogTitle>
            <DialogDescription>
              A rejection email with this reason will be sent to <span className="font-medium">{vendor.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rejection reason <span className="text-accent">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. License expired 2024-12; please renew and resubmit."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button onClick={reject} disabled={!reason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
              Send rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend modal */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend vendor</DialogTitle>
            <DialogDescription>
              Suspension blocks the vendor from bidding until reactivated. Provide a reason for the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reason <span className="text-accent">*</span>
            </Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Compliance flag — repeated payment defaults."
              rows={4}
            />
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto text-xs text-muted-foreground">
              <Switch checked disabled /> Notify vendor by email
            </div>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button onClick={suspend} disabled={!suspendReason.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
              Confirm suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditVendorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        vendor={vendor}
        onSaved={() => { refresh(); }}
      />

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" onClick={() => navigate({ to: "/vendors" })}>
          <Link to="/vendors">Back to vendor database</Link>
        </Button>
      </div>
    </>
  );
}

function ReadField({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function EditVendorDialog({
  open,
  onOpenChange,
  vendor,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendor: Vendor;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(vendor);
  useEffect(() => setForm(vendor), [vendor, open]);

  function toggleMaterial(m: MaterialCategory) {
    setForm((f) => ({
      ...f,
      materialInterest: f.materialInterest.includes(m)
        ? f.materialInterest.filter((x) => x !== m)
        : [...f.materialInterest, m],
    }));
  }

  function save() {
    updateVendor(vendor.id, {
      companyName: form.companyName,
      location: form.location,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      gstNumber: form.gstNumber,
      licenseNumber: form.licenseNumber,
      materialInterest: form.materialInterest,
    });
    toast.success("Vendor details updated");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit vendor</DialogTitle>
          <DialogDescription>Update the vendor's contact and compliance details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <EditField label="Company Name">
            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </EditField>
          <EditField label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </EditField>
          <EditField label="Contact Name">
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </EditField>
          <EditField label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </EditField>
          <EditField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </EditField>
          <EditField label="GST Number">
            <Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
          </EditField>
          <EditField label="License Number">
            <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </EditField>
          <div className="md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Material Interest
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MATERIAL_CATEGORIES.map((m) => {
                const active = form.materialInterest.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMaterial(m)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}