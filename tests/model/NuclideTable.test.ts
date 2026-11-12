import { describe, expect, it } from "vitest";
import { ISOMERS, isStableUnder, requireIsomer, NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";

describe("NuclideTable", () => {
  it("decodes every ground state of the snapshot", () => {
    expect(T.nuclides.length).toBeGreaterThan(3300);
    expect(T.maxZ).toBe(118);
    expect(T.symbol(26)).toBe("Fe");
    expect(T.require("Fe-56").z).toBe(26);
    expect(T.get(26, 30)?.label).toBe("Fe-56");
    expect(T.get(26, 999)).toBeNull();
  });

  it("keeps the API's units (keV, seconds)", () => {
    const fe56 = T.require("Fe-56");
    expect(fe56.bindingPerNucleon).toBeCloseTo(8790.356, 2);
    expect(fe56.binding).toBeCloseTo(8790.356 * 56, 0);
    const cs137 = T.require("Cs-137");
    expect(cs137.halfLife).toBeCloseTo(30.08 * 365.2422 * 86400, -6);
    expect(cs137.branches[0]?.mode).toBe("B-");
  });

  it("puts Ni-62, not Fe-56, at the top of the binding-energy curve", () => {
    const ranked = [...T.nuclides]
      .filter((x) => x.bindingPerNucleon !== null)
      .sort((a, b) => (b.bindingPerNucleon ?? 0) - (a.bindingPerNucleon ?? 0));
    expect(ranked.slice(0, 3).map((x) => x.label)).toEqual(["Ni-62", "Fe-58", "Fe-56"]);
  });

  it("flags masses from systematics and stable nuclides", () => {
    expect(T.nuclides.filter((x) => x.isSystematic).length).toBeGreaterThan(700);
    expect(T.require("Pb-208").isStable).toBe(true);
    expect(T.require("Pb-208").halfLife).toBeNull();
    expect(T.require("Te-128").isStable).toBe(false);
    expect(isStableUnder(T.require("Te-128"), "effective")).toBe(true);
    expect(isStableUnder(T.require("Te-128"), "ensdf")).toBe(false);
    expect(isStableUnder(T.require("U-238"), "effective")).toBe(false);
  });

  it("loads the named isomers", () => {
    expect(ISOMERS.map((i) => i.label)).toEqual(["Pa-234m", "Tc-99m", "Ta-180m", "Am-242m"]);
    expect(requireIsomer("Pa-234m").halfLife).toBeCloseTo(69.54, 1);
    expect(requireIsomer("Tc-99m").halfLife).toBeCloseTo(6.0072 * 3600, -1);
    expect(requireIsomer("Ta-180m").branches).toHaveLength(0);
  });
});
