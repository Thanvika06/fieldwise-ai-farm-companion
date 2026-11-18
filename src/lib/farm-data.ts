// SAMPLE DATA — realistic demonstration values for a farm in Nashik, Maharashtra.
// Nothing here comes from sensors; every screen using it shows a "Sample data" badge.

export type GrowthStage =
  | "Germination"
  | "Seedling"
  | "Vegetative"
  | "Flowering"
  | "Fruiting"
  | "Grain filling"
  | "Maturity";

export interface Plot {
  id: string;
  name: string;
  crop: string;
  variety: string;
  areaAcres: number;
  stage: GrowthStage;
  stageProgress: number;
  moisture: number;
  temperature: number;
  diseaseRisk: number;
  zone: "Zone 1" | "Zone 2" | "Zone 3";
  issue?: string;
  sownOn: string;
  harvestBy: string;
  grid: { col: string; row: string };
}

export const SAMPLE_FARM = {
  name: "Green Valley Farm",
  owner: "Ramesh Patil",
  location: "Nashik, Maharashtra",
  totalAreaAcres: 24.5,
};

export const SAMPLE_PLOTS: Plot[] = [
  { id: "p1", name: "Plot A1", crop: "Rice", variety: "Indrayani", areaAcres: 4.2, stage: "Vegetative", stageProgress: 46, moisture: 78, temperature: 29, diseaseRisk: 0.12, zone: "Zone 2", sownOn: "2026-07-02", harvestBy: "2026-12-05", grid: { col: "1 / 5", row: "1 / 4" } },
  { id: "p2", name: "Plot A2", crop: "Sugarcane", variety: "Co 86032", areaAcres: 3.8, stage: "Vegetative", stageProgress: 58, moisture: 66, temperature: 31, diseaseRisk: 0.08, zone: "Zone 3", sownOn: "2026-02-14", harvestBy: "2027-02-10", grid: { col: "5 / 9", row: "1 / 3" } },
  { id: "p3", name: "Plot A3", crop: "Cotton", variety: "Bt NHH-44", areaAcres: 3.5, stage: "Flowering", stageProgress: 64, moisture: 36, temperature: 33, diseaseRisk: 0.28, zone: "Zone 1", issue: "Soil moisture below target; pink bollworm traps show rising counts", sownOn: "2026-06-20", harvestBy: "2026-12-20", grid: { col: "9 / 13", row: "1 / 4" } },
  { id: "p4", name: "Plot B1", crop: "Tomato", variety: "Arka Rakshak", areaAcres: 2.1, stage: "Fruiting", stageProgress: 72, moisture: 58, temperature: 27, diseaseRisk: 0.8, zone: "Zone 1", issue: "Early blight symptoms reported on lower leaves", sownOn: "2026-08-25", harvestBy: "2026-12-15", grid: { col: "5 / 9", row: "3 / 5" } },
  { id: "p5", name: "Plot B2", crop: "Wheat", variety: "HD 2967", areaAcres: 4.6, stage: "Germination", stageProgress: 12, moisture: 52, temperature: 24, diseaseRisk: 0.05, zone: "Zone 2", sownOn: "2026-11-05", harvestBy: "2027-03-25", grid: { col: "1 / 5", row: "4 / 7" } },
  { id: "p6", name: "Plot B3", crop: "Maize", variety: "NK 6240", areaAcres: 3.0, stage: "Grain filling", stageProgress: 81, moisture: 63, temperature: 28, diseaseRisk: 0.15, zone: "Zone 3", sownOn: "2026-07-15", harvestBy: "2026-11-30", grid: { col: "5 / 9", row: "5 / 7" } },
  { id: "p7", name: "Plot C1", crop: "Chilli", variety: "Phule Jyoti", areaAcres: 1.6, stage: "Flowering", stageProgress: 55, moisture: 31, temperature: 32, diseaseRisk: 0.35, zone: "Zone 1", issue: "Drip line pressure drop; leaf curl seen on border rows", sownOn: "2026-08-10", harvestBy: "2027-01-20", grid: { col: "9 / 11", row: "4 / 7" } },
  { id: "p8", name: "Plot C2", crop: "Groundnut", variety: "TAG 24", areaAcres: 1.7, stage: "Maturity", stageProgress: 93, moisture: 47, temperature: 30, diseaseRisk: 0.1, zone: "Zone 1", sownOn: "2026-07-01", harvestBy: "2026-11-22", grid: { col: "11 / 13", row: "4 / 7" } },
];

export const IRRIGATION_ZONES = [
  { id: "Zone 1", method: "Drip", source: "Farm pond", status: "Running", flowLpm: 420, nextRun: "Today, 5:30 PM" },
  { id: "Zone 2", method: "Flood (canal)", source: "Canal outlet", status: "Idle", flowLpm: 0, nextRun: "Thu, 6:00 AM" },
  { id: "Zone 3", method: "Sprinkler", source: "Borewell", status: "Scheduled", flowLpm: 0, nextRun: "Tomorrow, 6:00 AM" },
] as const;

export const HEALTH_TREND = [
  { month: "Dec", health: 76, target: 80 },
  { month: "Jan", health: 78, target: 80 },
  { month: "Feb", health: 74, target: 80 },
  { month: "Mar", health: 71, target: 80 },
  { month: "Apr", health: 69, target: 80 },
  { month: "May", health: 72, target: 80 },
  { month: "Jun", health: 75, target: 80 },
  { month: "Jul", health: 81, target: 80 },
  { month: "Aug", health: 83, target: 80 },
  { month: "Sep", health: 79, target: 80 },
  { month: "Oct", health: 77, target: 80 },
  { month: "Nov", health: 78, target: 80 },
];

