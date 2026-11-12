import { describe, expect, it } from "vitest";
import {
  FUSION_REACTIONS,
  fissionRelease,
  fusionRelease,
  mostBoundIsobar,
} from "../../src/common/model/energyRelease.js";

const reaction = (key: string) => {
  const r = FUSION_REACTIONS.find((x) => x.key === key);
  if (!r) {
    throw new Error(key);
  }
  return r;
};

describe("energyRelease", () => {
  it("takes fragments at the end of their β⁻ chains", () => {
    expect(mostBoundIsobar(95)?.label).toBe("Mo-95");
    expect(mostBoundIsobar(139)?.label).toBe("La-139");
  });

  it("releases about 200 MeV per U-235 fission, and the curve estimate agrees", () => {
    const f = fissionRelease(95);
    expect((f?.q ?? 0) / 1000).toBeGreaterThan(195);
    expect((f?.q ?? 0) / 1000).toBeLessThan(215);
    expect((f?.gainPerNucleon ?? 0) / 1000).toBeCloseTo(0.9, 1);
    expect(Math.abs((f?.estimate ?? 0) - (f?.q ?? 0)) / 1000).toBeLessThan(15);
  });

  it("gives 17.59 MeV for D–T fusion and 26.73 MeV for the pp chain", () => {
    const dt = fusionRelease(reaction("dt"));
    expect(dt.q / 1000).toBeCloseTo(17.59, 2);
    expect(dt.bindingGain / 1000).toBeCloseTo(17.59, 2);
    expect(fusionRelease(reaction("pp")).q / 1000).toBeCloseTo(26.73, 2);
    expect(fusionRelease(reaction("tripleAlpha")).q / 1000).toBeCloseTo(7.275, 2);
  });

  it("shows that fusing past iron can still release energy", () => {
    expect(fusionRelease(reaction("ironAlpha")).q).toBeGreaterThan(0);
  });
});
