import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ---------------- status pill ---------------- */
const TONES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-primary/10 text-primary ring-primary/25",
  live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warn: "bg-accent/10 text-accent ring-accent/30",
  danger: "bg-red-50 text-red-700 ring-red-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  Live: "live",
  Operational: "good",
  Success: "good",
  Verified: "good",
  Approved: "good",
  Accepted: "good",
  Active: "good",
  Completed: "good",
  Paid: "good",
  Refunded: "good",
  Delivered: "good",
  Resolved: "good",
  Closed: "neutral",
  Cancelled: "neutral",
  Inactive: "neutral",
  Draft: "neutral",
  Dismissed: "neutral",
  Scheduled: "info",
  "Ready to Publish": "info",
  "In Progress": "info",
  Processing: "info",
  Queued: "info",
  Issued: "info",
  Monitoring: "info",
  Running: "info",
  Investigating: "info",
  "Draft Review": "warn",
  Pending: "warn",
  "Pending KYB": "warn",
  "Pending Approval": "warn",
  "Pending Verification": "warn",
  "On Hold": "warn",
  "Awaiting Decision": "warn",
  "Low Competition": "warn",
  "Payment Pending": "warn",
  Degraded: "warn",
  Retrying: "warn",
  Overdue: "danger",
  Failed: "danger",
  Rejected: "danger",
  Suspended: "danger",
  Blacklisted: "danger",
  Blocked: "danger",
  Down: "danger",
  Exception: "danger",
  Disputed: "danger",
  "Winner Default": "danger",
  Defaulted: "danger",
  "Fulfilment Exception": "danger",
  "Technical Exception": "danger",
  "Below Reserve": "danger",
  Forfeited: "danger",
  Expired: "danger",
  Bounced: "danger",
  Escalated: "danger",
  Critical: "danger",
  High: "danger",
  Medium: "warn",
  Low: "neutral",
  Open: "warn",
  "Above Target": "purple",
  Confirmed: "purple",
  Contained: "purple",
  Restricted: "purple",
};

export function StatusPill({ value, tone }: { value: string; tone?: keyof typeof TONES }) {
  const t = tone ?? STATUS_TONE[value] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        TONES[t],
      )}
    >
      {t === "live" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {value}
    </span>
  );
}

export function RiskDot({ level }: { level: string }) {
  const color =
    level === "Critical" ? "bg-red-600" : level === "High" ? "bg-accent" : level === "Medium" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", color)} /> {level}
    </span>
  );
}

/* ---------------- stat card ---------------- */
export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "warn" | "danger" | "live" | "good";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card-premium relative overflow-hidden p-4">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          tone === "danger" ? "bg-red-500" : tone === "warn" ? "bg-accent" : tone === "live" ? "bg-emerald-500" : "gradient-gold",
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
      </div>
      <div className="mt-1.5 font-display text-2xl leading-none text-foreground">{value}</div>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ---------------- section ---------------- */
export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-premium p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* ---------------- tabs (filter chips) ---------------- */
export function ChipTabs<T extends string>({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: readonly T[];
  value: T;
  onChange: (t: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-colors",
            value === t
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {t}
          {counts?.[t] !== undefined && (
            <span className={cn("ml-1.5 text-[10px]", value === t ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
              {counts[t]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------------- data table ---------------- */
export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right";
};

export function DataTable<T extends { id: string }>({
  rows: rowsProp,
  data,
  columns,
  onRowClick,
  searchable = true,
  searchKeys,
  exportName,
  toolbar,
  empty = "No records match the current filters.",
  dense,
  pageSize = 12,
  searchPlaceholder,
}: {
  rows?: T[];
  data?: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchKeys?: (row: T) => string;
  exportName?: string;
  toolbar?: React.ReactNode;
  empty?: string;
  dense?: boolean;
  pageSize?: number;
  searchPlaceholder?: string;
}) {
  const rows = rowsProp ?? data ?? [];
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const base = q
      ? rows.filter((r) => (searchKeys ? searchKeys(r) : JSON.stringify(r)).toLowerCase().includes(q.toLowerCase()))
      : rows;
    if (!sort) return base;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return base;
    return [...base].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      return av === bv ? 0 : (av > bv ? 1 : -1) * sort.dir;
    });
  }, [rows, q, sort, columns, searchKeys]);

  React.useEffect(() => setPage(0), [q, rows.length]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);

  function exportCsv() {
    const header = columns.map((c) => c.header).join(",");
    const body = filtered
      .map((r) =>
        columns
          .map((c) => {
            const v = c.sortValue ? c.sortValue(r) : "";
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportName ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-3">
      {(searchable || toolbar || exportName) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="h-9 rounded-full pl-9 text-sm"
              />
            </div>
          )}
          {toolbar}
          {exportName && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() =>
                        setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))
                      }
                    >
                      {c.header}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr
                key={r.id}
                onClick={() => onRowClick?.(r)}
                className={cn(
                  "border-b border-border/60 last:border-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/40",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-3 align-middle", dense ? "py-2" : "py-3", c.align === "right" && "text-right", c.className)}
                  >
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span>
              {page + 1} / {pages}
            </span>
            <Button variant="outline" size="sm" className="h-7" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- detail drawer ---------------- */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border bg-muted/30 px-5 py-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- misc ---------------- */
export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function FieldGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <dl className={cn("grid gap-4", cols === 3 ? "sm:grid-cols-3" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-2")}>{children}</dl>;
}

export function Timeline({ items }: { items: Array<{ at: string; who?: string; note: string }> }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {items.map((i, idx) => (
        <li key={idx} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-background" />
          <p className="text-sm text-foreground">{i.note}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {i.who ? `${i.who} · ` : ""}
            {i.at}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground">
      <SlidersHorizontal className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xs font-medium text-foreground focus:outline-none"
      >
        <option value="All">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {value !== "All" && (
        <button type="button" onClick={() => onChange("All")} aria-label={`Clear ${label}`}>
          <X className="h-3 w-3" />
        </button>
      )}
    </label>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function ReasonNote({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs text-foreground">
      <span className="font-semibold uppercase tracking-wider text-accent">Reason required</span>
      <p className="mt-1 text-muted-foreground">{text}</p>
    </div>
  );
}
