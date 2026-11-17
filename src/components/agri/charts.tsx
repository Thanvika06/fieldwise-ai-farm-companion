// Reusable farm charts built on the shared chart container (Recharts).
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DISEASE_HISTORY, HEALTH_TREND, PERFORMANCE, SOIL_MOISTURE_14D, WATER_USAGE } from "@/lib/farm-data";

const H = "h-64 w-full aspect-auto";

export function HealthTrendChart({ data = HEALTH_TREND }: { data?: typeof HEALTH_TREND }) {
  const config = { health: { label: "Avg crop health", color: "var(--chart-1)" }, target: { label: "Target", color: "var(--chart-4)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={H}>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillHealth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-health)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--color-health)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis domain={[50, 100]} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="health" stroke="var(--color-health)" strokeWidth={2.5} fill="url(#fillHealth)" />
        <Area type="monotone" dataKey="target" stroke="var(--color-target)" strokeDasharray="5 5" fill="none" />
      </AreaChart>
    </ChartContainer>
  );
}

export function WaterUsageChart() {
  const config = { planned: { label: "Planned (kL)", color: "var(--chart-5)" }, actual: { label: "Actual (kL)", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={H}>
      <BarChart data={WATER_USAGE} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="week" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="planned" fill="var(--color-planned)" radius={[6, 6, 0, 0]} opacity={0.55} />
        <Bar dataKey="actual" fill="var(--color-actual)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function SoilMoistureChart() {
  const config = {
    zone1: { label: "Zone 1 · Drip", color: "var(--chart-2)" },
    zone2: { label: "Zone 2 · Flood", color: "var(--chart-5)" },
    zone3: { label: "Zone 3 · Sprinkler", color: "var(--chart-3)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={H}>
      <LineChart data={SOIL_MOISTURE_14D} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} interval={2} />
        <YAxis unit="%" domain={[30, 90]} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {(["zone1", "zone2", "zone3"] as const).map((k) => (
          <Line key={k} type="monotone" dataKey={k} stroke={`var(--color-${k})`} strokeWidth={2.2} dot={false} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

export function DiseaseHistoryChart() {
  const config = { detected: { label: "Detected", color: "var(--chart-3)" }, resolved: { label: "Resolved", color: "var(--chart-2)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={H}>
      <BarChart data={DISEASE_HISTORY} margin={{ left: -24, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="detected" fill="var(--color-detected)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="resolved" fill="var(--color-resolved)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function PerformanceRadar() {
  const config = { score: { label: "Score", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className={H}>
      <RadarChart data={PERFORMANCE} outerRadius="72%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Radar dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.35} strokeWidth={2} />
      </RadarChart>
    </ChartContainer>
  );
}

export function HealthDonut({ counts }: { counts: { healthy: number; watch: number; critical: number } }) {
  const data = [
    { name: "healthy", value: counts.healthy },
    { name: "watch", value: counts.watch },
    { name: "critical", value: counts.critical },
  ];
  const config = {
    healthy: { label: "Healthy", color: "var(--success)" },
    watch: { label: "Needs attention", color: "var(--warning)" },
    critical: { label: "Critical", color: "var(--danger)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-56 w-full aspect-auto">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
          {data.map((d) => (
            <Cell key={d.name} fill={`var(--color-${d.name})`} />
          ))}
        </Pie>
        <Legend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
