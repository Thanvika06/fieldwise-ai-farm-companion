// Pure agronomy rules used by the digital twin, dashboard and irrigation pages.
// Thresholds are general guidance for demo purposes, not field-calibrated values.

export type Range = [min: number, max: number];

export interface CropProfile {
  name: string;
  /** Target volumetric soil moisture, % */
  idealMoisture: Range;
  /** Comfortable air temperature, °C */
  idealTemp: Range;
}

export const CROP_PROFILES: Record<string, CropProfile> = {
  Rice: { name: "Rice", idealMoisture: [70, 90], idealTemp: [22, 32] },
  Wheat: { name: "Wheat", idealMoisture: [45, 65], idealTemp: [12, 25] },
  Tomato: { name: "Tomato", idealMoisture: [55, 75], idealTemp: [18, 29] },
  Cotton: { name: "Cotton", idealMoisture: [45, 65], idealTemp: [21, 35] },
  Sugarcane: { name: "Sugarcane", idealMoisture: [60, 80], idealTemp: [20, 35] },
  Maize: { name: "Maize", idealMoisture: [50, 70], idealTemp: [18, 32] },
  Chilli: { name: "Chilli", idealMoisture: [50, 70], idealTemp: [20, 30] },
  Groundnut: { name: "Groundnut", idealMoisture: [40, 60], idealTemp: [22, 33] },
};

const DEFAULT_PROFILE: CropProfile = {
  name: "Generic crop",
  idealMoisture: [50, 70],
  idealTemp: [18, 32],
};

export function getCropProfile(crop: string): CropProfile {
  return CROP_PROFILES[crop] ?? DEFAULT_PROFILE;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 100 inside the range, falling linearly to 0 once `tolerance` units outside it. */
export function rangeScore(value: number, [min, max]: Range, tolerance: number): number {
  if (value >= min && value <= max) return 100;
  const distance = value < min ? min - value : value - max;
  return clamp(100 - (distance / tolerance) * 100, 0, 100);
}

export interface HealthInput {
  crop: string;
  moisture: number;
  temperature: number;
  /** 0–1 likelihood of disease pressure */
  diseaseRisk: number;
}

/** Weighted crop health score 0–100: moisture 40%, temperature 25%, disease pressure 35%. */
export function computePlotHealth({ crop, moisture, temperature, diseaseRisk }: HealthInput): number {
  const profile = getCropProfile(crop);
  const moistureScore = rangeScore(moisture, profile.idealMoisture, 15);
  const tempScore = rangeScore(temperature, profile.idealTemp, 8);
  const diseaseScore = 100 - clamp(diseaseRisk, 0, 1) * 100;
  return Math.round(moistureScore * 0.4 + tempScore * 0.25 + diseaseScore * 0.35);
}

export type HealthStatus = "healthy" | "watch" | "critical";

export function healthStatus(score: number): HealthStatus {
  if (score >= 75) return "healthy";
  if (score >= 50) return "watch";
  return "critical";
}

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  watch: "Needs attention",
  critical: "Critical",
};

export type IrrigationAction = "irrigate" | "light" | "skip" | "hold";

export interface IrrigationInput {
  crop: string;
  soilMoisture: number;
  rainNext24hMm: number;
  /** 0–100 */
  rainProbability: number;
  temperature: number;
}

export interface IrrigationAdvice {
  action: IrrigationAction;
  label: string;
  depthMm: number;
  reason: string;
}

export function irrigationAdvice(input: IrrigationInput): IrrigationAdvice {
  const { crop, soilMoisture, rainNext24hMm, rainProbability, temperature } = input;
  const profile = getCropProfile(crop);
  const [min, max] = profile.idealMoisture;

  if (soilMoisture > max + 10) {
    return {
      action: "hold",
      label: "Hold irrigation & check drainage",
      depthMm: 0,
      reason: `Soil moisture ${soilMoisture}% is well above the ${min}–${max}% target for ${profile.name}; waterlogging risk.`,
    };
  }
  if (rainNext24hMm >= 10 && rainProbability >= 60) {
    return {
      action: "skip",
      label: "Skip — rain expected",
      depthMm: 0,
      reason: `${rainNext24hMm} mm of rain forecast in 24 h (${rainProbability}% chance) should cover the crop's need.`,
    };
  }
  if (soilMoisture >= min) {
    return {
      action: "skip",
      label: "No irrigation needed",
      depthMm: 0,
      reason: `Soil moisture ${soilMoisture}% is within the ${min}–${max}% target for ${profile.name}.`,
    };
  }
  const deficit = min - soilMoisture;
  const heatBonus = temperature > 32 ? 3 : 0;
  const depthMm = Math.round(clamp(deficit * 0.8 + heatBonus - rainNext24hMm, 0, 50));
  if (depthMm === 0) {
    return {
      action: "skip",
      label: "Skip — expected rain covers deficit",
      depthMm: 0,
      reason: `Forecast rain offsets the small ${deficit}-point moisture deficit.`,
    };
  }
  return {
    action: deficit <= 8 ? "light" : "irrigate",
    label: deficit <= 8 ? "Light irrigation" : "Irrigate today",
    depthMm,
    reason: `Soil moisture ${soilMoisture}% is ${deficit} points below the ${min}% minimum for ${profile.name}${
      heatBonus ? "; high temperature increases demand" : ""
    }.`,
  };
}
