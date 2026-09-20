import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/security")({
  component: SecuritySettingsPage,
});

function SecuritySettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaRequiredForAdmin, setMfaRequiredForAdmin] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState("120");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState("15");

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.mfa_enabled !== undefined) setMfaEnabled(Boolean(config.mfa_enabled));
        if (config?.mfa_required_for_admin !== undefined) setMfaRequiredForAdmin(Boolean(config.mfa_required_for_admin));
        if (config?.session_timeout_minutes !== undefined) setSessionTimeoutMinutes(String(config.session_timeout_minutes));
        if (config?.max_login_attempts !== undefined) setMaxLoginAttempts(String(config.max_login_attempts));
        if (config?.lockout_duration_minutes !== undefined) setLockoutDurationMinutes(String(config.lockout_duration_minutes));
      })
      .catch(() => toast.error("Could not load security settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updatePlatformConfig({
        mfa_enabled: mfaEnabled,
        mfa_required_for_admin: mfaRequiredForAdmin,
        session_timeout_minutes: Number(sessionTimeoutMinutes),
        max_login_attempts: Number(maxLoginAttempts),
        lockout_duration_minutes: Number(lockoutDurationMinutes),
      });
      setSaved(true);
      toast.success("Security settings saved.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-red-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-red-50/80 pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          <CardTitle className="text-base">Security & Authentication</CardTitle>
        </div>
        <CardDescription>Multi-factor authentication, session policies, and login lockout rules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Multi-Factor Authentication</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Enable MFA Platform-Wide</Label><p className="text-xs text-muted-foreground">Allow users to set up TOTP-based two-factor authentication.</p></div>
                <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Require MFA for Admin Accounts</Label><p className="text-xs text-muted-foreground">Force all admin users to enable MFA before accessing the admin panel.</p></div>
                <Switch checked={mfaRequiredForAdmin} onCheckedChange={setMfaRequiredForAdmin} />
              </div>
            </div>
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Session & Lockout Policies</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" min={5} value={sessionTimeoutMinutes} onChange={(e) => setSessionTimeoutMinutes(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Inactive sessions expire after this period.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Max Login Attempts</Label>
                  <Input type="number" min={1} value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Failed attempts before account lockout.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Lockout Duration (minutes)</Label>
                  <Input type="number" min={1} value={lockoutDurationMinutes} onChange={(e) => setLockoutDurationMinutes(e.target.value)} />
                  <p className="text-xs text-muted-foreground">How long an account stays locked after exceeding max attempts.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={handleSave} disabled={saving || loading} className="gap-2 bg-red-600 text-white hover:bg-red-700">
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save Security Settings"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
