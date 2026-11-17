import { describe, expect, it } from "vitest";
import { computePlotHealth, healthStatus, irrigationAdvice } from "@/lib/farm-logic";

describe("crop health score", () => {
  it("scores a rice plot with ideal moisture, temperature and no disease as 100", () => {
    expect(computePlotHealth({ crop: "Rice", moisture: 80, temperature: 28, diseaseRisk: 0 })).toBe(100);
  });

  it("drops a wheat plot to 43 when soil is 20 points too dry and it is 5°C too hot", () => {
    // moisture score 20, temp score 50, disease score 80 → 9 + 17.5 + 16 = 42.5 → 43
    expect(computePlotHealth({ crop: "Wheat", moisture: 25, temperature: 30, diseaseRisk: 0.2 })).toBe(43);
  });

  it("classifies 75+ as healthy, 50–74 as needs attention, below 50 as critical", () => {
    expect(healthStatus(75)).toBe("healthy");
    expect(healthStatus(74)).toBe("watch");
    expect(healthStatus(50)).toBe("watch");
    expect(healthStatus(49)).toBe("critical");
  });
});

describe("irrigation advice", () => {
  it("skips irrigation when 10 mm+ rain is forecast with at least 60% chance", () => {
    const advice = irrigationAdvice({ crop: "Tomato", soilMoisture: 40, rainNext24hMm: 12, rainProbability: 70, temperature: 28 });
    expect(advice.action).toBe("skip");
    expect(advice.depthMm).toBe(0);
  });

  it("recommends 15 mm for tomato at 40% moisture with no rain on a hot day", () => {
    // deficit 15 → 15*0.8 = 12 + 3 heat bonus = 15
    const advice = irrigationAdvice({ crop: "Tomato", soilMoisture: 40, rainNext24hMm: 0, rainProbability: 10, temperature: 34 });
    expect(advice.action).toBe("irrigate");
    expect(advice.depthMm).toBe(15);
  });

  it("holds irrigation when moisture is more than 10 points above the crop's maximum", () => {
    const advice = irrigationAdvice({ crop: "Wheat", soilMoisture: 80, rainNext24hMm: 0, rainProbability: 0, temperature: 20 });
    expect(advice.action).toBe("hold");
  });

  it("does not irrigate when moisture is inside the target range", () => {
    const advice = irrigationAdvice({ crop: "Rice", soilMoisture: 75, rainNext24hMm: 0, rainProbability: 0, temperature: 30 });
    expect(advice.action).toBe("skip");
  });
});
