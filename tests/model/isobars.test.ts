import { describe, expect, it } from "vitest";
import { analyzeIsobars, fitParabola, mattauchViolations } from "../../src/common/model/isobars.js";
import { KRANE_COEFFICIENTS } from "../../src/common/model/massFormula.js";

const stableLabels = (a: number): string[] => analyzeIsobars(a, KRANE_COEFFICIENTS).betaStable.map((x) => x.label);

describe("isobars", () => {
  it("fits a parabola exactly", () => {
    const p = fitParabola(
      [1, 2, 3, 4].map((z) => ({ z, massExcess: 5 + 2 * (z - 2.5) ** 2 })),
      "all",
    );
    expect(p?.zMin).toBeCloseTo(2.5, 9);
    expect(p?.minimum).toBeCloseTo(5, 9);
    expect(p?.curvature).toBeCloseTo(2, 9);
  });

  it("leaves one β-stable isobar for odd A", () => {
    expect(stableLabels(125)).toEqual(["Te-125"]);
  });

  it("splits even A into two parabolas, and Ge-76 decays only by double β", () => {
    const a76 = analyzeIsobars(76, KRANE_COEFFICIENTS);
    expect(a76.parabolas.map((p) => p.kind)).toEqual(["evenEven", "oddOdd"]);
    const [ee, oo] = a76.parabolas;
    expect((oo?.minimum ?? 0) - (ee?.minimum ?? 0)).toBeGreaterThan(1000);
    expect(stableLabels(76)).toEqual(["Ge-76", "Se-76"]);
    const ge76 = a76.transitions.find((t) => t.from.label === "Ge-76");
    expect(ge76?.kind).toBe("doubleBetaMinus");
    expect((ge76?.q ?? 0) / 1000).toBeCloseTo(2.039, 3);
  });

  it("finds the classic double-β pairs at A = 130 and 136", () => {
    for (const [a, from, to] of [
      [130, "Te-130", "Xe-130"],
      [136, "Xe-136", "Ba-136"],
    ] as const) {
      const t = analyzeIsobars(a, KRANE_COEFFICIENTS).transitions.find((x) => x.from.label === from);
      expect(t?.to.label).toBe(to);
      expect(t?.kind).toBe("doubleBetaMinus");
    }
  });

  it("never finds two neighbouring β-stable isobars (Mattauch's rule)", () => {
    for (let a = 1; a <= 260; a++) {
      expect(mattauchViolations(analyzeIsobars(a, KRANE_COEFFICIENTS))).toEqual([]);
    }
  });
});
