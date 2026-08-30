# Scrapify — Admin Panel Review & Customer Panel Flow Specification

Version 1.0 · Handover document for the customer-facing website + mobile app (paste sections 7 into Lovable as build prompts).

---

## 1. Product architecture (three panels, one data model)

| Panel | Users | Purpose |
|---|---|---|
| **Admin Panel** (this project) | Admin, Super Admin | Master data, approvals, auction governance, monitoring, reports, audit |
| **Customer / Bidder Panel** (website + mobile app) | Vendors / Buyers | Registration, KYC, browse auctions, EMD, bid, win, pay, lift |
| **Seller / Organization Panel** (optional, can live inside customer app) | Organization users | Create auctions, upload lots, view results |

Golden rule: **the admin panel is the source of truth for state.** The customer panel never invents a status — it only reads statuses admin produces (`Pending`, `Approved`, `Rejected`, `Suspended`, `Published`, `Live`, `Closed`, …) and writes only the events admin consumes (registration submitted, document uploaded, EMD paid, bid placed).

---

## 2. Admin panel review — module by module

### 2.1 Shell
Navy collapsible sidebar (state persisted, mobile drawer, active-route highlight); topbar with global search, notifications, **role switcher (Admin / Super Admin)** and avatar menu. Modules: Dashboard, Organizations, Vendors, Auctions, Reports, Tokens, Finance, Audit Log, Settings.

### 2.2 Dashboard
KPI cards (Pending Vendor Approvals, Pending Org Approvals — Super Admin only, Live Auctions, Awaiting Publish, Total Vendors), a **Needs Attention** table (anything pending > 24h, orange highlight), and a recent-activity feed of the last 10 admin actions.

### 2.3 Organizations (seller companies)
Statuses: `Draft` → `Pending Super Admin Approval` → `Approved` / `Rejected` (reason mandatory).
Data: company name, address, total units; per unit — Name, GST, Location, Bank (A/C, IFSC, Bank name); org-level bank details; documents (GST Certificate, PAN, Cancelled Cheque, Certificate of Incorporation, Authorisation Letter).
Rule: **Organization approval = Super Admin only. Vendor approval = Admin.**

### 2.4 Vendors (buyers / bidders)
Statuses: `Pending` → `Approved` / `Rejected` / `Suspended` (reason mandatory on reject and suspend).
Data: Company, Location, Contact, Email, Phone, GST, **Material Interest** (Ferrous, Non-Ferrous, E-Waste, Paper, Plastic, Rubber), **License number**, KYC docs (License, GST Certificate, PAN, Cancelled Cheque), auction-participation history.
List: filters (status, material, location), search, Approved tab, CSV export.

### 2.5 Auctions
Statuses: `Pending Approval` → `Approved` / `Sent Back` / `Rejected` → `Published` → `Live` → `Closed`; plus `Cancelled`.
Review screen: lots/sub-lots, photos, schedule, inspection, terms, contact, reserve and starting price.
Publish screen: notification channel checklist (Email / SMS / Portal).
Live monitor: unmasked bid history, **Extend** (reason + minutes), **End Now**.
Overview chart: Completed / Pending / Upcoming / Failed.

### 2.6 Tokens
Shareable per-auction access links — `View Only` or `Can Bid`, with expiry and Active / Revoked / Expired states; link format `/join/<token>`.

### 2.7 Reports
H1 Summary Report, All Bid Report, All Bidder Report — landscape A4 PDFs with STA, H1 bid/bidder, EMD hold, GST 18%, TCS 1% and balance; bulk and per-row export.

### 2.8 Audit Log
Read-only, filterable: timestamp, user, role, action, IP.

### 2.9 Gaps in admin today
Finance and Settings are still placeholders. Finance should cover the EMD ledger, invoices, GST/TCS summary, refunds and payouts. Settings should cover users & roles, notification templates, auction defaults (increment, anti-sniping window, EMD %) and the material master.

---

## 3. Customer panel — full flow to build

