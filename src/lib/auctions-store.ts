import { useEffect, useState } from "react";
import { adminApi } from "./api-client";

export type AuctionStatus =
  | "Pending Approval"
  | "Approved"
  | "Sent Back"
  | "Rejected"
  | "Published"
  | "Live"
  | "Closed"
  | "Cancelled";

export type AuctionCategory =
  | "Ferrous"
  | "Non-Ferrous"
  | "E-Waste"
  | "Paper"
  | "Plastic"
  | "Rubber";

export type SubLot = {
  id: string;
  name: string;
  quantity: string;
  reservePriceInr: number;
  currentBidInr?: number;
  bidders?: number;
};

export type BidEntry = {
  id: string;
  vendorId: string;
  vendorName: string;
  subLotId?: string;
  amountInr: number;
  at: string;
};

export type Auction = {
  id: string;
  title: string;
  company: string;
  plant: string;
  warehouse: string;
  location: string;
  category: AuctionCategory;
  lotType: "Single" | "Lot-wise";
  reservePriceInr: number;
  startingPriceInr: number;
  currentHighestInr?: number;
  bidders?: number;
  submittedBy: string;
  submittedAt: string;
  status: AuctionStatus;
  scheduleStart: string;
  scheduleEnd: string;
  inspection: string;
  terms: string;
  contact: { name: string; phone: string; email: string };
  photos: string[];
  subLots: SubLot[];
  bids: BidEntry[];
  reviewComment?: string;
  publishedAt?: string;
  publishChannels?: string[];
  closedAt?: string;
  finalPriceInr?: number;
  winner?: string;
  extensions?: Array<{ reason: string; minutes: number; at: string }>;
};

const KEY = "admin.auctions.v1";
const EVT = "admin:auctions";

function iso(offsetHours: number) {
  return new Date(Date.now() + offsetHours * 3600_000).toISOString();
}

