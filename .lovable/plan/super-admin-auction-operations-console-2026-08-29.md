# Super Admin & Auction Operations Console

Turn the current Scrapify admin into the full multi-industry operations console described in your spec — same theme (navy/orange, Inter, existing card, badge and table styles), no restyling.

## What changes

### 1. Navigation shell
Replace the flat 9-item sidebar with grouped, collapsible sections:
Overview · Operations · Fulfilment · Customers · Vendors · Finance · Risk & Security · Configuration · System.
Sections remember open/closed state, keep the collapsed-rail mode, keyboard access and active highlighting. Topbar global search becomes a categorized command palette (events, customers, vendors, bids, payments, refunds, orders, invoices, disputes, documents, users). Role switcher extends to Super Admin, Operations, Auction Manager, Compliance, Finance, Support, Security, Auditor, Customer Success — nav items and actions hide by permission.

### 2. Shared operations UI kit
Reusable pieces every module uses, so screens stay dense and consistent:
data table with advanced filters, saved views, column manager, bulk actions, export; queue-tab header; status/severity/risk badges; reason-required confirm modal; side drawer for record detail; audit trail panel; KPI strip (compact, not giant cards); empty/skeleton/exception states.

### 3. Modules (mock data, full routes)
- **Dashboard** — compact KPI strip (16 metrics) + charts: GMV, forward vs reverse value, platform fees, success rate, customer/vendor growth, auction & category distribution, participation, settlement aging, dispute trend, savings/realisation.
- **Live Auction Control Room** — live event grid with price, H1/L1, participants, bid velocity, extensions, connection health, integrity score, alerts; detail monitor with realtime chart, bid stream, masked bidders, server clock, extension history, admin action log; controls Pause / Resume / Extend / Emergency Hold / Broadcast / Remove Participant / Cancel, each behind reason + confirm + permission + audit entry.
- **Event Queue** — 15 queue tabs (Draft Review → Cancelled) with customer/category/type/owner/value/risk/date filters.
- **Event Workspace** — one record, 18 tabs (Summary, Items/Lots, Participants, RFx, Documents, Qualification, Clarifications, Inspection, Auction Rules, Live Bids, Approvals, Award, Finance, Fulfilment, Disputes, Security, Communications, Audit).
- **RFx, Inspections, Clarifications, Approvals, Awards** — monitoring lists + detail, award queues incl. winner acceptance and default handling.
- **Default Centre** — H1/H2 · L1/L2 default cases with Forfeit / Next Rank / Re-auction / Cancel / Suspend / Rank Downgrade.
- **Fulfilment** — Orders, Deliveries/Pickups, Acceptance, Disputes + overdue/variance/SLA alert queues.
- **Customers** — Companies, Facilities, Customer Users, Approval Policies, Configuration, plus customer health/churn view.
- **Vendors** — Directory, KYB queue, Compliance & Document centre (expiry buckets, OCR vs entered mismatch), Ranking (A–D with score explanation and audited manual override), Suspensions, Blacklist.
- **Finance** — Security/EMD, Payments, Refunds (retry/hold/escalate), Forfeitures, Settlements, Payouts, Invoices, Reconciliation exceptions; maker-checker on sensitive actions.
- **Risk & Security** — Integrity alerts, Fraud & collusion centre (shared bank/IP/device, bid rotation, sniping patterns), Related parties, Login security, Security incidents with freeze/force-logout actions and timelines, Audit log with before/after, reason, correlation ID, IP (immutable).
- **Exception Centre** — aggregated exceptions with severity, age, owner, SLA, recommended action.
- **Configuration** — Categories & attribute tree, Units, Auction/RFx/Terms/Fulfilment templates, Tax profiles, Notification templates with variables + preview, Scoring/Ranking/Payment rules, Users & Roles with permission matrix and maker-checker.
- **System** — Reports (18 platform reports with export), Notification logs, Jobs, System health with degradation banners, Settings.

### 4. Mock data
One realistic dataset spanning Forward Asset Sale, Reverse Procurement, Transport Lane, Machinery Auction, Scrap Sale, Facility Services, Commodity RFQ and Professional Services RFP — shared across every module so events, vendors, payments, disputes and audit entries cross-link.

## Delivery order
1. Shell + nav + permissions + UI kit + mock dataset
2. Dashboard, Control Room, Event Queue, Event Workspace
3. Customers, Vendors, KYB, Documents, Ranking
4. Finance, Refunds, Reconciliation, Awards, Defaults, Fulfilment, Disputes
5. Risk & Security, Exception Centre, Audit
6. Configuration, Reports, System

## Notes
- Existing Organizations, Vendors, Auctions, Tokens, Reports and Audit screens are folded into the new structure; existing PDF reports (H1, All Bid, All Bidder) are kept and reachable from Reports and the Event Workspace.
- Everything is mock/in-memory — no backend in this pass.
