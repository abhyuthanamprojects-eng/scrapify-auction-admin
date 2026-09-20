import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Gavel, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/auctions")({
  component: AuctionsSettingsPage,
});

interface Promotion {
  id?: number;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  active: boolean;
}

function AuctionsSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [antiSnipingEnabled, setAntiSnipingEnabled] = useState(true);
  const [antiSnipingExtensionMinutes, setAntiSnipingExtensionMinutes] = useState("2");
  const [antiSnipingThresholdSeconds, setAntiSnipingThresholdSeconds] = useState("30");
  const [maxExtensions, setMaxExtensions] = useState("10");
  const [autoForfeitEmd, setAutoForfeitEmd] = useState(false);
  const [autoForfeitDays, setAutoForfeitDays] = useState("7");

  const [registrationPromotions, setRegistrationPromotions] = useState<Promotion[]>([]);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscountType, setNewPromoDiscountType] = useState("PERCENTAGE");
  const [newPromoDiscountValue, setNewPromoDiscountValue] = useState("");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("100");

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.anti_sniping_enabled !== undefined) setAntiSnipingEnabled(Boolean(config.anti_sniping_enabled));
        if (config?.anti_sniping_extension_minutes !== undefined) setAntiSnipingExtensionMinutes(String(config.anti_sniping_extension_minutes));
        if (config?.anti_sniping_threshold_seconds !== undefined) setAntiSnipingThresholdSeconds(String(config.anti_sniping_threshold_seconds));
        if (config?.max_extensions !== undefined) setMaxExtensions(String(config.max_extensions));
        if (config?.auto_forfeit_emd !== undefined) setAutoForfeitEmd(Boolean(config.auto_forfeit_emd));
        if (config?.auto_forfeit_days !== undefined) setAutoForfeitDays(String(config.auto_forfeit_days));
        if (Array.isArray(config?.registration_promotions)) setRegistrationPromotions(config.registration_promotions);
      })
      .catch(() => toast.error("Could not load auction settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updatePlatformConfig({
        anti_sniping_enabled: antiSnipingEnabled,
        anti_sniping_extension_minutes: Number(antiSnipingExtensionMinutes),
        anti_sniping_threshold_seconds: Number(antiSnipingThresholdSeconds),
        max_extensions: Number(maxExtensions),
        auto_forfeit_emd: autoForfeitEmd,
        auto_forfeit_days: Number(autoForfeitDays),
      });
      setSaved(true);
      toast.success("Auction settings saved.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const createPromotion = async () => {
    if (!newPromoCode.trim()) { toast.error("Enter a promo code."); return; }
    const value = Number(newPromoDiscountValue);
    if (!Number.isFinite(value) || value <= 0) { toast.error("Enter a valid discount value."); return; }
    try {
      const response = await adminApi.createRegistrationPromotion({
        code: newPromoCode.trim().toUpperCase(),
        discount_type: newPromoDiscountType,
        discount_value: value,
        max_uses: Number(newPromoMaxUses) || 100,
        active: true,
      });
      const promo = response?.data ?? response;
      setRegistrationPromotions((current) => [...current, promo]);
      setNewPromoCode("");
      setNewPromoDiscountValue("");
      toast.success("Promotion created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create promotion.");
    }
  };

  const togglePromotion = async (promo: Promotion) => {
    if (!promo.id) return;
    try {
      await adminApi.updateRegistrationPromotion(promo.id, { active: !promo.active });
      setRegistrationPromotions((current) => current.map((p) => (p.id === promo.id ? { ...p, active: !p.active } : p)));
    } catch (error) {
      toast.error("Could not update promotion.");
    }
  };

  const deletePromotion = async (promo: Promotion) => {
    if (!promo.id) return;
    try {
      await adminApi.deleteRegistrationPromotion(promo.id);
      setRegistrationPromotions((current) => current.filter((p) => p.id !== promo.id));
      toast.success("Promotion deleted.");
    } catch (error) {
      toast.error("Could not delete promotion.");
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-amber-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-amber-50/80 pb-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">Live Auction & EMD Settings</CardTitle>
        </div>
        <CardDescription>Anti-sniping rules, EMD forfeiture, and registration promotions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Anti-Sniping Rules</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Enable Anti-Sniping</Label><p className="text-xs text-muted-foreground">Automatically extend the auction when a bid arrives near closing.</p></div>
                <Switch checked={antiSnipingEnabled} onCheckedChange={setAntiSnipingEnabled} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Extension Duration (minutes)</Label>
                  <Input type="number" min={1} value={antiSnipingExtensionMinutes} onChange={(e) => setAntiSnipingExtensionMinutes(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Threshold (seconds before end)</Label>
                  <Input type="number" min={1} value={antiSnipingThresholdSeconds} onChange={(e) => setAntiSnipingThresholdSeconds(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Extensions</Label>
                  <Input type="number" min={1} value={maxExtensions} onChange={(e) => setMaxExtensions(e.target.value)} />
                </div>
              </div>
            </section>
            <section className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">EMD Auto-Forfeiture</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Auto-Forfeit EMD</Label><p className="text-xs text-muted-foreground">Automatically forfeit winner's EMD if they fail to complete the transaction within the deadline.</p></div>
                <Switch checked={autoForfeitEmd} onCheckedChange={setAutoForfeitEmd} />
              </div>
              <div className="space-y-1.5">
                <Label>Forfeiture Deadline (days after auction end)</Label>
                <Input type="number" min={1} value={autoForfeitDays} onChange={(e) => setAutoForfeitDays(e.target.value)} />
              </div>
            </section>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={handleSave} disabled={saving || loading} className="gap-2 bg-amber-600 text-white hover:bg-amber-700">
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save Auction Settings"}
              </Button>
            </div>
            <section className="space-y-3 border-t pt-5">
              <h3 className="text-sm font-semibold">Registration Promo Codes</h3>
              <p className="text-xs text-muted-foreground">Create discount codes for vendor registration fees.</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1fr_1fr_auto]">
                <Input placeholder="Code (e.g. WELCOME50)" value={newPromoCode} onChange={(e) => setNewPromoCode(e.target.value)} />
                <select value={newPromoDiscountType} onChange={(e) => setNewPromoDiscountType(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed ₹</option>
                </select>
                <Input type="number" min={0} placeholder="Value" value={newPromoDiscountValue} onChange={(e) => setNewPromoDiscountValue(e.target.value)} />
                <Input type="number" min={1} placeholder="Max uses" value={newPromoMaxUses} onChange={(e) => setNewPromoMaxUses(e.target.value)} />
                <Button onClick={createPromotion} variant="outline" className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
              </div>
              {registrationPromotions.length > 0 && (
                <div className="space-y-2">
                  {registrationPromotions.map((promo) => (
                    <div key={promo.id ?? promo.code} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <code className="rounded bg-muted px-2 py-0.5 text-sm font-semibold">{promo.code}</code>
                        <span className="text-sm text-muted-foreground">
                          {promo.discount_type === "PERCENTAGE" ? `${promo.discount_value}%` : `₹${promo.discount_value}`} off · max {promo.max_uses} uses
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={promo.active} onCheckedChange={() => togglePromotion(promo)} />
                        <Button variant="ghost" size="icon" onClick={() => deletePromotion(promo)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
