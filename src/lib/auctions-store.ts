// Auction store compatibility surface. Records are API-owned; no local
// fixture or localStorage business state is created here.
export type AuctionStatus = string;
export type AuctionCategory = string;
export type SubLot = any;
export type BidEntry = any;
export type Auction = any;
export function listAuctions(): Auction[] { return []; }
export function getAuction(_id: string): Auction | undefined { return undefined; }
export function updateAuction(_id: string, _patch: Partial<Auction>) { return undefined; }
export function useAuctions(): Auction[] { return []; }
export function auctionStatusTone(_s: AuctionStatus) { return "neutral"; }
export function formatInr(n: number): string { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); }

export type TokenType = "View Only" | "Can Bid";
export type TokenStatus = string;
export type TokenRow = any;
export function useTokens(): TokenRow[] { return []; }
export function createToken(_input: { auctionId: string; type: TokenType; expiresAt: string }) { return undefined; }
export function revokeToken(_id: string) { return undefined; }
export function tokenShareLink(_t: TokenRow) { return ""; }
export function tokenStatusTone(_s: TokenStatus) { return "neutral"; }

export type AuditEntry = any;
export function seedAuditLog(): AuditEntry[] { return []; }
export function auditToCSV(_rows: AuditEntry[]): string { return ""; }
