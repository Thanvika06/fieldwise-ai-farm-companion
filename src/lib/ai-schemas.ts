import { z } from "zod";

export const SOIL_TYPES = ["Alluvial", "Black (Regur)", "Red", "Laterite", "Sandy", "Loamy", "Clay", "Saline / Alkaline", "Not sure"] as const;
export const GROWTH_STAGES = ["Planning (not sown)", "Land preparation", "Germination", "Seedling", "Vegetative", "Flowering", "Fruiting / Grain filling", "Maturity / Harvest"] as const;
export const IRRIGATION_METHODS = ["Drip", "Sprinkler", "Flood / Furrow", "Canal", "Rainfed only", "Borewell (manual)"] as const;
export const SEASONS = ["Kharif (monsoon)", "Rabi (winter)", "Zaid (summer)", "Year-round"] as const;

export const recommendationInput = z.object({
  cropName: z.string().trim().min(2, "Enter a crop name").max(60),
  soilType: z.enum(SOIL_TYPES),
  location: z.string().trim().min(2, "Enter your village, district or state").max(80),
  landArea: z.coerce.number({ invalid_type_error: "Enter land area" }).positive("Land area must be more than 0").max(10000, "Land area looks too large"),
  areaUnit: z.enum(["acres", "hectares"]),
  growthStage: z.enum(GROWTH_STAGES),
  irrigationMethod: z.enum(IRRIGATION_METHODS),
  season: z.enum(SEASONS),
  soilInfo: z.string().trim().max(600, "Keep soil notes under 600 characters").optional().default(""),
  language: z.string().max(10).default("en"),
});
export type RecommendationInput = z.infer<typeof recommendationInput>;

export const SECTION_KEYS = ["crop_selection", "irrigation", "fertilizer", "disease_prevention", "soil_improvement", "seasonal", "resource_optimization"] as const;

export const recommendationOutput = z.object({
  summary: z.string(),
  sections: z
    .array(
      z.object({
        key: z.enum(SECTION_KEYS).catch("resource_optimization"),
        title: z.string(),
        points: z.array(z.string()).min(1),
      }),
    )
    .min(1),
  assumptions: z.array(z.string()).default([]),
  missingInfo: z.array(z.string()).default([]),
  verifyWith: z.array(z.string()).default([]),
});
export type RecommendationOutput = z.infer<typeof recommendationOutput>;

export const analysisInput = z.object({
  image: z
    .string()
    .max(8_000_000, "Image is too large — please use a smaller photo")
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Only JPG, PNG or WEBP images are supported"),
  cropHint: z.string().trim().max(40).optional().default(""),
  language: z.string().max(10).default("en"),
});

const nullableConfidence = z.number().min(0).max(1).nullable().catch(null);

export const analysisOutput = z.object({
  isPlant: z.boolean(),
  imageQuality: z.enum(["good", "fair", "poor"]).catch("fair"),
  crop: z.string().nullable().catch(null),
  cropConfidence: nullableConfidence,
  condition: z
    .enum(["healthy", "disease_suspected", "pest_suspected", "nutrient_deficiency_suspected", "abiotic_stress_suspected", "uncertain"])
    .catch("uncertain"),
  possibleDisease: z.string().nullable().catch(null),
  confidence: nullableConfidence,
  severity: z.enum(["none", "low", "moderate", "high", "unknown"]).catch("unknown"),
  symptoms: z.array(z.string()).default([]),
  causes: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  prevention: z.array(z.string()).default([]),
  alternatives: z.array(z.string()).default([]),
  notes: z.string().default(""),
});
export type CropAnalysis = z.infer<typeof analysisOutput>;
