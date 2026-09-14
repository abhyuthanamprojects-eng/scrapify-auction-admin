import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { type StaffUser } from "@/hooks/use-auth";

interface AdminProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StaffUser;
  onSave?: (updated: Partial<StaffUser>) => void;
}

export function AdminProfileDialog({ open, onOpenChange, user, onSave }: AdminProfileDialogProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "+91 98765 43210");
  const [department, setDepartment] = useState(user.department);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    if (onSave) {
      onSave({
        name,
        email,
        phone,
        department,
      });
    }
    setTimeout(() => {
      setSaving(false);
      onOpenChange(false);
    }, 400);
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border bg-card">
        {/* Header Banner */}
        <div className="gradient-navy p-6 text-primary-foreground relative border-b border-border/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-accent/30 ring-offset-2 ring-offset-card shadow-lg">
                <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {user.name}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/75 text-xs mt-0.5">
                  {user.employeeId} · {user.department}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-primary-foreground/80 border-primary-foreground/20 text-[11px]"
                  >
                    2FA Verified
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1">
              <TabsTrigger value="details" className="text-xs">
                Staff Identity
              </TabsTrigger>
              <TabsTrigger value="permissions" className="text-xs">
                RBAC Matrix
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Staff Details */}
            <TabsContent value="details" className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-name" className="text-xs font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="staff-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-email" className="text-xs font-medium">
                    Official Email
                  </Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-phone" className="text-xs font-medium">
                    Mobile Number
                  </Label>
                  <Input
                    id="staff-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-dept" className="text-xs font-medium">
                    Department / Unit
                  </Label>
                  <Input
                    id="staff-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border p-3.5 bg-muted/30 flex items-center justify-end text-xs">
                <Badge variant="secondary" className="text-[10px]">
                  Employee ID: {user.employeeId}
                </Badge>
              </div>
            </TabsContent>

            {/* Tab 2: Permissions */}
            <TabsContent value="permissions" className="space-y-3 pt-2">
              <div className="rounded-xl border border-border p-3.5 bg-muted/20">
                <p className="text-xs font-semibold text-foreground mb-1">
                  Enforced RBAC Governance
                </p>
                <p className="text-xs text-muted-foreground">
                  Role <strong>{user.role}</strong> grants immutable permission bounds enforced
                  server-side.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  "Live Auction Intervention (Pause/Extend)",
                  "Vendor KYB Verification & Approval",
                  "Reserve Price Override Authority",
                  "EMD Escrow Release & Forfeiture",
                  "Arbitration Dispute Resolution",
                  "SOC-2 Immutable Audit Log Inspection",
                  "Staff User Provisioning & Roles",
                  "Platform Security & API Gateways",
                ].map((perm, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-foreground text-[11px] font-medium leading-tight">
                      {perm}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/10 sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {saving ? "Saving…" : "Save Profile Details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
