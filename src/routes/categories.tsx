import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderTree,
  Plus,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "Categories — Scrapify Admin" }] }),
  component: CategoriesPage,
});

type Category = {
  id: number;
  name: string;
  slug: string;
  direction: string;
  template_required: boolean;
  allow_manual_items: boolean;
  allow_excel: boolean;
  max_rows: number | null;
  is_active: boolean;
  sort_order: number;
  children: Category[];
};

type FormData = {
  name: string;
  parent_id: string;
  direction: string;
  template_required: boolean;
  allow_manual_items: boolean;
  allow_excel: boolean;
  is_active: boolean;
};

const emptyForm: FormData = {
  name: "",
  parent_id: "",
  direction: "forward",
  template_required: false,
  allow_manual_items: true,
  allow_excel: false,
  is_active: true,
};

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  async function loadCategories() {
    try {
      const res = await adminApi.getCategories();
      const data = res?.data ?? res;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openCreate(parentId?: number) {
    setEditingId(null);
    setForm({ ...emptyForm, parent_id: parentId ? String(parentId) : "" });
    setDialogOpen(true);
  }

  function openEdit(cat: Category, parentId?: number) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      parent_id: parentId ? String(parentId) : "",
      direction: cat.direction ?? "forward",
      template_required: cat.template_required ?? false,
      allow_manual_items: cat.allow_manual_items ?? true,
      allow_excel: cat.allow_excel ?? false,
      is_active: cat.is_active ?? true,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        direction: form.direction,
        template_required: form.template_required,
        allow_manual_items: form.allow_manual_items,
        allow_excel: form.allow_excel,
        is_active: form.is_active,
      };
      if (form.parent_id) payload.parent_id = Number(form.parent_id);
      if (editingId) {
        await adminApi.updateCategory(editingId, payload);
        toast.success("Category updated.");
      } else {
        await adminApi.createCategory(payload);
        toast.success("Category created.");
      }
      setDialogOpen(false);
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cannot delete category.");
    }
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Categories"
          description="Manage auction material categories and subcategories."
        />
        <Button onClick={() => openCreate()} className="gradient-gold text-primary font-bold">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-border/70 bg-white">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderTree className="h-5 w-5 text-accent" /> Category Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No categories found.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <CategoryRow
                    category={cat}
                    depth={0}
                    expanded={expanded.has(cat.id)}
                    onToggle={() => toggleExpand(cat.id)}
                    onEdit={() => openEdit(cat)}
                    onDelete={() => setDeleteTarget(cat)}
                    onAddChild={() => openCreate(cat.id)}
                  />
                  {expanded.has(cat.id) &&
                    cat.children?.map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        depth={1}
                        onEdit={() => openEdit(child, cat.id)}
                        onDelete={() => setDeleteTarget(child)}
                      />
                    ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Ferrous Metals"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent category</Label>
              <Select value={form.parent_id || "none"} onValueChange={(v) => set("parent_id", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root category)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={(v) => set("direction", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="reverse">Reverse</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <CheckboxField
                label="Template required"
                checked={form.template_required}
                onChange={(v) => set("template_required", v)}
              />
              <CheckboxField
                label="Allow manual items"
                checked={form.allow_manual_items}
                onChange={(v) => set("allow_manual_items", v)}
              />
              <CheckboxField
                label="Allow Excel upload"
                checked={form.allow_excel}
                onChange={(v) => set("allow_excel", v)}
              />
              <CheckboxField
                label="Active"
                checked={form.is_active}
                onChange={(v) => set("is_active", v)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The API will reject deletion if the category has linked auctions
              or templates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryRow({
  category,
  depth,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category;
  depth: number;
  expanded?: boolean;
  onToggle?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
      style={{ paddingLeft: `${20 + depth * 32}px` }}
    >
      {depth === 0 ? (
        <button
          onClick={onToggle}
          className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      ) : (
        <span className="h-5 w-5 shrink-0" />
      )}

      <span className="font-medium text-sm flex-1 min-w-0 truncate">{category.name}</span>
      <span className="text-xs text-muted-foreground font-mono">{category.slug}</span>
      <Badge label={category.direction} />
      {category.template_required && <Pill label="TPL" title="Template required" />}
      {category.allow_excel && <Pill label="XLS" title="Allow Excel" />}
      <span
        className={`inline-block h-2 w-2 rounded-full ${category.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
        title={category.is_active ? "Active" : "Inactive"}
      />

      <div className="flex items-center gap-1 shrink-0">
        {onAddChild && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddChild} title="Add subcategory">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  );
}

function Pill({ label, title }: { label: string; title: string }) {
  return (
    <span
      className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
      title={title}
    >
      {label}
    </span>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
      {label}
    </label>
  );
}
