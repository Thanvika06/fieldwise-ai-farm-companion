import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface WeatherReport {
  source: "live" | "demo";
  locationName: string;
  fetchedAt: string;
  current: { temperature: number; humidity: number; windSpeed: number; precipitation: number; weatherCode: number };
  daily: { date: string; tMax: number; tMin: number; rainMm: number; rainProbability: number; weatherCode: number }[];
}

const input = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  name: z.string().min(1).max(120),
});

const openMeteo = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number().nullable()),
    precipitation_probability_max: z.array(z.number().nullable()),
    weather_code: z.array(z.number()),
  }),
});

/** Live weather from Open-Meteo (free, no API key). Returns an error instead of throwing so the UI can fall back to labelled demo data. */
export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; report: WeatherReport } | { ok: false; error: string }> => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(data.lat));
    url.searchParams.set("longitude", String(data.lon));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) return { ok: false, error: `Weather service responded with ${res.status}` };
      const parsed = openMeteo.safeParse(await res.json());
      if (!parsed.success) return { ok: false, error: "Weather service returned an unexpected format" };
      const { current, daily } = parsed.data;
      return {
        ok: true,
        report: {
          source: "live",
          locationName: data.name,
          fetchedAt: new Date().toISOString(),
          current: {
            temperature: Math.round(current.temperature_2m),
            humidity: Math.round(current.relative_humidity_2m),
            windSpeed: Math.round(current.wind_speed_10m),
            precipitation: current.precipitation,
            weatherCode: current.weather_code,
          },
          daily: daily.time.map((date, i) => ({
            date,
            tMax: Math.round(daily.temperature_2m_max[i] ?? 0),
            tMin: Math.round(daily.temperature_2m_min[i] ?? 0),
            rainMm: Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
            rainProbability: daily.precipitation_probability_max[i] ?? 0,
            weatherCode: daily.weather_code[i] ?? 0,
          })),
        },
      };
    } catch (err) {
      console.error("weather fetch failed", err);
      return { ok: false, error: "Could not reach the weather service" };
    }
  });
