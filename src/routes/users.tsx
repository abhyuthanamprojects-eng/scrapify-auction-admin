import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  UserPlus,
  Trash2,
} from "lucide-react";
import { ADMIN_ROLES, type AdminRole } from "@/lib/ops/roles";
import { toast } from "sonner";
import { useAuth, type StaffUser } from "@/hooks/use-auth";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Staff Users & RBAC Management — Scrapify Admin" }] }),
  component: StaffUsersPage,
});

function StaffUsersPage() {
  const location = useLocation();
  if (location.pathname === "/users/new") return <Outlet />;
  return <StaffUsersContent />;
}

function StaffUsersContent() {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadStaff = async () => {
    try {
      const response = await adminApi.getOrgUsers();
      const rows = response.data ?? response.users ?? [];
      setStaffList(
        rows.map((rawRow: unknown) => {
          const row = rawRow as Record<string, unknown>;
          return {
            id: String(row.id ?? row.code ?? ""),
            name: String(row.name ?? row.full_name ?? ""),
            email: String(row.email ?? ""),
            phone: row.phone ? String(row.phone) : undefined,
            employeeId: String(row.employee_id ?? row.code ?? row.id ?? ""),
            role: (row.role_label ?? row.role ?? "Operations") as AdminRole,
            department: String(row.department ?? ""),
            status:
              row.status === "active"
                ? "active"
                : row.status === "pending_mfa"
                  ? "pending_mfa"
                  : "suspended",
            mfaEnabled: Boolean(row.mfa_enabled),
            lastLogin: row.last_login_at ? String(row.last_login_at) : undefined,
            permissions: Array.isArray(row.permissions) ? row.permissions : [],
          };
        }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load staff users.");
    }
  };

  useEffect(() => {
    void loadStaff();
  }, []);

  const toggleStatus = async (id: string) => {
    const staff = staffList.find((item) => item.id === id);
    if (!staff || !/^\d+$/.test(id)) return toast.error("This staff record has no API identifier.");
    const nextStatus = staff.status === "active" ? "suspended" : "active";
    try {
      await adminApi.updateOrgUser(Number(id), { status: nextStatus });
      await loadStaff();
      toast.info(`${staff.name} is now ${nextStatus.toUpperCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update staff user.");
    }
  };

  const deleteUser = async (staff: StaffUser) => {
    if (staff.email === currentUser?.email) return toast.error("You cannot delete your own account.");
    if (!/^\d+$/.test(staff.id)) return toast.error("This user has no API identifier.");
    const expected = `DELETE ${staff.email}`;
    const confirmation = window.prompt(
      `This permanently deletes ${staff.name} and all owned data. Type exactly:\n\n${expected}`,
    );
    if (confirmation !== expected) return;
    try {
      await adminApi.deleteOrgUser(Number(staff.id), staff.email);
      setStaffList((current) => current.filter((item) => item.id !== staff.id));
      toast.success("User and all owned data permanently deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user.");
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch = [s.name, s.email, s.employeeId, s.department].some((value) =>
      value.toLowerCase().includes(term),
    );
    return matchesSearch && (selectedRoleFilter === "all" || s.role === selectedRoleFilter);
  });
  const pageCount = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleStaff = filteredStaff.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          title="Staff Users & Multi-Role Governance"
          description="Provision internal operations personnel, assign granular RBAC roles, enforce 2FA requirements, and monitor active sessions."
        />
        <Button asChild className="gradient-gold text-primary shrink-0 gap-2 font-bold shadow-md">
          <Link to="/users/new">
            <UserPlus className="h-4 w-4" />
            Add User / Vendor
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Staff Users" value={staffList.length} index={0} />
        <KpiCard
          label="Active Super Admins"
          value={staffList.filter((s) => s.role === "Super Admin").length}
          index={1}
          valueClass="text-emerald-600"
        />
        <KpiCard
          label="Floor & Ops Officers"
          value={
            staffList.filter((s) => s.role === "Operations" || s.role === "Auction Manager").length
          }
          index={12}
          valueClass="text-blue-600"
        />
        <KpiCard label="MFA Compliant" value="100%" index={10} valueClass="text-purple-600" />
      </div>
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, employee ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 bg-muted/40 pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Role Filter:</span>
            <Select
              value={selectedRoleFilter}
              onValueChange={(value) => {
                setSelectedRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ADMIN_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">2FA / Security</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visibleStaff.map((staff) => {
                const initials = staff.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isSelf = staff.email === currentUser?.email;
                return (
                  <tr key={staff.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-1 ring-border">
                          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="flex items-center gap-1.5 font-bold text-foreground">
                            {staff.name}
                            {isSelf && (
                              <Badge
                                variant="outline"
                                className="border-accent px-1 py-0 text-[10px] text-accent"
                              >
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {staff.employeeId}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          staff.role === "Super Admin"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : staff.role === "Operations"
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                              : "bg-muted text-foreground"
                        }
                      >
                        {staff.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{staff.department}</td>
                    <td className="px-4 py-3">
                      {staff.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Enforced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">
                      {staff.lastLogin || "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant={staff.status === "active" ? "ghost" : "secondary"}
                          size="sm"
                          disabled={isSelf}
                          onClick={() => toggleStatus(staff.id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          {staff.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                        {!isSelf && staff.role !== "Super Admin" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteUser(staff)}
                            className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Permanently delete user and all owned data"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast.info(`Password reset link dispatched to ${staff.email}.`)
                          }
                          className="h-7 px-2 text-[11px]"
                        >
                          Reset
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleStaff.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No staff users match the current filters.
            </div>
          )}
        </CardContent>
        <div className="flex flex-col justify-between gap-3 border-t border-border/80 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>
            Showing {filteredStaff.length ? (safePage - 1) * pageSize + 1 : 0}–
            {Math.min(safePage * pageSize, filteredStaff.length)} of {filteredStaff.length} staff
            users
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="min-w-16 text-center font-semibold text-foreground">
              Page {safePage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={safePage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  index,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string | number;
  index: number;
  valueClass?: string;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className={`mt-0.5 text-2xl font-black ${valueClass}`}>{value}</p>
        </div>
        <StaffKpi3DIcon index={index} />
      </CardContent>
    </Card>
  );
}

function StaffKpi3DIcon({ index }: { index: number }) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <span
      aria-hidden="true"
      className="h-12 w-12 shrink-0 rounded-xl bg-[#fff7ec] bg-contain bg-no-repeat shadow-sm ring-1 ring-orange-100"
      style={{
        backgroundImage: "url('/assets/dashboard-secondary-3d-icons.png')",
        backgroundPosition: `${column * 33.3333}% ${row * 33.3333}%`,
        backgroundSize: "400% 400%",
      }}
    />
  );
}
