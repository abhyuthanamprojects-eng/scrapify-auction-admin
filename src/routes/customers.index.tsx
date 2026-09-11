import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import {
  ChipTabs,
  DataTable,
  FilterSelect,
  StatCard,
  StatusPill,
  type Column,
} from "@/components/ops/ops-ui";
import { Button } from "@/components/ui/button";
import { useVendors, type Vendor } from "@/lib/vendors-store";
import { RefreshCw, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/customers/")({
  head: () => ({ meta: [{ title: "Customers — Scrapify Operations Console" }] }),
  component: CustomersIndex,
});

const TABS = ["All", "Approved", "Pending", "Rejected", "Suspended"] as const;
type Tab = (typeof TABS)[number];

function CustomersIndex() {
  const navigate = useNavigate();
  const { vendors, loading, error, refetch } = useVendors();
  const [tab, setTab] = useState<Tab>("All");
  const [location, setLocation] = useState("All");
  const [role, setRole] = useState("All");
  const [search, setSearch] = useState("");

  const locations = useMemo(
    () => Array.from(new Set(vendors.map((vendor) => vendor.location).filter(Boolean))).sort(),
    [vendors],
  );
  const roles = useMemo(
    () => Array.from(new Set(vendors.map((vendor) => vendor.userRole).filter(Boolean))).sort(),
    [vendors],
  );
  const pending = vendors.filter(
    (vendor) => vendor.status === "Pending" || vendor.status === "Draft",
  ).length;
  const approved = vendors.filter((vendor) => vendor.status === "Approved").length;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (
        tab !== "All" &&
        (tab === "Pending" ? !["Pending", "Draft"].includes(vendor.status) : vendor.status !== tab)
      )
        return false;
      if (location !== "All" && vendor.location !== location) return false;
      if (role !== "All" && vendor.userRole !== role) return false;
      if (
        term &&
        ![
          vendor.companyName,
          vendor.tradeName,
          vendor.contactName,
          vendor.email,
          vendor.code,
          vendor.gstNumber,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term),
        )
      )
        return false;
      return true;
    });
  }, [vendors, tab, location, role, search]);

  const columns: Column<Vendor>[] = [
    {
      key: "name",
      header: "Customer / Business",
      render: (vendor) => (
        <div>
          <p className="font-medium leading-tight">
            {vendor.companyName || vendor.contactName || "Unnamed business"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {vendor.code} · {vendor.contactName || "No contact"}
          </p>
        </div>
      ),
      sortValue: (vendor) => vendor.companyName,
    },
    {
      key: "role",
      header: "Type",
      render: (vendor) => <span className="capitalize">{vendor.userRole}</span>,
      sortValue: (vendor) => vendor.userRole,
    },
    {
      key: "status",
      header: "Status",
      render: (vendor) => <StatusPill value={vendor.status} />,
      sortValue: (vendor) => vendor.status,
    },
    {
      key: "business",
      header: "Business",
      render: (vendor) => (
        <div>
          <p>{vendor.businessType || "—"}</p>
          <p className="text-[11px] text-muted-foreground">
            {vendor.gstNumber || "GST not provided"}
          </p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (vendor) => vendor.location || "—",
      sortValue: (vendor) => vendor.location,
    },
    {
      key: "contact",
      header: "Contact",
      render: (vendor) => (
        <div>
          <p>{vendor.email || "—"}</p>
          <p className="text-[11px] text-muted-foreground">
            {vendor.phone || "Phone not provided"}
          </p>
        </div>
      ),
    },
    {
      key: "kyb",
      header: "KYB",
      render: (vendor) =>
        vendor.canBid ? (
          <span className="text-emerald-600">Eligible</span>
        ) : (
          <span className="text-amber-600">Review pending</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <PageHeader
          title="Customers & Vendors"
          description="Real buyer and seller businesses from the platform API, with KYB and account status."
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void refetch()}
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
          <Button asChild className="gradient-gold text-primary gap-2 font-bold">
            <Link to="/users/new" search={{ mode: "customer" }}>
              <UserPlus className="h-4 w-4" />
              Add Buyer / Seller
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Businesses" value={vendors.length} />
        <StatCard label="Approved" value={approved} tone="good" />
        <StatCard label="Pending KYB" value={pending} tone="warn" />
        <StatCard
          label="Seller accounts"
          value={vendors.filter((vendor) => vendor.userRole === "seller").length}
        />
        <StatCard
          label="Buyer accounts"
          value={vendors.filter((vendor) => vendor.userRole === "buyer").length}
        />
      </div>
      {error ? (
        <div className="card-premium flex items-center justify-between gap-4 p-5 text-sm text-destructive">
          <span>Unable to load customer/vendor records: {error.message}</span>
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="card-premium p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search business, contact, GST, code…"
                className="pl-9"
              />
            </div>
          </div>
          <DataTable
            rows={rows}
            columns={columns}
            exportName="customers-vendors"
            onRowClick={(vendor) => navigate({ to: "/vendors/$id", params: { id: vendor.code } })}
            toolbar={
              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  label="Location"
                  value={location}
                  options={locations}
                  onChange={setLocation}
                />
                <FilterSelect label="Type" value={role} options={roles} onChange={setRole} />
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
