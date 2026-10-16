import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api-client";

// Auction records are API-owned. This module keeps the old import surface used
// by the admin screens, but reads from the live API rather than returning the
// old empty fixture arrays.
export type AuctionStatus = string;
export type AuctionCategory = string;
export type SubLot = any;
export type BidEntry = any;
export type Auction = {
  id: string;
  status: AuctionStatus;
  title: string;
  company: string;
  plant: string;
  warehouse: string;
  location: string;
  category: string;
  lotType: string;
  submittedBy: string;
  submittedAt: string;
  scheduleStart: string;
  scheduleEnd: string;
  reservePriceInr: number;
  startingPriceInr: number;
  currentHighestInr?: number;
  finalPriceInr?: number;
  bidders?: number;
  winner?: string;
  closedAt?: string;
  subLots: SubLot[];
  terms_conditions?: any[];
  terms?: string;
  inspection: string;
  photos: string[];
  contact: { name: string; phone: string; email?: string };
  reviewComment?: string;
  [key: string]: any;
};

const first = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== "");
const stringValue = (value: any, fallback = "—") => String(first(value, fallback));
const numberValue = (value: any, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

function responseRows(payload: any): any[] {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.data?.items, payload?.data?.auctions, payload?.items, payload?.auctions, payload?.results];
  return candidates.find(Array.isArray) ?? [];
}

function responseRecord(payload: any): any {
  const candidates = [payload?.data?.auction, payload?.data?.item, payload?.data?.data?.auction, payload?.data?.data?.item, payload?.auction, payload?.item, payload?.data?.data, payload?.data, payload];
  return candidates.find((value) => value && typeof value === "object" && !Array.isArray(value)) ?? {};
}

export function mapAuction(raw: any): Auction {
  const row = raw?.auction ?? raw?.item ?? raw ?? {};
  const code = stringValue(first(row.code, row.auction_code, row.reference, row.id), "");
  const statusRaw = stringValue(first(row.status_label, row.status, row.workflow_status, row.state), "Draft");
  const statusMap: Record<string, string> = {
    pending_approval: "Pending Approval", submitted: "Pending Approval", under_review: "Pending Approval",
    sent_back: "Sent Back", rejected: "Rejected", approved: "Approved", published: "Published",
    live: "Live", closed: "Closed", cancelled: "Cancelled", canceled: "Cancelled",
  };
  const status = statusMap[statusRaw.toLowerCase()] ?? statusRaw;
  const organization = row.company ?? row.organization ?? row.vendor ?? row.seller ?? {};
  const location = row.location ?? row.site ?? {};
  const schedule = row.schedule ?? {};
  const prices = row.pricing ?? row.price ?? {};
  const terms = first(row.terms_conditions, row.termsAndConditions, row.terms_conditions_list);
  return {
    ...row,
    id: code,
    status,
    title: stringValue(first(row.title, row.name, row.auction_title), code || "Auction"),
    company: stringValue(first(row.company_name, organization.name, row.vendor_name, row.seller_name, typeof organization === "string" ? organization : undefined)),
    plant: stringValue(first(row.plant, row.plant_name, location.plant)),
    warehouse: stringValue(first(row.warehouse, row.warehouse_name, location.warehouse)),
    location: stringValue(first(row.location_name, typeof location === "string" ? location : undefined, row.address, row.city)),
    category: stringValue(first(row.category_name, row.category?.name, row.category, row.material_category)),
    lotType: stringValue(first(row.lot_type, row.lotType, row.lot_mode), "Single Lot"),
    submittedBy: stringValue(first(row.submitted_by_name, row.submitted_by, row.created_by_name, row.vendor_name, organization.name)),
    submittedAt: stringValue(first(row.submitted_at, row.created_at, row.submittedAt), ""),
    scheduleStart: stringValue(first(row.schedule_start, row.start_at, row.starts_at, schedule.start, row.scheduleStart), ""),
    scheduleEnd: stringValue(first(row.schedule_end, row.end_at, row.ends_at, schedule.end, row.scheduleEnd), ""),
    reservePriceInr: numberValue(first(row.reserve_price, row.reserve_price_inr, prices.reserve, row.reservePriceInr)),
    startingPriceInr: numberValue(first(row.starting_price, row.starting_price_inr, prices.starting, row.startingPriceInr)),
    currentHighestInr: numberValue(first(row.current_highest_bid, row.current_highest_inr, row.highest_bid, row.currentHighestInr), 0),
    finalPriceInr: row.final_price == null && row.finalPriceInr == null ? undefined : numberValue(first(row.final_price, row.final_price_inr, row.finalPriceInr)),
    bidders: numberValue(first(row.bidder_count, row.bidders, row.total_bidders), 0),
    winner: first(row.winner_name, row.winner, row.awarded_to),
    closedAt: first(row.closed_at, row.closedAt),
    subLots: Array.isArray(row.sub_lots) ? row.sub_lots : Array.isArray(row.subLots) ? row.subLots : Array.isArray(row.lots) ? row.lots : [],
    terms_conditions: Array.isArray(terms) ? terms : [],
    terms: stringValue(first(row.terms, typeof terms === "string" ? terms : undefined), ""),
    inspection: stringValue(first(row.inspection, row.inspection_details, row.inspection_notes), "—"),
    photos: Array.isArray(row.photos) ? row.photos.map((photo: any) => typeof photo === "string" ? photo : first(photo.url, photo.path, photo.download_url)).filter(Boolean) : [],
    contact: {
      name: stringValue(first(row.contact_name, row.contact?.name, organization.contact_name), "—"),
      phone: stringValue(first(row.contact_phone, row.contact?.phone, organization.phone), "—"),
      email: first(row.contact_email, row.contact?.email, organization.email),
    },
    reviewComment: first(row.review_comment, row.reviewComment, row.review_remarks),
  };
}

