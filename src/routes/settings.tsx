import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  Lock,
  Mail,
  CreditCard,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Scrapify Auctions Admin" },
      { name: "description", content: "Platform configuration, security policies, payment gateways, and notification settings." },
      { property: "og:title", content: "Platform Settings — Scrapify Auctions Admin" },
      { property: "og:description", content: "Platform configuration, security policies, payment gateways, and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api/v1");
  const [wsUrl, setWsUrl] = useState("ws://localhost:8080/app");
  const [antiSnipeWindow, setAntiSnipeWindow] = useState("180");
  const [antiSnipeExtension, setAntiSnipeExtension] = useState("180");
  const [mfaMandatory, setMfaMandatory] = useState(true);
  const [autoForfeitEmd, setAutoForfeitEmd] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  const handleSave = () => {
    setSaved(true);
    toast.success("Platform settings saved and synchronized with Laravel backend.");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Platform Settings & Governance"
          description="Configure global API connectivity, anti-sniping timers, payment escrow parameters, and security policies."
        />
        <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & API Connectivity */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Backend API & Reverb Cluster</CardTitle>
            </div>
            <CardDescription>Configure Laravel REST and WebSocket cluster endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="api-url" className="text-xs font-medium">REST API Base URL</Label>
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-url" className="text-xs font-medium">WebSocket / Reverb Cluster URL</Label>
              <Input
                id="ws-url"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8080/app"
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Auction Engine Rules */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Live Auction & Anti-Sniping</CardTitle>
            </div>
            <CardDescription>Timing thresholds enforced by backend transaction locks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="anti-snipe-win" className="text-xs font-medium">Trigger Window (seconds)</Label>
                <Input
                  id="anti-snipe-win"
                  type="number"
                  value={antiSnipeWindow}
                  onChange={(e) => setAntiSnipeWindow(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anti-snipe-ext" className="text-xs font-medium">Extension Duration (seconds)</Label>
                <Input
                  id="anti-snipe-ext"
                  type="number"
                  value={antiSnipeExtension}
                  onChange={(e) => setAntiSnipeExtension(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm font-medium">Auto-Forfeit EMD on Winner Default</p>
                <p className="text-xs text-muted-foreground">Trigger escrow forfeiture when acceptance window expires</p>
              </div>
              <Switch checked={autoForfeitEmd} onCheckedChange={setAutoForfeitEmd} />
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Policies */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Security & Authentication</CardTitle>
            </div>
            <CardDescription>Platform-wide session and MFA enforcement policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mandatory MFA for Staff & Admin</p>
                <p className="text-xs text-muted-foreground">Require OTP / Authenticator app on every staff login</p>
              </div>
              <Switch checked={mfaMandatory} onCheckedChange={setMfaMandatory} />
            </div>
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-medium">Admin Session Inactivity Timeout</Label>
              <Input defaultValue="30 minutes" className="text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Gateways */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Broadcast & Notification Channels</CardTitle>
            </div>
            <CardDescription>Real-time outbid and auction status delivery options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transactional Email (SES / SendGrid)</span>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">SMS Outbid Alerts (Twilio / Gupshup)</span>
              </div>
              <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">WhatsApp Business Notifications</span>
              </div>
              <Switch checked={whatsappAlerts} onCheckedChange={setWhatsappAlerts} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}