import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageHeader } from "@/components/agri/page-header";
import { ChartCard } from "@/components/agri/chart-card";
import { HealthDonut, HealthTrendChart, PerformanceRadar } from "@/components/agri/charts";
import { farmSummary, useFarm } from "@/lib/farm-store";
import { DISEASE_BY_TYPE, DISEASE_HISTORY, HEALTH_TREND, IRRIGATION_EFFICIENCY, RESOURCE_UTILIZATION, WATER_BY_ZONE_MONTHLY } from "@/lib/farm-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/analytics")({
  head: () => ({
    meta: [
      { title: "Farm Analytics · AgriSmart AI" },
      { name: "description", content: "Farm performance, crop health distribution, water use, disease statistics, resources and irrigation efficiency." },
      { property: "og:title", content: "Farm Analytics · AgriSmart AI" },
      { property: "og:description", content: "Farm performance, crop health distribution, water use, disease statistics, resources and irrigation efficiency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analytics,
});

const RANGES = { "3m": 3, "6m": 6, "12m": 12 } as const;
type RangeKey = keyof typeof RANGES;

function downloadCsv() {
  const rows = [["Month", "Avg crop health", "Target"], ...HEALTH_TREND.map((r) => [r.month, r.health, r.target])];
  rows.push([], ["Month", "Zone 1 water kL", "Zone 2 water kL", "Zone 3 water kL"], ...WATER_BY_ZONE_MONTHLY.map((r) => [r.month, r.zone1, r.zone2, r.zone3]));
  rows.push([], ["Month", "Diseases detected", "Resolved"], ...DISEASE_HISTORY.map((r) => [r.month, r.detected, r.resolved]));
  const csv = "# AgriSmart AI analytics export — SAMPLE DATA\n" + rows.map((r) => r.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "farm-analytics-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Analytics() {
  const { plots, simulation } = useFarm();
  const [range, setRange] = useState<RangeKey>("12m");
  const n = RANGES[range];
  const summary = farmSummary(plots);
  const totalWater = WATER_BY_ZONE_MONTHLY.slice(-Math.min(n, 6)).reduce((s, m) => s + m.zone1 + m.zone2 + m.zone3, 0);
  const totalDetected = DISEASE_HISTORY.slice(-Math.min(n, 6)).reduce((s, d) => s + d.detected, 0);
  const totalResolved = DISEASE_HISTORY.slice(-Math.min(n, 6)).reduce((s, d) => s + d.resolved, 0);

  const waterCfg = { zone1: { label: "Zone 1 · Drip", color: "var(--chart-2)" }, zone2: { label: "Zone 2 · Flood", color: "var(--chart-5)" }, zone3: { label: "Zone 3 · Sprinkler", color: "var(--chart-3)" } } satisfies ChartConfig;
  const effCfg = { drip: { label: "Drip", color: "var(--chart-2)" }, sprinkler: { label: "Sprinkler", color: "var(--chart-4)" }, flood: { label: "Flood", color: "var(--chart-3)" } } satisfies ChartConfig;
  const diseaseColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const diseaseCfg = Object.fromEntries(DISEASE_BY_TYPE.map((d, i) => [`d${i}`, { label: d.name, color: diseaseColors[i] ?? "var(--chart-1)" }])) satisfies ChartConfig;
  const diseaseData = DISEASE_BY_TYPE.map((d, i) => ({ ...d, key: `d${i}` }));
  const cropCfg = { health: { label: "Health score", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Farm analytics & trends"
        description="Performance across health, water, disease and resources. Hover any chart for exact values."
        actions={
          <>
            <ToggleGroup type="single" value={range} onValueChange={(v) => v && setRange(v as RangeKey)} variant="outline" size="sm" className="bg-card">
              <ToggleGroupItem value="3m">3 months</ToggleGroupItem>
              <ToggleGroupItem value="6m">6 months</ToggleGroupItem>
              <ToggleGroupItem value="12m">12 months</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={downloadCsv}><Download /> CSV</Button>
            <Button asChild size="sm"><Link to="/reports"><FileText /> PDF report</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Overall farm performance" value={`${Math.round(HEALTH_TREND.slice(-n).reduce((s, r) => s + r.health, 0) / n)}/100`} sub={`Avg health, last ${n} months`} />
        <Kpi label="Current crop health" value={`${summary.avgHealth}/100`} sub={simulation.enabled ? "Includes simulation" : "Area-weighted"} />
        <Kpi label="Water used" value={`${totalWater.toLocaleString("en-IN")} kL`} sub={`Last ${Math.min(n, 6)} months`} />
        <Kpi label="Disease cases resolved" value={`${totalResolved}/${totalDetected}`} sub={`${Math.round((totalResolved / Math.max(1, totalDetected)) * 100)}% resolution rate`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Historical health trend" subtitle={`Last ${n} months`} className="lg:col-span-2"><HealthTrendChart data={HEALTH_TREND.slice(-n)} /></ChartCard>
        <ChartCard title="Crop health distribution" subtitle="Plots by status" kind={simulation.enabled ? "simulated" : "sample"}><HealthDonut counts={summary.counts} /></ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Water usage analysis" subtitle="Monthly use by irrigation zone (kL)">
          <ChartContainer config={waterCfg} className="h-64 w-full aspect-auto">
            <BarChart data={WATER_BY_ZONE_MONTHLY.slice(-Math.min(n, 6))} margin={{ left: -18, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="zone1" stackId="w" fill="var(--color-zone1)" />
              <Bar dataKey="zone2" stackId="w" fill="var(--color-zone2)" />
              <Bar dataKey="zone3" stackId="w" fill="var(--color-zone3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Irrigation efficiency" subtitle="Water reaching the root zone, % by method">
          <ChartContainer config={effCfg} className="h-64 w-full aspect-auto">
            <LineChart data={IRRIGATION_EFFICIENCY.slice(-Math.min(n, 6))} margin={{ left: -18, top: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis domain={[40, 100]} unit="%" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {(["drip", "sprinkler", "flood"] as const).map((k) => <Line key={k} dataKey={k} stroke={`var(--color-${k})`} strokeWidth={2.2} dot={{ r: 3 }} />)}
            </LineChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Crop disease statistics" subtitle="Cases by type, this season">
          <ChartContainer config={diseaseCfg} className="h-64 w-full aspect-auto">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie data={diseaseData} dataKey="value" nameKey="key" outerRadius="80%" strokeWidth={2}>
                {diseaseData.map((d) => <Cell key={d.key} fill={`var(--color-${d.key})`} />)}
              </Pie>
              <Legend content={<ChartLegendContent nameKey="key" className="flex-wrap" />} />
            </PieChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Health score by plot" subtitle="Current conditions" kind={simulation.enabled ? "simulated" : "sample"}>
          <ChartContainer config={cropCfg} className="h-64 w-full aspect-auto">
            <BarChart data={plots.map((p) => ({ name: p.crop, health: p.health, status: p.status }))} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={78} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="health" radius={[0, 6, 6, 0]}>
                {plots.map((p) => <Cell key={p.id} fill={p.status === "healthy" ? "var(--success)" : p.status === "watch" ? "var(--warning)" : "var(--danger)"} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Performance scorecard" subtitle="Key areas (0–100)"><PerformanceRadar /></ChartCard>
      </div>

      <ChartCard title="Resource utilization" subtitle="Season to date vs budget">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCE_UTILIZATION.map((r) => {
            const pct = Math.round((r.used / r.budget) * 100);
            return (
              <div key={r.resource} className="rounded-xl border bg-background p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">{r.resource}</p>
                  <p className={cn("text-sm font-semibold", pct > 100 ? "text-danger" : "text-success")}>{pct}%</p>
                </div>
                <Progress value={Math.min(100, pct)} className="mt-2 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{r.used.toLocaleString("en-IN")} of {r.budget.toLocaleString("en-IN")} {r.unit}{pct > 100 && " — over budget"}</p>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