function seed(): Auction[] {
  return [
    {
      id: "AUC-2026-0031",
      title: "HMS 1&2 Bundles — 240 MT",
      company: "Meridian Steelworks Ltd",
      plant: "Chakan Plant",
      warehouse: "Warehouse B-2",
      location: "Pune, MH",
      category: "Ferrous",
      lotType: "Lot-wise",
      reservePriceInr: 8_400_000,
      startingPriceInr: 8_400_000,
      submittedBy: "Rakesh Iyer (Seller Ops)",
      submittedAt: iso(-6),
      status: "Pending Approval",
      scheduleStart: iso(48),
      scheduleEnd: iso(52),
      inspection: "On-site at Chakan Plant, 09:00–17:00 IST, two days prior.",
      terms: "Payment T+2. EMD 5%. Lifting within 7 days of award.",
      contact: { name: "Rakesh Iyer", phone: "+91 98220 55221", email: "rakesh@meridiansteel.in" },
      photos: [
        "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800",
      ],
      subLots: [
        { id: "SL-01", name: "HMS 1 — 120 MT", quantity: "120 MT", reservePriceInr: 4_200_000 },
        { id: "SL-02", name: "HMS 2 — 120 MT", quantity: "120 MT", reservePriceInr: 4_200_000 },
      ],
      bids: [],
    },
    {
      id: "AUC-2026-0032",
      title: "Copper Wire Scrap — 18 MT",
      company: "Novus Alloys Pvt Ltd",
      plant: "Faridabad Plant",
      warehouse: "Central Yard",
      location: "Faridabad, HR",
      category: "Non-Ferrous",
      lotType: "Single",
      reservePriceInr: 12_600_000,
      startingPriceInr: 12_600_000,
      submittedBy: "Ankit Bansal",
      submittedAt: iso(-30),
      status: "Pending Approval",
      scheduleStart: iso(72),
      scheduleEnd: iso(74),
      inspection: "By appointment, contact plant manager.",
      terms: "Payment T+1. EMD 7.5%. Lifting within 5 days.",
      contact: { name: "Ankit Bansal", phone: "+91 98111 33445", email: "ankit@novusalloys.com" },
      photos: [
        "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
      ],
      subLots: [],
      bids: [],
    },
    {
      id: "AUC-2026-0028",
      title: "Populated PCBs — 6 MT",
      company: "Deccan E-Waste Solutions",
      plant: "Hyderabad Facility",
      warehouse: "E-Waste Bay",
      location: "Hyderabad, TS",
      category: "E-Waste",
      lotType: "Single",
      reservePriceInr: 3_200_000,
      startingPriceInr: 3_200_000,
      submittedBy: "K. Srinivas",
      submittedAt: iso(-72),
      status: "Approved",
      scheduleStart: iso(24),
      scheduleEnd: iso(28),
      inspection: "Video walkthrough available on request.",
      terms: "Payment T+2. EMD 10%. E-waste rules compliance mandatory.",
      contact: { name: "K. Srinivas", phone: "+91 90000 51122", email: "srinivas@deccanewaste.in" },
      photos: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800",
      ],
      subLots: [],
      bids: [],
    },
    {
      id: "AUC-2026-0027",
      title: "Aluminium UBC — 45 MT",
      company: "Coastal Recyclers LLP",
      plant: "Kandla Yard",
      warehouse: "Bay 4",
      location: "Kandla, GJ",
      category: "Non-Ferrous",
      lotType: "Single",
      reservePriceInr: 6_750_000,
      startingPriceInr: 6_750_000,
      submittedBy: "Nisha Patel",
      submittedAt: iso(-96),
      status: "Approved",
      scheduleStart: iso(12),
      scheduleEnd: iso(16),
      inspection: "Open inspection Mon–Sat, 10:00–16:00.",
      terms: "Payment T+3. EMD 5%.",
      contact: { name: "Nisha Patel", phone: "+91 98980 44112", email: "nisha@coastalrecyclers.co" },
      photos: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
      subLots: [],
      bids: [],
    },
    {
      id: "AUC-2026-0025",
      title: "Mixed Ferrous Turnings — 300 MT",
      company: "Meridian Steelworks Ltd",
      plant: "Pune Plant",
      warehouse: "Yard 7",
      location: "Pune, MH",
      category: "Ferrous",
      lotType: "Lot-wise",
      reservePriceInr: 5_400_000,
      startingPriceInr: 5_400_000,
      currentHighestInr: 6_120_000,
      bidders: 14,
      submittedBy: "Rakesh Iyer",
      submittedAt: iso(-120),
      status: "Live",
      scheduleStart: iso(-2),
      scheduleEnd: iso(2),
      inspection: "Yard 7, gate pass on request.",
      terms: "Payment T+2. EMD 5%.",
      contact: { name: "Rakesh Iyer", phone: "+91 98220 55221", email: "rakesh@meridiansteel.in" },
      photos: ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800"],
      subLots: [
        { id: "SL-01", name: "Lot A — 150 MT", quantity: "150 MT", reservePriceInr: 2_700_000, currentBidInr: 3_060_000, bidders: 9 },
        { id: "SL-02", name: "Lot B — 150 MT", quantity: "150 MT", reservePriceInr: 2_700_000, currentBidInr: 3_060_000, bidders: 8 },
      ],
      bids: [
        { id: "b1", vendorId: "V-0904", vendorName: "Novus Alloys Pvt Ltd", subLotId: "SL-01", amountInr: 3_060_000, at: iso(-0.2) },
        { id: "b2", vendorId: "V-0987", vendorName: "Vaayu Recyclers", subLotId: "SL-01", amountInr: 3_020_000, at: iso(-0.3) },
        { id: "b3", vendorId: "V-0904", vendorName: "Novus Alloys Pvt Ltd", subLotId: "SL-02", amountInr: 3_060_000, at: iso(-0.4) },
        { id: "b4", vendorId: "V-1042", vendorName: "Meridian Metals Pvt Ltd", subLotId: "SL-02", amountInr: 3_000_000, at: iso(-0.6) },
        { id: "b5", vendorId: "V-0987", vendorName: "Vaayu Recyclers", subLotId: "SL-01", amountInr: 2_980_000, at: iso(-0.8) },
      ],
    },
    {
      id: "AUC-2026-0024",
      title: "Copper Cathode Rejects — 8 MT",
      company: "Novus Alloys Pvt Ltd",
      plant: "Faridabad Plant",
      warehouse: "Central Yard",
      location: "Faridabad, HR",
      category: "Non-Ferrous",
      lotType: "Single",
      reservePriceInr: 5_600_000,
      startingPriceInr: 5_600_000,
      currentHighestInr: 6_240_000,
      bidders: 11,
      submittedBy: "Ankit Bansal",
      submittedAt: iso(-100),
      status: "Live",
      scheduleStart: iso(-1),
      scheduleEnd: iso(1.5),
      inspection: "By appointment.",
      terms: "Payment T+1. EMD 7.5%.",
      contact: { name: "Ankit Bansal", phone: "+91 98111 33445", email: "ankit@novusalloys.com" },
      photos: ["https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800"],
      subLots: [],
      bids: [
        { id: "b1", vendorId: "V-1042", vendorName: "Meridian Metals Pvt Ltd", amountInr: 6_240_000, at: iso(-0.1) },
        { id: "b2", vendorId: "V-1051", vendorName: "Coastal Recyclers LLP", amountInr: 6_180_000, at: iso(-0.2) },
        { id: "b3", vendorId: "V-0904", vendorName: "Novus Alloys Pvt Ltd", amountInr: 6_100_000, at: iso(-0.35) },
      ],
    },
    {
      id: "AUC-2026-0021",
      title: "Populated PCBs — 4 MT",
      company: "Deccan E-Waste Solutions",
      plant: "Hyderabad Facility",
      warehouse: "E-Waste Bay",
      location: "Hyderabad, TS",
      category: "E-Waste",
      lotType: "Single",
      reservePriceInr: 1_600_000,
      startingPriceInr: 1_600_000,
      currentHighestInr: 1_820_000,
      bidders: 8,
      submittedBy: "K. Srinivas",
      submittedAt: iso(-240),
      status: "Closed",
      scheduleStart: iso(-60),
      scheduleEnd: iso(-56),
      inspection: "-",
      terms: "Payment T+2. EMD 10%.",
      contact: { name: "K. Srinivas", phone: "+91 90000 51122", email: "srinivas@deccanewaste.in" },
      photos: [],
      subLots: [],
      bids: [],
      closedAt: iso(-56),
      finalPriceInr: 1_820_000,
      winner: "Novus Alloys Pvt Ltd",
    },
    {
      id: "AUC-2026-0018",
      title: "HMS Bundles — 200 MT",
      company: "Meridian Steelworks Ltd",
      plant: "Chakan Plant",
      warehouse: "Warehouse B-2",
      location: "Pune, MH",
      category: "Ferrous",
      lotType: "Single",
      reservePriceInr: 7_000_000,
      startingPriceInr: 7_000_000,
      currentHighestInr: 7_780_000,
      bidders: 12,
      submittedBy: "Rakesh Iyer",
      submittedAt: iso(-360),
      status: "Closed",
      scheduleStart: iso(-96),
      scheduleEnd: iso(-92),
      inspection: "-",
      terms: "Payment T+2. EMD 5%.",
      contact: { name: "Rakesh Iyer", phone: "+91 98220 55221", email: "rakesh@meridiansteel.in" },
      photos: [],
      subLots: [],
      bids: [],
      closedAt: iso(-92),
      finalPriceInr: 7_780_000,
      winner: "Vaayu Recyclers",
    },
    {
      id: "AUC-2026-0017",
      title: "PET Bales — 60 MT",
      company: "Vaayu Recyclers",
      plant: "Bengaluru Yard",
      warehouse: "Bay 2",
      location: "Bengaluru, KA",
      category: "Plastic",
      lotType: "Single",
      reservePriceInr: 1_200_000,
      startingPriceInr: 1_200_000,
      submittedBy: "Priya Menon",
      submittedAt: iso(-400),
      status: "Cancelled",
      scheduleStart: iso(-120),
      scheduleEnd: iso(-116),
      inspection: "-",
      terms: "-",
      contact: { name: "Priya Menon", phone: "+91 99000 22334", email: "priya@vaayurecyclers.in" },
      photos: [],
      subLots: [],
      bids: [],
      closedAt: iso(-118),
    },
  ];
}

