// Organization store compatibility surface. Organizations are API-owned; no
// seeded organization or localStorage business state is created here.
export type OrgStatus = string;
export type UnitBank = any;
export type Unit = any;
export type OrgDocument = any;
export const ORG_DOCUMENT_TYPES: readonly string[] = [];
export type Organization = any;
export function listOrganizations(): Organization[] { return []; }
export function getOrganization(_id: string): Organization | undefined { return undefined; }
export function upsertOrganization(_org: Organization) { return undefined; }
export function updateStatus(_id: string, _status: OrgStatus, _reason?: string) { return undefined; }
export function newOrgId() { return `ORG-${Date.now()}`; }
export function useOrganizations(): Organization[] { return []; }
export function isUnitComplete(_u: Unit): boolean { return false; }
export function isOrgComplete(_o: Organization): boolean { return false; }
export function statusTone(_s: OrgStatus) { return { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border", dot: "bg-muted-foreground" }; }
