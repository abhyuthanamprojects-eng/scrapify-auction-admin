import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/notifications")({
  component: NotificationsSettingsPage,
});

function NotificationsSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [auctionAlerts, setAuctionAlerts] = useState(true);
  const [registrationAlerts, setRegistrationAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.email_notifications !== undefined) setEmailNotifications(Boolean(config.email_notifications));
        if (config?.sms_notifications !== undefined) setSmsNotifications(Boolean(config.sms_notifications));
        if (config?.whatsapp_notifications !== undefined) setWhatsappNotifications(Boolean(config.whatsapp_notifications));
        if (config?.push_notifications !== undefined) setPushNotifications(Boolean(config.push_notifications));
        if (config?.auction_alerts !== undefined) setAuctionAlerts(Boolean(config.auction_alerts));
        if (config?.registration_alerts !== undefined) setRegistrationAlerts(Boolean(config.registration_alerts));
        if (config?.payment_alerts !== undefined) setPaymentAlerts(Boolean(config.payment_alerts));
      })
      .catch(() => toast.error("Could not load notification settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updatePlatformConfig({
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        whatsapp_notifications: whatsappNotifications,
        push_notifications: pushNotifications,
        auction_alerts: auctionAlerts,
        registration_alerts: registrationAlerts,
        payment_alerts: paymentAlerts,
      });
      setSaved(true);
      toast.success("Notification settings saved.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-blue-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-blue-50/80 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Broadcast & Notification Channels</CardTitle>
        </div>
        <CardDescription>Enable or disable notification channels and alert categories for the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Channels</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Email Notifications</Label><p className="text-xs text-muted-foreground">Send transactional and alert emails via Brevo SMTP.</p></div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>SMS Notifications</Label><p className="text-xs text-muted-foreground">Send OTP and alert SMS via MSG91.</p></div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>WhatsApp Notifications</Label><p className="text-xs text-muted-foreground">Send notifications via WhatsApp Business API (MSG91).</p></div>
                <Switch checked={whatsappNotifications} onCheckedChange={setWhatsappNotifications} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Push Notifications</Label><p className="text-xs text-muted-foreground">Send push notifications via Firebase Cloud Messaging.</p></div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </div>
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Alert Categories</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Auction Alerts</Label><p className="text-xs text-muted-foreground">Bid placed, auction started, auction ended, winner declared.</p></div>
                <Switch checked={auctionAlerts} onCheckedChange={setAuctionAlerts} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Registration Alerts</Label><p className="text-xs text-muted-foreground">New vendor registration, KYB verification status changes.</p></div>
                <Switch checked={registrationAlerts} onCheckedChange={setRegistrationAlerts} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Payment Alerts</Label><p className="text-xs text-muted-foreground">EMD deposits, refunds, wallet top-ups, payment failures.</p></div>
                <Switch checked={paymentAlerts} onCheckedChange={setPaymentAlerts} />
              </div>
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={handleSave} disabled={saving || loading} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save Notification Settings"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
