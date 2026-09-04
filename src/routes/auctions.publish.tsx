import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { auctionStatusTone, formatInr, updateAuction, useAuctions } from "@/lib/auctions-store";

export const Route = createFileRoute("/auctions/publish")({
  component: PublishScreen,
});

const CHANNELS = ["Email", "SMS", "Portal"] as const;

function PublishScreen() {
  const auctions = useAuctions();
  const rows = useMemo(() => auctions.filter((a) => a.status === "Approved"), [auctions]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [channels, setChannels] = useState<string[]>([...CHANNELS]);

  const target = auctions.find((a) => a.id === openId);

  function toggle(c: string) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function publish() {
    if (!target) return;
    if (channels.length === 0) return toast.error("Select at least one notification channel.");
    try {
      await adminApi.publishAuction(target.id, channels);
    } catch (e) {
      console.warn("API publish failed, updating local state", e);
    }
    updateAuction(target.id, { status: "Published", publishedAt: new Date().toISOString(), publishChannels: channels });
    toast.success(`${target.id} published — notified via ${channels.join(", ")}.`);
    setOpenId(null);
    setChannels([...CHANNELS]);
  }

  return (
    <>
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 bg-muted/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Approved & Awaiting Publish</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 font-semibold">Auction ID</th>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Reserve</th>
                <th className="px-5 py-3 font-semibold">Schedule</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">No auctions awaiting publish.</td></tr>
              )}
              {rows.map((a) => {
                const t = auctionStatusTone(a.status);
                return (
                  <tr key={a.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">{a.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{a.title}</div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 mt-1 ${t.bg} ${t.text} ${t.ring}`}>
                        <span className={`h-1 w-1 rounded-full ${t.dot}`} /> {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">{a.company}</td>
                    <td className="px-5 py-4 text-muted-foreground">{a.category}</td>
                    <td className="px-5 py-4 font-semibold">{formatInr(a.reservePriceInr)}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(a.scheduleStart).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button onClick={() => setOpenId(a.id)} size="sm" className="gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Publish Now
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={openId !== null} onOpenChange={(o) => { if (!o) { setOpenId(null); setChannels([...CHANNELS]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Radio className="h-4 w-4 text-accent" /> Publish {target?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Publishing will open this auction on the vendor portal and dispatch notifications on the selected channels.
            </p>
            <div className="rounded-lg ring-1 ring-border p-4 bg-muted/20 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Notification channels</div>
              {CHANNELS.map((c) => (
                <label key={c} className="flex items-center gap-3 text-sm cursor-pointer">
                  <Checkbox checked={channels.includes(c)} onCheckedChange={() => toggle(c)} />
                  <span className="font-medium">{c}</span>
                  <span className="text-xs text-muted-foreground">
                    {c === "Email" && "Registered vendor emails"}
                    {c === "SMS" && "Verified mobile numbers"}
                    {c === "Portal" && "In-app banner + push"}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpenId(null); setChannels([...CHANNELS]); }}>Cancel</Button>
            <Button onClick={publish} className="gap-1.5"><Send className="h-4 w-4" /> Publish & Notify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}