import { queryOptions } from "@tanstack/react-query";
import { getWeather, type WeatherReport } from "@/lib/weather.functions";

export const WEATHER_LOCATIONS = [
  { id: "nashik", name: "Nashik, Maharashtra", lat: 19.9975, lon: 73.7898 },
  { id: "ludhiana", name: "Ludhiana, Punjab", lat: 30.901, lon: 75.8573 },
  { id: "guntur", name: "Guntur, Andhra Pradesh", lat: 16.3067, lon: 80.4365 },
  { id: "coimbatore", name: "Coimbatore, Tamil Nadu", lat: 11.0168, lon: 76.9558 },
  { id: "mysuru", name: "Mysuru, Karnataka", lat: 12.2958, lon: 76.6394 },
  { id: "indore", name: "Indore, Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { id: "bardhaman", name: "Bardhaman, West Bengal", lat: 23.2324, lon: 87.8615 },
] as const;

export function locationById(id: string) {
  return WEATHER_LOCATIONS.find((l) => l.id === id) ?? WEATHER_LOCATIONS[0];
}

/** Clearly-labelled fallback used only when the live weather service cannot be reached. */
export const DEMO_WEATHER: WeatherReport = {
  source: "demo",
  locationName: "Nashik, Maharashtra (demo)",
  fetchedAt: "",
  current: { temperature: 29, humidity: 62, windSpeed: 11, precipitation: 0, weatherCode: 2 },
  daily: [
    { date: "Day 1", tMax: 31, tMin: 19, rainMm: 0, rainProbability: 10, weatherCode: 2 },
    { date: "Day 2", tMax: 32, tMin: 20, rainMm: 0.4, rainProbability: 20, weatherCode: 3 },
    { date: "Day 3", tMax: 30, tMin: 20, rainMm: 6.2, rainProbability: 55, weatherCode: 61 },
    { date: "Day 4", tMax: 28, tMin: 19, rainMm: 12.5, rainProbability: 70, weatherCode: 63 },
    { date: "Day 5", tMax: 29, tMin: 18, rainMm: 1.1, rainProbability: 30, weatherCode: 3 },
    { date: "Day 6", tMax: 30, tMin: 18, rainMm: 0, rainProbability: 10, weatherCode: 1 },
    { date: "Day 7", tMax: 31, tMin: 19, rainMm: 0, rainProbability: 5, weatherCode: 0 },
  ],
};

export const weatherQuery = (locationId: string) => {
  const loc = locationById(locationId);
  return queryOptions({
    queryKey: ["weather", loc.id],
    queryFn: async (): Promise<WeatherReport & { error?: string }> => {
      const res = await getWeather({ data: { lat: loc.lat, lon: loc.lon, name: loc.name } });
      if (res.ok) return res.report;
      return { ...DEMO_WEATHER, error: res.error };
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

export function weatherLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed conditions";
}
