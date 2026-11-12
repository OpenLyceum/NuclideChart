import { describe, expect, it } from "vitest";
import { NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";
import { pairingCensus, parityClass } from "../../src/common/model/pairingCensus.js";

describe("pairingCensus", () => {
  it("classifies parities", () => {
    expect(parityClass(T.require("O-16"))).toBe("evenEven");
    expect(parityClass(T.require("N-14"))).toBe("oddOdd");
    expect(parityClass(T.require("C-13"))).toBe("evenOdd");
    expect(parityClass(T.require("N-15"))).toBe("oddEven");
  });

  it("counts four stable odd–odd ground states, five with the effective definition", () => {
    const ensdf = pairingCensus("ensdf");
    expect(ensdf.oddOdd.map((x) => x.label)).toEqual(["H-2", "Li-6", "B-10", "N-14"]);
    expect(ensdf.evenEven.length).toBeGreaterThan(ensdf.evenOdd.length + ensdf.oddEven.length);
    const effective = pairingCensus("effective");
    expect(effective.oddOdd.map((x) => x.label)).toContain("V-50");
    expect(effective.total).toBeGreaterThan(ensdf.total);
  });
});
