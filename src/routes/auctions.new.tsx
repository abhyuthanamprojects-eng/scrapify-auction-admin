import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Gavel,
  MapPin,
  Plus,
  Warehouse,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/auctions/new")({
  head: () => ({ meta: [{ title: "Create Auction — Scrapify Admin" }] }),
  component: NewAuction,
});

type Client = { code: string; name: string; role: "buyer" | "seller"; email?: string };
type FormState = Record<string, string>;
const SELF_OWNED = "__self__";

const initialForm: FormState = {
  clientCode: "",
  title: "",
  direction: "forward",
  category: "",
  subcategoryId: "",
  lotType: "single",
  quantity: "",
  unit: "MT",
  location: "",
  company: "",
  plant: "",
  warehouseName: "",
  warehouseAddress: "",
  warehouseCity: "",
  warehouseState: "",
  warehousePincode: "",
  warehouseContact: "",
  description: "",
  reservePrice: "",
  startingPrice: "",
  bidIncrement: "",
  emdAmount: "",
  terms: "",
  paymentTerms: "",
  liftingPeriod: "",
  liftingUnit: "Days",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  inspection: "",
  inspectionDate: "",
  inspectionTime: "",
  inspectionLocation: "",
  scheduleStart: "",
  scheduleEnd: "",
  initialSlotMinutes: "30",
  continuationSlotMinutes: "2",
  maximumDurationMinutes: "120",
};

type CategoryOption = { id: number; name: string; slug: string; children?: CategoryOption[] };

