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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Check, FileText, Landmark, MapPin, Wallet, X } from "lucide-react";
import { getOrganization, updateStatus, type Organization } from "@/lib/organizations-store";
import { useRole } from "@/hooks/use-role";
import { StatusBadge } from "./organizations.index";
import { toast } from "sonner";

export const Route = createFileRoute("/organizations/$id")({
  head: () => ({
    meta: [
      { title: "Organization — Scrapify Admin" },
      { name: "description", content: "Review an organization's company and unit details." },
    ],
  }),
  component: OrganizationDetail,
});

function OrganizationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [role] = useRole();
  const [org, setOrg] = useState<Organization | undefined>(undefined);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setOrg(getOrganization(id));
  }, [id]);

  if (!org) {
    return (
      <>
        <PageHeader title="Organization" />
        <div className="card-premium p-12 text-center text-muted-foreground">
          Organization not found.
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/organizations">Back to Organizations</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const isSuper = role === "Super Admin";
  const canReview = isSuper && org.status === "Pending Super Admin Approval";

  function approve() {
    updateStatus(org!.id, "Approved");
    toast.success(`${org!.companyName} approved`);
    navigate({ to: "/organizations" });
  }

  function reject() {
    if (!reason.trim()) return;
    updateStatus(org!.id, "Rejected", reason.trim());
    toast.success(`${org!.companyName} rejected`);
    setRejectOpen(false);
    navigate({ to: "/organizations" });
  }

  return (
    <>
      <PageHeader
        title={org.companyName}
        description={`${org.id} · Created ${new Date(org.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/organizations"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            {canReview && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)} className="gap-2 text-red-700 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button onClick={approve} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <StatusBadge status={org.status} />
        {org.status === "Rejected" && org.rejectionReason && (
          <span className="text-sm text-red-700">Reason: {org.rejectionReason}</span>
        )}
      </div>

      <section className="card-premium p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-accent" />
          <h2 className="font-display text-2xl text-foreground">Company Details</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <ReadField label="Company Name" value={org.companyName} />
          <ReadField label="Total Units" value={String(org.totalUnits)} />
          <ReadField label="Location / Address" value={org.location} className="md:col-span-1" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-accent" />
            <h2 className="font-display text-2xl text-foreground">Organization Bank Details</h2>
          </div>
          {org.bank ? (
            <div className="grid gap-4 sm:grid-cols-3 rounded-lg bg-muted/40 p-4">
              <ReadField label="Bank Name" value={org.bank.bankName} />
              <ReadField label="Account Number" value={org.bank.accountNumber} />
              <ReadField label="IFSC" value={org.bank.ifsc} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No organization-level bank details captured yet.
            </p>
          )}
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-accent" />
            <h2 className="font-display text-2xl text-foreground">
              Documents ({org.documents?.length ?? 0})
            </h2>
          </div>
          {org.documents && org.documents.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {org.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{d.type}</div>
                      <div className="text-xs text-muted-foreground truncate">{d.fileName}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(d.uploadedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No documents uploaded yet.</p>
          )}
        </div>
      </section>

      <section className="card-premium p-6">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="h-4 w-4 text-accent" />
          <h2 className="font-display text-2xl text-foreground">Units ({org.units.length})</h2>
        </div>
        {org.units.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No unit details captured yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {org.units.map((u, i) => (
              <div key={u.id} className="rounded-xl border border-border bg-background p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Unit {i + 1}</div>
                    <div className="font-display text-xl text-foreground mt-0.5">{u.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {u.location}
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{u.gst}</span>
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Bank Details</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Bank</div>
                      <div className="font-medium text-foreground truncate">{u.bank.bankName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Account</div>
                      <div className="font-mono text-foreground truncate">{u.bank.accountNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">IFSC</div>
                      <div className="font-mono text-foreground truncate">{u.bank.ifsc}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isSuper && org.status !== "Pending Super Admin Approval" && org.status !== "Approved" && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          This organization is not currently awaiting Super Admin review.
        </p>
      )}
      {!isSuper && org.status === "Pending Super Admin Approval" && (
        <div className="mt-4 card-premium p-4 text-sm text-muted-foreground text-center">
          Awaiting Super Admin review — approval is not available under the Admin role.
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject organization</DialogTitle>
            <DialogDescription>
              Provide a reason. This will be visible to the requester in their action list.
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
              placeholder="e.g. Incomplete KYC on Unit 2, GST does not match PAN."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button onClick={reject} disabled={!reason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReadField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}