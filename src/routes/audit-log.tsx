import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Search, ScrollText } from "lucide-react";
import { auditToCSV, seedAuditLog } from "@/lib/auctions-store";
import { toast } from "sonner";

export const Route = createFileRoute("/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log — Scrapify Admin" },
      { name: "description", content: "Immutable timeline of every admin action." },
      { property: "og:title", content: "Audit Log — Scrapify Admin" },
      { property: "og:description", content: "Immutable timeline of every admin action." },
    ],
  }),
  component: AuditLog,
});

function AuditLog() {
  const all = useMemo(() => seedAuditLog(), []);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"Admin" | "Super Admin" | "all">("all");

  const rows = useMemo(() => {
    let list = all;
    if (role !== "all") list = list.filter((r) => r.role === role);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (r) => r.action.toLowerCase().includes(t) || r.user.toLowerCase().includes(t) || r.ip.includes(t),
      );
    }
    return list;
  }, [all, q, role]);

  function exportCsv() {
    const csv = auditToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scrapify-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported.");
  }

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Immutable, read-only trail of every action taken across the admin suite."
        actions={
          <Button onClick={exportCsv} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="card-premium p-4 mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-9 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, user or IP…" className="pl-9" />
          </div>
          <div className="md:col-span-3">
            <Select value={role} onValueChange={(v) => setRole(v as "Admin" | "Super Admin" | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No entries match these filters.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-5 py-4 text-xs text-muted-foreground">{new Date(r.at).toLocaleString()}</td>
                  <td className="px-5 py-4 font-medium">{r.user}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${r.role === "Super Admin" ? "bg-primary/10 text-primary ring-primary/20" : "bg-muted text-muted-foreground ring-border"}`}>
                      {r.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <ScrollText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{r.action}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/60 text-xs text-muted-foreground bg-muted/20">
          Showing <span className="font-semibold text-foreground">{rows.length}</span> of {all.length} entries · read-only
        </div>
      </div>
    </>
  );
}