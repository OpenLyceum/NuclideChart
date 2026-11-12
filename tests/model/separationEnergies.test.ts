import { describe, expect, it } from "vitest";
import { NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";
import { boundRange, separationEnergy, separationLine } from "../../src/common/model/separationEnergies.js";

const s2n = (label: string): number => (separationEnergy(T.require(label), "twoNeutron") ?? 0) / 1000;

describe("separationEnergies", () => {
  it("matches the API's one-neutron and one-proton separation energies", () => {
    for (const label of ["O-16", "Fe-56", "Sn-120", "Pb-208", "U-238"]) {
      const x = T.require(label);
      expect(separationEnergy(x, "oneNeutron")).toBeCloseTo(x.sn ?? 0, -1);
      expect(separationEnergy(x, "oneProton")).toBeCloseTo(x.sp ?? 0, -1);
    }
  });

  it("drops by more than 2 MeV just past N = 28, 82 and 126", () => {
    expect(s2n("Ca-48") - s2n("Ca-50")).toBeGreaterThan(2);
    expect(s2n("Sn-132") - s2n("Sn-134")).toBeGreaterThan(2);
    expect(s2n("Pb-208") - s2n("Pb-210")).toBeGreaterThan(2);
  });

  it("builds one sorted line per element", () => {
    const tin = separationLine("twoNeutron", 50);
    expect(tin.length).toBeGreaterThan(20);
    expect(tin.every((p, i) => i === 0 || p.x > (tin[i - 1]?.x ?? 0))).toBe(true);
  });

  it("finds a bound range for each light element", () => {
    const oxygen = boundRange(8);
    expect(oxygen?.minN).toBeLessThanOrEqual(5);
    expect(oxygen?.maxN).toBe(16); // O-24 is the heaviest bound oxygen isotope
  });
});