### FLOW 1 — Registration & KYC (maps to admin **Vendors**)
1. Sign up: email + mobile OTP, password.
2. Company profile: Company Name, Location/Address, Contact Person, GST Number, License Number.
3. **Material Interest** multi-select (same six categories as admin).
4. KYC upload: License, GST Certificate, PAN Card, Cancelled Cheque.
5. Bank details (A/C, IFSC, Bank name) for EMD refunds.
6. Submit → status `Pending`, show "Under review, usually within 24 hours".
7. Admin decision drives the app:
   - `Approved` → full access + welcome notification.
   - `Rejected` → show the admin's **rejection reason** verbatim + "Edit & resubmit".
   - `Suspended` → block bidding, show the **suspension reason**, offer support contact.
8. After approval KYC fields become read-only; edits go through a "request update" that pushes the vendor back into the admin queue.

### FLOW 2 — Browse & discover (maps to admin **Auctions / Published**)
- Only `Published`, `Live` and `Closed` auctions are visible. Never expose `Pending Approval`, `Sent Back`, `Rejected` or drafts.
- Card: title, category chip, location, quantity, starting price, start/end time, live countdown, lot-type badge (Single / Lot-wise), watch toggle.
- Filters: category, location, status (Upcoming / Live / Closed), date range. Sort: ending soon, newest, price.
- Detail page: photo gallery, sub-lot table, price policy, inspection details, terms, documents, seller contact (masked until participation is approved).

### FLOW 3 — Auction participation & EMD
1. "Register for this auction" CTA (only for `Approved` vendors).
2. EMD requirement shown from the auction terms (5% / 7.5% / 10% etc.).
3. Pay EMD (gateway or NEFT reference upload) → `EMD Pending` → `EMD Confirmed`.
4. Only EMD-confirmed vendors enter the bidding room when the auction goes `Live`.
5. Token links: `/join/<token>` grants `View Only` (watch, no bid box) or `Can Bid` access without full registration, respecting expiry and revocation.

### FLOW 4 — Live bidding (mirror of admin **Live Monitor**)
- Realtime price, remaining time, my rank, bidder count.
- **Masked identities** for customers (Bidder A/B/C). Only the admin monitor shows real names.
- Bid box with minimum-increment validation, quick-bid buttons and a confirm dialog.
- Lot-wise auctions: bid per sub-lot.
- Anti-sniping: when admin extends, push the new end time instantly and show "Auction extended by X minutes".
- Admin "End Now" must immediately close the customer screen and show the result.
- Notifications: outbid, extension, closing soon (T-5 min), result — push + email + SMS.

### FLOW 5 — Post-auction / award
- Result screen: Won / Lost / Reserve not met.
- Winner: award letter PDF and payable summary — H1 price, **GST 18%**, **TCS 1%**, less EMD hold, balance payable — identical to the admin H1 report.
- Payment upload or gateway, then lifting schedule, gate pass and delivery status.
- Loser: EMD refund tracker (Initiated → Processed → Credited).

### FLOW 6 — Wallet / EMD ledger (maps to admin **Finance**)
Balance, EMD blocked per auction, refunds, transaction history, downloadable statements and invoices.

### FLOW 7 — Notifications
One template set shared with the admin publish channels: Email / SMS / in-app + push. Events: registration decision, auction published in my categories, starting in 1 hour, outbid, extended, closed, won/lost, payment due, EMD refunded.

### FLOW 8 — Seller / Organization flow (if in the same app)
Create organization → units (GST, location, bank) → org bank + documents → submit → `Pending Super Admin Approval` → approved → create auction (lots, photos, schedule, inspection, terms, reserve) → submit → admin review → `Sent Back` shows admin comments for editing → published → live results dashboard.

### FLOW 9 — Mobile-app specifics
Biometric login, push notifications, offline-safe bid confirmation (never double-submit), camera capture for KYC uploads, compact live screen with sticky bid bar, countdown synced to server time (never device time).

---

