import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Landmark,
  CheckCircle2,
  CircleDashed,
  Send,
  Save,
  FileText,
  Wallet,
  Trash2,
  Upload,
} from "lucide-react";
import {
  isOrgComplete,
  isUnitComplete,
  newOrgId,
  upsertOrganization,
  ORG_DOCUMENT_TYPES,
  type OrgDocument,
  type UnitBank,
  type Organization,
  type Unit,
} from "@/lib/organizations-store";

export const Route = createFileRoute("/organizations/new")({
  head: () => ({
    meta: [
      { title: "New Organization — Scrapify Admin" },
      { name: "description", content: "Create a new seller organization and submit for Super Admin approval." },
    ],
  }),
  component: NewOrganization,
});

function emptyUnit(i: number): Unit {
  return {
    id: `U-${i}`,
    name: "",
    gst: "",
    location: "",
    bank: { accountNumber: "", ifsc: "", bankName: "" },
  };
}

function NewOrganization() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [totalUnits, setTotalUnits] = useState(1);
  const [units, setUnits] = useState<Unit[]>([emptyUnit(1)]);
  const [open, setOpen] = useState<Record<string, boolean>>({ "U-1": true });
  const [bank, setBank] = useState<UnitBank>({ accountNumber: "", ifsc: "", bankName: "" });
  const [documents, setDocuments] = useState<OrgDocument[]>([]);

  function addDocument(type: string, fileName: string) {
    setDocuments((prev) => [
      ...prev,
      { id: `D-${Date.now()}`, type, fileName, uploadedAt: new Date().toISOString() },
    ]);
  }

  function syncUnitCount(n: number) {
    const count = Math.max(0, Math.min(50, Math.floor(n || 0)));
    setTotalUnits(count);
    setUnits((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const extra = Array.from({ length: count - prev.length }, (_, i) => emptyUnit(prev.length + i + 1));
        return [...prev, ...extra];
      }
      return prev.slice(0, count);
    });
  }

  function updateUnit(idx: number, patch: Partial<Unit> | { bank: Partial<Unit["bank"]> }) {
    setUnits((prev) =>
      prev.map((u, i) => {
        if (i !== idx) return u;
        if ("bank" in patch && patch.bank) return { ...u, bank: { ...u.bank, ...patch.bank } };
        return { ...u, ...(patch as Partial<Unit>) };
      }),
    );
  }

  const draft: Organization = useMemo(
    () => ({
      id: "",
      companyName,
      location,
      totalUnits,
      units,
      status: "Draft",
      createdAt: new Date().toISOString(),
      bank,
      documents,
    }),
    [companyName, location, totalUnits, units, bank, documents],
  );

  const complete = isOrgComplete(draft);

  function save(status: "Draft" | "Pending Super Admin Approval") {
    const id = newOrgId();
    upsertOrganization({ ...draft, id, status });
    toast.success(
      status === "Draft" ? "Saved as draft" : "Sent for Super Admin approval",
    );
    navigate({ to: "/organizations" });
  }

  return (
    <>
      <PageHeader
        title="New Organization"
        description="Register a seller organization and its operating units. Requires Super Admin approval to go live."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save("Draft")} className="gap-2">
              <Save className="h-4 w-4" /> Save draft
            </Button>
            <Button onClick={() => save("Pending Super Admin Approval")} disabled={!complete} className="gap-2">
              <Send className="h-4 w-4" /> Send for Approval
            </Button>
          </div>
        }
      />

      {/* Section A */}
      <Section
        icon={<Building2 className="h-4 w-4" />}
        letter="A"
        title="Company Details"
        subtitle="Legal entity and headquarters."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Company Name" required>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Meridian Metals Pvt Ltd" />
          </Field>
          <Field label="Total Units" required hint="Number of branches or operating units.">
            <Input
              type="number"
              min={1}
              max={50}
              value={totalUnits}
              onChange={(e) => syncUnitCount(parseInt(e.target.value, 10))}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Location / Address" required>
              <Textarea value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Full registered address" rows={2} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Section B */}
      <Section
        icon={<Landmark className="h-4 w-4" />}
        letter="B"
        title="Unit Details"
        subtitle={`Configure ${totalUnits} unit${totalUnits === 1 ? "" : "s"}. Adjust the Total Units above to add or remove cards.`}
      >
        {units.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Set Total Units above to add unit cards.
          </div>
        )}
        <div className="space-y-3">
          {units.map((u, idx) => {
            const done = isUnitComplete(u);
            const isOpen = open[u.id] ?? false;
            return (
              <div key={u.id} className="rounded-xl border border-border bg-background overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [u.id]: !isOpen }))}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold ring-1 ${done ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-muted text-muted-foreground ring-border"}`}>
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">
                        {u.name || `Unit ${idx + 1}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {done ? (
                          <><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Complete</>
                        ) : (
                          <><CircleDashed className="h-3 w-3" /> Awaiting details</>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 pt-2 border-t border-border/60">
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Unit Name" required>
                        <Input value={u.name} onChange={(e) => updateUnit(idx, { name: e.target.value })} placeholder="e.g. Pune HQ" />
                      </Field>
                      <Field label="Unit GST Number" required>
                        <Input value={u.gst} onChange={(e) => updateUnit(idx, { gst: e.target.value.toUpperCase() })} placeholder="15-char GSTIN" />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Unit Location" required>
                          <Input value={u.location} onChange={(e) => updateUnit(idx, { location: e.target.value })} placeholder="City, State" />
                        </Field>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                          <Landmark className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Bank Details</p>
                      </div>
                      <div className="grid gap-5 md:grid-cols-3 rounded-lg bg-muted/30 p-4">
                        <Field label="Bank Name" required>
                          <Input value={u.bank.bankName} onChange={(e) => updateUnit(idx, { bank: { bankName: e.target.value } })} placeholder="e.g. HDFC Bank" />
                        </Field>
                        <Field label="Account Number" required>
                          <Input value={u.bank.accountNumber} onChange={(e) => updateUnit(idx, { bank: { accountNumber: e.target.value } })} />
                        </Field>
                        <Field label="IFSC" required>
                          <Input value={u.bank.ifsc} onChange={(e) => updateUnit(idx, { bank: { ifsc: e.target.value.toUpperCase() } })} placeholder="e.g. HDFC0001234" />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Section C */}
      <Section
        icon={<Wallet className="h-4 w-4" />}
        letter="C"
        title="Bank Details & Documents"
        subtitle="Organization-level banking and KYC paperwork."
      >
        <div className="grid gap-5 md:grid-cols-3 rounded-lg bg-muted/30 p-4">
          <Field label="Bank Name">
            <Input
              value={bank.bankName}
              onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
              placeholder="e.g. HDFC Bank"
            />
          </Field>
          <Field label="Account Number">
            <Input
              value={bank.accountNumber}
              onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value }))}
            />
          </Field>
          <Field label="IFSC">
            <Input
              value={bank.ifsc}
              onChange={(e) => setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))}
              placeholder="e.g. HDFC0001234"
            />
          </Field>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Documents</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ORG_DOCUMENT_TYPES.map((type) => {
              const existing = documents.find((d) => d.type === type);
              return (
                <label
                  key={type}
                  className="rounded-xl border border-dashed border-border bg-background p-4 flex items-start gap-3 cursor-pointer hover:border-accent/50 transition-colors"
                >
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{type}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {existing ? existing.fileName : "PDF, JPG or PNG"}
                    </div>
                  </div>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setDocuments((prev) => prev.filter((d) => d.type !== type));
                      addDocument(type, f.name);
                      toast.success(`${type} attached`);
                    }}
                  />
                </label>
              );
            })}
          </div>

          {documents.length > 0 && (
            <ul className="mt-4 divide-y divide-border/60 rounded-xl border border-border bg-background">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{d.type}</div>
                    <div className="text-xs text-muted-foreground truncate">{d.fileName}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDocuments((prev) => prev.filter((x) => x.id !== d.id))}
                    aria-label={`Remove ${d.type}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <div className="mt-8 flex items-center justify-between card-premium p-4">
        <div className="text-sm">
          {complete ? (
            <span className="inline-flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Ready to send for Super Admin approval.
            </span>
          ) : (
            <span className="text-muted-foreground">
              Complete all sections and every unit card to enable submission.
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save("Draft")} className="gap-2">
            <Save className="h-4 w-4" /> Save draft
          </Button>
          <Button onClick={() => save("Pending Super Admin Approval")} disabled={!complete} className="gap-2">
            <Send className="h-4 w-4" /> Send for Approval
          </Button>
        </div>
      </div>
    </>
  );
}

function Section({
  letter,
  icon,
  title,
  subtitle,
  children,
}: {
  letter: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-premium p-6 mb-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl gradient-navy text-white flex items-center justify-center font-display text-lg shadow-sm">
          {letter}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-accent">{icon}</span>
            <h2 className="font-display text-2xl text-foreground">{title}</h2>
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}