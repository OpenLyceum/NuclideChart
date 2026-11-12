import { describe, expect, it } from "vitest";
import {
  fitLine,
  geigerNuttallFits,
  geigerNuttallPoints,
  sargentPoints,
} from "../../src/common/model/halfLifeTrends.js";
import { NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";

describe("halfLifeTrends", () => {
  it("puts the Geiger–Nuttall points of each actinide on a straight line", () => {
    const fits = geigerNuttallFits(geigerNuttallPoints());
    for (const z of [84, 86, 88, 90, 92, 94]) {
      expect(fits.get(z)?.rSquared).toBeGreaterThan(0.95);
      expect(fits.get(z)?.slope).toBeGreaterThan(100);
    }
  });

  it("spans 24 orders of magnitude between Po-212 and Th-232", () => {
    const points = geigerNuttallPoints();
    const po = points.find((p) => p.nuclide === T.require("Po-212"));
    const th = points.find((p) => p.nuclide === T.require("Th-232"));
    expect((th?.logHalfLife ?? 0) - (po?.logHalfLife ?? 0)).toBeCloseTo(24.2, 1);
  });

  it("gives a Sargent slope near −5", () => {
    const points = sargentPoints();
    const fit = fitLine(
      points.map((p) => Math.log10(p.qBeta)),
      points.map((p) => p.logHalfLife),
    );
    expect(fit?.slope).toBeLessThan(-4);
    expect(fit?.slope).toBeGreaterThan(-7);
  });

  it("fits an exact line exactly", () => {
    expect(fitLine([1, 2, 3], [3, 5, 7])).toEqual({ slope: 2, intercept: 1, rSquared: 1, count: 3 });
    expect(fitLine([1, 2], [1, 2])).toBeNull();
  });
});