function read(): Auction[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Auction[];
  } catch {
    return seed();
  }
}

function write(a: Auction[]) {
  window.localStorage.setItem(KEY, JSON.stringify(a));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listAuctions(): Auction[] {
  return read();
}
export function getAuction(id: string): Auction | undefined {
  return read().find((a) => a.id === id);
}
export function updateAuction(id: string, patch: Partial<Auction>) {
  const all = read();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch };
  write(all);
}

export function useAuctions(): Auction[] {
  const [rows, setRows] = useState<Auction[]>([]);
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await adminApi.getAuctions();
        const data = response?.data ?? response;
        const mapped = (data as any[]).map((a: any) => ({
          id: a.code,
          title: a.title,
          company: a.customer?.company_name || 'Unknown',
          plant: a.location || '',
          warehouse: a.warehouse || '',
          location: a.location || '',
          category: (a.category || 'Ferrous') as AuctionCategory,
          lotType: 'Lot-wise' as const,
          reservePriceInr: a.reserve_price || 0,
          startingPriceInr: a.reserve_price || 0,
          currentHighestInr: a.current_price || a.reserve_price || 0,
          finalPriceInr: a.final_price || null,
          bidders: a.bids_count || 0,
          winner: a.winner_vendor?.company_name || null,
          status: (a.status || 'Pending Approval') as AuctionStatus,
          submittedAt: a.created_at,
          closedAt: a.closed_at,
          publishedAt: a.published_at,
          liveAt: a.live_at,
          submittedBy: a.submitted_by || '',
          scheduleStart: a.schedule_start || '',
          scheduleEnd: a.schedule_end || '',
          inspection: a.inspection || '',
          terms: a.terms || '',
          contact: a.contact || { name: '', phone: '', email: '' },
          photos: a.photos || [],
          subLots: a.sub_lots || [],
          bids: a.bids || [],
        }));
        setRows(mapped);
      } catch {
        setRows(read());
      }
    };
    fetchAuctions();
  }, []);
  return rows;
}

