import { createServerFn } from "@tanstack/react-start";
import { analysisInput, analysisOutput, recommendationInput, recommendationOutput, type CropAnalysis, type RecommendationOutput } from "@/lib/ai-schemas";
import type { AiFailure } from "@/lib/ai.server";

const LANG: Record<string, string> = {
  en: "simple English", hi: "Hindi", mr: "Marathi", ta: "Tamil", te: "Telugu", kn: "Kannada", bn: "Bengali", pa: "Punjabi", gu: "Gujarati",
};

export const analyzeCropImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => analysisInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; result: CropAnalysis; model: string } | AiFailure> => {
    const { collectGeminiText, parseJsonObject, toAiFailure, GEMINI_MODEL } = await import("@/lib/ai.server");
    const language = LANG[data.language] ?? "simple English";
    const system = `You are a careful plant-health screening assistant for Indian farmers. You look at ONE photo and describe what is visible.
Rules:
- Never claim a confirmed diagnosis. Use "possible" / "suspected" language. If the image is unclear, not a plant, or symptoms are ambiguous, say so and set condition to "uncertain".
- confidence and cropConfidence are your own rough estimate between 0 and 1 (not a calibrated probability). Use null if you cannot judge.
- Prefer practical, low-cost, locally available actions (Indian context: KVK, state agriculture department, neem-based options, sanitation). Mention chemical options only generically and always advise following label instructions and local agronomist advice.
- Do not invent lab results, weather, or field measurements.
- Write all free-text values in ${language}. Keep JSON keys and enum values in English.
Return ONLY a JSON object with exactly these keys:
{"isPlant": boolean, "imageQuality": "good"|"fair"|"poor", "crop": string|null, "cropConfidence": number|null, "condition": "healthy"|"disease_suspected"|"pest_suspected"|"nutrient_deficiency_suspected"|"abiotic_stress_suspected"|"uncertain", "possibleDisease": string|null, "confidence": number|null, "severity": "none"|"low"|"moderate"|"high"|"unknown", "symptoms": string[], "causes": string[], "nextSteps": string[], "prevention": string[], "alternatives": string[], "notes": string}
"alternatives" lists other conditions that could look similar. Keep each list to at most 5 short items.`;
    const userText = data.cropHint
      ? `The farmer says this is ${data.cropHint}. Verify from the image rather than assuming. Analyse the visible plant health.`
      : "Analyse the visible plant health in this photo.";
    try {
      const text = await collectGeminiText(
        [
          { role: "system", content: system },
          { role: "user", content: [{ type: "text", text: userText }, { type: "image_url", image_url: { url: data.image } }] },
        ],
        { json: true },
      );
      const parsed = analysisOutput.safeParse(parseJsonObject(text));
      if (!parsed.success) return { ok: false, code: "invalid_output", message: "The AI response could not be read. Please try again." };
      return { ok: true, result: parsed.data, model: GEMINI_MODEL };
    } catch (err) {
      if (err instanceof SyntaxError || (err instanceof Error && err.message.startsWith("No JSON")))
        return { ok: false, code: "invalid_output", message: "The AI response could not be read. Please try again." };
      return toAiFailure(err);
    }
  });

export const generateRecommendations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => recommendationInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; result: RecommendationOutput } | AiFailure> => {
    const { collectGeminiText, parseJsonObject, toAiFailure } = await import("@/lib/ai.server");
    const language = LANG[data.language] ?? "simple English";
    const system = `You are an agronomy advisor for Indian smallholder and commercial farmers.
Give practical, personalised recommendations based ONLY on the farmer's inputs and well-established agronomic practice for that crop, region and season.
Strict rules:
- Do NOT invent weather readings, soil test values, disease diagnoses or market prices. If information is missing, say what is missing and give general guidance labelled as typical.
- Never promise or predict a specific yield or income.
- Fertilizer advice: give it as "typical recommended ranges" and tell the farmer to confirm with a Soil Health Card test or local KVK.
- Mention locally relevant resources (Soil Health Card, KVK, state agriculture university) where useful.
- Write all text values in ${language}. Keep JSON keys and "key" enum values in English.
Return ONLY a JSON object:
{"summary": string, "sections": [{"key": "crop_selection"|"irrigation"|"fertilizer"|"disease_prevention"|"soil_improvement"|"seasonal"|"resource_optimization", "title": string, "points": string[]}], "assumptions": string[], "missingInfo": string[], "verifyWith": string[]}
Include all seven section keys exactly once, in that order, each with 3-5 concise, actionable points.`;
    const user = `Farmer inputs:
- Crop: ${data.cropName}
- Soil type: ${data.soilType}
- Location: ${data.location}
- Land area: ${data.landArea} ${data.areaUnit}
- Current growth stage: ${data.growthStage}
- Irrigation method: ${data.irrigationMethod}
- Season: ${data.season}
- Available soil information: ${data.soilInfo || "None provided"}`;
    try {
      const text = await collectGeminiText(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { json: true },
      );
      const parsed = recommendationOutput.safeParse(parseJsonObject(text));
      if (!parsed.success) return { ok: false, code: "invalid_output", message: "The AI response could not be read. Please try again." };
      return { ok: true, result: parsed.data };
    } catch (err) {
      if (err instanceof SyntaxError || (err instanceof Error && err.message.startsWith("No JSON")))
        return { ok: false, code: "invalid_output", message: "The AI response could not be read. Please try again." };
      return toAiFailure(err);
    }
  });
