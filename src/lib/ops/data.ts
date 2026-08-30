/**
 * Central mock dataset for the Super Admin & Auction Operations Console.
 * Deterministic (seeded) so every module cross-links to the same records.
 */

/* ---------------- deterministic random ---------------- */
function mulberry(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(20260829);
const pick = <T,>(arr: readonly T[], r = rnd()) => arr[Math.floor(r * arr.length) % arr.length];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const money = (min: number, max: number) => Math.round((rnd() * (max - min) + min) / 1000) * 1000;

export const NOW = new Date("2026-08-29T11:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const inHours = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();

export const fmtMoney = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function ageHours(iso: string) {
  return Math.max(0, Math.round((NOW.getTime() - new Date(iso).getTime()) / 3600_000));
}
export function ageLabel(iso: string) {
  const h = ageHours(iso);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}
export function countdown(iso: string) {
  const ms = new Date(iso).getTime() - NOW.getTime();
  if (ms <= 0) return "ended";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/* ---------------- vocabularies ---------------- */
export const CATEGORIES = [
  "Industrial Asset",
  "Scrap",
  "Commodity",
  "Vehicle",
  "Transport",
  "Warehouse",
  "Facility Services",
  "Manpower",
  "Raw Material",
  "Equipment",
  "Professional Services",
  "IT Procurement",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const EVENT_TEMPLATES = [
  "Forward Asset Sale",
  "Reverse Procurement",
  "Reverse Service Contract",
  "Transport Lane Auction",
  "Machinery Sale",
  "Commodity RFQ",
  "Contract RFP",
] as const;
export type EventTemplate = (typeof EVENT_TEMPLATES)[number];

export const EVENT_STATUSES = [
  "Draft Review",
  "Ready to Publish",
  "Scheduled",
  "Live",
  "Awaiting Decision",
  "Below Reserve",
  "Above Target",
  "Low Competition",
  "Technical Exception",
  "Payment Pending",
  "Winner Default",
  "Fulfilment Exception",
  "Disputed",
  "Closed",
  "Cancelled",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export const RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High", "Critical"];

export type Severity = "Low" | "Medium" | "High" | "Critical";

const OWNERS = ["R. Iyer", "A. Mehta", "K. Rao", "S. Nair", "P. Bhatt", "N. Verma", "D. Kulkarni"];
const CITIES = ["Mumbai", "Pune", "Chennai", "Hyderabad", "Ahmedabad", "Kolkata", "Jamshedpur", "Coimbatore", "Gurugram", "Nagpur"];

/* ---------------- customers ---------------- */
export type CustomerStatus = "Prospect" | "Onboarding" | "Active" | "Suspended" | "Inactive";

export type Facility = { id: string; name: string; city: string; type: string; contact: string };
export type CustomerUser = { id: string; name: string; email: string; role: string; lastLogin: string; status: "Active" | "Invited" | "Disabled" };
export type ApprovalTier = { tier: string; threshold: number; approver: string; sla: number };

export type Customer = {
  id: string;
  name: string;
  legalEntity: string;
  industry: string;
  status: CustomerStatus;
  city: string;
  plan: "Enterprise" | "Growth" | "Pilot";
  since: string;
  categories: Category[];
  businessUnits: string[];
  facilities: Facility[];
  users: CustomerUser[];
  approvalMatrix: ApprovalTier[];
  activeEvents: number;
  completedEvents: number;
  gmv: number;
  savings: number;
  realisation: number;
  pendingSettlement: number;
  openDisputes: number;
  healthScore: number;
  churnRisk: RiskLevel;
  csat: number;
  supportTickets: number;
  lastEvent: string;
};

const CUSTOMER_SEED: Array<[string, string, string, CustomerStatus]> = [
  ["Tata Steel Processing", "Tata Steel Processing & Distribution Ltd", "Metals", "Active"],
  ["Hindalco Industries", "Hindalco Industries Limited", "Metals", "Active"],
  ["Mahindra Logistics", "Mahindra Logistics Limited", "Logistics", "Active"],
  ["NTPC Ramagundam", "NTPC Limited — Ramagundam STPS", "Power", "Active"],
  ["Bharat Petroleum", "Bharat Petroleum Corporation Ltd", "Energy", "Active"],
  ["Godrej Appliances", "Godrej & Boyce Mfg. Co. Ltd", "Manufacturing", "Active"],
  ["Ashok Leyland", "Ashok Leyland Limited", "Automotive", "Onboarding"],
  ["Southern Railway", "Southern Railway — Salem Division", "Public Sector", "Active"],
  ["Aurobindo Pharma", "Aurobindo Pharma Limited", "Pharma", "Prospect"],
  ["Vedanta Aluminium", "Vedanta Limited — Aluminium Business", "Metals", "Suspended"],
  ["Wipro Infrastructure", "Wipro Enterprises Pvt Ltd", "Engineering", "Active"],
  ["JSW Cement", "JSW Cement Limited", "Cement", "Inactive"],
];

export const customers: Customer[] = CUSTOMER_SEED.map(([name, legal, industry, status], i) => {
  const gmv = money(18_000_000, 420_000_000);
  return {
    id: `CUS-${1001 + i}`,
    name,
    legalEntity: legal,
    industry,
    status,
    city: CITIES[i % CITIES.length],
    plan: i % 3 === 0 ? "Enterprise" : i % 3 === 1 ? "Growth" : "Pilot",
    since: daysAgo(int(120, 1400)),
    categories: [CATEGORIES[i % 12], CATEGORIES[(i + 4) % 12], CATEGORIES[(i + 7) % 12]],
    businessUnits: ["Corporate", `${name.split(" ")[0]} West`, `${name.split(" ")[0]} South`].slice(0, int(2, 3)),
    facilities: Array.from({ length: int(2, 4) }, (_, f) => ({
      id: `FAC-${1001 + i}-${f + 1}`,
      name: `${CITIES[(i + f) % CITIES.length]} ${["Plant", "Warehouse", "Yard", "Depot"][f % 4]}`,
      city: CITIES[(i + f) % CITIES.length],
      type: ["Plant", "Warehouse", "Yard", "Depot"][f % 4],
      contact: OWNERS[(i + f) % OWNERS.length],
    })),
    users: Array.from({ length: int(3, 5) }, (_, u) => ({
      id: `CUSR-${1001 + i}-${u + 1}`,
      name: `${["Anil", "Priya", "Rahul", "Meera", "Vikas"][u % 5]} ${["Sharma", "Nair", "Gupta", "Desai", "Menon"][(u + i) % 5]}`,
      email: `user${u + 1}@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      role: ["Buyer", "Approver L1", "Approver L2", "Viewer", "Finance"][u % 5],
      lastLogin: hoursAgo(int(1, 300)),
      status: u === 4 ? "Invited" : "Active",
    })),
    approvalMatrix: [
      { tier: "L1", threshold: 500_000, approver: "Category Manager", sla: 24 },
      { tier: "L2", threshold: 5_000_000, approver: "Business Head", sla: 48 },
      { tier: "L3", threshold: 50_000_000, approver: "CFO", sla: 72 },
    ],
    activeEvents: int(0, 9),
    completedEvents: int(8, 140),
    gmv,
    savings: Math.round(gmv * (0.04 + rnd() * 0.08)),
    realisation: Math.round(gmv * (0.5 + rnd() * 0.4)),
    pendingSettlement: money(0, 12_000_000),
    openDisputes: int(0, 4),
    healthScore: int(38, 97),
    churnRisk: pick(RISK_LEVELS),
    csat: Math.round((3 + rnd() * 2) * 10) / 10,
    supportTickets: int(0, 22),
    lastEvent: daysAgo(int(0, 90)),
  };
});

/* ---------------- vendors ---------------- */
export type VendorStatus = "Verified" | "Pending KYB" | "On Hold" | "Rejected" | "Suspended" | "Blacklisted";
export type VendorRank = "A Preferred" | "B Established" | "C Standard" | "D New / Watchlist";

export type ComplianceDoc = {
  id: string;
  type: string;
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  categoryScope: string;
  regionScope: string;
  file: string;
  ocrValue: string;
  enteredValue: string;
  mismatch: boolean;
  status: "Pending Verification" | "Verified" | "Rejected" | "Expired";
  verifiedBy?: string;
};

export type Vendor = {
  id: string;
  name: string;
  taxId: string;
  gst: string;
  city: string;
  status: VendorStatus;
  rank: VendorRank;
  rankScore: number;
  riskScore: number;
  categories: Category[];
  regions: string[];
  bankVerified: boolean;
  bankAccount: string;
  ifsc: string;
  bankName: string;
  submittedAt: string;
  flags: string[];
  contact: string;
  email: string;
  phone: string;
  capacity: string;
  events: number;
  wins: number;
  winRate: number;
  defaults: number;
  disputes: number;
  onTimePayment: number;
  onTimeDelivery: number;
  forfeitures: number;
  documents: ComplianceDoc[];
  notes: string[];
  suspensionHistory: Array<{ at: string; reason: string; by: string; until: string }>;
};

const VENDOR_NAMES = [
  "Meridian Metals Pvt Ltd", "Coastal Recyclers LLP", "Deccan E-Waste Solutions", "Novus Alloys Pvt Ltd",
  "Bluestone Logistics", "Kaveri Transport Services", "Orbit Facility Management", "Shakti Industrial Spares",
  "Prime Scrap Co.", "Everblue Traders", "Sunrise Commodities", "Vertex Engineering Works",
  "Ganga Metals & Alloys", "Trinity Manpower Services", "Alpine IT Systems", "Zenith Machinery Traders",
  "Sagar Shipbreakers", "Neelkanth Plastics", "Pinnacle Consulting LLP", "Ratna Steel Traders",
  "Konark Warehousing", "Bharat Cable Recyclers", "Silverline Freight", "Anand Auto Salvage",
  "Titan Equipment Rentals", "Mauryan Raw Materials", "Crestline Services", "Indus Paper Mills",
];

const DOC_TYPES = ["GST Certificate", "PAN Card", "Cancelled Cheque", "Trade Licence", "PCB Authorisation", "ISO 9001", "Factory Licence", "MSME Certificate"];

export const vendors: Vendor[] = VENDOR_NAMES.map((name, i) => {
  const status: VendorStatus =
    i % 11 === 3 ? "Pending KYB" : i % 11 === 5 ? "On Hold" : i % 11 === 7 ? "Suspended" : i % 13 === 11 ? "Blacklisted" : i % 17 === 9 ? "Rejected" : "Verified";
  const events = int(3, 90);
  const wins = int(0, Math.max(1, Math.floor(events * 0.4)));
  const rankScore = int(38, 98);
  const rank: VendorRank = rankScore > 85 ? "A Preferred" : rankScore > 68 ? "B Established" : rankScore > 52 ? "C Standard" : "D New / Watchlist";
  return {
    id: `VEN-${2001 + i}`,
    name,
    taxId: `AA${String(1000 + i)}CP${int(1, 9)}Z${int(1, 9)}`,
    gst: `${int(21, 36)}AA${String(1000 + i)}CP${int(1, 9)}Z${int(1, 9)}`,
    city: CITIES[i % CITIES.length],
    status,
    rank,
    rankScore,
    riskScore: int(4, 92),
    categories: [CATEGORIES[i % 12], CATEGORIES[(i + 5) % 12]],
    regions: [CITIES[i % CITIES.length], CITIES[(i + 3) % CITIES.length]],
    bankVerified: i % 6 !== 2,
    bankAccount: `XXXXXX${int(1000, 9999)}`,
    ifsc: `HDFC000${int(1000, 9999)}`,
    bankName: pick(["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra"]),
    submittedAt: daysAgo(int(0, 90)),
    flags: i % 5 === 0 ? ["Shared IP with VEN-2010"] : i % 7 === 0 ? ["Repeat default"] : [],
    contact: OWNERS[i % OWNERS.length],
    email: `ops@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 14)}.in`,
    phone: `+91 9${int(100000000, 899999999)}`,
    capacity: `${int(50, 1800)} MT / month`,
    events,
    wins,
    winRate: Math.round((wins / Math.max(1, events)) * 100),
    defaults: i % 9 === 0 ? int(1, 3) : 0,
    disputes: i % 6 === 0 ? int(1, 2) : 0,
    onTimePayment: int(62, 100),
    onTimeDelivery: int(58, 100),
    forfeitures: i % 12 === 0 ? int(1, 2) : 0,
    documents: DOC_TYPES.slice(0, int(4, 7)).map((t, d) => {
      const expiry = inHours(int(-2000, 9000));
      const mismatch = (i + d) % 13 === 0;
      return {
        id: `DOC-${2001 + i}-${d + 1}`,
        type: t,
        number: `${t.slice(0, 3).toUpperCase()}-${int(100000, 999999)}`,
        issuer: pick(["GSTN", "Income Tax Dept", "State PCB", "BIS", "Municipal Corp"]),
        issueDate: daysAgo(int(200, 1200)),
        expiryDate: expiry,
        categoryScope: CATEGORIES[(i + d) % 12],
        regionScope: CITIES[(i + d) % CITIES.length],
        file: `${t.replace(/\s/g, "_").toLowerCase()}.pdf`,
        ocrValue: `${t.slice(0, 3).toUpperCase()}-${int(100000, 999999)}`,
        enteredValue: `${t.slice(0, 3).toUpperCase()}-${int(100000, 999999)}`,
        mismatch,
        status:
          new Date(expiry) < NOW ? "Expired" : (i + d) % 9 === 0 ? "Pending Verification" : (i + d) % 17 === 0 ? "Rejected" : "Verified",
        verifiedBy: (i + d) % 9 === 0 ? undefined : OWNERS[(i + d) % OWNERS.length],
      } as ComplianceDoc;
    }),
    notes: i % 4 === 0 ? ["Escalated once for late pickup — resolved."] : [],
    suspensionHistory:
      status === "Suspended"
        ? [{ at: daysAgo(int(3, 40)), reason: "Winner default on AUC-2026-0031", by: "R. Iyer", until: inHours(int(200, 900)) }]
        : [],
  };
});

export const allDocuments = vendors.flatMap((v) =>
  v.documents.map((d) => ({ ...d, vendorId: v.id, vendorName: v.name })),
);
export type VendorDocument = (typeof allDocuments)[number];

export function documentBucket(d: VendorDocument) {
  if (d.status === "Rejected") return "Rejected" as const;
  if (d.status === "Pending Verification") return "Pending Verification" as const;
  const h = (new Date(d.expiryDate).getTime() - NOW.getTime()) / 3600_000;
  if (h <= 0) return "Expired" as const;
  if (h <= 24 * 7) return "Expiring 7 Days" as const;
  if (h <= 24 * 30) return "Expiring 30 Days" as const;
  if (h <= 24 * 60) return "Expiring 60 Days" as const;
  return "Verified" as const;
}

/* ---------------- events ---------------- */
export type Lot = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  basePrice: number;
  currentPrice: number;
  h1?: string;
};

export type Participant = {
  vendorId: string;
  alias: string;
  eligible: boolean;
  invited: boolean;
  accepted: boolean;
  qualified: boolean;
  documentsOk: boolean;
  securityPaid: boolean;
  termsAccepted: boolean;
  connected: boolean;
  bidCount: number;
  rank: number;
  risk: RiskLevel;
  ip: string;
  device: string;
};

export type Bid = {
  seq: number;
  alias: string;
  vendorId: string;
  amount: number;
  serverTime: string;
  status: "Accepted" | "Reversed" | "Disqualified";
  previousPrice: number;
  step: number;
  ipRisk: RiskLevel;
  device: string;
  correlationId: string;
};

export type AuctionEvent = {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  direction: "Forward" | "Reverse";
  template: EventTemplate;
  kind: "Auction" | "RFI" | "RFQ" | "RFP";
  category: Category;
  status: EventStatus;
  owner: string;
  risk: RiskLevel;
  value: number;
  reserve: number;
  currentPrice: number;
  startAt: string;
  endAt: string;
  participants: Participant[];
  bids: Bid[];
  bidCount: number;
  bidVelocity: number;
  extensions: number;
  connectionHealth: "Healthy" | "Degraded" | "Unstable";
  integrityScore: number;
  alerts: string[];
  lots: Lot[];
  emdPercent: number;
  antiSnipe: number;
  increment: number;
  termsVersion: string;
  inspection: { required: boolean; window: string; contact: string; completed: number };
  clarifications: Array<{ id: string; vendor: string; question: string; answer?: string; at: string }>;
  approvals: Array<{ tier: string; approver: string; status: "Pending" | "Approved" | "Rejected"; at?: string; sla: number }>;
  award?: {
    winner: string;
    winnerId: string;
    amount: number;
    runnerUp: string;
    runnerUpAmount: number;
    acceptanceDeadline: string;
    state: "Pending Approval" | "Approved" | "Winner Acceptance Pending" | "Accepted" | "Defaulted" | "Fallback Offered" | "Re-auction Required";
  };
  createdAt: string;
};

const EVENT_NAMES: Array<[string, Category, EventTemplate, "Forward" | "Reverse", AuctionEvent["kind"]]> = [
  ["Bare Bright Copper Wire Scrap — Lot 14", "Scrap", "Forward Asset Sale", "Forward", "Auction"],
  ["Surplus CNC Machining Centre (2019)", "Equipment", "Machinery Sale", "Forward", "Auction"],
  ["Mumbai–Nagpur FTL Lane Contract FY27", "Transport", "Transport Lane Auction", "Reverse", "Auction"],
  ["Housekeeping & Facility Services — 3 Sites", "Facility Services", "Reverse Service Contract", "Reverse", "Auction"],
  ["HR Coil Procurement — 2,400 MT", "Raw Material", "Reverse Procurement", "Reverse", "Auction"],
  ["Aluminium Ingot Supply Q3", "Commodity", "Commodity RFQ", "Reverse", "RFQ"],
  ["End-of-Life Fleet — 26 LCVs", "Vehicle", "Forward Asset Sale", "Forward", "Auction"],
  ["SAP S/4HANA Rollout Partner", "IT Procurement", "Contract RFP", "Reverse", "RFP"],
  ["Mixed Ferrous Turnings — 800 MT", "Scrap", "Forward Asset Sale", "Forward", "Auction"],
  ["Warehouse Lease — Bhiwandi 60k sqft", "Warehouse", "Reverse Service Contract", "Reverse", "Auction"],
  ["Contract Manpower — Plant Shutdown", "Manpower", "Reverse Procurement", "Reverse", "Auction"],
  ["Idle DG Sets 500 kVA × 4", "Industrial Asset", "Forward Asset Sale", "Forward", "Auction"],
  ["Management Consulting Retainer", "Professional Services", "Contract RFP", "Reverse", "RFP"],
  ["Copper Cathode Grade A — 300 MT", "Commodity", "Commodity RFQ", "Reverse", "RFQ"],
  ["Obsolete IT Hardware Disposal", "Scrap", "Forward Asset Sale", "Forward", "Auction"],
  ["Cold Chain Transport Lanes — South", "Transport", "Transport Lane Auction", "Reverse", "Auction"],
  ["Injection Moulding Machines × 3", "Equipment", "Machinery Sale", "Forward", "Auction"],
  ["Industrial Gases Annual Contract", "Raw Material", "Reverse Procurement", "Reverse", "Auction"],
  ["Security Services — 5 Facilities", "Facility Services", "Reverse Service Contract", "Reverse", "Auction"],
  ["Scrap Rail Track Removal — Salem", "Scrap", "Forward Asset Sale", "Forward", "Auction"],
  ["Pre-owned Forklift Fleet", "Vehicle", "Machinery Sale", "Forward", "Auction"],
  ["Packaging Materials RFI", "Raw Material", "Commodity RFQ", "Reverse", "RFI"],
  ["Solar EPC Partner Selection", "Professional Services", "Contract RFP", "Reverse", "RFP"],
  ["Aluminium Dross & Skimmings", "Scrap", "Forward Asset Sale", "Forward", "Auction"],
  ["Laptop Refresh — 1,200 units", "IT Procurement", "Reverse Procurement", "Reverse", "Auction"],
  ["Bulk Cement Haulage Lanes", "Transport", "Transport Lane Auction", "Reverse", "Auction"],
  ["Surplus Transformers 33kV", "Industrial Asset", "Forward Asset Sale", "Forward", "Auction"],
  ["Canteen Services Contract", "Facility Services", "Reverse Service Contract", "Reverse", "Auction"],
];

const STATUS_PLAN: EventStatus[] = [
  "Live", "Live", "Live", "Live", "Live", "Live",
  "Draft Review", "Draft Review", "Ready to Publish", "Ready to Publish", "Scheduled", "Scheduled",
  "Awaiting Decision", "Below Reserve", "Above Target", "Low Competition", "Technical Exception",
  "Payment Pending", "Winner Default", "Fulfilment Exception", "Disputed",
  "Closed", "Closed", "Closed", "Closed", "Cancelled", "Closed", "Scheduled",
];

function makeParticipants(idx: number, count: number): Participant[] {
  return Array.from({ length: count }, (_, p) => {
    const v = vendors[(idx * 3 + p * 5) % vendors.length];
    return {
      vendorId: v.id,
      alias: `Bidder ${String.fromCharCode(65 + p)}`,
      eligible: true,
      invited: true,
      accepted: p % 7 !== 5,
      qualified: p % 9 !== 6,
      documentsOk: p % 8 !== 5,
      securityPaid: p % 6 !== 4,
      termsAccepted: p % 10 !== 8,
      connected: p % 4 !== 3,
      bidCount: int(0, 18),
      rank: p + 1,
      risk: RISK_LEVELS[(idx + p) % 4],
      ip: `103.${int(10, 250)}.${int(1, 250)}.${int(1, 250)}`,
      device: pick(["Chrome / Windows", "Safari / macOS", "Chrome / Android", "Edge / Windows"]),
    };
  });
}

function makeBids(idx: number, parts: Participant[], base: number, direction: "Forward" | "Reverse"): Bid[] {
  const n = int(14, 34);
  let price = base;
  return Array.from({ length: n }, (_, b) => {
    const p = parts[(b + idx) % parts.length];
    const step = Math.round(base * 0.01);
    price = direction === "Forward" ? price + step : Math.max(step, price - step);
    return {
      seq: b + 1,
      alias: p.alias,
      vendorId: p.vendorId,
      amount: price,
      serverTime: hoursAgo(6 - (b / n) * 6),
      status: b === 7 && idx % 9 === 0 ? "Reversed" : "Accepted",
      previousPrice: direction === "Forward" ? price - step : price + step,
      step,
      ipRisk: RISK_LEVELS[(idx + b) % 4],
      device: p.device,
      correlationId: `COR-${idx}-${b + 1}`,
    } as Bid;
  });
}

export const events: AuctionEvent[] = EVENT_NAMES.map(([name, category, template, direction, kind], i) => {
  const customer = customers[i % customers.length];
  const status = STATUS_PLAN[i % STATUS_PLAN.length];
  const value = money(400_000, 96_000_000);
  const parts = makeParticipants(i, int(4, 9));
  const bids = makeBids(i, parts, value, direction);
  const live = status === "Live";
  const currentPrice = bids[bids.length - 1]?.amount ?? value;
  const closedish = ["Closed", "Payment Pending", "Winner Default", "Fulfilment Exception", "Disputed", "Awaiting Decision"].includes(status);
  const winner = vendors[(i * 7) % vendors.length];
  const runner = vendors[(i * 7 + 3) % vendors.length];
  return {
    id: `EVT-2026-${String(1001 + i)}`,
    name,
    customerId: customer.id,
    customerName: customer.name,
    direction,
    template,
    kind,
    category,
    status,
    owner: OWNERS[i % OWNERS.length],
    risk: RISK_LEVELS[i % 4],
    value,
    reserve: Math.round(value * (direction === "Forward" ? 0.92 : 1.06)),
    currentPrice,
    startAt: live ? hoursAgo(int(1, 5)) : status === "Scheduled" ? inHours(int(6, 200)) : daysAgo(int(2, 60)),
    endAt: live ? inHours(int(0, 4) + 0.3) : status === "Scheduled" ? inHours(int(210, 400)) : daysAgo(int(1, 55)),
    participants: parts,
    bids,
    bidCount: bids.length,
    bidVelocity: Math.round((bids.length / 6) * 10) / 10,
    extensions: live ? int(0, 3) : int(0, 2),
    connectionHealth: i % 9 === 4 ? "Unstable" : i % 5 === 2 ? "Degraded" : "Healthy",
    integrityScore: int(52, 99),
    alerts: i % 6 === 0 ? ["Shared IP between Bidder B and Bidder D"] : i % 8 === 3 ? ["Last-second bid clustering"] : [],
    lots: Array.from({ length: int(1, 4) }, (_, l) => ({
      id: `LOT-${1001 + i}-${l + 1}`,
      name: `${name.split("—")[0].trim()} · Lot ${l + 1}`,
      qty: int(10, 900),
      unit: pick(["MT", "Nos", "Trips", "Man-days", "sqft"]),
      basePrice: Math.round(value / int(2, 5)),
      currentPrice: Math.round(currentPrice / int(2, 5)),
      h1: parts[l % parts.length]?.alias,
    })),
    emdPercent: pick([5, 7.5, 10]),
    antiSnipe: pick([2, 3, 5]),
    increment: Math.round(value * 0.01),
    termsVersion: `v${int(1, 4)}.${int(0, 9)}`,
    inspection: {
      required: i % 3 !== 0,
      window: `${fmtDay(daysAgo(int(2, 20)))} – ${fmtDay(daysAgo(int(0, 1)))}`,
      contact: OWNERS[(i + 2) % OWNERS.length],
      completed: int(0, parts.length),
    },
    clarifications: Array.from({ length: int(0, 3) }, (_, c) => ({
      id: `CLR-${1001 + i}-${c + 1}`,
      vendor: parts[c % parts.length].alias,
      question: pick([
        "Is the material lifting deadline extendable by 3 days?",
        "Please confirm loading assistance at the yard.",
        "Are weighbridge slips shared post-award?",
        "Can EMD be submitted via NEFT?",
      ]),
      answer: c % 2 === 0 ? "Answered by category desk — see terms clause 7.2." : undefined,
      at: hoursAgo(int(2, 100)),
    })),
    approvals: [
      { tier: "L1", approver: "Category Manager", status: closedish ? "Approved" : "Pending", at: closedish ? daysAgo(int(1, 8)) : undefined, sla: 24 },
      { tier: "L2", approver: "Business Head", status: closedish && i % 3 !== 0 ? "Approved" : "Pending", sla: 48 },
    ],
    award: closedish
      ? {
          winner: winner.name,
          winnerId: winner.id,
          amount: currentPrice,
          runnerUp: runner.name,
          runnerUpAmount: Math.round(currentPrice * (direction === "Forward" ? 0.96 : 1.04)),
          acceptanceDeadline: inHours(int(-100, 90)),
          state:
            status === "Winner Default"
              ? "Defaulted"
              : status === "Payment Pending"
                ? "Winner Acceptance Pending"
                : status === "Awaiting Decision"
                  ? "Pending Approval"
                  : "Accepted",
        }
      : undefined,
    createdAt: daysAgo(int(3, 120)),
  };
});

export const liveEvents = events.filter((e) => e.status === "Live");
export const getEvent = (id: string) => events.find((e) => e.id === id);
export const getVendor = (id: string) => vendors.find((v) => v.id === id);
export const getCustomer = (id: string) => customers.find((c) => c.id === id);

/* ---------------- finance ---------------- */
export type Security = {
  id: string;
  vendorId: string;
  vendorName: string;
  eventId: string;
  amount: number;
  mode: "Gateway" | "NEFT" | "Bank Guarantee";
  state: "Held" | "Refund Initiated" | "Refunded" | "Forfeited";
  since: string;
  reference: string;
};

export const securities: Security[] = events.slice(0, 22).flatMap((e, i) =>
  e.participants.slice(0, 3).map((p, j) => ({
    id: `SEC-${4001 + i * 3 + j}`,
    vendorId: p.vendorId,
    vendorName: getVendor(p.vendorId)?.name ?? p.vendorId,
    eventId: e.id,
    amount: Math.round((e.value * e.emdPercent) / 100),
    mode: pick(["Gateway", "NEFT", "Bank Guarantee"]),
    state: (i + j) % 11 === 0 ? "Forfeited" : (i + j) % 5 === 0 ? "Refund Initiated" : (i + j) % 7 === 0 ? "Refunded" : "Held",
    since: daysAgo(int(1, 60)),
    reference: `TXN${int(10000000, 99999999)}`,
  })),
);

export type Payment = {
  id: string;
  eventId: string;
  vendorName: string;
  customerName: string;
  type: "Security" | "Winner Payment" | "Platform Fee" | "Settlement" | "Payout";
  amount: number;
  provider: "Razorpay" | "ICICI NEFT" | "HDFC RTGS" | "Cashfree";
  status: "Success" | "Pending" | "Failed" | "Reversed";
  at: string;
  reference: string;
};

export const payments: Payment[] = events.slice(0, 26).map((e, i) => ({
  id: `PAY-${5001 + i}`,
  eventId: e.id,
  vendorName: e.award?.winner ?? e.participants[0] ? getVendor(e.participants[0].vendorId)!.name : "—",
  customerName: e.customerName,
  type: pick(["Security", "Winner Payment", "Platform Fee", "Settlement", "Payout"]),
  amount: money(80_000, 42_000_000),
  provider: pick(["Razorpay", "ICICI NEFT", "HDFC RTGS", "Cashfree"]),
  status: i % 9 === 0 ? "Failed" : i % 5 === 0 ? "Pending" : i % 13 === 0 ? "Reversed" : "Success",
  at: daysAgo(int(0, 45)),
  reference: `REF${int(10000000, 99999999)}`,
}));

export type Refund = {
  id: string;
  vendorName: string;
  eventId: string;
  amount: number;
  reason: string;
  reference: string;
  dueDate: string;
  status: "Queued" | "Processing" | "Failed" | "On Hold" | "Refunded";
  retries: number;
  failureReason?: string;
};

export const refunds: Refund[] = securities
  .filter((s) => s.state !== "Held")
  .slice(0, 18)
  .map((s, i) => ({
    id: `RFD-${6001 + i}`,
    vendorName: s.vendorName,
    eventId: s.eventId,
    amount: s.amount,
    reason: pick(["Auction lost", "Event cancelled", "Duplicate security", "Excess collection"]),
    reference: s.reference,
    dueDate: inHours(int(-120, 200)),
    status: i % 6 === 0 ? "Failed" : i % 4 === 0 ? "Processing" : i % 9 === 0 ? "On Hold" : i % 3 === 0 ? "Refunded" : "Queued",
    retries: i % 6 === 0 ? int(1, 3) : 0,
    failureReason: i % 6 === 0 ? pick(["Bank account invalid", "IMPS gateway timeout", "Beneficiary name mismatch"]) : undefined,
  }));

export type Settlement = {
  id: string;
  customerName: string;
  eventId: string;
  gross: number;
  fee: number;
  tax: number;
  net: number;
  dueDate: string;
  ageDays: number;
  status: "Pending" | "Scheduled" | "Paid" | "On Hold";
};

export const settlements: Settlement[] = events.slice(0, 20).map((e, i) => {
  const gross = e.currentPrice;
  const fee = Math.round(gross * 0.015);
  const tax = Math.round(fee * 0.18);
  return {
    id: `STL-${7001 + i}`,
    customerName: e.customerName,
    eventId: e.id,
    gross,
    fee,
    tax,
    net: gross - fee - tax,
    dueDate: inHours(int(-300, 400)),
    ageDays: int(0, 62),
    status: i % 7 === 0 ? "On Hold" : i % 4 === 0 ? "Paid" : i % 3 === 0 ? "Scheduled" : "Pending",
  };
});

export type Invoice = {
  id: string;
  party: string;
  type: "Platform Fee" | "Winner Invoice" | "Service Invoice";
  amount: number;
  gst: number;
  issued: string;
  due: string;
  status: "Draft" | "Issued" | "Paid" | "Overdue";
};

export const invoices: Invoice[] = Array.from({ length: 16 }, (_, i) => {
  const amount = money(50_000, 8_000_000);
  return {
    id: `INV-2026-${String(801 + i)}`,
    party: i % 2 === 0 ? customers[i % customers.length].name : vendors[i % vendors.length].name,
    type: pick(["Platform Fee", "Winner Invoice", "Service Invoice"]),
    amount,
    gst: Math.round(amount * 0.18),
    issued: daysAgo(int(1, 70)),
    due: inHours(int(-400, 500)),
    status: i % 8 === 0 ? "Overdue" : i % 4 === 0 ? "Paid" : i % 5 === 0 ? "Draft" : "Issued",
  };
});

export type ReconItem = {
  id: string;
  kind: "Missing payment" | "Duplicate webhook" | "Amount mismatch" | "Refund mismatch" | "Settlement mismatch";
  reference: string;
  platformAmount: number;
  providerAmount: number;
  variance: number;
  provider: string;
  detectedAt: string;
  severity: Severity;
  status: "Open" | "Investigating" | "Resolved";
};

export const reconItems: ReconItem[] = Array.from({ length: 12 }, (_, i) => {
  const p = money(50_000, 5_000_000);
  const q = i % 3 === 0 ? p : p - money(1_000, 90_000);
  return {
    id: `REC-${9001 + i}`,
    kind: pick(["Missing payment", "Duplicate webhook", "Amount mismatch", "Refund mismatch", "Settlement mismatch"]),
    reference: `REF${int(10000000, 99999999)}`,
    platformAmount: p,
    providerAmount: q,
    variance: p - q,
    provider: pick(["Razorpay", "ICICI NEFT", "HDFC RTGS", "Cashfree"]),
    detectedAt: hoursAgo(int(2, 300)),
    severity: p - q !== 0 ? "Critical" : "Medium",
    status: i % 4 === 0 ? "Resolved" : i % 3 === 0 ? "Investigating" : "Open",
  };
});

/* ---------------- fulfilment ---------------- */
export type Order = {
  id: string;
  eventId: string;
  customerName: string;
  vendorName: string;
  category: Category;
  value: number;
  mode: "Pickup" | "Delivery" | "Service";
  scheduled: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue" | "Exception";
  acceptance: "Pending" | "Accepted" | "Partially Accepted" | "Rejected";
  variance: number;
  slaBreached: boolean;
  evidence: boolean;
};

export const orders: Order[] = events.slice(0, 22).map((e, i) => ({
  id: `ORD-${8001 + i}`,
  eventId: e.id,
  customerName: e.customerName,
  vendorName: e.award?.winner ?? getVendor(e.participants[0].vendorId)!.name,
  category: e.category,
  value: e.currentPrice,
  mode: e.direction === "Forward" ? "Pickup" : i % 3 === 0 ? "Service" : "Delivery",
  scheduled: inHours(int(-260, 300)),
  status: i % 9 === 0 ? "Exception" : i % 7 === 0 ? "Overdue" : i % 3 === 0 ? "Completed" : i % 2 === 0 ? "In Progress" : "Scheduled",
  acceptance: i % 5 === 0 ? "Pending" : i % 11 === 0 ? "Partially Accepted" : i % 13 === 0 ? "Rejected" : "Accepted",
  variance: i % 4 === 0 ? int(1, 9) : 0,
  slaBreached: i % 8 === 0,
  evidence: i % 6 !== 0,
}));

export type Dispute = {
  id: string;
  eventId: string;
  customerName: string;
  vendorName: string;
  category: string;
  amount: number;
  issue: string;
  raisedAt: string;
  stage: "New" | "Evidence Pending" | "Under Review" | "Decision Pending" | "Appealed" | "Closed";
  owner: string;
  severity: Severity;
  timeline: Array<{ at: string; who: string; note: string }>;
};

export const disputes: Dispute[] = Array.from({ length: 14 }, (_, i) => {
  const e = events[(i * 3) % events.length];
  return {
    id: `DSP-${3001 + i}`,
    eventId: e.id,
    customerName: e.customerName,
    vendorName: getVendor(e.participants[0].vendorId)!.name,
    category: pick(["Quality", "Quantity Variance", "Payment", "Delay", "Terms Interpretation", "Damage"]),
    amount: money(40_000, 6_000_000),
    issue: pick([
      "Delivered quantity 6% below awarded quantity.",
      "Material grade differs from lot description.",
      "Pickup delayed beyond agreed window; demurrage claimed.",
      "Winner payment credited but not reflected on portal.",
      "Service SLA breach for two consecutive weeks.",
    ]),
    raisedAt: daysAgo(int(1, 40)),
    stage: (["New", "Evidence Pending", "Under Review", "Decision Pending", "Appealed", "Closed"] as const)[i % 6],
    owner: OWNERS[i % OWNERS.length],
    severity: (["Low", "Medium", "High", "Critical"] as const)[i % 4],
    timeline: [
      { at: daysAgo(int(10, 40)), who: "Vendor", note: "Dispute raised with photographic evidence." },
      { at: daysAgo(int(3, 9)), who: "Customer", note: "Counter-statement and weighbridge slips submitted." },
      { at: daysAgo(int(0, 2)), who: OWNERS[i % OWNERS.length], note: "Under review by platform operations." },
    ],
  };
});

/* ---------------- risk & security ---------------- */
export type FraudAlert = {
  id: string;
  type: string;
  severity: Severity;
  entities: string[];
  eventId: string;
  evidence: string;
  detectedAt: string;
  investigator: string;
  status: "Open" | "Monitoring" | "Restricted" | "Escalated" | "Resolved" | "Blocked";
};

const FRAUD_TYPES = [
  "Shared bank account",
  "Shared contact",
  "Shared IP",
  "Shared device",
  "Related company indicator",
  "Unusual bid rotation",
  "Suspicious alternating bids",
  "Artificial bid jumps",
  "Last-second coordinated bidding",
  "New vendor + high-value auction",
  "Repeated default",
  "Bidder/customer relationship flag",
];

export const fraudAlerts: FraudAlert[] = FRAUD_TYPES.map((type, i) => {
  const e = events[(i * 2) % events.length];
  return {
    id: `FRD-${4501 + i}`,
    type,
    severity: (["Critical", "High", "Medium", "Low"] as const)[i % 4],
    entities: [vendors[i % vendors.length].name, vendors[(i + 6) % vendors.length].name],
    eventId: e.id,
    evidence: pick([
      "Two vendors submitted identical bank IFSC + account suffix.",
      "Bids alternated within 400ms across 9 rounds.",
      "Same device fingerprint observed for both logins.",
      "Bid jump of 38% above prevailing price with no follow-up.",
    ]),
    detectedAt: hoursAgo(int(1, 400)),
    investigator: OWNERS[i % OWNERS.length],
    status: (["Open", "Monitoring", "Restricted", "Escalated", "Resolved", "Blocked"] as const)[i % 6],
  };
});

export type SecurityIncident = {
  id: string;
  type: "Unauthorized Access" | "Account Takeover" | "Document Leak" | "Bid Integrity Concern" | "Payment Fraud" | "Suspicious Admin Action" | "Data Exposure";
  severity: Severity;
  entity: string;
  openedAt: string;
  owner: string;
  status: "Open" | "Contained" | "Resolved";
  timeline: Array<{ at: string; note: string }>;
};

export const securityIncidents: SecurityIncident[] = (
  ["Unauthorized Access", "Account Takeover", "Document Leak", "Bid Integrity Concern", "Payment Fraud", "Suspicious Admin Action", "Data Exposure"] as const
).map((type, i) => ({
  id: `SEC-INC-${501 + i}`,
  type,
  severity: (["Critical", "High", "Medium", "Low"] as const)[i % 4],
  entity: i % 2 === 0 ? vendors[i % vendors.length].name : customers[i % customers.length].name,
  openedAt: hoursAgo(int(2, 500)),
  owner: OWNERS[i % OWNERS.length],
  status: (["Open", "Contained", "Resolved"] as const)[i % 3],
  timeline: [
    { at: hoursAgo(int(200, 500)), note: "Signal raised by anomaly detection." },
    { at: hoursAgo(int(20, 190)), note: "Sessions reviewed; step-up authentication enforced." },
    { at: hoursAgo(int(1, 19)), note: "Containment actions applied and logged." },
  ],
}));

export type LoginEvent = {
  id: string;
  user: string;
  role: string;
  result: "Success" | "Failed" | "Blocked" | "MFA Challenge";
  ip: string;
  location: string;
  device: string;
  at: string;
  risk: RiskLevel;
};

export const loginEvents: LoginEvent[] = Array.from({ length: 24 }, (_, i) => ({
  id: `LOG-${7101 + i}`,
  user: i % 3 === 0 ? OWNERS[i % OWNERS.length] : vendors[i % vendors.length].contact,
  role: i % 3 === 0 ? pick(["Operations", "Finance", "Compliance", "Security"]) : "Vendor User",
  result: i % 7 === 0 ? "Failed" : i % 11 === 0 ? "Blocked" : i % 5 === 0 ? "MFA Challenge" : "Success",
  ip: `103.${int(10, 250)}.${int(1, 250)}.${int(1, 250)}`,
  location: pick(CITIES),
  device: pick(["Chrome / Windows", "Safari / macOS", "Chrome / Android", "Edge / Windows"]),
  at: hoursAgo(int(0, 200)),
  risk: RISK_LEVELS[i % 4],
}));

export type RelatedParty = {
  id: string;
  a: string;
  b: string;
  signal: string;
  confidence: number;
  events: string[];
  status: "Unreviewed" | "Confirmed" | "Dismissed";
};

export const relatedParties: RelatedParty[] = Array.from({ length: 9 }, (_, i) => ({
  id: `REL-${6101 + i}`,
  a: vendors[i % vendors.length].name,
  b: vendors[(i + 4) % vendors.length].name,
  signal: pick(["Same registered address", "Shared director", "Shared bank account", "Shared phone number", "Same device fingerprint"]),
  confidence: int(45, 98),
  events: [events[i % events.length].id, events[(i + 3) % events.length].id],
  status: (["Unreviewed", "Confirmed", "Dismissed"] as const)[i % 3],
}));

/* ---------------- exceptions ---------------- */
export type ExceptionItem = {
  id: string;
  kind: string;
  entity: string;
  eventId?: string;
  severity: Severity;
  raisedAt: string;
  owner: string;
  slaHours: number;
  recommended: string;
  status: "Open" | "In Progress" | "Resolved";
};

const EXCEPTION_KINDS = [
  ["Below Reserve", "Refer to customer for reserve waiver"],
  ["Above Target", "Escalate to category desk"],
  ["Low Competition", "Extend event and re-invite vendors"],
  ["Abnormal Low Bid", "Request bid confirmation from vendor"],
  ["KYB Issue", "Request clarification from vendor"],
  ["Compliance Expired", "Block category until document renewed"],
  ["Payment Failure", "Retry collection and notify vendor"],
  ["Winner Default", "Offer to next rank or forfeit security"],
  ["Quantity Variance", "Trigger joint reconciliation"],
  ["Delivery Delay", "Apply SLA penalty per contract"],
  ["Security Alert", "Assign to security investigator"],
  ["Fraud Flag", "Restrict participation pending review"],
  ["Dispute", "Assign dispute owner and set decision date"],
];

export const exceptions: ExceptionItem[] = EXCEPTION_KINDS.flatMap(([kind, action], i) =>
  Array.from({ length: i % 3 === 0 ? 2 : 1 }, (_, j) => {
    const e = events[(i * 2 + j) % events.length];
    return {
      id: `EXC-${9101 + i * 2 + j}`,
      kind,
      entity: j % 2 === 0 ? e.customerName : vendors[(i + j) % vendors.length].name,
      eventId: e.id,
      severity: (["Critical", "High", "Medium", "Low"] as const)[(i + j) % 4],
      raisedAt: hoursAgo(int(1, 200)),
      owner: OWNERS[(i + j) % OWNERS.length],
      slaHours: pick([12, 24, 48, 72]),
      recommended: action,
      status: (["Open", "In Progress", "Resolved"] as const)[(i + j) % 3],
    };
  }),
);

/* ---------------- audit / notifications / jobs ---------------- */
export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  before: string;
  after: string;
  reason: string;
  correlationId: string;
  ip: string;
  device: string;
  risk: RiskLevel;
};

const AUDIT_ACTIONS: Array<[string, string, string]> = [
  ["Extended live auction", "Remaining 02:00", "Remaining 07:00"],
  ["Approved vendor KYB", "Pending KYB", "Verified"],
  ["Rejected document", "Pending Verification", "Rejected"],
  ["Forfeited security", "Held", "Forfeited"],
  ["Retried refund", "Failed", "Processing"],
  ["Suspended vendor", "Verified", "Suspended"],
  ["Cancelled event", "Live", "Cancelled"],
  ["Published event", "Ready to Publish", "Scheduled"],
  ["Awarded event", "Awaiting Decision", "Awarded"],
  ["Placed emergency hold", "Live", "Held"],
  ["Changed rank manually", "C Standard", "B Established"],
  ["Escalated fraud alert", "Open", "Escalated"],
];

export const auditLog: AuditEntry[] = Array.from({ length: 48 }, (_, i) => {
  const [action, before, after] = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const e = events[i % events.length];
  return {
    id: `AUD-${100001 + i}`,
    at: hoursAgo(i * 3 + int(0, 2)),
    actor: OWNERS[i % OWNERS.length],
    role: pick(["Super Admin", "Operations", "Compliance", "Finance", "Security"]),
    action,
    entity: pick(["Event", "Vendor", "Payment", "Document", "Customer"]),
    entityId: i % 2 === 0 ? e.id : vendors[i % vendors.length].id,
    before,
    after,
    reason: pick([
      "Customer requested extension in writing.",
      "Documents verified against issuer portal.",
      "Winner failed to pay within acceptance window.",
      "Gateway returned a retryable error.",
      "Compliance escalation per policy 4.3.",
    ]),
    correlationId: `COR-${int(100000, 999999)}`,
    ip: `103.${int(10, 250)}.${int(1, 250)}.${int(1, 250)}`,
    device: pick(["Chrome / Windows", "Safari / macOS", "Edge / Windows"]),
    risk: RISK_LEVELS[i % 4],
  };
});

export type NotificationTemplate = {
  id: string;
  name: string;
  channels: Array<"Email" | "SMS" | "Push" | "In-app">;
  subject: string;
  body: string;
  variables: string[];
  updatedAt: string;
  active: boolean;
};

const TEMPLATE_NAMES = [
  "Invitation", "RFQ Open", "RFQ Reminder", "Qualification Approved", "Qualification Rejected", "Security Due",
  "Auction Start", "Outbid", "Rank Change", "Auction Extended", "Auction Closed", "Approval Request",
  "Award", "Payment Due", "Refund", "Order", "Delivery", "Dispute", "Compliance Expiry",
];

export const notificationTemplates: NotificationTemplate[] = TEMPLATE_NAMES.map((name, i) => ({
  id: `NTP-${301 + i}`,
  name,
  channels: (["Email", "SMS", "Push", "In-app"] as const).filter((_, c) => (i + c) % 3 !== 0),
  subject: `${name} — {{event_name}}`,
  body: `Hello {{vendor_name}},\n\nThis is regarding {{event_name}} ({{event_id}}) for {{customer_name}}.\nAmount: {{amount}} · Deadline: {{deadline}}\n\n— {{platform_name}} Operations`,
  variables: ["vendor_name", "event_name", "event_id", "customer_name", "amount", "deadline", "platform_name"],
  updatedAt: daysAgo(int(1, 90)),
  active: i % 9 !== 4,
}));

export type NotificationLog = {
  id: string;
  template: string;
  channel: "Email" | "SMS" | "Push" | "In-app";
  recipient: string;
  status: "Delivered" | "Queued" | "Failed" | "Bounced";
  at: string;
  error?: string;
};

export const notificationLogs: NotificationLog[] = Array.from({ length: 30 }, (_, i) => ({
  id: `NLG-${9501 + i}`,
  template: TEMPLATE_NAMES[i % TEMPLATE_NAMES.length],
  channel: (["Email", "SMS", "Push", "In-app"] as const)[i % 4],
  recipient: i % 2 === 0 ? vendors[i % vendors.length].email : customers[i % customers.length].users[0].email,
  status: i % 11 === 0 ? "Failed" : i % 13 === 0 ? "Bounced" : i % 5 === 0 ? "Queued" : "Delivered",
  at: hoursAgo(int(0, 120)),
  error: i % 11 === 0 ? pick(["SMTP 550 mailbox unavailable", "SMS gateway rejected DLT template"]) : undefined,
}));

export type Job = {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  duration: string;
  status: "Success" | "Running" | "Failed" | "Retrying";
  failures: number;
};

export const jobs: Job[] = [
  "Auction closing sweeper", "Refund retry worker", "Compliance expiry scanner", "Settlement generator",
  "Reconciliation import", "Notification dispatcher", "Fraud signal scoring", "Vendor rank recompute",
  "Document OCR pipeline", "Webhook replay",
].map((name, i) => ({
  id: `JOB-${201 + i}`,
  name,
  schedule: pick(["every 5 min", "every 15 min", "hourly", "daily 02:00"]),
  lastRun: hoursAgo(int(0, 12)),
  duration: `${int(1, 240)}s`,
  status: i % 7 === 0 ? "Failed" : i % 5 === 0 ? "Retrying" : i % 3 === 0 ? "Running" : "Success",
  failures: i % 7 === 0 ? int(1, 9) : 0,
}));

export type ServiceHealth = { name: string; status: "Operational" | "Degraded" | "Down"; latency: string; uptime: string };

export const services: ServiceHealth[] = [
  { name: "Realtime bidding service", status: "Operational", latency: "38 ms", uptime: "99.99%" },
  { name: "Notification service", status: "Degraded", latency: "812 ms", uptime: "99.42%" },
  { name: "Payment provider — Razorpay", status: "Operational", latency: "142 ms", uptime: "99.97%" },
  { name: "Payment provider — Cashfree", status: "Degraded", latency: "1.9 s", uptime: "98.80%" },
  { name: "Document processing / OCR", status: "Operational", latency: "2.4 s", uptime: "99.90%" },
  { name: "Auction event engine", status: "Operational", latency: "21 ms", uptime: "99.99%" },
  { name: "Webhook receiver", status: "Down", latency: "—", uptime: "97.10%" },
];

/* ---------------- configuration ---------------- */
export type CategoryConfig = {
  id: string;
  name: Category;
  parent?: string;
  attributes: Array<{ name: string; type: "Text" | "Number" | "Select" | "Date" | "File"; required: boolean; unit?: string }>;
  pricingModel: "Per Unit" | "Lump Sum" | "Per Trip" | "Per Man-day";
  documents: string[];
  compliance: string[];
  inspectionRequired: boolean;
  fulfilmentTemplate: string;
  taxProfile: string;
  termsTemplate: string;
  suggestedAuction: EventTemplate;
};

export const categoryConfigs: CategoryConfig[] = CATEGORIES.map((name, i) => ({
  id: `CAT-${101 + i}`,
  name,
  attributes: [
    { name: "Grade", type: "Select", required: true },
    { name: "Quantity", type: "Number", required: true, unit: pick(["MT", "Nos", "Trips", "Man-days"]) },
    { name: "Location", type: "Text", required: true },
    { name: "Inspection Report", type: "File", required: i % 2 === 0 },
  ],
  pricingModel: pick(["Per Unit", "Lump Sum", "Per Trip", "Per Man-day"]),
  documents: ["GST Certificate", "PAN Card", "Trade Licence"].slice(0, int(2, 3)),
  compliance: i % 3 === 0 ? ["PCB Authorisation"] : ["ISO 9001"],
  inspectionRequired: i % 3 !== 0,
  fulfilmentTemplate: pick(["Pickup — Weighbridge", "Delivery — GRN", "Service — Milestone"]),
  taxProfile: pick(["GST 18% + TCS 1%", "GST 12%", "GST 5% (RCM)"]),
  termsTemplate: `Standard ${name} Terms v${int(1, 3)}.0`,
  suggestedAuction: EVENT_TEMPLATES[i % EVENT_TEMPLATES.length],
}));

export type AuctionTemplateConfig = {
  id: string;
  name: EventTemplate;
  format: "English" | "Dutch" | "Sealed Bid" | "Japanese";
  step: string;
  duration: string;
  antiSnipe: string;
  visibility: "Rank only" | "Price visible" | "Sealed";
  security: string;
  participantThreshold: number;
  approval: string;
  award: string;
  terms: string;
  fulfilment: string;
};

export const auctionTemplates: AuctionTemplateConfig[] = EVENT_TEMPLATES.map((name, i) => ({
  id: `TPL-${401 + i}`,
  name,
  format: pick(["English", "Dutch", "Sealed Bid", "Japanese"]),
  step: name.startsWith("Reverse") ? `Decrement ₹${int(500, 5000)}` : `Increment ₹${int(500, 5000)}`,
  duration: `${int(30, 240)} min`,
  antiSnipe: `${pick([2, 3, 5])} min`,
  visibility: pick(["Rank only", "Price visible", "Sealed"]),
  security: `${pick([5, 7.5, 10])}% EMD`,
  participantThreshold: int(2, 5),
  approval: pick(["L1 only", "L1 + L2", "L1 + L2 + CFO"]),
  award: pick(["Auto to H1/L1", "Manual award", "Approval driven"]),
  terms: `Terms v${int(1, 3)}.0`,
  fulfilment: pick(["Pickup — Weighbridge", "Delivery — GRN", "Service — Milestone"]),
}));

export type AdminUser = { id: string; name: string; email: string; role: string; status: "Active" | "Disabled"; lastLogin: string; mfa: boolean };

export const adminUsers: AdminUser[] = OWNERS.map((name, i) => ({
  id: `AUSR-${601 + i}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@platform.ops`,
  role: ["Super Admin", "Operations", "Auction Manager", "Compliance", "Finance", "Security", "Support"][i % 7],
  status: i === 6 ? "Disabled" : "Active",
  lastLogin: hoursAgo(int(0, 120)),
  mfa: i % 4 !== 3,
}));

/* ---------------- dashboard aggregates ---------------- */
export const dashboardKpis = [
  { label: "Total Customers", value: customers.length, hint: "all statuses" },
  { label: "Active Customers", value: customers.filter((c) => c.status === "Active").length, hint: "transacting" },
  { label: "Verified Vendors", value: vendors.filter((v) => v.status === "Verified").length, hint: "KYB cleared" },
  { label: "Pending KYB", value: vendors.filter((v) => v.status === "Pending KYB" || v.status === "On Hold").length, tone: "warn" as const },
  { label: "Live Auctions", value: liveEvents.length, tone: "live" as const },
  { label: "Auctions Today", value: events.filter((e) => Math.abs(ageHours(e.startAt)) < 24).length },
  { label: "Upcoming Auctions", value: events.filter((e) => e.status === "Scheduled").length },
  { label: "Open RFQs", value: events.filter((e) => e.kind !== "Auction" && e.status !== "Closed").length },
  { label: "Pending Awards", value: events.filter((e) => e.award?.state === "Pending Approval" || e.award?.state === "Winner Acceptance Pending").length, tone: "warn" as const },
  { label: "Pending Approvals", value: events.filter((e) => e.approvals.some((a) => a.status === "Pending")).length, tone: "warn" as const },
  { label: "EMD Held", value: fmtMoney(securities.filter((s) => s.state === "Held").reduce((a, s) => a + s.amount, 0)) },
  { label: "Refunds Due", value: refunds.filter((r) => r.status !== "Refunded").length, tone: "warn" as const },
  { label: "Settlement Due", value: fmtMoney(settlements.filter((s) => s.status !== "Paid").reduce((a, s) => a + s.net, 0)) },
  { label: "Open Disputes", value: disputes.filter((d) => d.stage !== "Closed").length, tone: "warn" as const },
  { label: "Critical Security Alerts", value: fraudAlerts.filter((f) => f.severity === "Critical").length + securityIncidents.filter((s) => s.severity === "Critical" && s.status !== "Resolved").length, tone: "danger" as const },
  { label: "Compliance Expiring", value: allDocuments.filter((d) => ["Expiring 7 Days", "Expiring 30 Days"].includes(documentBucket(d))).length, tone: "warn" as const },
];

const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const gmvSeries = MONTHS.map((m, i) => ({
  month: m,
  forward: money(30_000_000, 120_000_000),
  reverse: money(40_000_000, 160_000_000),
  fees: money(600_000, 3_400_000),
  successRate: int(58, 94),
  savings: money(2_000_000, 18_000_000),
  realisation: money(4_000_000, 26_000_000),
  customers: 40 + i * int(2, 6),
  vendors: 320 + i * int(8, 30),
  avgBids: int(9, 28),
  avgParticipants: int(3, 12),
  disputes: int(1, 9),
}));

export const auctionTypeMix = EVENT_TEMPLATES.map((t) => ({
  name: t,
  value: events.filter((e) => e.template === t).length || 1,
}));

export const categoryMix = CATEGORIES.map((c) => ({
  name: c,
  value: events.filter((e) => e.category === c).length || 1,
}));

export const settlementAging = [
  { bucket: "0–7d", value: settlements.filter((s) => s.ageDays <= 7).length },
  { bucket: "8–15d", value: settlements.filter((s) => s.ageDays > 7 && s.ageDays <= 15).length },
  { bucket: "16–30d", value: settlements.filter((s) => s.ageDays > 15 && s.ageDays <= 30).length },
  { bucket: "31–60d", value: settlements.filter((s) => s.ageDays > 30 && s.ageDays <= 60).length },
  { bucket: "60d+", value: settlements.filter((s) => s.ageDays > 60).length },
];

export const platformReports = [
  "Customer GMV", "Forward Auction GMV", "Reverse Auction GMV", "Platform Revenue", "Auction Success Rate",
  "Average Participant Count", "Savings Generated", "Realisation Generated", "Customer Retention",
  "Vendor Participation", "Vendor Win Rates", "Category Trends", "Disputes", "Defaults",
  "Security Forfeitures", "Refund SLA", "Settlement SLA", "Cycle Time",
];