export function auctionStatusTone(s: AuctionStatus) {
  switch (s) {
    case "Approved":
    case "Closed":
      return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" };
    case "Rejected":
    case "Cancelled":
      return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" };
    case "Sent Back":
      return { bg: "bg-accent/10", text: "text-accent", ring: "ring-accent/30", dot: "bg-accent" };
    case "Published":
      return { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", dot: "bg-sky-500" };
    case "Live":
      return { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/30", dot: "bg-primary" };
    default:
      return { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "bg-amber-500" };
  }
}

export function formatInr(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(n);
}

/* ============ TOKENS ============ */
export type TokenType = "View Only" | "Can Bid";
export type TokenStatus = "Active" | "Revoked" | "Expired";
export type TokenRow = {
  id: string;
  token: string;
  auctionId: string;
  type: TokenType;
  expiresAt: string;
  status: TokenStatus;
  createdAt: string;
};

const TKEY = "admin.tokens.v1";
const TEVT = "admin:tokens";

function tseed(): TokenRow[] {
  return [
    { id: "T-9001", token: "tkn_A83HD2K9QP", auctionId: "AUC-2026-0025", type: "View Only", expiresAt: iso(48), status: "Active", createdAt: iso(-24) },
    { id: "T-9002", token: "tkn_KQ8FN0LZ21", auctionId: "AUC-2026-0025", type: "Can Bid", expiresAt: iso(24), status: "Active", createdAt: iso(-24) },
    { id: "T-8990", token: "tkn_M2X7W3PQ88", auctionId: "AUC-2026-0021", type: "Can Bid", expiresAt: iso(-48), status: "Expired", createdAt: iso(-240) },
    { id: "T-8975", token: "tkn_ZR1H5T0V2N", auctionId: "AUC-2026-0018", type: "View Only", expiresAt: iso(-100), status: "Revoked", createdAt: iso(-260) },
  ];
}
function treadRaw(): TokenRow[] {
  if (typeof window === "undefined") return tseed();
  try {
    const raw = window.localStorage.getItem(TKEY);
    if (!raw) {
      const s = tseed();
      window.localStorage.setItem(TKEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return tseed();
  }
}
function twrite(t: TokenRow[]) {
  window.localStorage.setItem(TKEY, JSON.stringify(t));
  window.dispatchEvent(new CustomEvent(TEVT));
}
export function useTokens(): TokenRow[] {
  const [rows, setRows] = useState<TokenRow[]>([]);
  useEffect(() => {
    setRows(treadRaw());
    const on = () => setRows(treadRaw());
    window.addEventListener(TEVT, on);
    return () => window.removeEventListener(TEVT, on);
  }, []);
  return rows;
}
export function createToken(input: { auctionId: string; type: TokenType; expiresAt: string }) {
  const all = treadRaw();
  const id = "T-" + Math.floor(9000 + Math.random() * 1000);
  const token = "tkn_" + Math.random().toString(36).slice(2, 12).toUpperCase();
  const row: TokenRow = { id, token, ...input, status: "Active", createdAt: new Date().toISOString() };
  twrite([row, ...all]);
}
export function revokeToken(id: string) {
  const all = treadRaw();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], status: "Revoked" };
  twrite(all);
}
export function tokenShareLink(t: TokenRow) {
  const origin = typeof window === "undefined" ? "https://portal.scrapify.app" : window.location.origin;
  return `${origin}/join/${t.token}`;
}
export function tokenStatusTone(s: TokenStatus) {
  switch (s) {
    case "Active":
      return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" };
    case "Revoked":
      return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border", dot: "bg-muted-foreground" };
  }
}

/* ============ AUDIT LOG ============ */
export type AuditEntry = {
  id: string;
  at: string;
  user: string;
  role: "Admin" | "Super Admin";
  action: string;
  ip: string;
};

export function seedAuditLog(): AuditEntry[] {
  const users = [
    { u: "Ananya Rao", r: "Admin" as const },
    { u: "Vikram Shah", r: "Super Admin" as const },
    { u: "Meera Kapoor", r: "Admin" as const },
    { u: "Rohan Sethi", r: "Super Admin" as const },
  ];
  const actions = [
    "Approved Organization ORG-014",
    "Rejected Vendor VEN-092",
    "Approved Vendor V-0904",
    "Published Auction AUC-2026-0027",
    "Sent Back Auction AUC-2026-0031 for changes",
    "Revoked Token T-8975",
    "Generated Token T-9002",
    "Suspended Vendor V-0655",
    "Extended Auction AUC-2026-0025 by 10 min",
    "Ended Auction AUC-2026-0021 manually",
    "Approved Organization ORG-021",
    "Rejected Organization ORG-017",
    "Updated Vendor V-0987 details",
    "Approved Vendor V-1042",
    "Published Auction AUC-2026-0028",
  ];
  const ips = ["203.0.113.14", "198.51.100.42", "192.0.2.88", "203.0.113.201", "198.51.100.7"];
  return actions.map((a, i) => {
    const u = users[i % users.length];
    return {
      id: "AL-" + (5000 - i),
      at: iso(-i * 3 - 1),
      user: u.u,
      role: u.r,
      action: a,
      ip: ips[i % ips.length],
    };
  });
}

export function auditToCSV(rows: AuditEntry[]): string {
  const h = ["ID", "Timestamp", "User", "Role", "Action", "IP"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = rows.map((r) => [r.id, r.at, r.user, r.role, r.action, r.ip].map(esc).join(","));
  return [h.map(esc).join(","), ...body].join("\n");
}
