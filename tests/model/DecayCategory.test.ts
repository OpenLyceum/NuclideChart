import { describe, expect, it } from "vitest";
import { parseSpin } from "../../src/chart/model/MapColoring.js";
import { DecayCategory, decayCategoryOf, strongestBranch } from "../../src/common/model/DecayCategory.js";
import { NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";

describe("DecayCategory", () => {
  it("classifies nuclides by their strongest branch", () => {
    expect(decayCategoryOf(T.require("Fe-56"))).toBe(DecayCategory.STABLE);
    expect(decayCategoryOf(T.require("Cs-137"))).toBe(DecayCategory.BETA_MINUS);
    expect(decayCategoryOf(T.require("Na-22"))).toBe(DecayCategory.BETA_PLUS);
    expect(decayCategoryOf(T.require("U-238"))).toBe(DecayCategory.ALPHA);
    expect(decayCategoryOf(T.require("Bi-212"))).toBe(DecayCategory.BETA_MINUS);
    expect(decayCategoryOf(T.require("Cf-254"))).toBe(DecayCategory.FISSION);
  });

  it("counts very long-lived nuclides as stable under the effective definition", () => {
    expect(decayCategoryOf(T.require("Te-128"), "ensdf")).toBe(DecayCategory.BETA_MINUS);
    expect(decayCategoryOf(T.require("Te-128"), "effective")).toBe(DecayCategory.STABLE);
  });

  it("treats a lone branch without a ratio as the strongest", () => {
    expect(strongestBranch([{ mode: "B-", percent: null }])?.mode).toBe("B-");
    expect(
      strongestBranch([
        { mode: "A", percent: 35.94 },
        { mode: "B-", percent: 64.06 },
      ])?.mode,
    ).toBe("B-");
  });

  it("parses spins", () => {
    expect(parseSpin("0+")).toBe(0);
    expect(parseSpin("(7/2-)")).toBe(3.5);
    expect(parseSpin("")).toBeNull();
  });
});
