import { useState } from "react";
import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  Upload,
  UserRound,
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
import { Switch } from "@/components/ui/switch";
import { ADMIN_ROLES } from "@/lib/ops/roles";
import { adminApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/users/new")({
  head: () => ({ meta: [{ title: "Add Buyer or Seller — Scrapify Admin" }] }),
  component: NewAdminAccount,
});

type AccountType = "buyer" | "seller" | "staff";
type FormState = Record<string, string | boolean>;

const initialForm: FormState = {
  accountType: "seller",
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "Operations",
  department: "",
  mfaEnabled: false,
  businessName: "",
  tradeName: "",
  businessType: "Private Limited",
  gstNumber: "",
  panNumber: "",
  website: "",
  contactPerson: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  category: "",
  yearsInBusiness: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
};

function NewAdminAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const customerMode = new URLSearchParams(location.search).get("mode") === "customer";
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Record<string, File | null>>({
    gst_certificate: null,
    pan_card: null,
    bank_proof: null,
    address_proof: null,
  });
  const set = (key: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const accountType = form.accountType as AccountType;
  const isStaff = accountType === "staff";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!String(form.name).trim() || !String(form.email).trim() || String(form.password).length < 8)
      return toast.error("Name, email, and an 8-character password are required.");
    setSaving(true);
    try {
      const response = await adminApi.createOrgUser({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: isStaff ? form.role : accountType,
        department: form.department || undefined,
        mfa_enabled: Boolean(form.mfaEnabled),
        account_type: accountType,
        mobile_verified: true,
        email_verified: true,
        verification_required: false,
        business_name: form.businessName || undefined,
        trade_name: form.tradeName || undefined,
        business_type: form.businessType || undefined,
        gst_number: form.gstNumber || undefined,
        pan_number: form.panNumber || undefined,
        website: form.website || undefined,
        contact_person: form.contactPerson || undefined,
        category: form.category || undefined,
        years_in_business: form.yearsInBusiness || undefined,
        address_line1: form.addressLine1 || undefined,
        address_line2: form.addressLine2 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        country: form.country || undefined,
        bank_name: form.bankName || undefined,
        account_holder_name: form.accountHolderName || undefined,
        account_number: form.accountNumber || undefined,
        ifsc_code: form.ifscCode || undefined,
        created_by_admin: true,
      });
      const created = response?.data ?? response;
      const vendorCode = String(
        created?.vendor_code ?? created?.vendor?.code ?? created?.code ?? "",
      );
      const files = Object.entries(documents).filter((entry): entry is [string, File] =>
        Boolean(entry[1]),
      );
      if (vendorCode && files.length > 0) {
        await Promise.all(
          files.map(([key, file]) => adminApi.uploadVendorDocument(vendorCode, key, key, file)),
        );
      } else if (!isStaff && files.length > 0) {
        toast.warning(
          "Account created, but documents could not be linked because the API did not return a vendor code.",
        );
      }
      toast.success(`${isStaff ? "Staff user" : "Account"} created without OTP verification.`);
      navigate({ to: "/users" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create this account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link to="/users">
          <Button variant="outline" size="icon" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Add Buyer or Seller"
          description="Create a buyer or seller account from a governed admin workflow."
        />
      </div>
      <form onSubmit={submit} className="space-y-5">
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/70 bg-[#fff8ef]">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-5 w-5 text-accent" />
              Account type and login details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Account type *</Label>
              <Select value={accountType} onValueChange={(value) => set("accountType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  {!customerMode && <SelectItem value="staff">Staff user</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admin-created accounts are activated directly. Mobile and email OTP verification is
                skipped.
              </p>
            </div>
            <Field
              label="Full name *"
              value={form.name}
              onChange={(value) => set("name", value)}
              placeholder="Primary contact name"
              required
            />
            <Field
              label="Email address *"
              value={form.email}
              onChange={(value) => set("email", value)}
              type="email"
              placeholder="name@company.com"
              required
            />
            <Field
              label="Mobile number"
              value={form.phone}
              onChange={(value) => set("phone", value)}
              placeholder="+91 98765 00000"
            />
            <Field
              label="Initial password *"
              value={form.password}
              onChange={(value) => set("password", value)}
              type="password"
              placeholder="Minimum 8 characters"
              required
            />
            {isStaff && (
              <>
                <div className="space-y-2">
                  <Label>Assigned staff role</Label>
                  <Select value={String(form.role)} onValueChange={(value) => set("role", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Field
                  label="Department / unit"
                  value={form.department}
                  onChange={(value) => set("department", value)}
                  placeholder="Operations"
                />
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
                  <div>
                    <p className="text-sm font-semibold">Require staff 2FA</p>
                    <p className="text-xs text-muted-foreground">
                      Security policy for internal staff accounts.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(form.mfaEnabled)}
                    onCheckedChange={(value) => set("mfaEnabled", value)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!isStaff && (
          <>
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/70 bg-[#f1f7ff]">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Business and compliance details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 md:grid-cols-2">
                <Field
                  label="Legal business name"
                  value={form.businessName}
                  onChange={(value) => set("businessName", value)}
                  placeholder="Registered company name"
                />
                <Field
                  label="Trade name"
                  value={form.tradeName}
                  onChange={(value) => set("tradeName", value)}
                  placeholder="Brand or trading name"
                />
                <Field
                  label="Business type"
                  value={form.businessType}
                  onChange={(value) => set("businessType", value)}
                  placeholder="Private Limited / Partnership"
                />
                <Field
                  label="Material category"
                  value={form.category}
                  onChange={(value) => set("category", value)}
                  placeholder="Ferrous, E-Waste, Plastic..."
                />
                <Field
                  label="GST number"
                  value={form.gstNumber}
                  onChange={(value) => set("gstNumber", value)}
                  placeholder="Optional"
                />
                <Field
                  label="PAN number"
                  value={form.panNumber}
                  onChange={(value) => set("panNumber", value)}
                  placeholder="Optional"
                />
                <Field
                  label="Contact person"
                  value={form.contactPerson}
                  onChange={(value) => set("contactPerson", value)}
                  placeholder="Business contact"
                />
                <Field
                  label="Website"
                  value={form.website}
                  onChange={(value) => set("website", value)}
                  placeholder="https://"
                />
                <Field
                  label="Years in business"
                  value={form.yearsInBusiness}
                  onChange={(value) => set("yearsInBusiness", value)}
                  placeholder="e.g. 5"
                />
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/70 bg-[#f1fbf7]">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Registered address
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 md:grid-cols-2">
                <Field
                  label="Address line 1"
                  value={form.addressLine1}
                  onChange={(value) => set("addressLine1", value)}
                  placeholder="Building, street, area"
                />
                <Field
                  label="Address line 2"
                  value={form.addressLine2}
                  onChange={(value) => set("addressLine2", value)}
                  placeholder="Landmark / unit"
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(value) => set("city", value)}
                  placeholder="City"
                />
                <Field
                  label="State"
                  value={form.state}
                  onChange={(value) => set("state", value)}
                  placeholder="State"
                />
                <Field
                  label="Pincode"
                  value={form.pincode}
                  onChange={(value) => set("pincode", value)}
                  placeholder="400001"
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(value) => set("country", value)}
                  placeholder="India"
                />
              </CardContent>
            </Card>
          </>
        )}

        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="flex gap-3 p-4 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Admin verification policy</p>
              <p className="mt-1 text-xs">
                This workflow records the account as created by an administrator and marks contact
                verification as complete. OTP is not sent for admin-created users.
              </p>
            </div>
          </CardContent>
        </Card>
        {!isStaff && (
          <>
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/70 bg-[#fff7f0]">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-orange-600" /> Banking and settlement details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 md:grid-cols-2">
                <Field
                  label="Bank name"
                  value={form.bankName}
                  onChange={(value) => set("bankName", value)}
                  placeholder="HDFC Bank"
                />
                <Field
                  label="Account holder name"
                  value={form.accountHolderName}
                  onChange={(value) => set("accountHolderName", value)}
                  placeholder="Registered business name"
                />
                <Field
                  label="Account number"
                  value={form.accountNumber}
                  onChange={(value) => set("accountNumber", value)}
                  placeholder="Account number"
                />
                <Field
                  label="IFSC code"
                  value={form.ifscCode}
                  onChange={(value) => set("ifscCode", value)}
                  placeholder="HDFC0000001"
                />
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/70 bg-[#f7f3ff]">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-5 w-5 text-violet-600" /> Registration documents
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 md:grid-cols-2">
                {[
                  ["gst_certificate", "GST certificate"],
                  ["pan_card", "PAN card"],
                  ["bank_proof", "Bank proof / cancelled cheque"],
                  ["address_proof", "Registered address proof"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    className="space-y-2 rounded-xl border border-dashed border-border p-4"
                  >
                    <Label>{label}</Label>
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(event) =>
                        setDocuments((current) => ({
                          ...current,
                          [key]: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {documents[key]?.name ?? "PDF, PNG or JPG"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
        <div className="flex justify-end gap-3">
          <Link to="/users">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gradient-gold text-primary font-bold">
            {saving ? (
              "Creating…"
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Create account
              </>
            )}
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
  value: string | boolean;
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
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
