import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Copy, Plus, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createToken, revokeToken, tokenShareLink, tokenStatusTone, useAuctions, useTokens, type TokenType } from "@/lib/auctions-store";

export const Route = createFileRoute("/tokens")({
  head: () => ({
    meta: [
      { title: "Tokens — Scrapify Admin" },
      { name: "description", content: "Generate and manage shareable auction access tokens." },
      { property: "og:title", content: "Tokens — Scrapify Admin" },
      { property: "og:description", content: "Generate and manage shareable auction access tokens." },
    ],
  }),
  component: TokensPage,
});

function TokensPage() {
  const tokens = useTokens();
  const auctions = useAuctions();
  const [open, setOpen] = useState(false);
  const [auctionId, setAuctionId] = useState<string>("");
  const [type, setType] = useState<TokenType>("View Only");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const eligible = useMemo(
    () => auctions.filter((a) => ["Approved", "Published", "Live"].includes(a.status)),
    [auctions],
  );

  function generate() {
    if (!auctionId || !expiresAt) return toast.error("Auction and expiry are required.");
    createToken({ auctionId, type, expiresAt: new Date(expiresAt).toISOString() });
    toast.success("Token generated.");
    setOpen(false);
    setAuctionId(""); setType("View Only"); setExpiresAt("");
  }

  function copy(link: string) {
    navigator.clipboard.writeText(link);
    toast.success("Link copied.");
  }

  return (
    <>
      <PageHeader
        title="Token Manager"
        description="Issue shareable, expirable access links to specific auctions."
        actions={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Generate Token
          </Button>
        }
      />

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 font-semibold">Token</th>
                <th className="px-5 py-3 font-semibold">Linked Auction</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Expiry</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">No tokens yet.</td></tr>}
              {tokens.map((t) => {
                const tone = tokenStatusTone(t.status);
                const link = tokenShareLink(t);
                return (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-5 py-4 font-mono text-xs">
                      <div className="font-semibold text-foreground">{t.token}</div>
                      <div className="text-muted-foreground">{t.id}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">{t.auctionId}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${t.type === "Can Bid" ? "bg-primary/10 text-primary ring-primary/20" : "bg-muted text-muted-foreground ring-border"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{new Date(t.expiresAt).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
                        <span className={`h-1 w-1 rounded-full ${tone.dot}`} /> {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(link)}>
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </Button>
                      {t.status === "Active" && (
                        <Button size="sm" variant="outline" className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50" onClick={() => { revokeToken(t.id); toast.success("Token revoked."); }}>
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-accent" /> Generate Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Auction</label>
              <Select value={auctionId} onValueChange={setAuctionId}>
                <SelectTrigger><SelectValue placeholder="Select an auction…" /></SelectTrigger>
                <SelectContent>
                  {eligible.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.id} — {a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as TokenType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="View Only">View Only</SelectItem>
                  <SelectItem value="Can Bid">Can Bid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expiry</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={generate} className="gap-1.5"><Plus className="h-4 w-4" /> Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}