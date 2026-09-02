import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { ADMIN_ROLES, type AdminRole } from "@/lib/ops/roles";
import { toast } from "sonner";
import { useAuth, type StaffUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Staff Users & RBAC Management — Scrapify Admin" },
      {
        name: "description",
        content: "Provision staff users, assign RBAC roles, and manage access policies across Scrapify Auctions.",
      },
      { property: "og:title", content: "Staff Users & Roles | Scrapify Admin" },
      { property: "og:description", content: "Super Admin staff user provisioning and role administration." },
    ],
  }),
  component: StaffUsersPage,
});

const INITIAL_STAFF: StaffUser[] = [
  {
    id: "USR-001",
    name: "R. Iyer",
    email: "r.iyer@scrapifyauctions.com",
    phone: "+91 98765 43210",
    employeeId: "STF-2026-0042",
    role: "Super Admin",
    department: "Executive Platform Ops",
    status: "active",
    mfaEnabled: true,
    lastLogin: "Active Now (IP: 103.21.144.8)",
  },
  {
    id: "USR-002",
    name: "Karan Johar",
    email: "ops.lead@scrapifyauctions.com",
    phone: "+91 98765 43211",
    employeeId: "STF-2026-0043",
    role: "Operations",
    department: "Live Floor & Control Room",
    status: "active",
    mfaEnabled: true,
    lastLogin: "10 mins ago (IP: 103.21.144.12)",
  },
  {
    id: "USR-003",
    name: "Ananya Sharma",
    email: "compliance@scrapifyauctions.com",
    phone: "+91 98765 43212",
    employeeId: "STF-2026-0044",
    role: "Compliance",
    department: "KYB & Legal Verification",
    status: "active",
    mfaEnabled: true,
    lastLogin: "1 hour ago",
  },
  {
    id: "USR-004",
    name: "Vikram Malhotra",
    email: "finance@scrapifyauctions.com",
    phone: "+91 98765 43213",
    employeeId: "STF-2026-0045",
    role: "Finance",
    department: "Treasury & Escrow",
    status: "active",
    mfaEnabled: true,
    lastLogin: "3 hours ago",
  },
  {
    id: "USR-005",
    name: "Pooja Hegde",
    email: "auctioneer@scrapifyauctions.com",
    phone: "+91 98765 43214",
    employeeId: "STF-2026-0046",
    role: "Auction Manager",
    department: "Metals & Heavy Scrap Desk",
    status: "active",
    mfaEnabled: true,
    lastLogin: "Yesterday",
  },
  {
    id: "USR-006",
    name: "Rajesh Koothrappali",
    email: "audit@scrapifyauctions.com",
    phone: "+91 98765 43215",
    employeeId: "STF-2026-0047",
    role: "Auditor",
    department: "SOC-2 Risk & Oversight",
    status: "active",
    mfaEnabled: true,
    lastLogin: "2 days ago",
  },
];

function StaffUsersPage() {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form State for Adding Staff
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("Operations");
  const [newDepartment, setNewDepartment] = useState("");
  const [newMfa, setNewMfa] = useState(true);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      toast.error("Please fill in the staff name and official email.");
      return;
    }

    const newStaff: StaffUser = {
      id: `USR-${Math.floor(Math.random() * 900 + 100)}`,
      name: newName,
      email: newEmail,
      phone: newPhone || "+91 98765 43210",
      employeeId: `STF-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      role: newRole,
      department: newDepartment || `${newRole} Unit`,
      status: "active",
      mfaEnabled: newMfa,
      lastLogin: "Never logged in (Invitation sent)",
    };

    setStaffList((prev) => [newStaff, ...prev]);
    toast.success(`Staff user ${newStaff.name} created as ${newStaff.role}! Activation email dispatched.`);

    // Reset Form
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewDepartment("");
    setDialogOpen(false);
  };

  const toggleStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === "active" ? "suspended" : "active";
          toast.info(`Staff user ${s.name} is now ${nextStatus.toUpperCase()}.`);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      selectedRoleFilter === "all" || s.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Staff Users & Multi-Role Governance"
          description="Provision internal operations personnel, assign granular RBAC roles, enforce 2FA requirements, and monitor active sessions."
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-primary font-bold gap-2 shrink-0 shadow-md">
              <UserPlus className="h-4 w-4" />
              Add Staff User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[540px] rounded-2xl border-border bg-card p-0 overflow-hidden">
            <div className="gradient-navy p-6 text-white border-b border-border/40">
              <DialogTitle className="text-lg font-bold">Provision New Staff User</DialogTitle>
              <DialogDescription className="text-white/75 text-xs mt-0.5">
                Create an internal user with specific RBAC role access and security constraints.
              </DialogDescription>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="add-name" className="text-xs font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="add-name"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-email" className="text-xs font-semibold">
                    Official Email *
                  </Label>
                  <Input
                    id="add-email"
                    type="email"
                    required
                    placeholder="name@scrapifyauctions.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="add-phone" className="text-xs font-semibold">
                    Mobile Number
                  </Label>
                  <Input
                    id="add-phone"
                    placeholder="+91 98765 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-dept" className="text-xs font-semibold">
                    Department / Unit
                  </Label>
                  <Input
                    id="add-dept"
                    placeholder="e.g. Metals Floor Desk"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assigned Staff Role *</Label>
                <Select
                  value={newRole}
                  onValueChange={(v) => setNewRole(v as AdminRole)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select staff role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        <span className="font-semibold">{r}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border p-3.5 bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Enforce Mandatory 2FA</p>
                  <p className="text-[11px] text-muted-foreground">Requires OTP setup on first sign in</p>
                </div>
                <Switch checked={newMfa} onCheckedChange={setNewMfa} />
              </div>

              <DialogFooter className="pt-3 border-t border-border sm:justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="gradient-gold text-primary font-bold">
                  Create Staff Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Staff Users</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{staffList.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Active Super Admins</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {staffList.filter((s) => s.role === "Super Admin").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Floor &amp; Ops Officers</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {staffList.filter((s) => s.role === "Operations" || s.role === "Auction Manager").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">MFA Compliant</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                100%
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Container */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, employee ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground hidden sm:inline">Role Filter:</Label>
            <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">2FA / Security</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredStaff.map((staff) => {
                const initials = staff.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isSelf = staff.email === currentUser.email;

                return (
                  <tr key={staff.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-1 ring-border">
                          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            {staff.name}
                            {isSelf && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 border-accent text-accent">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {staff.employeeId}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          staff.role === "Super Admin"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : staff.role === "Operations"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-muted text-foreground"
                        }
                      >
                        {staff.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{staff.department}</td>
                    <td className="py-3 px-4">
                      {staff.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enforced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                          <ShieldAlert className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {staff.lastLogin || "Never"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant={staff.status === "active" ? "ghost" : "secondary"}
                          size="sm"
                          disabled={isSelf}
                          onClick={() => toggleStatus(staff.id)}
                          className={`h-7 px-2 text-[11px] ${
                            staff.status === "active"
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {staff.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info(`Password reset link dispatched to ${staff.email}.`)}
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
        </CardContent>
      </Card>
    </div>
  );
}
