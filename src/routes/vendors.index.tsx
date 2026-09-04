import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Download, Eye, FileText, Filter, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  MATERIAL_CATEGORIES,
  useVendors,
  vendorStatusTone,
  vendorsToCSV,
  type MaterialCategory,
  type Vendor,
  type VendorStatus,
} from "@/lib/vendors-store";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors & KYC — Scrapify Admin Console" },
      { name: "description", content: "Registered vendor database, KYC review, document verification, and approvals." },
    ],
  }),
  component: VendorsList,
});

type TabKey = "pending" | "approved" | "rejected" | "suspended" | "all";
const TABS: Array<{ id: TabKey; label: string }> = [
  { id: "pending", label: "Pending Verification" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "suspended", label: "Suspended" },
  { id: "all", label: "All Records" },
];

function VendorsList() {
  const { vendors, loading } = useVendors();
  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [material, setMaterial] = useState<MaterialCategory | "all">("all");
  const [location, setLocation] = useState<string>("all");

  const locations = useMemo(() => Array.from(new Set(vendors.map((v) => v.location).filter(Boolean))).sort(), [vendors]);

  const counts = useMemo(
    () => ({
      pending: vendors.filter((v) => v.status === "Pending" || v.status === "Draft").length,
      approved: vendors.filter((v) => v.status === "Approved").length,
      rejected: vendors.filter((v) => v.status === "Rejected").length,
      suspended: vendors.filter((v) => v.status === "Suspended").length,
      all: vendors.length,
    }),
    [vendors],
  );

  const rows = useMemo(() => {
    let list = vendors;
    if (tab === "pending") list = list.filter((v) => v.status === "Pending" || v.status === "Draft");
    else if (tab === "approved") list = list.filter((v) => v.status === "Approved");
    else if (tab === "rejected") list = list.filter((v) => v.status === "Rejected");
    else if (tab === "suspended") list = list.filter((v) => v.status === "Suspended");

    if (roleFilter !== "all") list = list.filter((v) => v.userRole === roleFilter);
    if (material !== "all") list = list.filter((v) => v.materialInterest.includes(material));
    if (location !== "all") list = list.filter((v) => v.location === location);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.companyName.toLowerCase().includes(t) ||
          v.email.toLowerCase().includes(t) ||
          v.gstNumber.toLowerCase().includes(t) ||
          v.code.toLowerCase().includes(t)
      );
    }
    return list;
  }, [vendors, tab, roleFilter, material, location, q]);

  function exportCsv() {
    const csv = vendorsToCSV(vendors);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scrapify-vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Vendors &amp; KYC Verification"
        description="Comprehensive enterprise dossier verification, GSTIN cross-checks, penny-drop validation, and KYC decisions."
        actions={
          <Button onClick={exportCsv} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all border ${
              tab === t.id
                ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 shadow-sm"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold ${
                tab === t.id ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="card-premium p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filter &amp; Search Dossiers
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by company, email, GSTIN, code..."
              className="pl-9"
            />
          </div>

          <div className="md:col-span-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles (Buyers &amp; Sellers)</SelectItem>
                <SelectItem value="buyer">Buyers Only</SelectItem>
                <SelectItem value="seller">Sellers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select value={material} onValueChange={(v) => setMaterial(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Material Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {MATERIAL_CATEGORIES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/80">
                <th className="px-4 py-3 font-semibold">Vendor Code</th>
                <th className="px-4 py-3 font-semibold">Company &amp; Legal Entity</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">GSTIN / PAN</th>
                <th className="px-4 py-3 font-semibold text-center">Docs</th>
                <th className="px-4 py-3 font-semibold text-center">KYC Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Loading vendor dossiers...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No vendor records match the selected filter.
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <tr key={v.id} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">{v.code}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/vendors/$id"
                        params={{ id: v.code }}
                        className="font-bold text-foreground hover:text-amber-500 hover:underline"
                      >
                        {v.companyName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{v.location || v.businessType || "India"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {v.userRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-foreground">{v.contactName}</div>
                      <div className="text-muted-foreground font-mono">{v.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <div>{v.gstNumber || "—"}</div>
                      <div className="text-muted-foreground">{v.panNumber || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-muted">
                        <FileText className="h-3 w-3 text-muted-foreground" /> {v.documents.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <VendorStatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                        <Link to="/vendors/$id" params={{ id: v.code }}>
                          <Eye className="h-3.5 w-3.5" /> Inspect
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${vendorStatusTone(status)}`}>
      {status.toUpperCase()}
    </Badge>
  );
}

export function MaterialChip({ m }: { m: MaterialCategory }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border">
      {m}
    </span>
  );
}