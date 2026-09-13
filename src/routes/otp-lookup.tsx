import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api-client";
import {
  Clock3,
  Filter,
  History,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

type Channel = "all" | "sms" | "email";

type OtpRecord = {
  id: number;
  identifier: string;
  channel: "sms" | "email";
  purpose: string;
  status: "active" | "expired" | "used";
  attempts: number;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
};

type OtpMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  retention_days: number;
};

export const Route = createFileRoute("/otp-lookup")({
  head: () => ({
    meta: [
      { title: "OTP Lookup — Scrapify Admin" },
      {
        name: "description",
        content: "Read-only OTP delivery history with protected OTP values.",
      },
    ],
  }),
  component: OtpLookup,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatPurpose(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function OtpLookup() {
  const [records, setRecords] = useState<OtpRecord[]>([]);
  const [meta, setMeta] = useState<OtpMeta | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<Channel>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getOtpHistory({
        identifier: identifier.trim() || undefined,
        channel: channel === "all" ? undefined : channel,
        page,
        per_page: 50,
      });
      setRecords(response?.data ?? []);
      setMeta(response?.meta ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load OTP history.");
    } finally {
      setLoading(false);
    }
  }, [channel, identifier, page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  function submitFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    if (page === 1) void loadHistory();
  }

  return (
    <>
      <PageHeader
        title="OTP Lookup"
        description="Read-only delivery history for the last 90 days. OTP values are never displayed or recoverable."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void loadHistory()}
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh
          </Button>
        }
      />

      <div className="card-premium mb-4 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <form className="grid gap-3 md:grid-cols-12" onSubmit={submitFilters}>
          <div className="relative md:col-span-7">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Search mobile number or email"
              className="pl-9"
              aria-label="Search mobile number or email"
            />
          </div>
          <div className="md:col-span-3">
            <Select
              value={channel}
              onValueChange={(value) => {
                setChannel(value as Channel);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Filter by channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                <SelectItem value="sms">SMS only</SelectItem>
                <SelectItem value="email">Email only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="gap-2 md:col-span-2">
            <Search className="h-4 w-4" /> Show history
          </Button>
        </form>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold">OTP values are protected</p>
          <p className="mt-1 text-amber-900/80">
            This page records whether an OTP was created, used, or expired. It never reveals the
            code, which prevents administrators, logs, and database viewers from recovering user
            credentials.
          </p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">OTP records</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {meta?.total ?? 0} records found · last {meta?.retention_days ?? 90} days
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Mobile / Email</th>
                <th className="px-5 py-3 font-semibold">Channel</th>
                <th className="px-5 py-3 font-semibold">Purpose</th>
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Attempts</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                    Loading OTP history…
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                    No OTP records match these filters.
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((record) => (
                  <tr key={record.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="whitespace-nowrap px-5 py-4 font-medium">{record.identifier}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        {record.channel === "email" ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        {record.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatPurpose(record.purpose)}
                    </td>
                    <td className="px-5 py-4 font-medium text-muted-foreground">Protected</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          record.status === "used"
                            ? "bg-emerald-100 text-emerald-700"
                            : record.status === "expired"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{record.attempts}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(record.expires_at)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
