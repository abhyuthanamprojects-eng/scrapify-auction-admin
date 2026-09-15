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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/terms-conditions")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Scrapify Auctions" }] }),
  component: TermsConditionsPage,
});

type TNC = {
  id: number;
  title: string;
  content: string;
  category_id: number | null;
  category?: { id: number; name: string } | null;
  applicable_to: string;
  type: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const TYPE_BADGE: Record<string, string> = {
  general: "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-950 dark:text-blue-300",
  payment: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
  inspection: "bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-950 dark:text-amber-300",
  delivery: "bg-purple-50 text-purple-700 ring-purple-300 dark:bg-purple-950 dark:text-purple-300",
  liability: "bg-red-50 text-red-700 ring-red-300 dark:bg-red-950 dark:text-red-300",
  dispute: "bg-orange-50 text-orange-700 ring-orange-300 dark:bg-orange-950 dark:text-orange-300",
  compliance: "bg-teal-50 text-teal-700 ring-teal-300 dark:bg-teal-950 dark:text-teal-300",
};

const APPLICABLE_BADGE: Record<string, string> = {
  all: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  buyer: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  seller: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

const TYPES = ["general", "payment", "inspection", "delivery", "liability", "dispute", "compliance"] as const;
const APPLICABLE = ["all", "buyer", "seller"] as const;

type CategoryOption = { id: number; label: string; isChild: boolean };

/** Parents followed by their own children, so a subcategory can be picked too. */
function flattenCategories(nested: any[]): CategoryOption[] {
  const out: CategoryOption[] = [];
  for (const parent of nested) {
    if (parent.parent_id) continue;
    out.push({ id: parent.id, label: parent.name, isChild: false });
    for (const child of parent.children ?? []) {
      out.push({ id: child.id, label: `    ${child.name}`, isChild: true });
    }
  }
  return out;
}

function TermsConditionsPage() {
  const [items, setItems] = useState<TNC[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TNC | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TNC | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    category_id: "" as string | number,
    applicable_to: "all" as string,
    type: "general" as string,
    sort_order: 0,
    is_active: true,
  });

  const categoryOptions = flattenCategories(categories);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getTermsConditions()
      .then((res: any) => {
        const inner = res?.data;
        const rows = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
        setItems(rows);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    adminApi.getCategories()
      .then((res: any) => setCategories(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => {});
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", content: "", category_id: "", applicable_to: "all", type: "general", sort_order: 0, is_active: true });
    setDialogOpen(true);
  }

  function openEdit(t: TNC) {
    setEditing(t);
    setForm({
      title: t.title,
      content: t.content,
      category_id: t.category_id ?? "",
      applicable_to: t.applicable_to,
      type: t.type,
      sort_order: t.sort_order,
      is_active: t.is_active,
    });
    setDialogOpen(true);
  }

  async function save() {
    const payload: any = { ...form, category_id: form.category_id || null, sort_order: Number(form.sort_order) || 0 };
    try {
      if (editing) {
        await adminApi.updateTermsCondition(editing.id, payload);
        toast.success("Terms updated.");
      } else {
        await adminApi.createTermsCondition(payload);
        toast.success("Terms created.");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function toggleActive(t: TNC) {
    try {
      await adminApi.updateTermsCondition(t.id, { is_active: !t.is_active });
      toast.success(`"${t.title}" ${t.is_active ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed.");
    }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    try {
      await adminApi.deleteTermsCondition(deleteConfirm.id);
      toast.success(`"${deleteConfirm.title}" deleted.`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const filtered = items.filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterCategory === "global" && t.category_id !== null) return false;
    if (filterCategory && filterCategory !== "global" && String(t.category_id) !== filterCategory) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Terms & Conditions"
        description="Manage terms and conditions that apply to auctions by category. Buyers see these on the auction detail page."
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border bg-card px-3 py-2 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>

        <select
          className="rounded-lg border bg-card px-3 py-2 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All categories</option>
          <option value="global">Global (all categories)</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        <div className="flex-1" />
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Terms
        </Button>
      </div>

      <Section title={`Terms & Conditions (${filtered.length})`} description="Active and inactive terms across all categories.">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No terms found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">For</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{t.sort_order}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{t.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.category?.name ?? <span className="italic text-muted-foreground">Global</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_BADGE[t.type] ?? ""}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${APPLICABLE_BADGE[t.applicable_to] ?? ""}`}>
                        {t.applicable_to}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${t.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300" : "bg-gray-100 text-gray-500 ring-gray-300 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(t)} title={t.is_active ? "Deactivate" : "Activate"}>
                          {t.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(t)} title="Delete" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Terms & Condition" : "New Terms & Condition"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Payment Terms" />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Full terms text..."
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Global (all categories)</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Applicable To</Label>
                <select
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  value={form.applicable_to}
                  onChange={(e) => setForm({ ...form, applicable_to: e.target.value })}
                >
                  {APPLICABLE.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.content.trim()} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Terms & Condition</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>"{deleteConfirm?.title}"</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