## 4. Status contract (must match exactly on both sides)

```text
VENDOR   Pending -> Approved | Rejected(reason) ; Approved -> Suspended(reason) -> Approved
ORG      Draft -> Pending Super Admin Approval -> Approved | Rejected(reason)
AUCTION  Pending Approval -> Approved | Sent Back(comment) | Rejected(reason)
         Approved -> Published -> Live -> Closed ; any -> Cancelled
TOKEN    Active -> Revoked | Expired
EMD      Not Paid -> Pending -> Confirmed -> Refund Initiated -> Refunded
```

Visibility rules for customers: a vendor sees only its own data; auctions are visible only when `Published`, `Live` or `Closed`; bidder identities are masked; the reserve price is hidden (show only "reserve met / not met").

---

## 5. Money rules (single source of truth)
- EMD % is defined per auction in the admin terms.
- GST 18% on the H1 value; TCS 1% on (value + GST) unless the client confirms otherwise.
- Balance payable = H1 value + GST + TCS − EMD held.
- These formulas already exist in the admin H1 report and must be reused verbatim in the customer payable summary.

---

## 6. Suggested build order for the customer panel
1. Auth + registration/KYC + status screens (Flow 1)
2. Browse + auction detail (Flow 2)
3. Participation + EMD (Flow 3)
4. Live bidding + realtime (Flow 4)
5. Results, payment, lifting (Flow 5)
6. Wallet / EMD ledger + documents (Flow 6)
7. Notifications (Flow 7)
8. Seller / organization module (Flow 8)
9. Mobile polish (Flow 9)

---

## 7. Ready-to-paste Lovable prompts

**Prompt 1 — Registration & KYC**
> Same theme. Build the customer registration flow: signup (email + mobile OTP), company profile (Company Name, Address, Contact Person, GST, License Number), Material Interest multi-select (Ferrous, Non-Ferrous, E-Waste, Paper, Plastic, Rubber), KYC uploads (License, GST Certificate, PAN, Cancelled Cheque) and bank details. On submit set status Pending and show an "under review" screen. Handle Approved, Rejected (show the admin rejection reason + resubmit) and Suspended (block bidding, show reason).

**Prompt 2 — Browse & detail**
> Build auction browsing for approved vendors. Only show auctions with status Published, Live or Closed. Card grid with category chip, location, quantity, starting price, live countdown and watch toggle; filters for category/location/status/date and sort by ending soon. Detail page with photo gallery, sub-lot table, inspection, terms, documents and a "Register for this auction" CTA.

**Prompt 3 — EMD & participation**
> Add auction registration with EMD: show the EMD % from the auction terms, collect payment (gateway or NEFT reference upload), track Not Paid → Pending → Confirmed. Only EMD-confirmed vendors can enter the live bidding room.

**Prompt 4 — Live bidding**
> Build the live bidding room: realtime price, server-synced countdown, my rank, bidder count, masked bidder aliases, minimum-increment validation, confirm dialog, per-sub-lot bidding for lot-wise auctions, and instant handling of admin Extend and End Now. Send outbid / extended / closing-soon notifications.

**Prompt 5 — Results & payments**
> Build the post-auction flow: result screen (Won / Lost / Reserve not met), award letter PDF, payable summary (H1 value + GST 18% + TCS 1% − EMD held = balance), payment upload, lifting schedule and gate pass, plus an EMD refund tracker for losers.

**Prompt 6 — Wallet & notifications**
> Build the wallet / EMD ledger (balance, blocked EMD per auction, refunds, transaction history, invoice downloads) and a notification centre with email/SMS/in-app preferences per event type.

---

## 8. Open items to confirm with the client
1. Should Material Interest and License appear in the customer-facing registration form?
2. EMD percentage policy — per auction or platform-wide?
3. TCS applicability and rate confirmation.
4. Can token (guest) bidders win, or are they view-only in practice?
5. Report field list — the three current reports are a draft.
6. Does the seller / organization flow live inside the customer app or in a separate portal?