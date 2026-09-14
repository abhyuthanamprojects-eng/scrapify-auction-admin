import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Section, StatCard } from "@/components/ops/ops-ui";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api-client";
import { AlertTriangle, FileCode2, Layers, Plus, Settings2 } from "lucide-react";

export const Route = createFileRoute("/configuration")({
  head: () => ({ meta: [{ title: "Platform Configuration — Scrapify Auctions" }] }),
  component: ConfigurationPage,
});

type Category = { id: string; name: string; subcategories: string[]; status: string };
type Template = {
  id: string;
  template_code: string;
  name: string;
  category_name?: string;
  version?: string;
  status?: string;
};

function ConfigurationPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([adminApi.getCategories(), adminApi.getAuctionTemplates()])
      .then(([categoryResponse, templateResponse]: any[]) => {
        if (!active) return;
        const categoryRows = Array.isArray(categoryResponse) ? categoryResponse : categoryResponse?.data ?? [];
        const templateRows = Array.isArray(templateResponse) ? templateResponse : templateResponse?.data ?? [];
        setCategories(categoryRows.map((item: any) => ({
          id: String(item.id ?? item.code ?? ""),
          name: item.name ?? item.label ?? "",
          subcategories: Array.isArray(item.subcategories)
            ? item.subcategories.map((sub: any) => typeof sub === "string" ? sub : sub.name).filter(Boolean)
            : [],
          status: item.status ?? (item.is_active === false ? "Inactive" : "Active"),
        })));
        setTemplates(templateRows.map((item: any) => ({
          id: String(item.id ?? item.template_code ?? ""),
          template_code: item.template_code ?? item.code ?? "",
          name: item.name ?? "",
          category_name: item.category_name ?? item.category?.name,
          version: item.version,
          status: item.status,
        })));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load configuration from the API.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHeader
        title="Platform Configuration"
        description="Configuration values are read from the Laravel API. No local policy or business fixtures are used."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/categories">
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
            </Link>
            <Link to="/templates">
              <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Template</Button>
            </Link>
          </div>
        }
      />
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Configured Categories" value={loading ? "…" : String(categories.length)} icon={Layers} />
        <StatCard label="Auction Templates" value={loading ? "…" : String(templates.length)} icon={FileCode2} />
      </div>
      <Section title={`Configured Categories (${categories.length})`} description="Categories and subcategories returned by the configuration API.">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading configuration…</p> : categories.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No category configuration is available from the API.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Subcategories</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} className="border-b last:border-0"><td className="px-4 py-3 font-mono text-xs">{category.id || "—"}</td><td className="px-4 py-3 font-semibold">{category.name || "—"}</td><td className="px-4 py-3 text-muted-foreground">{category.subcategories.join(", ") || "—"}</td><td className="px-4 py-3">{category.status || "—"}</td></tr>)}</tbody></table></div>
        )}
      </Section>
      <Section title={`Auction Templates (${templates.length})`} description="Templates define the fields available when sellers upload auction items.">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading templates…</p> : templates.length === 0 ? (
          <div className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">No auction templates are configured yet.</p>
            <Link to="/templates"><Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Create Template</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{templates.map((template) => <tr key={template.id} className="border-b last:border-0"><td className="px-4 py-3 font-mono text-xs">{template.template_code || "—"}</td><td className="px-4 py-3 font-semibold">{template.name || "—"}</td><td className="px-4 py-3 text-muted-foreground">{template.category_name || "—"}</td><td className="px-4 py-3 font-mono text-xs">{template.version || "—"}</td><td className="px-4 py-3">{template.status || "—"}</td></tr>)}</tbody></table><div className="flex justify-end border-t p-4"><Link to="/templates"><Button variant="outline" className="gap-2"><Settings2 className="h-4 w-4" /> Manage Templates</Button></Link></div></div>
        )}
      </Section>
      <Section title="Auction, RFx, tax, legal, scoring and notification policies" description="These domains require their corresponding API resources before they can be shown or edited."><p className="p-6 text-sm text-muted-foreground">No policy records are available from the API.</p></Section>
    </>
  );
}