function NewAuction() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    adminApi
      .getCategories()
      .then((res) => {
        const data = res?.data ?? res;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    adminApi
      .getVendors({ status: "approved" })
      .then((response) => {
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        setClients(
          rows
            .map((row: any) => ({
              code: String(row.code ?? row.id ?? ""),
              name:
                row.company_name ??
                row.companyName ??
                row.legal_business_name ??
                row.name ??
                "Unnamed account",
              role:
                String(row.role ?? row.user_role ?? row.account_type ?? "seller").toLowerCase() ===
                "buyer"
                  ? "buyer"
                  : "seller",
              email: row.email,
            }))
            .filter((row: Client) => row.code),
        );
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Unable to load buyer and seller accounts.",
        ),
      )
      .finally(() => setLoadingClients(false));
  }, []);

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const isSelfOwned = form.clientCode === SELF_OWNED;
    if (
      !form.clientCode ||
      form.clientCode === "" ||
      !form.title.trim() ||
      !form.category.trim() ||
      !form.quantity ||
      !form.company.trim() ||
      !form.scheduleStart
    ) {
      toast.error(
        "Select the auction owner and complete the auction title, category, quantity, and start time.",
      );
      return;
    }
    const maximumDurationMinutes = Number(form.maximumDurationMinutes);
    const initialSlotMinutes = Number(form.initialSlotMinutes);
    const continuationSlotMinutes = Number(form.continuationSlotMinutes);
    const scheduleStart = new Date(form.scheduleStart);
    const scheduleEnd = form.scheduleEnd ? new Date(form.scheduleEnd) : undefined;
    if (!Number.isInteger(maximumDurationMinutes) || maximumDurationMinutes < 1 || maximumDurationMinutes > 120) {
      toast.error("Maximum auction duration cannot exceed 120 minutes.");
      return;
    }
    if (!Number.isInteger(initialSlotMinutes) || !Number.isInteger(continuationSlotMinutes) || initialSlotMinutes <= 0 || continuationSlotMinutes <= 0) {
      toast.error("Slot durations must be greater than zero.");
      return;
    }
    if (Number.isNaN(scheduleStart.getTime()) || (scheduleEnd && Number.isNaN(scheduleEnd.getTime()))) {
      toast.error("Please choose valid auction schedule dates.");
      return;
    }
    if (scheduleEnd && scheduleEnd <= scheduleStart) {
      toast.error("Auction end must be after the start time.");
      return;
    }
    if (scheduleEnd && scheduleEnd.getTime() - scheduleStart.getTime() > maximumDurationMinutes * 60_000) {
      toast.error("The selected auction window cannot exceed the maximum duration.");
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.createAuction({
        client_code: isSelfOwned ? undefined : form.clientCode,
        title: form.title.trim(),
        company: form.company.trim(),
        plant: form.plant.trim() || undefined,
        warehouse: form.warehouseName.trim() || undefined,
        warehouse_details: {
          address: form.warehouseAddress.trim() || undefined,
          city: form.warehouseCity.trim() || undefined,
          state: form.warehouseState.trim() || undefined,
          pincode: form.warehousePincode.trim() || undefined,
          contact: form.warehouseContact.trim() || undefined,
        },
        location: form.location.trim() || undefined,
        direction: form.direction,
        category: form.category.trim(),
        subcategory_id: form.subcategoryId ? Number(form.subcategoryId) : undefined,
        material_type: form.category.trim(),
        quantity: String(form.quantity),
        uom: form.unit,
        lot_type: form.lotType,
        reserve_price: Number(form.reservePrice) || 0,
        starting_price: Number(form.startingPrice) || Number(form.reservePrice) || 0,
        bid_increment: Number(form.bidIncrement) || 0,
        emd_amount: Number(form.emdAmount) || undefined,
        description: form.description.trim() || undefined,
        terms: form.terms.trim() || undefined,
        payment_terms: form.paymentTerms.trim() || undefined,
        lifting_period: form.liftingPeriod.trim() || undefined,
        lifting_unit: form.liftingUnit || undefined,
        contact_name: form.contactName.trim() || undefined,
        contact_phone: form.contactPhone.trim() || undefined,
        contact_email: form.contactEmail.trim() || undefined,
        inspection: form.inspection.trim() || undefined,
        inspection_date: form.inspectionDate || undefined,
        inspection_time: form.inspectionTime || undefined,
        inspection_location: form.inspectionLocation.trim() || undefined,
        status: "draft",
        schedule_start: scheduleStart.toISOString(),
        schedule_end: scheduleEnd?.toISOString(),
      });
      const created = response?.data ?? response;
      const code = String(created?.code ?? created?.auction?.code ?? created?.id ?? "");
      if (code) {
        await adminApi.updateAuctionConfiguration(code, {
          initial_slot_minutes: initialSlotMinutes,
          continuation_slot_minutes: continuationSlotMinutes,
          maximum_auction_duration_minutes: maximumDurationMinutes,
          bid_cutoff_ms: 500,
          continuation_mode: "MANUAL_ADMIN",
        });
      }
      toast.success(
        code
          ? isSelfOwned
            ? `${code} created for self.`
            : `${code} created for the selected client.`
          : "Auction created successfully.",
      );
      navigate({
        to: code ? "/auctions/$id" : "/auctions",
        params: code ? { id: code } : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create the auction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link to="/auctions">
          <Button variant="outline" size="icon" className="mt-1" aria-label="Back to auctions">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Create Auction"
          description="Create an auction on behalf of an approved buyer or seller."
        />
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <CardHeader className="border-b border-border/70 bg-white">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-accent" /> Client and auction identity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Auction owner *</Label>
              <Select value={form.clientCode} onValueChange={(value) => set("clientCode", value)}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingClients ? "Loading approved accounts…" : "Select owner"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELF_OWNED}>Create for self · Admin-owned auction</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.code} value={client.code}>
                      {client.name} · {client.role}
                      {client.email ? ` · ${client.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose self when the auction belongs to the admin operation. Otherwise select an
                approved Buyer or Seller to create it on that client&apos;s behalf.
              </p>
            </div>
            <Field
              label="Auction title *"
              value={form.title}
              onChange={(value) => set("title", value)}
              placeholder="Copper Wire Scrap — 18 MT"
              required
            />
            <div className="space-y-2">
              <Label>Material category *</Label>
              <Select value={form.category} onValueChange={(value) => { set("category", value); set("subcategoryId", ""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const selectedCat = categories.find((c) => c.name === form.category);
              const children = selectedCat?.children ?? [];
              if (children.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={form.subcategoryId} onValueChange={(value) => set("subcategoryId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((sub: any) => (
                        <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
            <div className="space-y-2">
              <Label>Direction *</Label>
              <Select value={form.direction} onValueChange={(value) => set("direction", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forward">Forward auction</SelectItem>
                  <SelectItem value="reverse">Reverse auction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lot type</Label>
              <Select value={form.lotType} onValueChange={(value) => set("lotType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="lot_wise">Lot-wise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Describe the material, quality, inspection, and fulfilment requirements."
                className="mt-2 min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/70 bg-white">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-blue-600" /> Lot and commercial details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <Field
              label="Quantity *"
              value={form.quantity}
              onChange={(value) => set("quantity", value)}
              type="number"
              placeholder="18"
              required
            />
            <Field
              label="Unit"
              value={form.unit}
              onChange={(value) => set("unit", value)}
              placeholder="MT"
            />
            <Field
              label="Pickup / delivery location"
              value={form.location}
              onChange={(value) => set("location", value)}
              placeholder="Pune, Maharashtra"
            />
            <Field
              label="Reserve price (₹)"
              value={form.reservePrice}
              onChange={(value) => set("reservePrice", value)}
              type="number"
              placeholder="12600000"
            />
            <Field
              label="Starting price (₹)"
              value={form.startingPrice}
              onChange={(value) => set("startingPrice", value)}
              type="number"
              placeholder="12600000"
            />
            <Field
              label="Bid increment / decrement (₹)"
              value={form.bidIncrement}
              onChange={(value) => set("bidIncrement", value)}
              type="number"
              placeholder="25000"
            />
            <div className="md:col-span-2 border-t border-border/70 pt-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Warehouse className="h-5 w-5 text-blue-600" /> Warehouse details
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Company / facility *"
                  value={form.company}
                  onChange={(value) => set("company", value)}
                  placeholder="Meridian Steelworks Ltd."
                  required
                />
                <Field
                  label="Plant / unit"
                  value={form.plant}
                  onChange={(value) => set("plant", value)}
                  placeholder="Pune Processing Plant"
                />
                <Field
                  label="Warehouse name"
                  value={form.warehouseName}
                  onChange={(value) => set("warehouseName", value)}
                  placeholder="Pune Central Warehouse"
                />
                <Field
                  label="Warehouse contact"
                  value={form.warehouseContact}
                  onChange={(value) => set("warehouseContact", value)}
                  placeholder="Contact person or phone number"
                />
                <Field
                  label="Warehouse address"
                  value={form.warehouseAddress}
                  onChange={(value) => set("warehouseAddress", value)}
                  placeholder="Plot, road, industrial area"
                />
                <Field
                  label="City"
                  value={form.warehouseCity}
                  onChange={(value) => set("warehouseCity", value)}
                  placeholder="Pune"
                />
                <Field
                  label="State"
                  value={form.warehouseState}
                  onChange={(value) => set("warehouseState", value)}
                  placeholder="Maharashtra"
                />
                <Field
                  label="Pincode"
                  value={form.warehousePincode}
                  onChange={(value) => set("warehousePincode", value)}
                  placeholder="411001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/70 bg-white">
            <CardTitle className="text-base">Terms & Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <Field label="EMD amount (₹)" value={form.emdAmount} onChange={(v) => set("emdAmount", v)} type="number" placeholder="50000" />
            <Field label="Payment terms" value={form.paymentTerms} onChange={(v) => set("paymentTerms", v)} placeholder="100% advance before lifting" />
            <Field label="Lifting period" value={form.liftingPeriod} onChange={(v) => set("liftingPeriod", v)} placeholder="7" />
            <div className="space-y-2">
              <Label>Lifting unit</Label>
              <Select value={form.liftingUnit} onValueChange={(v) => set("liftingUnit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Days">Days</SelectItem>
                  <SelectItem value="Weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Contact person" value={form.contactName} onChange={(v) => set("contactName", v)} placeholder="Name" />
            <Field label="Contact phone" value={form.contactPhone} onChange={(v) => set("contactPhone", v)} placeholder="9876543210" />
            <Field label="Contact email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} type="email" placeholder="contact@example.com" />
            <div className="md:col-span-2 space-y-2">
              <Label>Seller-added auction terms</Label>
              <Textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} placeholder="Add terms specific to this auction (optional)" className="min-h-20" />
            </div>
            <div className="md:col-span-2 border-t border-border/70 pt-5">
              <p className="mb-4 text-sm font-semibold">Inspection</p>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Inspection details" value={form.inspection} onChange={(v) => set("inspection", v)} placeholder="Details" />
                <Field label="Inspection date" value={form.inspectionDate} onChange={(v) => set("inspectionDate", v)} type="date" />
                <Field label="Inspection time" value={form.inspectionTime} onChange={(v) => set("inspectionTime", v)} type="time" />
                <Field label="Inspection location" value={form.inspectionLocation} onChange={(v) => set("inspectionLocation", v)} placeholder="Location" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/70 bg-white">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-emerald-600" /> Schedule and auction policy
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <Field
              label="Scheduled start *"
              value={form.scheduleStart}
              onChange={(value) => set("scheduleStart", value)}
              type="datetime-local"
              required
            />
            <Field
              label="Optional scheduled end"
              value={form.scheduleEnd}
              onChange={(value) => set("scheduleEnd", value)}
              type="datetime-local"
            />
            <Field
              label="Initial slot (minutes)"
              value={form.initialSlotMinutes}
              onChange={(value) => set("initialSlotMinutes", value)}
              type="number"
            />
            <Field
              label="Continuation slot (minutes)"
              value={form.continuationSlotMinutes}
              onChange={(value) => set("continuationSlotMinutes", value)}
              type="number"
            />
            <Field
              label="Maximum auction duration (minutes)"
              value={form.maximumDurationMinutes}
              onChange={(value) => set("maximumDurationMinutes", value)}
              type="number"
            />
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900 md:col-span-2">
              <Gavel className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Admin-created auction</p>
                <p className="mt-1 text-xs">
                  The auction is created as a draft for the selected client. Approval and publish
                  remain separate governed steps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/auctions">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving || loadingClients}
            className="gradient-gold text-primary font-bold"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {saving ? "Creating…" : "Create auction"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
