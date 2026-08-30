import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Layers,
  FileCode2,
  Percent,
  Bell,
  Scale,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";
import { DataTable, Section, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";

export const Route = createFileRoute("/configuration")({
  head: () => ({
    meta: [
      { title: "Platform Configuration & Template Engine — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Manage generic categories, dynamic attributes, auction templates, RFx templates, terms, tax profiles, and scoring rules.",
      },
      { property: "og:title", content: "Platform Configuration | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Centrally configure multi-category auction rules, templates, and operational policies.",
      },
    ],
  }),
  component: ConfigurationPage,
});

type ConfigTab =
  | "Categories & Attributes"
  | "Auction Templates"
  | "RFx Templates"
  | "Terms & Integrity Pacts"
  | "Tax & TCS Profiles"
  | "Scoring & Ranking Rules"
  | "Notification Rules";

type CategoryItem = {
  id: string;
  name: string;
  subcategories: string[];
  attributesCount: number;
  documentsRequired: string[];
  defaultFormat: string;
  status: "Active" | "Draft";
};

type AuctionTemplate = {
  id: string;
  name: string;
  direction: "Forward" | "Reverse";
  format: string;
  defaultIncrement: string;
  antiSnipe: string;
  minParticipants: number;
  emdBasis: string;
};

const CATEGORIES_DATA: CategoryItem[] = [
  { id: "CAT-01", name: "Scrap & Heavy Metals", subcategories: ["Ferrous", "Non-Ferrous", "Alloy Steel", "Copper Cables"], attributesCount: 8, documentsRequired: ["CPCB Consent", "Pollution Clearance", "GSTIN"], defaultFormat: "English Forward", status: "Active" },
  { id: "CAT-02", name: "Logistics & Transport Lanes", subcategories: ["Primary Freight", "Secondary Distribution", "Dedicated Fleet"], attributesCount: 10, documentsRequired: ["All-India Permit", "Transit Insurance", "Fleet RC"], defaultFormat: "Reverse English", status: "Active" },
  { id: "CAT-03", name: "Machinery & Heavy Plant", subcategories: ["CNC Machines", "Generators", "Boilers", "Earthmovers"], attributesCount: 12, documentsRequired: ["Ownership Proof", "Load Test Certificate"], defaultFormat: "Forward English", status: "Active" },
  { id: "CAT-04", name: "Facility Management", subcategories: ["Housekeeping", "Security Services", "MEP Maintenance"], attributesCount: 9, documentsRequired: ["EPF & ESIC Clearance", "PSARA License", "ISO 45001"], defaultFormat: "Two-Stage RFP", status: "Active" },
  { id: "CAT-05", name: "Manpower Contracts", subcategories: ["Skilled ITI", "Semi-skilled Operators", "Warehouse Staff"], attributesCount: 7, documentsRequired: ["Labour License", "Statutory Minimum Wage Affidavit"], defaultFormat: "Japanese / Clock", status: "Active" },
  { id: "CAT-06", name: "IT Hardware & Telecom", subcategories: ["Laptops", "Servers", "Networking Gear", "Printers"], attributesCount: 6, documentsRequired: ["OEM Authorization", "E-waste Asset Certificate"], defaultFormat: "Reverse RFQ", status: "Active" },
  { id: "CAT-07", name: "Civil Works & Infra", subcategories: ["Road Repair", "Shed Fabrication", "Piping"], attributesCount: 14, documentsRequired: ["Contractor Class A License", "Work Completion Certificates"], defaultFormat: "Two-Stage RFP", status: "Active" },
  { id: "CAT-08", name: "Raw Materials & Commodities", subcategories: ["Polymers", "Coal", "Steel Billets", "Chemicals"], attributesCount: 11, documentsRequired: ["MSDS Sheet", "COA Certificate of Analysis"], defaultFormat: "Reverse Clock", status: "Active" },
];

const AUCTION_TEMPLATES_DATA: AuctionTemplate[] = [
  { id: "TMPL-01", name: "Forward Asset & Scrap Sale", direction: "Forward", format: "English Dynamic", defaultIncrement: "₹10,000 / MT", antiSnipe: "3 mins on T-3m", minParticipants: 3, emdBasis: "5% of Reserve" },
  { id: "TMPL-02", name: "Annual Primary Freight Procurement", direction: "Reverse", format: "English Reverse", defaultIncrement: "₹500 / trip", antiSnipe: "5 mins on T-3m", minParticipants: 4, emdBasis: "₹2,00,000 Fixed" },
  { id: "TMPL-03", name: "Pan-India Facility Management RFP", direction: "Reverse", format: "Two-Envelope RFP", defaultIncrement: "₹50,000 / site", antiSnipe: "None (Sealed)", minParticipants: 3, emdBasis: "₹5,00,000 Escrow" },
  { id: "TMPL-04", name: "Plant Machinery Liquidation", direction: "Forward", format: "Sealed Bid + BAFO", defaultIncrement: "₹25,000", antiSnipe: "10 mins BAFO", minParticipants: 2, emdBasis: "10% of Start Price" },
  { id: "TMPL-05", name: "Contract Manpower Rate Tender", direction: "Reverse", format: "Japanese Clock Auction", defaultIncrement: "₹1,000 / month", antiSnipe: "2 min Interval", minParticipants: 3, emdBasis: "₹3,00,000" },
];

function ConfigurationPage() {
  const [tab, setTab] = useState<ConfigTab>("Categories & Attributes");
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORIES_DATA);
  const [templates, setTemplates] = useState<AuctionTemplate[]>(AUCTION_TEMPLATES_DATA);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newSubcats, setNewSubcats] = useState("");
  const [newFormat, setNewFormat] = useState("English Forward");

  const categoryColumns: Column<CategoryItem>[] = [
    { key: "id", header: "Code", render: (c) => <span className="font-mono text-xs text-muted-foreground">{c.id}</span> },
    { key: "name", header: "Category Name", render: (c) => <span className="font-bold text-foreground">{c.name}</span>, sortValue: (c) => c.name },
    { key: "sub", header: "Subcategories", render: (c) => <span className="text-xs text-muted-foreground">{c.subcategories.join(", ")}</span> },
    { key: "attrs", header: "Dynamic Attributes", render: (c) => <span className="font-mono text-xs font-semibold">{c.attributesCount} Fields</span> },
    { key: "docs", header: "Mandatory KYB Documents", render: (c) => <span className="text-xs text-primary">{c.documentsRequired.join(" • ")}</span> },
    { key: "format", header: "Default Format", render: (c) => <span className="text-xs font-medium">{c.defaultFormat}</span> },
    { key: "status", header: "Status", render: (c) => <StatusPill value={c.status} /> },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info(`Editing schema for ${c.name}`)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" /> Schema
          </Button>
        </div>
      ),
    },
  ];

  const templateColumns: Column<AuctionTemplate>[] = [
    { key: "id", header: "ID", render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.id}</span> },
    { key: "name", header: "Template Name", render: (t) => <span className="font-bold text-foreground">{t.name}</span>, sortValue: (t) => t.name },
    {
      key: "direction",
      header: "Direction",
      render: (t) => <StatusPill value={t.direction === "Forward" ? "Forward" : "Reverse"} />,
    },
    { key: "format", header: "Auction Engine", render: (t) => <span className="text-xs font-medium">{t.format}</span> },
    { key: "inc", header: "Tick Step", render: (t) => <span className="font-mono text-xs font-bold">{t.defaultIncrement}</span> },
    { key: "anti", header: "Anti-Snipe Buffer", render: (t) => <span className="text-xs text-accent font-medium">{t.antiSnipe}</span> },
    { key: "min", header: "Min Vendors", render: (t) => <span className="font-mono text-xs">{t.minParticipants}</span> },
    { key: "emd", header: "EMD Policy", render: (t) => <span className="text-xs font-semibold">{t.emdBasis}</span> },
  ];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newEntry: CategoryItem = {
      id: `CAT-0${categories.length + 1}`,
      name: newCatName.trim(),
      subcategories: newSubcats.split(",").map((s) => s.trim()).filter(Boolean),
      attributesCount: 8,
      documentsRequired: ["GSTIN", "Standard KYB"],
      defaultFormat: newFormat,
      status: "Active",
    };
    setCategories([...categories, newEntry]);
    setCatModalOpen(false);
    setNewCatName("");
    setNewSubcats("");
    toast.success(`Category "${newEntry.name}" created with default dynamic attribute schemas.`);
  };

  return (
    <>
      <PageHeader
        title="Platform Configuration"
        description="Configure generic categories, category-driven attribute schemas, auction templates, RFx scoring rules, tax profiles, and notification matrices."
        actions={
          <Button size="sm" onClick={() => setCatModalOpen(true)} className="gradient-gold text-primary shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Category Schema
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Configured Categories" value={categories.length} icon={Layers} />
        <StatCard label="Auction Templates" value={templates.length} icon={FileCode2} />
        <StatCard label="Active Tax Profiles" value="GST 18% + TCS 1%" icon={Percent} />
        <StatCard label="Compliance Rules" value="100% SOC2 Enforced" icon={ShieldCheck} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border/70 pb-2">
        {(
          [
            "Categories & Attributes",
            "Auction Templates",
            "RFx Templates",
            "Terms & Integrity Pacts",
            "Tax & TCS Profiles",
            "Scoring & Ranking Rules",
            "Notification Rules",
          ] as ConfigTab[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Categories & Attributes" && (
        <Section title={`Configured Sourcing Categories (${categories.length})`} description="Dynamic attribute schemas determine lot inputs, technical qualifications, and required KYB certificates per industry sector.">
          <DataTable data={categories} columns={categoryColumns} searchPlaceholder="Search categories, subcategories, or required documents..." />
        </Section>
      )}

      {tab === "Auction Templates" && (
        <Section title={`Standard Auction & Sourcing Templates (${templates.length})`} description="Pre-configured commercial parameters, anti-sniping buffers, EMD security deposits, and participant thresholds.">
          <DataTable data={templates} columns={templateColumns} searchPlaceholder="Search templates or auction engines..." />
        </Section>
      )}

      {tab === "RFx Templates" && (
        <div className="space-y-4">
          <Section title="Standard RFx Questionnaire Templates" description="Technical and commercial evaluation packages applied to RFQ, RFI, and RFP sourcing events.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Statutory & Tax Compliance Pack", sections: 3, questions: 12, weight: "30%", mandatory: true },
                { title: "Logistics Fleet & Driver SLA Evaluation", sections: 4, questions: 16, weight: "40%", mandatory: true },
                { title: "OHSAS & ISO 45001 Safety Management", sections: 3, questions: 10, weight: "30%", mandatory: false },
                { title: "IT Infrastructure & Security Controls", sections: 5, questions: 22, weight: "50%", mandatory: true },
                { title: "Plant Demolition & Hazardous Scrap Protocol", sections: 4, questions: 14, weight: "35%", mandatory: true },
              ].map((r, i) => (
                <div key={i} className="card-premium p-4 rounded-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-bold text-sm text-foreground">{r.title}</span>
                    <span className="font-mono text-xs font-bold text-accent">{r.weight}</span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <p>Sections: <strong className="text-foreground">{r.sections}</strong> • Questions: <strong className="text-foreground">{r.questions}</strong></p>
                    <p>Status: <strong className="text-primary">{r.mandatory ? "Mandatory Gate" : "Scoring Only"}</strong></p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info(`Viewing questions for ${r.title}`)}>
                      Configure Questions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "Terms & Integrity Pacts" && (
        <Section title="Enterprise Legal & Integrity Templates" description="Standardized auction terms, lifting pacts, and bidder integrity undertakings.">
          <div className="space-y-3 text-xs">
            {[
              { code: "PACT-FWD-01", name: "Standard As-Is-Where-Is Forward Scrap Disposal Pact (v3.2)", applied: "52 Events", lastUpdated: "15-Aug-2026" },
              { code: "PACT-REV-02", name: "Annual Logistics Rate Contract & Fuel Escalation Clause (v2.4)", applied: "38 Events", lastUpdated: "10-Aug-2026" },
              { code: "PACT-RFP-03", name: "Integrated Facility Management SLA & Liquidated Damages (v1.9)", applied: "19 Events", lastUpdated: "02-Aug-2026" },
              { code: "PACT-MAN-04", name: "Statutory Minimum Wage Guarantee & EPF/ESIC Indemnity (v4.0)", applied: "24 Events", lastUpdated: "22-Jul-2026" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between card-premium p-3.5 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-xs">{p.code}</span>
                    <span className="font-semibold text-foreground text-sm">{p.name}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">Applied across {p.applied} • Last revised on {p.lastUpdated}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.info(`Viewing legal clauses for ${p.code}`)}>
                  View Clauses
                </Button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "Tax & TCS Profiles" && (
        <Section title="Tax Profiles & Statutory TCS Computation" description="Automated tax determination applied to post-auction settlement ledgers and invoices.">
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="card-premium p-4 rounded-xl">
              <span className="font-bold text-sm text-foreground">Industrial Scrap (Forward)</span>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>GST Rate: <strong className="text-foreground">18.0%</strong></p>
                <p>TCS (Section 206C): <strong className="text-foreground">1.0%</strong></p>
                <p>Reverse Charge: <strong>No (Forward Sale)</strong></p>
              </div>
            </div>
            <div className="card-premium p-4 rounded-xl">
              <span className="font-bold text-sm text-foreground">Freight & Logistics (Reverse)</span>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>GST Rate: <strong className="text-foreground">5.0% (RCM) or 12.0% (FCM)</strong></p>
                <p>TCS: <strong>Not Applicable</strong></p>
                <p>TDS (Section 194C): <strong className="text-foreground">1.0% (Ind) / 2.0% (Co)</strong></p>
              </div>
            </div>
            <div className="card-premium p-4 rounded-xl">
              <span className="font-bold text-sm text-foreground">Service Contracts & Manpower</span>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>GST Rate: <strong className="text-foreground">18.0%</strong></p>
                <p>TDS (Section 194J / 194C): <strong className="text-foreground">2.0% to 10.0%</strong></p>
                <p>EPF/ESIC Verification: <strong className="text-primary">Mandatory Pre-Payout</strong></p>
              </div>
            </div>
          </div>
        </Section>
      )}

      {tab === "Scoring & Ranking Rules" && (
        <Section title="Vendor Tier & Ranking Configuration" description="Mathematical parameters driving automated supplier tiers (A Preferred, B Established, C Standard, D Watchlist).">
          <div className="space-y-3 text-xs">
            <div className="card-premium p-4 rounded-xl">
              <div className="flex justify-between font-bold text-sm text-foreground mb-2">
                <span>Tier A (Preferred Supplier)</span>
                <span className="text-primary font-mono">Score 90 – 100</span>
              </div>
              <p className="text-muted-foreground">Requirements: &gt;10 Completed events, 0 defaults in 24 months, &gt;98% on-time fulfilment SLA, 100% compliance validity. Unlocks instant EMD exemption up to ₹10 Lakhs.</p>
            </div>
            <div className="card-premium p-4 rounded-xl">
              <div className="flex justify-between font-bold text-sm text-foreground mb-2">
                <span>Tier B (Established Supplier)</span>
                <span className="text-primary font-mono">Score 75 – 89</span>
              </div>
              <p className="text-muted-foreground">Requirements: &gt;3 Completed events, 0 defaults, &gt;90% fulfilment SLA, valid statutory licenses. Standard EMD deposit required.</p>
            </div>
            <div className="card-premium p-4 rounded-xl">
              <div className="flex justify-between font-bold text-sm text-foreground mb-2">
                <span>Tier D (Watchlist / Suspended)</span>
                <span className="text-destructive font-mono">Score &lt; 50 or Default Flag</span>
              </div>
              <p className="text-muted-foreground">Triggered on: Winner payment default, anti-sniping collusion alert, or expired pollution consent. Requires admin reinstatement.</p>
            </div>
          </div>
        </Section>
      )}

      {tab === "Notification Rules" && (
        <Section title="Platform Notification & Webhook Engine" description="Event-driven dispatch triggers across Email, SMS, WhatsApp, and In-App push.">
          <div className="space-y-2 text-xs">
            {[
              { event: "Auction Live Broadcast", channels: "Email, Push, In-App", timing: "Real-time at T-0", target: "All Invited Vendors" },
              { event: "Outbid & Lead Price Change", channels: "SMS, Push, In-App", timing: "&lt; 50ms latency", target: "Outbid Participant" },
              { event: "Anti-Sniping Overtime Triggered", channels: "In-App Bidding Stream", timing: "Instantaneous", target: "Live Bidding Room" },
              { event: "Award Approval Escalation", channels: "Email + Actionable Link", timing: "At auction conclusion", target: "L1/L2 Approvers" },
              { event: "Winner Default Alert", channels: "Signed Notice + Email", timing: "At T+48 hours default", target: "Vendor, Finance, CPO" },
            ].map((n, idx) => (
              <div key={idx} className="flex items-center justify-between card-premium p-3 rounded-lg">
                <div>
                  <strong className="text-foreground">{n.event}</strong>
                  <div className="text-muted-foreground">Trigger: {n.timing} • Target: {n.target}</div>
                </div>
                <span className="rounded bg-muted px-2.5 py-1 font-semibold text-primary">{n.channels}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Add Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateCategory} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-base font-bold">Create Generic Sourcing Category</h3>
              <button type="button" onClick={() => setCatModalOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 text-xs space-y-3">
              <div>
                <label className="font-semibold text-muted-foreground">Category Name *</label>
                <Input
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Aviation Spares, Marine Fuel, Solar Equipment..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground">Subcategories (comma separated)</label>
                <Input
                  value={newSubcats}
                  onChange={(e) => setNewSubcats(e.target.value)}
                  placeholder="e.g. Turbines, Avionics, Hydraulic Systems"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground">Suggested Auction Format</label>
                <select
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs"
                >
                  <option value="English Forward">English Forward</option>
                  <option value="Reverse English">Reverse English</option>
                  <option value="Two-Stage RFP">Two-Stage RFP</option>
                  <option value="Japanese / Clock">Japanese / Clock</option>
                  <option value="Sealed Bid + BAFO">Sealed Bid + BAFO</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setCatModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gradient-gold text-primary font-bold">
                Create Category Schema
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
