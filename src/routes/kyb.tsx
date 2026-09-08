import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/kyb")({ component: KybPage });

function KybPage() {
  const [rows, setRows] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [search, setSearch] = useState(""); const [reason, setReason] = useState("");
  const load = () => adminApi.getKyb({ search: search || undefined, per_page: 50 }).then((r) => setRows(r.data?.data ?? r.data ?? [])).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);
  const act = async (kind: "approve" | "reject" | "reverify") => { if (!selected || reason.trim().length < 3) return toast.error("Enter an audit reason."); try { if (kind === "approve") await adminApi.approveKyb(selected.id, reason); if (kind === "reject") await adminApi.rejectKyb(selected.id, reason); if (kind === "reverify") await adminApi.requestKybReverification(selected.id, reason); toast.success("KYB decision recorded"); setSelected(null); setReason(""); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Action failed"); } };
  return <><PageHeader title="Business Verification" description="Review provider-backed GSTIN and bank verification without exposing full account numbers." /><div className="mb-4 flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search GSTIN or masked account" /><Button onClick={load}>Search</Button></div><div className="grid gap-4 lg:grid-cols-[1fr_380px]"><div className="card-premium overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">User</th><th className="p-3">GSTIN</th><th className="p-3">Bank</th><th className="p-3">Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} onClick={() => { setSelected(r); setReason(""); }} className="cursor-pointer border-b hover:bg-muted/50"><td className="p-3">{r.user?.name ?? r.user?.email ?? "—"}</td><td className="p-3">{r.gstin ?? "—"}</td><td className="p-3">{r.bank_account_masked ?? "—"}</td><td className="p-3"><Badge>{r.overall_kyb_status}</Badge></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No verification records.</p>}</div>{selected && <div className="card-premium h-fit p-5"><h2 className="font-display text-lg font-bold">Review #{selected.id}</h2><div className="mt-4 space-y-2 text-sm"><p>GSTIN: <b>{selected.gstin ?? "—"}</b> · {selected.gstin_status ?? "—"}</p><p>Legal name: <b>{selected.legal_business_name ?? "—"}</b></p><p>Bank: <b>{selected.bank_name ?? "—"}</b> · {selected.bank_account_masked ?? "—"}</p><p>Name match: <b>{selected.bank_name_match_score ?? "—"}</b> ({selected.business_bank_match_status ?? "—"})</p><p>Overall: <Badge>{selected.overall_kyb_status}</Badge></p></div><Textarea className="mt-4" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mandatory audit reason" /><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => act("approve")}>Approve</Button><Button variant="destructive" onClick={() => act("reject")}>Reject</Button><Button variant="outline" onClick={() => act("reverify")}>Request reverification</Button></div></div>}</div></>;
}