/** Thousand litres per week */
export const WATER_USAGE = [
  { week: "W40", planned: 310, actual: 296 },
  { week: "W41", planned: 300, actual: 318 },
  { week: "W42", planned: 290, actual: 275 },
  { week: "W43", planned: 280, actual: 301 },
  { week: "W44", planned: 270, actual: 262 },
  { week: "W45", planned: 265, actual: 248 },
  { week: "W46", planned: 260, actual: 255 },
];

export const WATER_BY_ZONE_MONTHLY = [
  { month: "Jun", zone1: 210, zone2: 520, zone3: 300 },
  { month: "Jul", zone1: 180, zone2: 380, zone3: 260 },
  { month: "Aug", zone1: 190, zone2: 340, zone3: 250 },
  { month: "Sep", zone1: 240, zone2: 410, zone3: 290 },
  { month: "Oct", zone1: 280, zone2: 450, zone3: 330 },
  { month: "Nov", zone1: 260, zone2: 300, zone3: 310 },
];

export const SOIL_MOISTURE_14D = Array.from({ length: 14 }, (_, i) => {
  const day = i + 1;
  return {
    day: `Nov ${3 + i}`,
    zone1: Math.round(48 + Math.sin(day / 2) * 6 - day * 0.4),
    zone2: Math.round(70 + Math.cos(day / 3) * 5),
    zone3: Math.round(60 + Math.sin(day / 2.5 + 1) * 4),
  };
});

export const DISEASE_HISTORY = [
  { month: "Jun", detected: 2, resolved: 2 },
  { month: "Jul", detected: 5, resolved: 4 },
  { month: "Aug", detected: 7, resolved: 6 },
  { month: "Sep", detected: 4, resolved: 4 },
  { month: "Oct", detected: 3, resolved: 2 },
  { month: "Nov", detected: 3, resolved: 1 },
];

export const DISEASE_BY_TYPE = [
  { name: "Early blight", value: 6 },
  { name: "Leaf curl virus", value: 4 },
  { name: "Bacterial leaf blight", value: 3 },
  { name: "Powdery mildew", value: 5 },
  { name: "Pest damage", value: 6 },
];

export const PERFORMANCE = [
  { metric: "Crop health", score: 78 },
  { metric: "Water efficiency", score: 72 },
  { metric: "Soil quality", score: 68 },
  { metric: "Pest control", score: 74 },
  { metric: "Input cost", score: 63 },
  { metric: "Yield outlook", score: 76 },
];

export const RESOURCE_UTILIZATION = [
  { resource: "Water", used: 1720, budget: 1900, unit: "kL" },
  { resource: "Fertilizer", used: 3.1, budget: 3.6, unit: "t" },
  { resource: "Electricity", used: 2850, budget: 2600, unit: "kWh" },
  { resource: "Labour", used: 410, budget: 450, unit: "days" },
];

export const IRRIGATION_EFFICIENCY = [
  { month: "Jun", drip: 88, sprinkler: 74, flood: 52 },
  { month: "Jul", drip: 89, sprinkler: 75, flood: 55 },
  { month: "Aug", drip: 90, sprinkler: 76, flood: 54 },
  { month: "Sep", drip: 87, sprinkler: 73, flood: 51 },
  { month: "Oct", drip: 91, sprinkler: 77, flood: 56 },
  { month: "Nov", drip: 90, sprinkler: 78, flood: 57 },
];

export const SOIL_HEALTH = {
  index: 68,
  ph: 7.4,
  organicCarbon: 0.52,
  nitrogen: "Low",
  phosphorus: "Medium",
  potassium: "High",
  testedOn: "2026-06-12",
};

export type AlertSeverity = "critical" | "warning" | "info";

export interface FarmAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  time: string;
  plotId?: string;
}

export const SAMPLE_ALERTS: FarmAlert[] = [
  { id: "a1", severity: "critical", title: "Low soil moisture in Plot C1", detail: "Chilli plot at 31% — below the 50% minimum. Drip pressure dropped overnight.", time: "25 min ago", plotId: "p7" },
  { id: "a2", severity: "warning", title: "Early blight risk on tomato", detail: "Humid nights and leaf spots reported in Plot B1. Scout lower canopy.", time: "2 h ago", plotId: "p4" },
  { id: "a3", severity: "warning", title: "Cotton moisture stress", detail: "Plot A3 at 36% during flowering — a sensitive stage.", time: "5 h ago", plotId: "p3" },
  { id: "a4", severity: "info", title: "Groundnut nearing harvest", detail: "Plot C2 at 93% of maturity. Plan harvest within ~7 days.", time: "Yesterday", plotId: "p8" },
];

export const RECENT_ACTIVITY = [
  { id: "r1", title: "Drip irrigation started — Zone 1", by: "Auto schedule", time: "Today, 6:10 AM" },
  { id: "r2", title: "Leaf image scanned — Plot B1 tomato", by: "Ramesh Patil", time: "Yesterday, 4:42 PM" },
  { id: "r3", title: "Urea top-dressing logged — Plot A1 (25 kg/acre)", by: "Suresh (field staff)", time: "Yesterday, 11:15 AM" },
  { id: "r4", title: "Pheromone traps checked — Plot A3", by: "Suresh (field staff)", time: "Mon, 8:30 AM" },
  { id: "r5", title: "Wheat sown — Plot B2 (HD 2967)", by: "Ramesh Patil", time: "Nov 5" },
];
