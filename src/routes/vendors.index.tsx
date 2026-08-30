import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, Search, ShieldCheck } from "lucide-react";
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

// NOTE (client verification pending):
// "Material Interest" and "License" fields are captured on the admin Vendors module only.
// Confirm with client whether these should also appear on the bidder-facing registration
// form, since they are not currently part of that flow.

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors — Scrapify Admin" },
      { name: "description", content: "Registered vendor database, KYC review and approvals." },
      { property: "og:title", content: "Vendors — Scrapify Admin" },
      { property: "og:description", content: "Registered vendor database, KYC review and approvals." },
    ],
  }),
  component: VendorsList,
});

type TabKey = "pending" | "approved" | "rejected" | "all";
const TABS: Array<{ id: TabKey; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function VendorsList() {
  const vendors = useVendors();
  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");
  const [material, setMaterial] = useState<MaterialCategory | "all">("all");
  const [location, setLocation] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");

  const locations = useMemo(() => Array.from(new Set(vendors.map((v) => v.location))).sort(), [vendors]);

  const counts = useMemo(
    () => ({
      pending: vendors.filter((v) => v.status === "Pending").length,
      approved: vendors.filter((v) => v.status === "Approved" || v.status === "Suspended").length,
      rejected: vendors.filter((v) => v.status === "Rejected").length,
      all: vendors.length,
    }),
    [vendors],
  );

  const rows = useMemo(() => {
    let list = vendors;
    if (tab === "pending") list = list.filter((v) => v.status === "Pending");
    else if (tab === "approved") list = list.filter((v) => v.status === "Approved" || v.status === "Suspended");
    else if (tab === "rejected") list = list.filter((v) => v.status === "Rejected");

    if (statusFilter !== "all") list = list.filter((v) => v.status === statusFilter);
    if (material !== "all") list = list.filter((v) => v.materialInterest.includes(material));
    if (location !== "all") list = list.filter((v) => v.location === location);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (v) => v.companyName.toLowerCase().includes(t) || v.email.toLowerCase().includes(t),
      );
    }
    return list;
  }, [vendors, tab, statusFilter, material, location, q]);

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
        title="Vendors"
        description="Registered vendors, KYC review and post-approval management."
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ring-1 ${
              tab === t.id
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-background text-muted-foreground ring-border hover:text-foreground"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-semibold ${
                tab === t.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="card-premium p-4 mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by company name or email…"
              className="pl-9"
            />
          </div>
          <div className="md:col-span-3">
            <Select value={material} onValueChange={(v) => setMaterial(v as MaterialCategory | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Material interest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All materials</SelectItem>
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
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VendorStatus | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
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
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">GST Number</th>
                <th className="px-5 py-3 font-semibold">Material Interest</th>
                <th className="px-5 py-3 font-semibold">License</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-muted-foreground">
                    No vendors match these filters.
                  </td>
                </tr>
              )}
              {rows.map((v) => (
                <VendorRow key={v.id} v={v} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/60 text-xs text-muted-foreground bg-muted/20">
          Showing <span className="font-semibold text-foreground">{rows.length}</span> of {vendors.length} vendors
        </div>
      </div>
    </>
  );
}

function VendorRow({ v }: { v: Vendor }) {
  return (
    <tr className="border-t border-border/60 hover:bg-muted/30 transition-colors">
      <td className="px-5 py-4">
        <div className="font-medium text-foreground">{v.companyName}</div>
        <div className="text-xs text-muted-foreground">{v.id}</div>
      </td>
      <td className="px-5 py-4 text-muted-foreground">{v.location}</td>
      <td className="px-5 py-4 text-foreground">{v.contactName}</td>
      <td className="px-5 py-4 text-muted-foreground">{v.email}</td>
      <td className="px-5 py-4 font-mono text-xs">{v.gstNumber}</td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {v.materialInterest.slice(0, 2).map((m) => (
            <MaterialChip key={m} m={m} />
          ))}
          {v.materialInterest.length > 2 && (
            <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium">
              +{v.materialInterest.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4 font-mono text-xs">{v.licenseNumber}</td>
      <td className="px-5 py-4">
        <VendorStatusBadge status={v.status} />
      </td>
      <td className="px-5 py-4 text-right">
        {v.status === "Pending" ? (
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/vendors/$id" params={{ id: v.id }}>
              <ShieldCheck className="h-3.5 w-3.5" /> Review
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/vendors/$id" params={{ id: v.id }}>Open</Link>
          </Button>
        )}
      </td>
    </tr>
  );
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const t = vendorStatusTone(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {status}
    </span>
  );
}

export function MaterialChip({ m }: { m: MaterialCategory }) {
  const map: Record<MaterialCategory, string> = {
    Ferrous: "bg-primary/10 text-primary ring-primary/20",
    "Non-Ferrous": "bg-accent/10 text-accent ring-accent/30",
    "E-Waste": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Paper: "bg-slate-100 text-slate-700 ring-slate-200",
    Plastic: "bg-sky-50 text-sky-700 ring-sky-200",
    Rubber: "bg-stone-100 text-stone-700 ring-stone-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[m]}`}>
      {m}
    </span>
  );
}