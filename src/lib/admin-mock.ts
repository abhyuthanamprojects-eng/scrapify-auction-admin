export type Pending = {
  id: string;
  type: "Vendor" | "Organization" | "Auction";
  name: string;
  submittedAt: string; // ISO
  hoursWaiting: number;
  assignee: string;
};

export type Activity = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string; // human
};

export const kpis = {
  pendingVendors: 12,
  pendingOrganizations: 3,
  liveAuctions: 8,
  auctionsAwaitingPublish: 5,
  totalVendors: 1_248,
};

export const needsAttention: Pending[] = [
  { id: "V-1042", type: "Vendor", name: "Meridian Metals Pvt Ltd", submittedAt: "2026-07-24T09:12:00Z", hoursWaiting: 46, assignee: "Unassigned" },
  { id: "O-0210", type: "Organization", name: "Southern Railway — Salem Div.", submittedAt: "2026-07-24T14:05:00Z", hoursWaiting: 41, assignee: "R. Iyer" },
  { id: "V-1051", type: "Vendor", name: "Coastal Recyclers LLP", submittedAt: "2026-07-25T02:30:00Z", hoursWaiting: 30, assignee: "A. Mehta" },
  { id: "A-3392", type: "Auction", name: "Copper Wire Scrap — Bare Bright #1", submittedAt: "2026-07-25T05:00:00Z", hoursWaiting: 27, assignee: "K. Rao" },
  { id: "V-1060", type: "Vendor", name: "Deccan E-Waste Solutions", submittedAt: "2026-07-25T06:45:00Z", hoursWaiting: 25, assignee: "Unassigned" },
];

export const activity: Activity[] = [
  { id: "a1", actor: "R. Iyer", action: "Approved vendor", target: "Novus Alloys Pvt Ltd", at: "12 min ago" },
  { id: "a2", actor: "A. Mehta", action: "Published auction", target: "AUC-2026-0027 — Mixed Ferrous Turnings", at: "34 min ago" },
  { id: "a3", actor: "K. Rao", action: "Rejected vendor", target: "Everblue Traders (incomplete KYC)", at: "1 hr ago" },
  { id: "a4", actor: "R. Iyer", action: "Approved organization", target: "NTPC — Ramagundam", at: "2 hr ago" },
  { id: "a5", actor: "S. Nair", action: "Published auction", target: "AUC-2026-0025 — HMS Bundles", at: "3 hr ago" },
  { id: "a6", actor: "A. Mehta", action: "Suspended vendor", target: "Prime Scrap Co. (compliance flag)", at: "4 hr ago" },
  { id: "a7", actor: "K. Rao", action: "Approved vendor", target: "Vaayu Recyclers", at: "5 hr ago" },
  { id: "a8", actor: "R. Iyer", action: "Rejected auction", target: "AUC-2026-0022 (missing lot photos)", at: "6 hr ago" },
  { id: "a9", actor: "S. Nair", action: "Approved vendor", target: "Ganga Metals", at: "8 hr ago" },
  { id: "a10", actor: "A. Mehta", action: "Published auction", target: "AUC-2026-0021 — Populated PCBs", at: "10 hr ago" },
];

export const gmvSeries = [
  { day: "Mon", gmv: 42, bids: 128 },
  { day: "Tue", gmv: 51, bids: 164 },
  { day: "Wed", gmv: 48, bids: 152 },
  { day: "Thu", gmv: 63, bids: 210 },
  { day: "Fri", gmv: 72, bids: 245 },
  { day: "Sat", gmv: 58, bids: 198 },
  { day: "Sun", gmv: 81, bids: 276 },
];

export const categoryMix = [
  { name: "Ferrous", value: 42, color: "#1F3251" },
  { name: "Non-Ferrous", value: 28, color: "#E65100" },
  { name: "E-Waste", value: 18, color: "#2E7D32" },
  { name: "Paper", value: 12, color: "#94A3B8" },
];

export const kpiTrends = {
  pendingVendors: [8, 10, 9, 11, 12, 12, 12],
  pendingOrganizations: [1, 2, 2, 3, 3, 2, 3],
  liveAuctions: [4, 5, 6, 7, 8, 7, 8],
  auctionsAwaitingPublish: [2, 3, 4, 4, 5, 5, 5],
  totalVendors: [1180, 1195, 1210, 1224, 1235, 1242, 1248],
};