export async function fetchAuctions(params: Record<string, any> = {}): Promise<Auction[]> {
  const payload = await adminApi.getAuctions(params);
  return responseRows(payload).map(mapAuction).filter((auction) => auction.id);
}

export function useAuctionsState() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAuctions(await fetchAuctions());
    } catch (cause) {
      setAuctions([]);
      setError(cause instanceof Error ? cause.message : "Failed to load auctions.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { auctions, loading, error, refetch };
}

export function useAuctions(): Auction[] {
  return useAuctionsState().auctions;
}

export function useAuction(id: string) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApi.getAuction(id);
      setAuction(mapAuction(responseRecord(payload)));
    } catch (cause) {
      setAuction(null);
      setError(cause instanceof Error ? cause.message : "Failed to load auction.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { void refetch(); }, [refetch]);
  return { auction, loading, error, refetch };
}

// Kept only for legacy callers; mutations must go through adminApi so they
// cannot falsely report a local success when the server rejects the change.
export function listAuctions(): Auction[] { return []; }
export function getAuction(_id: string): Auction | undefined { return undefined; }
export function updateAuction(_id: string, _patch: Partial<Auction>) { return undefined; }
export function auctionStatusTone(status: AuctionStatus) {
  if (["Approved", "Published", "Live"].includes(status)) return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" };
  if (["Rejected", "Cancelled"].includes(status)) return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" };
  if (["Pending Approval", "Sent Back"].includes(status)) return { bg: "bg-accent/10", text: "text-accent", ring: "ring-accent/30", dot: "bg-accent" };
  return { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border", dot: "bg-muted-foreground" };
}
export function formatInr(n: number): string { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0); }

export type TokenType = "View Only" | "Can Bid";
export type TokenStatus = string;
export type TokenRow = { id: string; token: string; auctionId: string; type: TokenType; expiresAt: string; status: string; link?: string; [key: string]: any };

function mapToken(raw: any): TokenRow {
  const token = raw?.token ?? raw?.access_token ?? raw?.code ?? "";
  const type = String(raw?.type ?? raw?.access_type ?? "View Only").toLowerCase().includes("bid") ? "Can Bid" : "View Only";
  return {
    ...raw,
    id: String(raw?.id ?? raw?.code ?? token),
    token: String(token),
    auctionId: String(raw?.auction_code ?? raw?.auction_id ?? raw?.auctionId ?? "—"),
    type,
    expiresAt: String(raw?.expires_at ?? raw?.expiresAt ?? ""),
    status: String(raw?.status ?? (raw?.revoked_at ? "Revoked" : "Active")),
    link: raw?.link ?? raw?.url,
  };
}

function tokenRows(payload: any): TokenRow[] {
  const data = payload?.data ?? payload;
  const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.tokens) ? data.tokens : [];
  return rows.map(mapToken);
}

export function useTokensState() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTokens(tokenRows(await adminApi.getTokens())); }
    catch (cause) { setTokens([]); setError(cause instanceof Error ? cause.message : "Failed to load tokens."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { tokens, loading, error, refetch };
}

export function useTokens(): TokenRow[] { return useTokensState().tokens; }
export async function createToken(input: { auctionId: string; type: TokenType; expiresAt: string }) {
  return adminApi.createToken({ auction_code: input.auctionId, access_type: input.type === "Can Bid" ? "bid" : "view", expires_at: input.expiresAt });
}
export async function revokeToken(id: string) { return adminApi.revokeToken(id); }
export function tokenShareLink(token: TokenRow) {
  const origin = typeof window === "undefined" ? "https://scrapifyauctions.com" : window.location.origin;
  return token.link || `${origin}/auction-access/${encodeURIComponent(token.token)}`;
}
export function tokenStatusTone(status: TokenStatus) {
  if (status.toLowerCase() === "active") return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" };
  if (status.toLowerCase() === "revoked") return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" };
  return { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border", dot: "bg-muted-foreground" };
}

export type AuditEntry = any;
export function seedAuditLog(): AuditEntry[] { return []; }
export function auditToCSV(_rows: AuditEntry[]): string { return ""; }
