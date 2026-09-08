/**
 * Compatibility exports for operations screens.
 *
 * Operational records must come from the API stores. This module intentionally
 * contains no seeded business data; empty API responses render empty states.
 */
export const NOW = new Date();

export const fmtMoney = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const fmtDay = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export function ageHours(iso: string) {
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : Math.max(0, Math.round((Date.now() - value) / 3600000));
}

export function ageLabel(iso: string) {
  const hours = ageHours(iso);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function countdown(iso: string) {
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) return "—";
  const ms = value - Date.now();
  if (ms <= 0) return "ended";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export const CATEGORIES = [] as readonly string[];
export type Category = string;
export const EVENT_TEMPLATES = [] as readonly string[];
export type EventTemplate = string;
export const EVENT_STATUSES = [] as readonly string[];
export type EventStatus = string;

export type RiskLevel = "Low" | "Medium" | "High" | "Critical" | string;
export type Severity = "Low" | "Medium" | "High" | "Critical" | string;
export type CustomerStatus = string;
export type CustomerUser = any;
export type Customer = any;
export type Vendor = any;
export type VendorDocument = any;
export type AuctionEvent = any;
export type Participant = any;
export type Bid = any;
export type FraudAlert = any;
export type RelatedParty = any;
export type SecurityIncident = any;
export type LoginEvent = any;
export type ExceptionItem = any;

export const customers: Customer[] = [];
export const vendors: Vendor[] = [];
export const allDocuments: VendorDocument[] = [];
export const events: AuctionEvent[] = [];
export const liveEvents: AuctionEvent[] = [];
export const securities: any[] = [];
export const payments: any[] = [];
export const refunds: any[] = [];
export const settlements: any[] = [];
export const orders: any[] = [];
export const disputes: any[] = [];
export const fraudAlerts: FraudAlert[] = [];
export const securityIncidents: SecurityIncident[] = [];
export const loginEvents: LoginEvent[] = [];
export const relatedParties: RelatedParty[] = [];
export const auditLog: any[] = [];
export const notificationLogs: any[] = [];
export const adminUsers: any[] = [];

export function getEvent(_id: string): AuctionEvent | undefined { return undefined; }
export function getVendor(_id: string): Vendor | undefined { return undefined; }
export function getCustomer(_id: string): Customer | undefined { return undefined; }
export function documentBucket(_document: VendorDocument) { return "Unknown"; }
