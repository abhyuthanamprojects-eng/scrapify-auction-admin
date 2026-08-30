import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, MessageSquare, X, MapPin, Calendar, Phone, Mail, User, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { auctionStatusTone, formatInr, getAuction, updateAuction, type Auction } from "@/lib/auctions-store";

export const Route = createFileRoute("/auctions/$id")({
  component: AuctionReview,
});

function AuctionReview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const a = getAuction(id);
  const [modal, setModal] = useState<null | "sendback" | "reject">(null);
  const [reason, setReason] = useState("");

  if (!a) {
    return (
      <div className="card-premium p-12 text-center">
        <p className="text-muted-foreground">Auction not found.</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/auctions">Back</Link></Button>
      </div>
    );
  }

  const t = auctionStatusTone(a.status);

  function approve() {
    updateAuction(a!.id, { status: "Approved" });
    toast.success(`Auction ${a!.id} approved and moved to Publish queue.`);
    navigate({ to: "/auctions" });
  }
  function submitModal() {
    if (!reason.trim()) return toast.error("A reason is required.");
    if (modal === "sendback") {
      updateAuction(a!.id, { status: "Sent Back", reviewComment: reason });
      toast.success("Sent back to seller with your comments.");
    } else if (modal === "reject") {
      updateAuction(a!.id, { status: "Rejected", reviewComment: reason });
      toast.success("Auction rejected. Seller notified.");
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
            </div>
          )}
        </div>
      </div>

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal === "sendback" ? "Send Back for Changes" : "Reject Auction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (required)</label>
            <Textarea rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={modal === "sendback" ? "Explain what needs to change…" : "Explain why this auction is being rejected…"} />
            <p className="text-xs text-muted-foreground">This message will be sent to the submitter.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={submitModal} className={modal === "reject" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-accent hover:bg-accent/90 text-accent-foreground"}>
              {modal === "sendback" ? "Send Back" : "Reject"}
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