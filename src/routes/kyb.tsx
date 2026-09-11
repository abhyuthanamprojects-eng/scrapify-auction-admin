import { createFileRoute } from "@tanstack/react-router";
import { Building2, CheckCircle2, Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/kyb")({ component: KybPage });

function KybPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getKyb({ search: search || undefined, per_page: 50 });
      const payload = response.data;
      setRows(Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load verification records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (kind: "approve" | "reject" | "reverify") => {
    if (!selected || reason.trim().length < 3) {
      toast.error("Enter an audit reason.");
      return;
    }

    try {
      if (kind === "approve") await adminApi.approveKyb(selected.id, reason);
      if (kind === "reject") await adminApi.rejectKyb(selected.id, reason);
      if (kind === "reverify") await adminApi.requestKybReverification(selected.id, reason);
      toast.success("KYB decision recorded");
      setSelected(null);
      setReason("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  return (
    <>
      <PageHeader
        title="Business Verification"
        description="Review provider-backed GSTIN and bank verification without exposing full account numbers."
      />

      <section className="card-premium mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load();
              }}
              placeholder="Search GSTIN or masked account"
              aria-label="Search GSTIN or masked account"
            />
          </div>
          <Button className="shrink-0" onClick={() => void load()} disabled={loading}>
            <Search className="mr-2 size-4" />
            Search
          </Button>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </section>

      <div
        className={`grid gap-5 ${selected ? "lg:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}
      >
        <section className="card-premium w-full overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/25 px-4 py-3 sm:px-5">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Verification records
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {loading
                  ? "Loading records…"
                  : `${rows.length} record${rows.length === 1 ? "" : "s"} found`}
              </p>
            </div>
            <ShieldCheck className="size-5 text-primary" />
          </div>

          {rows.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/20">
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold sm:px-5">User</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">GSTIN</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Bank</th>
                    <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isSelected = selected?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelected(row);
                          setReason("");
                        }}
                        className={`cursor-pointer border-b last:border-b-0 transition-colors hover:bg-primary/5 ${isSelected ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Building2 className="size-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-foreground">
                                {row.user?.name ?? row.user?.email ?? "—"}
                              </p>
                              {row.legal_business_name && (
                                <p className="text-xs text-muted-foreground">
                                  {row.legal_business_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground sm:px-5">
                          {row.gstin ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground sm:px-5">
                          {row.bank_account_masked ?? "—"}
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <Badge
                            variant={
                              row.overall_kyb_status === "verified" ? "default" : "secondary"
                            }
                          >
                            {row.overall_kyb_status ?? "pending"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </span>
              <h3 className="font-display text-base font-bold">No verification records</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {search
                  ? "Try a different GSTIN or masked account search."
                  : "Verified business records will appear here when available."}
              </p>
            </div>
          )}
        </section>

        {selected && (
          <aside className="card-premium h-fit p-5 lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected record
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">Review #{selected.id}</h2>
              </div>
              <Clock3 className="size-5 text-primary" />
            </div>

            <div className="mt-5 grid gap-3 rounded-xl bg-muted/30 p-4 text-sm">
              <Detail
                label="GSTIN"
                value={`${selected.gstin ?? "—"} · ${selected.gstin_status ?? "—"}`}
              />
              <Detail label="Legal name" value={selected.legal_business_name ?? "—"} />
              <Detail
                label="Bank"
                value={`${selected.bank_name ?? "—"} · ${selected.bank_account_masked ?? "—"}`}
              />
              <Detail
                label="Name match"
                value={`${selected.bank_name_match_score ?? "—"} (${selected.business_bank_match_status ?? "—"})`}
              />
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-muted-foreground">Overall status</span>
                <Badge>{selected.overall_kyb_status ?? "pending"}</Badge>
              </div>
            </div>

            <Textarea
              className="mt-4 min-h-24"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Mandatory audit reason"
              aria-label="Mandatory audit reason"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void act("approve")}>
                <CheckCircle2 className="mr-2 size-4" />
                Approve
              </Button>
              <Button variant="destructive" onClick={() => void act("reject")}>
                Reject
              </Button>
              <Button variant="outline" onClick={() => void act("reverify")}>
                Request reverification
              </Button>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
