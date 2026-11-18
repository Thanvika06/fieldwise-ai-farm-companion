import type { LivePlot } from "@/lib/farm-store";
import type { Settings } from "@/lib/farm-store";
import { HEALTH_LABEL, irrigationAdvice } from "@/lib/farm-logic";
import { SAMPLE_ALERTS, SOIL_HEALTH, WATER_USAGE, DISEASE_HISTORY } from "@/lib/farm-data";

export interface ReportOptions {
  sections: { summary: boolean; plots: boolean; irrigation: boolean; soil: boolean; disease: boolean; alerts: boolean };
  simulated: boolean;
  weatherSource: "live" | "demo";
  rainNext24hMm: number;
  rainProbability: number;
}

type RGB = [number, number, number];
const FOREST: RGB = [34, 84, 52];
const LEAF: RGB = [118, 176, 65];
const EARTH: RGB = [125, 86, 50];
const INK: RGB = [36, 52, 40];
const MUTED: RGB = [110, 120, 108];
const STATUS: Record<string, RGB> = { healthy: [76, 150, 80], watch: [214, 160, 40], critical: [196, 72, 52] };

/** Builds the farm health report PDF in the browser and triggers a download. Returns the filename. */
export async function downloadFarmReport(plots: LivePlot[], settings: Settings, opts: ReportOptions): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 16;
  let y = 0;

  const ensure = (h: number) => {
    if (y + h > 280) {
      doc.addPage();
      y = 18;
    }
  };
  const heading = (t: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...FOREST);
    doc.text(t, M, y);
    doc.setDrawColor(...LEAF);
    doc.setLineWidth(0.6);
    doc.line(M, y + 2, M + 24, y + 2);
    y += 9;
  };
  const para = (t: string, size = 10, color: RGB = INK) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(t, W - M * 2) as string[];
    ensure(lines.length * 5);
    doc.text(lines, M, y);
    y += lines.length * 5;
  };

  // Header band
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, W, 34, "F");
  doc.setTextColor(250, 248, 238);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Farm Health Report", M, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${settings.farmName}  ·  ${settings.location}  ·  ${settings.ownerName}`, M, 23);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}  ·  AgriSmart AI`, M, 29);
  y = 44;

  doc.setFillColor(252, 243, 220);
  doc.setDrawColor(...EARTH);
  doc.roundedRect(M, y - 5, W - M * 2, 14, 2, 2, "FD");
  doc.setTextColor(...EARTH);
  doc.setFontSize(9);
  doc.text(
    doc.splitTextToSize(
      `Data notice: field values are SAMPLE / DEMONSTRATION data, not sensor readings.${opts.simulated ? " A what-if simulation was active when this report was created." : ""} Weather: ${opts.weatherSource === "live" ? "live forecast (Open-Meteo)" : "demo values"}.`,
      W - M * 2 - 6,
    ) as string[],
    M + 3,
    y,
  );
  y += 16;

  const totalArea = plots.reduce((s, p) => s + p.areaAcres, 0);
  const avg = Math.round(plots.reduce((s, p) => s + p.health * p.areaAcres, 0) / totalArea);

  if (opts.sections.summary) {
    heading("Summary");
    const kpis = [
      ["Cultivated area", `${totalArea.toFixed(1)} acres`],
      ["Avg crop health", `${avg} / 100`],
      ["Plots needing attention", `${plots.filter((p) => p.status !== "healthy").length} of ${plots.length}`],
      ["Soil health index", `${SOIL_HEALTH.index} / 100`],
    ];
    const bw = (W - M * 2 - 9) / 4;
    ensure(22);
    kpis.forEach(([label = "", value = ""], i) => {
      const x = M + i * (bw + 3);
      doc.setFillColor(243, 246, 236);
      doc.roundedRect(x, y, bw, 18, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(label, x + 3, y + 6);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(value, x + 3, y + 14);
      doc.setFont("helvetica", "normal");
    });
    y += 26;
  }

  if (opts.sections.plots) {
    heading("Plot health");
    plots.forEach((p) => {
      ensure(9);
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(`${p.name} · ${p.crop}`, M, y);
      doc.setTextColor(...MUTED);
      doc.text(`${p.stage} · ${p.moisture}% moisture · ${p.temperature}°C`, M + 46, y);
      const barX = M + 118;
      const barW = 46;
      doc.setFillColor(232, 234, 226);
      doc.roundedRect(barX, y - 3, barW, 4, 1, 1, "F");
      doc.setFillColor(...(STATUS[p.status] ?? LEAF));
      doc.roundedRect(barX, y - 3, (barW * p.health) / 100, 4, 1, 1, "F");
      doc.setTextColor(...INK);
      doc.text(`${p.health}  ${HEALTH_LABEL[p.status]}`, barX + barW + 3, y);
      y += 7;
    });
    y += 3;
  }

  if (opts.sections.irrigation) {
    heading("Irrigation recommendations");
    plots.forEach((p) => {
      const a = irrigationAdvice({ crop: p.crop, soilMoisture: p.moisture, rainNext24hMm: opts.rainNext24hMm, rainProbability: opts.rainProbability, temperature: p.temperature });
      para(`${p.name} (${p.crop}): ${a.label}${a.depthMm ? ` — about ${a.depthMm} mm` : ""}. ${a.reason}`, 9);
      y += 1;
    });
    const planned = WATER_USAGE.reduce((s, w) => s + w.planned, 0);
    const actual = WATER_USAGE.reduce((s, w) => s + w.actual, 0);
    para(`Last 7 weeks water use: ${actual} kL vs ${planned} kL planned (${Math.round((actual / planned) * 100)}%).`, 9, MUTED);
    y += 3;
  }

  if (opts.sections.soil) {
    heading("Soil health (last soil test, sample)");
    para(
      `pH ${SOIL_HEALTH.ph} · Organic carbon ${SOIL_HEALTH.organicCarbon}% · N ${SOIL_HEALTH.nitrogen} · P ${SOIL_HEALTH.phosphorus} · K ${SOIL_HEALTH.potassium} · Tested ${SOIL_HEALTH.testedOn}. Re-test with a Soil Health Card lab before changing fertilizer plans.`,
      9,
    );
    y += 3;
  }

  if (opts.sections.disease) {
    heading("Disease detections (6 months)");
    para(DISEASE_HISTORY.map((d) => `${d.month}: ${d.detected} detected / ${d.resolved} resolved`).join("   ·   "), 9);
    para("AI image screening is indicative only; confirm with an agronomist or KVK before major treatment.", 8, MUTED);
    y += 3;
  }

  if (opts.sections.alerts) {
    heading("Open alerts");
    SAMPLE_ALERTS.forEach((a) => {
      para(`[${a.severity.toUpperCase()}] ${a.title} — ${a.detail}`, 9);
      y += 1;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`AgriSmart AI · Farm Health Report · page ${i} of ${pages}`, M, 290);
  }

  const filename = `farm-health-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}
