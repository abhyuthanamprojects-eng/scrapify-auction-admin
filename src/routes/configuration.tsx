import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Section, StatCard } from "@/components/ops/ops-ui";
import { adminApi } from "@/lib/api-client";
import { AlertTriangle, Layers, FileCode2 } from "lucide-react";

export const Route = createFileRoute("/configuration")({
  head: () => ({ meta: [{ title: "Platform Configuration — Scrapify Auctions" }] }),
  component: ConfigurationPage,
});

type Category = { id: string; name: string; subcategories: string[]; status: string };

function ConfigurationPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void adminApi.getCategories()
      .then((response: any) => {
        const rows = Array.isArray(response) ? response : response?.data ?? [];
        if (!active) return;
        setCategories(rows.map((item: any) => ({
          id: String(item.id ?? item.code ?? ""),
          name: item.name ?? item.label ?? "",
          subcategories: Array.isArray(item.subcategories)
            ? item.subcategories.map((sub: any) => typeof sub === "string" ? sub : sub.name).filter(Boolean)
            : [],
          status: item.status ?? "",
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
      <PageHeader title="Platform Configuration" description="Configuration values are read from the Laravel API. No local policy or business fixtures are used." />
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Configured Categories" value={loading ? "…" : String(categories.length)} icon={Layers} />
        <StatCard label="Auction Templates" value="—" icon={FileCode2} />
      </div>
      <Section title={`Configured Categories (${categories.length})`} description="Categories and subcategories returned by the configuration API.">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading configuration…</p> : categories.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No category configuration is available from the API.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Subcategories</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} className="border-b last:border-0"><td className="px-4 py-3 font-mono text-xs">{category.id || "—"}</td><td className="px-4 py-3 font-semibold">{category.name || "—"}</td><td className="px-4 py-3 text-muted-foreground">{category.subcategories.join(", ") || "—"}</td><td className="px-4 py-3">{category.status || "—"}</td></tr>)}</tbody></table></div>
        )}
      </Section>
      <Section title="Auction, RFx, tax, legal, scoring and notification policies" description="These domains require their corresponding API resources before they can be shown or edited."><p className="p-6 text-sm text-muted-foreground">No policy records are available from the API.</p></Section>
    </>
  );
}
