import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Bug, CloudSun, Droplets, FileText, Layers, Leaf, ScanLine, SlidersHorizontal, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/agri/page-header";
import { StatCard } from "@/components/agri/stat-card";
import { ChartCard } from "@/components/agri/chart-card";
import { DataBadge } from "@/components/agri/data-badge";
import { DiseaseHistoryChart, HealthDonut, HealthTrendChart, PerformanceRadar, SoilMoistureChart, WaterUsageChart } from "@/components/agri/charts";
import { STATUS_SOFT, STATUS_TEXT } from "@/components/agri/health";
import { farmSummary, useFarm } from "@/lib/farm-store";
import { DISEASE_HISTORY, IRRIGATION_ZONES, RECENT_ACTIVITY, SAMPLE_ALERTS, SOIL_HEALTH } from "@/lib/farm-data";
import { HEALTH_LABEL, irrigationAdvice } from "@/lib/farm-logic";
import { weatherLabel, weatherQuery } from "@/lib/weather";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview Dashboard · AgriSmart AI" },
      { name: "description", content: "Crop health, soil, weather, irrigation, disease detections and growth for your farm in one dashboard." },
      { property: "og:title", content: "Overview Dashboard · AgriSmart AI" },
      { property: "og:description", content: "Crop health, soil, weather, irrigation, disease detections and growth for your farm in one dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const SEV = { critical: "border-danger/40 bg-danger/10 text-danger", warning: "border-warning/50 bg-warning/15 text-warning-foreground dark:text-warning", info: "border-water/40 bg-water/10 text-water" } as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { plots, settings, simulation, scansThisSession } = useFarm();
  const summary = farmSummary(plots);
  const weather = useQuery(weatherQuery(settings.weatherLocationId));
  const rain24 = weather.data?.daily[0]?.rainMm ?? 0;
  const rainProb = weather.data?.daily[0]?.rainProbability ?? 0;
  const lastMonth = DISEASE_HISTORY[DISEASE_HISTORY.length - 1] ?? { detected: 0, resolved: 0 };
  const running = IRRIGATION_ZONES.filter((z) => z.status === "Running").length;

  const recs = plots
    .map((p) => ({ plot: p, advice: irrigationAdvice({ crop: p.crop, soilMoisture: p.moisture, rainNext24hMm: rain24, rainProbability: rainProb, temperature: p.temperature }) }))
    .filter((r) => r.advice.action === "irrigate" || r.advice.action === "light" || r.advice.action === "hold" || r.plot.issue)
    .sort((a, b) => a.plot.health - b.plot.health)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={settings.farmName}
        title={`${greeting()}, ${settings.ownerName.split(" ")[0]}`}
        description={`${settings.location} · ${plots.length} plots under cultivation. Field values below are sample data${simulation.enabled ? " with your simulation applied" : ""}.`}
        actions={
          <>
            {simulation.enabled && (
              <Button asChild variant="outline" size="sm" className="border-earth/50 text-earth">
                <Link to="/digital-twin"><SlidersHorizontal /> Simulation on</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm"><Link to="/reports"><FileText /> Farm report</Link></Button>
            <Button asChild size="sm"><Link to="/disease-detection"><ScanLine /> Scan a crop</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard to="/digital-twin" icon={Layers} tone="earth" label="Total cultivated area" value={`${summary.totalArea.toFixed(1)} ac`} sub={`${plots.length} plots · ${settings.totalAreaAcres} ac farm`} />
        <StatCard
          to="/digital-twin"
          icon={Leaf}
          tone="leaf"
          label="Crop health"
          value={<span className={STATUS_TEXT[summary.status]}>{summary.avgHealth}<span className="text-sm text-muted-foreground">/100</span></span>}
          sub={`${summary.counts.healthy} healthy · ${summary.counts.watch + summary.counts.critical} need care`}
        />
        <StatCard to="/analytics" icon={Sprout} tone="wheat" label="Soil health index" value={`${SOIL_HEALTH.index}/100`} sub={`pH ${SOIL_HEALTH.ph} · N ${SOIL_HEALTH.nitrogen}`} />
        <StatCard
          to="/weather"
          icon={CloudSun}
          tone="water"
          label="Weather now"
          value={weather.isPending ? <span className="text-base text-muted-foreground">Loading…</span> : `${weather.data?.current.temperature ?? "–"}°C`}
          sub={weather.data ? `${weatherLabel(weather.data.current.weatherCode)} · ${weather.data.current.humidity}% RH` : "Fetching forecast"}
          footer={weather.data && <DataBadge kind={weather.data.source === "live" ? "live" : "demo"} className="self-start" />}
        />
        <StatCard to="/weather" icon={Droplets} tone="primary" label="Irrigation status" value={`${running}/${IRRIGATION_ZONES.length} zones`} sub={`Running now · avg soil moisture ${summary.avgMoisture}%`} />
        <StatCard to="/disease-detection" icon={Bug} tone="danger" label="Disease detections" value={`${lastMonth.detected} cases`} sub={`This month · ${lastMonth.detected - lastMonth.resolved} open · ${scansThisSession} scans today`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Crop health trend" subtitle="Farm average vs target, last 12 months" className="lg:col-span-2">
          <HealthTrendChart />
        </ChartCard>
        <ChartCard title="Crop health overview" subtitle="Plots by current status" kind={simulation.enabled ? "simulated" : "sample"}>
          <HealthDonut counts={summary.counts} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Water consumption" subtitle="Weekly use vs plan (thousand litres)"><WaterUsageChart /></ChartCard>
        <ChartCard title="Soil moisture levels" subtitle="Daily average by irrigation zone"><SoilMoistureChart /></ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Crop growth progress" subtitle="Progress toward harvest by plot" kind={simulation.enabled ? "simulated" : "sample"}>
          <ul className="space-y-3">
            {plots.map((p) => (
              <li key={p.id}>
                <Link to="/digital-twin" search={{ plot: p.id }} className="block rounded-lg p-1 transition-colors hover:bg-muted">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{p.crop} <span className="text-xs text-muted-foreground">· {p.name}</span></span>
                    <span className="text-xs text-muted-foreground">{p.stage} · {p.stageProgress}%</span>
                  </div>
                  <Progress value={p.stageProgress} className="h-2" />
                </Link>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title="Disease detection history" subtitle="Cases detected vs resolved"><DiseaseHistoryChart /></ChartCard>
        <ChartCard title="Agricultural performance" subtitle="Scorecard (0–100)"><PerformanceRadar /></ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Farming recommendations"
          subtitle={`From plot conditions + ${weather.data?.source === "live" ? "live" : "demo"} rain forecast`}
          kind={null}
          className="lg:col-span-2"
          action={<Button asChild variant="ghost" size="sm"><Link to="/recommendations">AI advice <ArrowRight /></Link></Button>}
        >
          {recs.length === 0 ? (
            <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">All plots are within target ranges. No actions needed right now.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {recs.map(({ plot, advice }) => (
                <li key={plot.id} className="rounded-xl border bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{plot.name} · {plot.crop}</p>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", STATUS_SOFT[plot.status])}>{HEALTH_LABEL[plot.status]}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-primary">{advice.label}{advice.depthMm ? ` · ~${advice.depthMm} mm` : ""}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{advice.reason}</p>
                  {plot.issue && <p className="mt-2 flex gap-1.5 text-xs text-foreground"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />{plot.issue}</p>}
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Alerts & recent activity" subtitle="Latest farm events">
          <ul className="space-y-2">
            {SAMPLE_ALERTS.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link to="/digital-twin" search={{ plot: a.plotId }} className={cn("block rounded-xl border p-3 transition-opacity hover:opacity-85", SEV[a.severity])}>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs opacity-80">{a.time}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-3">
            <ul className="space-y-3">
              {RECENT_ACTIVITY.slice(0, 4).map((r) => (
                <li key={r.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-leaf" />
                  <span>
                    <span className="block">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.by} · {r.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
