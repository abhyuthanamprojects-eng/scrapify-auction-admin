import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Section } from "@/components/ops/ops-ui";
import { adminApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Download, Play, Pause, GitBranch, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Auction Templates — Scrapify Auctions" }] }),
  component: TemplatesPage,
});

type ColumnDef = {
  key: string;
  label: string;
  type: "string" | "decimal" | "money" | "integer" | "year" | "enum";
  required: boolean;
  description: string;
  example: string;
};

type Template = {
  id: number;
  template_code: string;
  name: string;
  category_id: number | null;
  subcategory_id: number | null;
  category_name?: string;
  subcategory_name?: string;
  version: string;
  status: string;
  direction: string;
  schema_definition: any;
  instructions: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 ring-gray-300",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-300",
  deprecated: "bg-yellow-50 text-yellow-700 ring-yellow-300",
  retired: "bg-red-50 text-red-700 ring-red-300",
};

const EMPTY_COLUMN: ColumnDef = { key: "", label: "", type: "string", required: false, description: "", example: "" };

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    adminApi.getAuctionTemplates()
      .then((res: any) => {
        const inner = res?.data;
        const rows = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
        setTemplates(rows);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTemplates();
    adminApi.getCategories()
      .then((res: any) => setCategories(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => {});
  }, [loadTemplates]);

  async function toggleStatus(t: Template) {
    try {
      if (t.status === "active") {
        await adminApi.deactivateAuctionTemplate(t.id);
        toast.success(`Template "${t.name}" deactivated.`);
      } else {
        await adminApi.activateAuctionTemplate(t.id);
        toast.success(`Template "${t.name}" activated.`);
      }
      loadTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status change failed.");
    }
  }

  return (
    <>
      <PageHeader title="Auction Templates" description="Manage Excel/upload templates that define how sellers submit auction item data." />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      <Section title={`Templates (${templates.length})`} description="All auction templates with their current status and version.">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No templates found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subcategory</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{t.template_code}</td>
                    <td className="px-4 py-3 font-semibold">
                      <button className="text-left hover:underline" onClick={() => setPreviewTemplate(t)}>{t.name}</button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.category_name ?? t.category_id ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.subcategory_name ?? t.subcategory_id ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.version}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_BADGE[t.status] ?? STATUS_BADGE.draft}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{t.direction}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={adminApi.getTemplateDownloadUrl(t.id)} target="_blank" rel="noreferrer" title="Download">
                          <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                        </a>
                        <Button size="sm" variant="ghost" title={t.status === "active" ? "Deactivate" : "Activate"} onClick={() => toggleStatus(t)}>
                          {t.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" title="New Version" onClick={() => setVersionOpen(t)}>
                          <GitBranch className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {previewTemplate && (
        <TemplatePreviewDialog template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}

      <CreateTemplateDialog
        open={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onCreated={loadTemplates}
      />

      <NewVersionDialog
        template={versionOpen}
        onClose={() => setVersionOpen(null)}
        onCreated={loadTemplates}
      />
    </>
  );
}

/* ---------- Template Preview Dialog ---------- */

function TemplatePreviewDialog({ template, onClose }: { template: Template; onClose: () => void }) {
  const columns: ColumnDef[] = (() => {
    try {
      const sd = template.schema_definition;
      if (!sd) return [];
      const parsed = typeof sd === "string" ? JSON.parse(sd) : sd;
      return Array.isArray(parsed.columns) ? parsed.columns : Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template: {template.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm mt-2">
          <div><span className="text-xs uppercase text-muted-foreground">Code</span><div className="font-mono">{template.template_code}</div></div>
          <div><span className="text-xs uppercase text-muted-foreground">Version</span><div className="font-mono">{template.version}</div></div>
          <div><span className="text-xs uppercase text-muted-foreground">Direction</span><div className="capitalize">{template.direction}</div></div>
          <div><span className="text-xs uppercase text-muted-foreground">Status</span><div className="capitalize">{template.status}</div></div>
        </div>
        {template.instructions && (
          <div className="mt-4">
            <span className="text-xs uppercase text-muted-foreground">Instructions</span>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{template.instructions}</p>
          </div>
        )}
        {columns.length > 0 && (
          <div className="mt-4">
            <span className="text-xs uppercase text-muted-foreground">Columns ({columns.length})</span>
            <div className="mt-2 overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead><tr className="border-b bg-muted/40"><th className="p-2 text-left">Key</th><th className="p-2 text-left">Label</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Required</th><th className="p-2 text-left">Example</th></tr></thead>
                <tbody>
                  {columns.map((col, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2 font-mono">{col.key}</td>
                      <td className="p-2">{col.label}</td>
                      <td className="p-2">{col.type}</td>
                      <td className="p-2">{col.required ? "Yes" : "No"}</td>
                      <td className="p-2 text-muted-foreground">{col.example || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Create Template Dialog ---------- */

function CreateTemplateDialog({ open, categories, onClose, onCreated }: { open: boolean; categories: any[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    template_code: "",
    name: "",
    category_id: "",
    subcategory_id: "",
    direction: "forward",
    version: "1.0.0",
    instructions: "",
  });
  const [columns, setColumns] = useState<ColumnDef[]>([{ ...EMPTY_COLUMN }]);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((c: any) => String(c.id) === form.category_id);
  const subcategories: any[] = selectedCategory?.children ?? [];

  function updateColumn(idx: number, patch: Partial<ColumnDef>) {
    setColumns((prev) => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }
  function removeColumn(idx: number) {
    setColumns((prev) => prev.filter((_, i) => i !== idx));
  }
  function addColumn() {
    setColumns((prev) => [...prev, { ...EMPTY_COLUMN }]);
  }

  async function submit() {
    if (!form.template_code || !form.name) {
      toast.error("Template code and name are required.");
      return;
    }
    setSubmitting(true);
    try {
      const validColumns = columns.filter((c) => c.key.trim());
      await adminApi.createAuctionTemplate({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        schema_definition: { columns: validColumns },
      });
      toast.success("Template created.");
      onClose();
      onCreated();
      setForm({ template_code: "", name: "", category_id: "", subcategory_id: "", direction: "forward", version: "1.0.0", instructions: "" });
      setColumns([{ ...EMPTY_COLUMN }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Auction Template</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Template Code</Label>
              <Input value={form.template_code} onChange={(e) => setForm({ ...form, template_code: e.target.value })} placeholder="e.g. SCRAP_METAL_V1" />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Scrap Metal Template" />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: "" })}>
                <option value="">— Select —</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Subcategory</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}>
                <option value="">— Select —</option>
                {subcategories.map((s: any) => {
                  const id = typeof s === "string" ? s : s.id;
                  const name = typeof s === "string" ? s : s.name;
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Direction</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="forward">Forward</option>
                <option value="reverse">Reverse</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Version</Label>
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Instructions</Label>
            <Textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Instructions for sellers filling out this template..." />
          </div>

          {/* Column Schema Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Column Schema</Label>
              <Button size="sm" variant="outline" onClick={addColumn} className="gap-1"><Plus className="h-3 w-3" /> Add Column</Button>
            </div>
            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_100px_40px_1fr_1fr_32px] gap-2 items-center rounded-md border p-2">
                  <Input placeholder="key" value={col.key} onChange={(e) => updateColumn(idx, { key: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="label" value={col.label} onChange={(e) => updateColumn(idx, { label: e.target.value })} className="h-8 text-xs" />
                  <select className="h-8 rounded-md border bg-background px-1 text-xs" value={col.type} onChange={(e) => updateColumn(idx, { type: e.target.value as ColumnDef["type"] })}>
                    <option value="string">string</option>
                    <option value="decimal">decimal</option>
                    <option value="money">money</option>
                    <option value="integer">integer</option>
                    <option value="year">year</option>
                    <option value="enum">enum</option>
                  </select>
                  <div className="flex items-center justify-center">
                    <Checkbox checked={col.required} onCheckedChange={(v) => updateColumn(idx, { required: !!v })} />
                  </div>
                  <Input placeholder="description" value={col.description} onChange={(e) => updateColumn(idx, { description: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="example" value={col.example} onChange={(e) => updateColumn(idx, { example: e.target.value })} className="h-8 text-xs" />
                  <Button size="sm" variant="ghost" onClick={() => removeColumn(idx)} className="h-8 w-8 p-0"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Key | Label | Type | Req | Description | Example</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={submitting} onClick={submit} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {submitting ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- New Version Dialog ---------- */

function NewVersionDialog({ template, onClose, onCreated }: { template: Template | null; onClose: () => void; onCreated: () => void }) {
  const [version, setVersion] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setVersion("");
      setInstructions(template.instructions ?? "");
    }
  }, [template]);

  async function submit() {
    if (!template || !version.trim()) {
      toast.error("Version is required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createTemplateVersion(template.id, { version, instructions });
      toast.success(`Version ${version} created for "${template.name}".`);
      onClose();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create version.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={template !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Version — {template?.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="text-sm text-muted-foreground">Current version: <span className="font-mono font-medium text-foreground">{template?.version}</span></div>
          <div className="space-y-1">
            <Label>New Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 2.0.0" />
          </div>
          <div className="space-y-1">
            <Label>Instructions (optional)</Label>
            <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={submitting} onClick={submit} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {submitting ? "Creating..." : "Create Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
