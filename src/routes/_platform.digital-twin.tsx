import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, Droplets, Gauge, RotateCcw, SlidersHorizontal, Sprout, Thermometer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "@/components/agri/page-header";
import { DataBadge } from "@/components/agri/data-badge";
import { STATUS_BG, STATUS_SOFT, STATUS_TEXT } from "@/components/agri/health";
import { farmSummary, useFarm, type LivePlot } from "@/lib/farm-store";
import { IRRIGATION_ZONES, SAMPLE_PLOTS } from "@/lib/farm-data";
import { getCropProfile, HEALTH_LABEL, irrigationAdvice } from "@/lib/farm-logic";
import { cn } from "@/lib/utils";

type Layer = "health" | "moisture" | "zones";

export const Route = createFileRoute("/_platform/digital-twin")({
  validateSearch: (search: Record<string, unknown>): { plot?: string } => ({
    plot: typeof search.plot === "string" ? search.plot : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Digital Twin Farm · AgriSmart AI" },
      { name: "description", content: "Interactive virtual farm map with plot health, irrigation zones, problem areas and a what-if simulator." },
      { property: "og:title", content: "Digital Twin Farm · AgriSmart AI" },
      { property: "og:description", content: "Interactive virtual farm map with plot health, irrigation zones, problem areas and a what-if simulator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DigitalTwin,
});

const ZONE_RING: Record<string, string> = { "Zone 1": "ring-water", "Zone 2": "ring-earth", "Zone 3": "ring-wheat" };
const ZONE_DOT: Record<string, string> = { "Zone 1": "bg-water", "Zone 2": "bg-earth", "Zone 3": "bg-wheat" };

function moistureClass(m: number) {
  if (m < 40) return "bg-earth/70";
  if (m < 55) return "bg-wheat/70";
  if (m < 70) return "bg-leaf/60";
  return "bg-water/60";
}

function DigitalTwin() {
  const { plot: selectedId } = Route.useSearch();
  const navigate = useNavigate({ from: "/digital-twin" });
  const { plots, simulation, setSimulation, resetSimulation } = useFarm();
  const [layer, setLayer] = useState<Layer>("health");
  const summary = farmSummary(plots);
  const selected = plots.find((p) => p.id === selectedId);
  const select = (id?: string) => navigate({ search: { plot: id }, replace: true });
  const problems = plots.filter((p) => p.status !== "healthy" || p.issue);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital twin"
        title="Your farm, live in one map"
        description="Click any plot for details. Switch layers to see health, soil moisture or irrigation zones, and use simulation mode to test what-if conditions."
        actions={<DataBadge kind={simulation.enabled ? "simulated" : "sample"} label={simulation.enabled ? "Simulation running" : "Sample field data"} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewTile icon={Gauge} label="Farm-wide health" value={`${summary.avgHealth}/100`} valueClass={STATUS_TEXT[summary.status]} sub={HEALTH_LABEL[summary.status]} />
        <OverviewTile icon={Sprout} label="Plot status" value={`${summary.counts.healthy} / ${summary.counts.watch} / ${summary.counts.critical}`} sub="Healthy · Attention · Critical" />
        <OverviewTile icon={Droplets} label="Avg soil moisture" value={`${summary.avgMoisture}%`} sub="Across all plots" />
        <OverviewTile icon={AlertTriangle} label="Problem areas" value={`${problems.length}`} valueClass={problems.length ? "text-danger" : "text-success"} sub="Plots flagged for attention" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border bg-card p-4 shadow-soft md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup type="single" value={layer} onValueChange={(v) => v && setLayer(v as Layer)} variant="outline" size="sm">
              <ToggleGroupItem value="health">Crop health</ToggleGroupItem>
              <ToggleGroupItem value="moisture">Soil moisture</ToggleGroupItem>
              <ToggleGroupItem value="zones">Irrigation zones</ToggleGroupItem>
            </ToggleGroup>
            <Legend layer={layer} />
          </div>

          <div className="relative overflow-hidden rounded-2xl border-4 border-earth/40 bg-earth/20 p-2">
            <div className="grid aspect-[4/3] grid-cols-12 grid-rows-6 gap-2 sm:aspect-[16/9]">
              {plots.map((p) => (
                <PlotTile key={p.id} plot={p} layer={layer} selected={p.id === selectedId} onClick={() => select(p.id === selectedId ? undefined : p.id)} />
              ))}
            </div>
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-card/85 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">N ↑ · not to scale</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {IRRIGATION_ZONES.map((z) => (
              <div key={z.id} className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
                <span className={cn("size-3 rounded-full", ZONE_DOT[z.id])} />
                <div className="min-w-0">
                  <p className="font-semibold">{z.id} · {z.method}</p>
                  <p className="truncate text-xs text-muted-foreground">{z.status} · next {z.nextRun}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          {selected ? <PlotDetails plot={selected} onClose={() => select(undefined)} /> : (
            <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-center">
              <Sprout className="mx-auto size-8 text-primary" />
              <p className="mt-2 font-semibold">Select a plot</p>
              <p className="text-sm text-muted-foreground">Click any field on the map to see crop stage, moisture, temperature and recommended action.</p>
            </div>
          )}

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><SlidersHorizontal className="size-4" /> Simulation mode</h2>
                <p className="text-xs text-muted-foreground">Changes apply across the dashboard, analytics and reports.</p>
              </div>
              <Switch checked={simulation.enabled} onCheckedChange={(v) => setSimulation((s) => ({ ...s, enabled: v }))} aria-label="Toggle simulation mode" />
            </div>
            <div className={cn("mt-5 space-y-5 transition-opacity", !simulation.enabled && "pointer-events-none opacity-45")}>
              <SimSlider label="Farm-wide soil moisture change" unit="%" min={-30} max={30} value={simulation.moistureDelta} onChange={(v) => setSimulation((s) => ({ ...s, moistureDelta: v }))} />
              <SimSlider label="Farm-wide temperature change" unit="°C" min={-8} max={8} value={simulation.tempDelta} onChange={(v) => setSimulation((s) => ({ ...s, tempDelta: v }))} />
              {selected && (
                <div className="space-y-5 rounded-xl bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Override {selected.name} only</p>
                  <SimSlider
                    label="Soil moisture"
                    unit="%"
                    absolute
                    min={0}
                    max={100}
                    value={selected.moisture}
                    onChange={(v) => setSimulation((s) => ({ ...s, overrides: { ...s.overrides, [selected.id]: { ...s.overrides[selected.id], moisture: v } } }))}
                  />
                  <SimSlider
                    label="Temperature"
                    unit="°C"
                    absolute
                    min={0}
                    max={48}
                    value={selected.temperature}
                    onChange={(v) => setSimulation((s) => ({ ...s, overrides: { ...s.overrides, [selected.id]: { ...s.overrides[selected.id], temperature: v } } }))}
                  />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={resetSimulation} className="w-full"><RotateCcw /> Reset to sample values</Button>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="font-sans text-base font-semibold">Potential problem areas</h2>
            {problems.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No problem areas detected.</p> : (
              <ul className="mt-3 space-y-2">
                {problems.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => select(p.id)} className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted">
                      <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", STATUS_BG[p.status])} />
                      <span>
                        <span className="block text-sm font-semibold">{p.name} · {p.crop} <span className={cn("ml-1 text-xs", STATUS_TEXT[p.status])}>{p.health}</span></span>
                        <span className="block text-xs text-muted-foreground">{p.issue ?? `Conditions outside ideal range for ${p.crop}`}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function OverviewTile({ icon: Icon, label, value, sub, valueClass }: { icon: typeof Gauge; label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft">
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("font-display text-xl font-semibold", valueClass)}>{value}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Legend({ layer }: { layer: Layer }) {
  const items =
    layer === "health"
      ? [["bg-success", "Healthy 75+"], ["bg-warning", "Attention 50–74"], ["bg-danger", "Critical <50"]]
      : layer === "moisture"
        ? [["bg-earth/70", "<40%"], ["bg-wheat/70", "40–55%"], ["bg-leaf/60", "55–70%"], ["bg-water/60", "70%+"]]
        : [["bg-water", "Zone 1 · Drip"], ["bg-earth", "Zone 2 · Flood"], ["bg-wheat", "Zone 3 · Sprinkler"]];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", c)} />{l}</span>
      ))}
    </div>
  );
}

function PlotTile({ plot, layer, selected, onClick }: { plot: LivePlot; layer: Layer; selected: boolean; onClick: () => void }) {
  const fill =
    layer === "health"
      ? { healthy: "bg-success/75", watch: "bg-warning/75", critical: "bg-danger/75" }[plot.status]
      : layer === "moisture"
        ? moistureClass(plot.moisture)
        : "bg-leaf/45";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ gridColumn: plot.grid.col, gridRow: plot.grid.row }}
      aria-pressed={selected}
      aria-label={`${plot.name}, ${plot.crop}, health ${plot.health}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl p-2 text-left transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:p-3",
        fill,
        layer === "zones" && cn("ring-4 ring-inset", ZONE_RING[plot.zone]),
        selected && "outline outline-4 outline-offset-2 outline-foreground",
      )}
    >
      <span className="pointer-events-none absolute inset-0 field-pattern opacity-70" />
      <span className="relative">
        <span className="block truncate font-display text-xs font-semibold text-foreground sm:text-base">{plot.crop}</span>
        <span className="hidden truncate text-[10px] text-foreground/80 sm:block">{plot.name} · {plot.stage}</span>
      </span>
      <span className="relative flex flex-wrap items-center gap-1">
        <span className="rounded-md bg-card/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
          {layer === "moisture" ? `${plot.moisture}%` : layer === "zones" ? plot.zone : plot.health}
        </span>
        <span className="hidden rounded-md bg-card/85 px-1.5 py-0.5 text-[10px] text-foreground md:inline">{plot.temperature}°C</span>
        {(plot.status === "critical" || plot.issue) && (
          <span className={cn("grid size-5 place-items-center rounded-full bg-danger text-destructive-foreground", plot.status === "critical" && "animate-alert")}>
            <AlertTriangle className="size-3" />
          </span>
        )}
      </span>
    </button>
  );
}

function PlotDetails({ plot, onClose }: { plot: LivePlot; onClose: () => void }) {
  const profile = getCropProfile(plot.crop);
  const base = SAMPLE_PLOTS.find((p) => p.id === plot.id);
  const advice = irrigationAdvice({ crop: plot.crop, soilMoisture: plot.moisture, rainNext24hMm: 0, rainProbability: 0, temperature: plot.temperature });
  return (
    <section className="animate-rise rounded-2xl border bg-card p-5 shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{plot.name} · {plot.zone}</p>
          <h2 className="text-2xl font-semibold">{plot.crop}</h2>
          <p className="text-xs text-muted-foreground">{plot.variety} · {plot.areaAcres} acres</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close plot details"><X /></Button>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className={cn("grid size-16 place-items-center rounded-2xl border-2 font-display text-2xl font-semibold", STATUS_SOFT[plot.status])}>{plot.health}</div>
        <div>
          <p className={cn("font-semibold", STATUS_TEXT[plot.status])}>{HEALTH_LABEL[plot.status]}</p>
          <p className="text-xs text-muted-foreground">Health score from moisture, temperature and disease pressure{plot.simulated && " (simulated)"}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric icon={Droplets} label="Soil moisture" value={`${plot.moisture}%`} sub={`Target ${profile.idealMoisture[0]}–${profile.idealMoisture[1]}%`} changed={base?.moisture !== plot.moisture} />
        <Metric icon={Thermometer} label="Temperature" value={`${plot.temperature}°C`} sub={`Ideal ${profile.idealTemp[0]}–${profile.idealTemp[1]}°C`} changed={base?.temperature !== plot.temperature} />
        <Metric icon={Sprout} label="Growth stage" value={plot.stage} sub={`${plot.stageProgress}% to harvest`} />
        <Metric icon={CalendarDays} label="Harvest by" value={new Date(plot.harvestBy).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} sub={`Sown ${new Date(plot.sownOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`} />
      </dl>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Season progress</span><span>{plot.stageProgress}%</span></div>
        <Progress value={plot.stageProgress} className="h-2" />
      </div>
      <div className="mt-4 rounded-xl bg-secondary p-3 text-sm">
        <p className="font-semibold text-secondary-foreground">{advice.label}{advice.depthMm ? ` · ~${advice.depthMm} mm` : ""}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{advice.reason} (Rain not included — see Weather & Irrigation for forecast-aware advice.)</p>
      </div>
      {plot.issue && (
        <p className="mt-3 flex gap-2 rounded-xl border border-warning/50 bg-warning/15 p-3 text-xs"><AlertTriangle className="size-4 shrink-0 text-warning" />{plot.issue}</p>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, sub, changed }: { icon: typeof Droplets; label: string; value: string; sub: string; changed?: boolean }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}{changed && <span className="ml-auto text-[10px] font-semibold text-earth">SIM</span>}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
      <dd className="text-[11px] text-muted-foreground">{sub}</dd>
    </div>
  );
}

function SimSlider({ label, unit, min, max, value, onChange, absolute }: { label: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void; absolute?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="rounded-md bg-background px-2 py-0.5 text-xs font-semibold tabular-nums">{!absolute && value > 0 ? "+" : ""}{value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={1} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}
