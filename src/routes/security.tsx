import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChipTabs, DataTable, DetailDrawer, Field, FieldGrid, RiskDot, StatCard, StatusPill, Timeline, type Column } from "@/components/ops/ops-ui";
import { adminUsers, fmtDate, loginEvents, securityIncidents, type AdminUser, type LoginEvent, type SecurityIncident } from "@/lib/ops/data";
import { useRole } from "@/hooks/use-role";
import { roleCan } from "@/lib/ops/roles";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — Scrapify Operations Console" },
      { name: "description", content: "Security incidents, admin access review, MFA posture and login telemetry for the auction platform." },
      { property: "og:title", content: "Security — Scrapify Operations Console" },
      { property: "og:description", content: "Track incidents, review privileged access and inspect login risk across the console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityConsole,
});

const TABS = ["Incidents", "Admin Access", "Login Activity"] as const;

function SecurityConsole() {
  const [role] = useRole();
  const canAct = roleCan(role, "act.security");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Incidents");
  const [incident, setIncident] = useState<SecurityIncident | null>(null);

  const incidentColumns: Column<SecurityIncident>[] = [
    { key: "t", header: "Incident", render: (i) => <span className="font-medium">{i.type}</span>, sortValue: (i) => i.type },
    { key: "s", header: "Severity", render: (i) => <StatusPill value={i.severity} />, sortValue: (i) => i.severity },
    { key: "e", header: "Entity", render: (i) => i.entity, sortValue: (i) => i.entity },
    { key: "o", header: "Owner", render: (i) => i.owner, sortValue: (i) => i.owner },
    { key: "op", header: "Opened", render: (i) => fmtDate(i.openedAt), sortValue: (i) => i.openedAt },
    { key: "st", header: "Status", render: (i) => <StatusPill value={i.status} />, sortValue: (i) => i.status },
  ];

  const userColumns: Column<AdminUser>[] = [
    { key: "n", header: "User", render: (u) => <span className="font-medium">{u.name}</span>, sortValue: (u) => u.name },
    { key: "e", header: "Email", render: (u) => <span className="text-xs text-muted-foreground">{u.email}</span> },
    { key: "r", header: "Role", render: (u) => u.role, sortValue: (u) => u.role },
    { key: "m", header: "MFA", render: (u) => <StatusPill value={u.mfa ? "Enabled" : "Missing"} tone={u.mfa ? "good" : "danger"} />, sortValue: (u) => String(u.mfa) },
    { key: "l", header: "Last login", render: (u) => fmtDate(u.lastLogin), sortValue: (u) => u.lastLogin },
    { key: "s", header: "Status", render: (u) => <StatusPill value={u.status} />, sortValue: (u) => u.status },
    {
      key: "a",
      header: "",
      align: "right",
      render: (u) => (
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!canAct} onClick={() => toast.success(`Sessions revoked for ${u.name}`)}>
          Revoke sessions
        </Button>
      ),
    },
  ];

  const loginColumns: Column<LoginEvent>[] = [
    { key: "u", header: "User", render: (l) => l.user, sortValue: (l) => l.user },
    { key: "r", header: "Role", render: (l) => <span className="text-xs text-muted-foreground">{l.role}</span> },
    { key: "res", header: "Result", render: (l) => <StatusPill value={l.result} />, sortValue: (l) => l.result },
    { key: "ip", header: "IP", render: (l) => <span className="font-mono text-xs">{l.ip}</span> },
    { key: "loc", header: "Location", render: (l) => l.location, sortValue: (l) => l.location },
    { key: "d", header: "Device", render: (l) => <span className="text-xs text-muted-foreground">{l.device}</span> },
    { key: "rk", header: "Risk", render: (l) => <RiskDot level={l.risk} />, sortValue: (l) => l.risk },
    { key: "at", header: "When", render: (l) => fmtDate(l.at), sortValue: (l) => l.at },
  ];

  return (
    <>
      <PageHeader
        title="Security"
        description="Incident response, privileged access review and authentication telemetry — every containment action is written to the audit trail."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open incidents" value={securityIncidents.filter((i) => i.status === "Open").length} tone="danger" />
        <StatCard label="Contained" value={securityIncidents.filter((i) => i.status === "Contained").length} tone="warn" />
        <StatCard label="Admin users" value={adminUsers.length} />
        <StatCard label="MFA gaps" value={adminUsers.filter((u) => !u.mfa).length} tone="warn" />
        <StatCard label="Failed / blocked logins" value={loginEvents.filter((l) => l.result !== "Success").length} tone="warn" />
      </div>

      <div className="card-premium p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ChipTabs tabs={TABS} value={tab} onChange={setTab} />
          {!canAct && <span className="text-xs text-accent">Containment actions require a Security or Super Admin role</span>}
        </div>
        {tab === "Incidents" && <DataTable rows={securityIncidents} columns={incidentColumns} exportName="security-incidents" onRowClick={setIncident} />}
        {tab === "Admin Access" && <DataTable rows={adminUsers} columns={userColumns} exportName="admin-users" />}
        {tab === "Login Activity" && <DataTable rows={loginEvents} columns={loginColumns} exportName="login-activity" pageSize={14} />}
      </div>

      <DetailDrawer
        open={!!incident}
        onOpenChange={(v) => !v && setIncident(null)}
        title={incident?.type ?? ""}
        subtitle={incident ? `${incident.id} · ${incident.entity}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={!canAct} onClick={() => toast.success("Incident contained")}>
              Contain
            </Button>
            <Button disabled={!canAct} onClick={() => { toast.success("Incident resolved"); setIncident(null); }}>
              Resolve
            </Button>
          </div>
        }
      >
        {incident && (
          <div className="space-y-4">
            <FieldGrid>
              <Field label="Severity" value={<StatusPill value={incident.severity} />} />
              <Field label="Status" value={<StatusPill value={incident.status} />} />
              <Field label="Owner" value={incident.owner} />
              <Field label="Opened" value={fmtDate(incident.openedAt)} />
            </FieldGrid>
            <Timeline items={incident.timeline.map((t) => ({ at: fmtDate(t.at), note: t.note }))} />
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
