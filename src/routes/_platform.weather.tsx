import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import { AlertTriangle, CloudRain, CloudSun, Droplets, Loader2, RefreshCw, Thermometer, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageHeader } from "@/components/agri/page-header";
import { ChartCard } from "@/components/agri/chart-card";
import { DataBadge } from "@/components/agri/data-badge";
import { useFarm } from "@/lib/farm-store";
import { IRRIGATION_ZONES } from "@/lib/farm-data";
import { irrigationAdvice, type IrrigationAction } from "@/lib/farm-logic";
import { WEATHER_LOCATIONS, weatherLabel, weatherQuery } from "@/lib/weather";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/weather")({
  head: () => ({
    meta: [
      { title: "Weather & Smart Irrigation · AgriSmart AI" },
      { name: "description", content: "Live weather, 7-day rain forecast and plot-by-plot irrigation recommendations for your farm." },
      { property: "og:title", content: "Weather & Smart Irrigation · AgriSmart AI" },
      { property: "og:description", content: "Live weather, 7-day rain forecast and plot-by-plot irrigation recommendations for your farm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeatherPage,
});

const ACTION_STYLE: Record<IrrigationAction, string> = {
  irrigate: "bg-water/15 text-water border-water/40",
  light: "bg-leaf/20 text-leaf-foreground border-leaf/50 dark:text-leaf",
  skip: "bg-muted text-muted-foreground border-border",
  hold: "bg-danger/15 text-danger border-danger/40",
};

function WeatherPage() {
  const { settings, updateSettings, plots } = useFarm();
  const q = useQuery(weatherQuery(settings.weatherLocationId));
  const w = q.data;
  const today = w?.daily[0];
  const config = { rainMm: { label: "Rain (mm)", color: "var(--chart-5)" }, rainProbability: { label: "Chance (%)", color: "var(--chart-3)" } } satisfies ChartConfig;
  const forecast = w?.daily.map((d) => ({ ...d, label: w.source === "live" ? new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }) : d.date }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Weather & irrigation"
        title="Plan watering with the forecast"
        description="Live weather from Open-Meteo combined with each plot's crop needs and soil moisture to suggest when and how much to irrigate."
        actions={
          <>
            <Select value={settings.weatherLocationId} onValueChange={(v) => updateSettings({ weatherLocationId: v })}>
              <SelectTrigger className="w-60 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{WEATHER_LOCATIONS.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={() => q.refetch()} disabled={q.isFetching} aria-label="Refresh weather">
              {q.isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh
            </Button>
          </>
        }
      />

      {q.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : w ? (
        <>
          {w.source === "demo" && (
            <div className="flex items-start gap-3 rounded-2xl border border-wheat/60 bg-wheat/20 p-4 text-sm">
              <AlertTriangle className="size-5 shrink-0 text-earth" />
              <p><strong>Showing demo weather.</strong> {"error" in w && w.error ? `${w.error}. ` : ""}These numbers are illustrative, not a real forecast. Press Refresh to retry.</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <DataBadge kind={w.source === "live" ? "live" : "demo"} label={w.source === "live" ? "Live weather · Open-Meteo" : "Demo weather"} />
            <span>{w.locationName}{w.fetchedAt && ` · updated ${new Date(w.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Tile icon={CloudSun} label="Current weather" value={weatherLabel(w.current.weatherCode)} />
            <Tile icon={Thermometer} label="Temperature" value={`${w.current.temperature}°C`} sub={today && `Today ${today.tMin}–${today.tMax}°C`} />
            <Tile icon={Droplets} label="Humidity" value={`${w.current.humidity}%`} />
            <Tile icon={Wind} label="Wind speed" value={`${w.current.windSpeed} km/h`} />
            <Tile icon={CloudRain} label="Rain next 24 h" value={`${today?.rainMm ?? 0} mm`} sub={`${today?.rainProbability ?? 0}% chance`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <ChartCard title="7-day rainfall forecast" subtitle="Expected rain and chance of rain" kind={w.source === "live" ? "live" : "demo"}>
              <ChartContainer config={config} className="h-64 w-full aspect-auto">
                <ComposedChart data={forecast ?? []} margin={{ left: -18, right: 0, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="mm" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar yAxisId="mm" dataKey="rainMm" fill="var(--color-rainMm)" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="pct" dataKey="rainProbability" stroke="var(--color-rainProbability)" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ChartContainer>
            </ChartCard>
            <ChartCard title="Daily outlook" kind={null}>
              <ul className="divide-y">
                {forecast?.map((d) => (
                  <li key={d.date} className="flex items-center justify-between py-2 text-sm">
                    <span className="w-20 font-medium">{d.label}</span>
                    <span className="flex-1 truncate text-muted-foreground">{weatherLabel(d.weatherCode)}</span>
                    <span className="w-20 text-right text-water">{d.rainMm} mm</span>
                    <span className="w-20 text-right tabular-nums">{d.tMin}–{d.tMax}°</span>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </div>

          <ChartCard title="Irrigation recommendations by plot" subtitle={`Crop moisture targets + current soil moisture (sample) + ${w.source === "live" ? "live" : "demo"} 24 h rain forecast`} kind={null}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr><th className="py-2 font-medium">Plot</th><th className="font-medium">Zone</th><th className="font-medium">Soil moisture <DataBadge kind="sample" className="ml-1" /></th><th className="font-medium">Recommendation</th><th className="font-medium">Why</th></tr>
                </thead>
                <tbody className="divide-y">
                  {plots.map((p) => {
                    const a = irrigationAdvice({ crop: p.crop, soilMoisture: p.moisture, rainNext24hMm: today?.rainMm ?? 0, rainProbability: today?.rainProbability ?? 0, temperature: w.current.temperature });
                    return (
                      <tr key={p.id} className="align-top">
                        <td className="py-3 font-medium">{p.name}<span className="block text-xs text-muted-foreground">{p.crop}</span></td>
                        <td className="py-3 text-muted-foreground">{p.zone}</td>
                        <td className="py-3">{p.moisture}%</td>
                        <td className="py-3"><span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold", ACTION_STYLE[a.action])}>{a.label}{a.depthMm ? ` · ${a.depthMm} mm` : ""}</span></td>
                        <td className="max-w-sm py-3 text-xs text-muted-foreground">{a.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <div className="grid gap-3 md:grid-cols-3">
            {IRRIGATION_ZONES.map((z) => (
              <div key={z.id} className="rounded-2xl border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{z.id} · {z.method}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", z.status === "Running" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{z.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Source: {z.source} · Flow {z.flowLpm} L/min · Next: {z.nextRun}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">Sensor and valve control not connected — sample status.</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Tile({ icon: Icon, label, value, sub }: { icon: typeof Wind; label: string; value: string; sub?: string | undefined }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <Icon className="size-5 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
