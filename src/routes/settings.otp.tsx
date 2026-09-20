import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Mail } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/otp")({
  component: OtpSettingsPage,
});

function OtpSettingsPage() {
  const [otpSettings, setOtpSettings] = useState<any>(null);
  const [otpAuthKey, setOtpAuthKey] = useState("");
  const [otpTestPhone, setOtpTestPhone] = useState("");
  const [otpTestEmail, setOtpTestEmail] = useState("");
  const [otpSaving, setOtpSaving] = useState(false);
  const [otpTesting, setOtpTesting] = useState(false);
  const [otpEmailTesting, setOtpEmailTesting] = useState(false);
  const [integrationSettings, setIntegrationSettings] = useState<any>(null);
  const [integrationSecrets, setIntegrationSecrets] = useState<Record<string, string>>({});
  const [integrationSaving, setIntegrationSaving] = useState(false);

  useEffect(() => {
    adminApi.getOtpSettings()
      .then((response) => setOtpSettings(response?.data ?? response))
      .catch(() => toast.error("Could not load OTP settings from the API."));
    adminApi.getIntegrationSettings()
      .then((response) => setIntegrationSettings(response?.data ?? response))
      .catch(() => toast.error("Could not load integration settings."));
  }, []);

  const updateIntegration = (key: string, value: unknown) => {
    setIntegrationSettings((current: any) => ({ ...current, [key]: value }));
  };

  const secretInput = (key: string, label: string, description?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="password"
        placeholder={integrationSettings?.[key] || "Not configured"}
        value={integrationSecrets[key] ?? ""}
        onChange={(e) => setIntegrationSecrets((current) => ({ ...current, [key]: e.target.value }))}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  const saveOtpSettings = async () => {
    if (!otpSettings) return;
    setOtpSaving(true);
    try {
      const response = await adminApi.updateOtpSettings({
        ...otpSettings,
        ...(otpAuthKey.trim() ? { msg91_auth_key: otpAuthKey.trim() } : {}),
        msg91_enabled: Boolean(otpSettings.msg91_enabled),
        msg91_otp_length: 4,
        email_otp_length: 4,
        otp_expiry_minutes: Number(otpSettings.otp_expiry_minutes),
        otp_resend_cooldown_seconds: Number(otpSettings.otp_resend_cooldown_seconds),
        otp_max_resend_attempts: Number(otpSettings.otp_max_resend_attempts),
        otp_max_verification_attempts: Number(otpSettings.otp_max_verification_attempts),
        otp_rate_limit_per_hour: Number(otpSettings.otp_rate_limit_per_hour),
      });
      setOtpSettings(response?.data ?? response);
      setOtpAuthKey("");
      toast.success("OTP settings saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save OTP settings.");
    } finally {
      setOtpSaving(false);
    }
  };

  const sendOtpTest = async () => {
    if (!/^[6-9]\d{9}$/.test(otpTestPhone)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setOtpTesting(true);
    try {
      const response = await adminApi.sendOtpTest(otpTestPhone);
      toast.success(
        [response?.message || "Test OTP request accepted by MSG91.", response?.provider_message, response?.provider_request_id ? `Request ID: ${response.provider_request_id}` : null].filter(Boolean).join(" "),
      );
      setOtpTestPhone("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send test OTP.");
    } finally {
      setOtpTesting(false);
    }
  };

  const sendEmailOtpTest = async () => {
    const email = otpTestEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setOtpEmailTesting(true);
    try {
      const response = await adminApi.sendEmailOtpTest(email);
      toast.success(response?.message || "Test email OTP sent successfully.");
      setOtpTestEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send test email OTP.");
    } finally {
      setOtpEmailTesting(false);
    }
  };

  const saveMailSettings = async () => {
    if (!integrationSettings) return;
    setIntegrationSaving(true);
    try {
      const mailSecrets = Object.fromEntries(
        Object.entries(integrationSecrets).filter(
          ([key, value]) => ["mail_username", "mail_password"].includes(key) && value.trim(),
        ),
      );
      const response = await adminApi.updateIntegrationSettings({
        mail_mailer: integrationSettings.mail_mailer ?? "smtp",
        mail_host: integrationSettings.mail_host ?? "smtp-relay.brevo.com",
        mail_port: Number(integrationSettings.mail_port ?? 587),
        mail_encryption: integrationSettings.mail_encryption ?? "tls",
        mail_from_address: otpSettings?.email_from_address || integrationSettings.mail_from_address || "",
        mail_from_name: otpSettings?.email_from_name || integrationSettings.mail_from_name || "Scrapify Auctions",
        ...mailSecrets,
      });
      setIntegrationSettings(response?.data ?? response);
      setIntegrationSecrets((current) => {
        const next = { ...current };
        delete next.mail_username;
        delete next.mail_password;
        return next;
      });
      toast.success("Brevo SMTP settings saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save SMTP settings.");
    } finally {
      setIntegrationSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-[color:var(--auction)] border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-orange-50/80 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[color:var(--auction)]" />
          <CardTitle className="text-base">OTP / MSG91 Integration</CardTitle>
        </div>
        <CardDescription>Provider credentials stay on Laravel. The auth key is masked on read and encrypted when stored.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {!otpSettings ? (
          <p className="text-sm text-muted-foreground">Loading OTP settings…</p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">MSG91 OTP enabled</Label>
                <p className="text-xs text-muted-foreground">Registration and login OTP requests use the backend provider.</p>
              </div>
              <Switch checked={Boolean(otpSettings.msg91_enabled)} onCheckedChange={(value) => setOtpSettings({ ...otpSettings, msg91_enabled: value })} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 md:col-span-2">
                <div>
                  <Label className="text-sm">Email OTP enabled</Label>
                  <p className="text-xs text-muted-foreground">Allow users to receive one-time passwords by email.</p>
                </div>
                <Switch checked={Boolean(otpSettings.email_enabled)} onCheckedChange={(value) => setOtpSettings({ ...otpSettings, email_enabled: value })} aria-label="Enable email OTP" />
              </div>
              <div className="space-y-1.5">
                <Label>Email From Name</Label>
                <Input value={otpSettings.email_from_name ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, email_from_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email From Address</Label>
                <Input type="email" value={otpSettings.email_from_address ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, email_from_address: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Email OTP Template</Label>
                <Textarea rows={4} placeholder="Your Scrapify Auctions verification code is :code. It expires in :minutes minutes." value={otpSettings.email_otp_template ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, email_otp_template: e.target.value })} />
                <p className="text-xs text-muted-foreground">Use only <code>:code</code> and <code>:minutes</code>. Laravel replaces these placeholders before sending.</p>
                <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Email preview</p>
                  <p className="whitespace-pre-line text-sm text-foreground">
                    {(otpSettings.email_otp_template || "Your Scrapify Auctions verification code is :code. It expires in :minutes minutes.")
                      .replace(/:code/g, "1234")
                      .replace(/:minutes/g, String(otpSettings.otp_expiry_minutes || 5))}
                  </p>
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4 md:col-span-2">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-violet-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-violet-950">Brevo SMTP delivery</h3>
                    <p className="text-xs text-violet-900/70">Add the SMTP login and key here. Laravel encrypts the credentials and returns only masked values.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Mailer</Label>
                    <select value={integrationSettings?.mail_mailer ?? "smtp"} onChange={(e) => updateIntegration("mail_mailer", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="smtp">SMTP</option>
                      <option value="sendmail">Sendmail</option>
                      <option value="log">Log</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMTP Host</Label>
                    <Input value={integrationSettings?.mail_host ?? "smtp-relay.brevo.com"} onChange={(e) => updateIntegration("mail_host", e.target.value)} placeholder="smtp-relay.brevo.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMTP Port</Label>
                    <Input type="number" min={1} max={65535} value={integrationSettings?.mail_port ?? 587} onChange={(e) => updateIntegration("mail_port", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Encryption</Label>
                    <select value={integrationSettings?.mail_encryption ?? "tls"} onChange={(e) => updateIntegration("mail_encryption", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="null">None</option>
                    </select>
                  </div>
                  {secretInput("mail_username", "SMTP Username", "Copy the SMTP login from Brevo SMTP & API.")}
                  {secretInput("mail_password", "SMTP Key", "Use the Brevo SMTP key, not the Brevo API key.")}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 pt-3">
                  <p className="text-xs text-violet-900/70">The email sender is configured in the Email From Name and Email From Address fields above.</p>
                  <Button onClick={saveMailSettings} disabled={integrationSaving || !integrationSettings} variant="outline" className="border-violet-300 bg-white text-violet-800 hover:bg-violet-100">
                    {integrationSaving ? "Saving…" : "Save SMTP Settings"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Auth Key</Label>
                <Input type="password" placeholder={otpSettings.msg91_auth_key || "Not configured"} value={otpAuthKey} onChange={(e) => setOtpAuthKey(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave blank to keep the current key.</p>
              </div>
              <div className="space-y-1.5">
                <Label>OTP Template ID</Label>
                <Input value={otpSettings.msg91_otp_template_id ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, msg91_otp_template_id: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SMS Template ID (optional)</Label>
                <Input value={otpSettings.msg91_sms_template_id ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, msg91_sms_template_id: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sender ID</Label>
                <Input value={otpSettings.msg91_sender_id ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, msg91_sender_id: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Country Code</Label>
                <Input value={otpSettings.msg91_country_code ?? ""} onChange={(e) => setOtpSettings({ ...otpSettings, msg91_country_code: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SMS OTP Length</Label>
                <Input type="number" value={4} readOnly />
                <p className="text-xs text-muted-foreground">Fixed at 4 digits. This must match the MSG91 OTP template.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Email OTP Length</Label>
                <Input type="number" value={4} readOnly />
                <p className="text-xs text-muted-foreground">Fixed at 4 digits.</p>
              </div>
              <div className="space-y-1.5">
                <Label>OTP Expiry (minutes)</Label>
                <Input type="number" min={1} max={30} value={otpSettings.otp_expiry_minutes ?? 5} onChange={(e) => setOtpSettings({ ...otpSettings, otp_expiry_minutes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Resend Cooldown (seconds)</Label>
                <Input type="number" min={10} max={3600} value={otpSettings.otp_resend_cooldown_seconds ?? 30} onChange={(e) => setOtpSettings({ ...otpSettings, otp_resend_cooldown_seconds: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Maximum Resends per Hour</Label>
                <Input type="number" min={1} max={20} value={otpSettings.otp_max_resend_attempts ?? 3} onChange={(e) => setOtpSettings({ ...otpSettings, otp_max_resend_attempts: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Maximum Verification Attempts</Label>
                <Input type="number" min={1} max={10} value={otpSettings.otp_max_verification_attempts ?? 5} onChange={(e) => setOtpSettings({ ...otpSettings, otp_max_verification_attempts: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>OTP Requests per Hour</Label>
                <Input type="number" min={1} max={100} value={otpSettings.otp_rate_limit_per_hour ?? 10} onChange={(e) => setOtpSettings({ ...otpSettings, otp_rate_limit_per_hour: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={saveOtpSettings} disabled={otpSaving} className="bg-[color:var(--auction)] text-white hover:brightness-110">
                {otpSaving ? "Saving…" : "Save OTP Configuration"}
              </Button>
              <div className="flex min-w-[280px] flex-1 gap-2">
                <Input aria-label="Test OTP mobile number" placeholder="Test mobile number" value={otpTestPhone} onChange={(e) => setOtpTestPhone(e.target.value)} />
                <Button variant="outline" onClick={sendOtpTest} disabled={otpTesting}>{otpTesting ? "Sending…" : "Send Test OTP"}</Button>
              </div>
              <div className="flex min-w-[280px] flex-1 gap-2">
                <Input aria-label="Test OTP email address" type="email" placeholder="Test email address" value={otpTestEmail} onChange={(e) => setOtpTestEmail(e.target.value)} />
                <Button variant="outline" onClick={sendEmailOtpTest} disabled={otpEmailTesting}>{otpEmailTesting ? "Sending…" : "Send Test Email OTP"}</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
