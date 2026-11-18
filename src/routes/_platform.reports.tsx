import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileCheck2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/agri/page-header";
import { DataBadge } from "@/components/agri/data-badge";
import { STATUS_BG } from "@/components/agri/health";
import { farmSummary, useFarm } from "@/lib/farm-store";
import { downloadFarmReport, type ReportOptions } from "@/lib/report-pdf";
import { weatherQuery } from "@/lib/weather";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/reports")({
  head: () => ({
    meta: [
      { title: "Reports · AgriSmart AI" },
      { name: "description", content: "Generate and download a farm health report PDF with plot health, irrigation advice, soil and disease summaries." },
      { property: "og:title", content: "Reports · AgriSmart AI" },
      { property: "og:description", content: "Generate and download a farm health report PDF with plot health, irrigation advice, soil and disease summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

const SECTION_LABELS: Record<keyof ReportOptions["sections"], string> = {
  summary: "Farm summary & KPIs",
  plots: "Plot-by-plot health",
  irrigation: "Irrigation recommendations",
  soil: "Soil health",
  disease: "Disease detections",
  alerts: "Open alerts",
};

function Reports() {
  const { plots, settings, simulation } = useFarm();
  const weather = useQuery(weatherQuery(settings.weatherLocationId));
  const [sections, setSections] = useState<ReportOptions["sections"]>({ summary: true, plots: true, irrigation: true, soil: true, disease: true, alerts: true });
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<{ name: string; at: string; sim: boolean }[]>([]);
  const summary = farmSummary(plots);
  const none = !Object.values(sections).some(Boolean);

  const generate = async () => {
    setBusy(true);
    try {
      const name = await downloadFarmReport(plots, settings, {
        sections,
        simulated: simulation.enabled,
        weatherSource: weather.data?.source ?? "demo",
        rainNext24hMm: weather.data?.daily[0]?.rainMm ?? 0,
        rainProbability: weather.data?.daily[0]?.rainProbability ?? 0,
      });
      setGenerated((g) => [{ name, at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), sim: simulation.enabled }, ...g]);
      toast.success("Report downloaded", { description: name });
    } catch (err) {
      console.error(err);
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reports" title="Farm health report" description="Choose what to include and download a PDF you can print or share with your agronomist, bank or FPO." actions={<DataBadge kind={simulation.enabled ? "simulated" : "sample"} />} />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft lg:self-start">
          <h2 className="font-sans text-base font-semibold">Report contents</h2>
          <div className="space-y-3">
            {(Object.keys(SECTION_LABELS) as (keyof ReportOptions["sections"])[]).map((k) => (
              <div key={k} className="flex items-center gap-3">
                <Checkbox id={`sec-${k}`} checked={sections[k]} onCheckedChange={(v) => setSections((s) => ({ ...s, [k]: v === true }))} />
                <Label htmlFor={`sec-${k}`} className="font-normal">{SECTION_LABELS[k]}</Label>
              </div>
            ))}
          </div>
          {simulation.enabled && <p className="rounded-lg bg-earth/10 p-2 text-xs text-earth">Simulation mode is on — the report will use simulated values and say so.</p>}
          <Button size="lg" className="h-11 w-full rounded-xl" onClick={generate} disabled={busy || none}>
            {busy ? <><Loader2 className="animate-spin" /> Creating PDF…</> : <><Download /> Download PDF report</>}
          </Button>
          {none && <p className="text-xs text-danger">Select at least one section.</p>}
        </section>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="bg-primary px-6 py-5 text-primary-foreground">
              <p className="font-display text-2xl font-semibold">Farm Health Report</p>
              <p className="text-sm opacity-85">{settings.farmName} · {settings.location} · Preview</p>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Area", `${summary.totalArea.toFixed(1)} ac`], ["Avg health", `${summary.avgHealth}/100`], ["Need attention", `${summary.counts.watch + summary.counts.critical}`], ["Weather", weather.data?.source === "live" ? "Live" : "Demo"]].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold">{v}</p></div>
                ))}
              </div>
              {sections.plots && (
                <ul className="space-y-2">
                  {plots.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 text-sm">
                      <span className="w-36 truncate">{p.name} · {p.crop}</span>
                      <span className="h-2 flex-1 rounded-full bg-muted"><span className={cn("block h-2 rounded-full", STATUS_BG[p.status])} style={{ width: `${p.health}%` }} /></span>
                      <span className="w-8 text-right tabular-nums">{p.health}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">Included: {Object.entries(sections).filter(([, v]) => v).map(([k]) => SECTION_LABELS[k as keyof typeof SECTION_LABELS]).join(", ") || "nothing"}.</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="font-sans text-base font-semibold">Downloaded this session</h2>
            {generated.length === 0 ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><FileText className="size-4" /> No reports yet.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {generated.map((g, i) => (
                  <li key={i} className="flex items-center gap-3 py-2 text-sm"><FileCheck2 className="size-4 text-success" /><span className="flex-1">{g.name}</span><span className="text-xs text-muted-foreground">{g.at}{g.sim && " · simulated"}</span></li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
