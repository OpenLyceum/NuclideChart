import { describe, expect, it } from "vitest";
import { isobaricChain, massChainYields, requireFissionSystem } from "../../src/common/model/FissionYields.js";

describe("FissionYields", () => {
  it("sums to two fragments per fission", () => {
    for (const parent of ["U-235", "Pu-239", "U-238"]) {
      const total = massChainYields(requireFissionSystem(parent)).reduce((s, y) => s + y, 0);
      expect(total).toBeCloseTo(2, 1);
    }
  });

  it("is two-humped for thermal U-235, with a deep symmetric valley", () => {
    const y = massChainYields(requireFissionSystem("U-235"));
    expect(y[95]).toBeGreaterThan(0.06);
    expect(y[137]).toBeGreaterThan(0.06);
    expect(y[118]).toBeLessThan(0.001);
  });

  it("lists an isobaric chain by increasing Z", () => {
    const chain = isobaricChain(requireFissionSystem("U-235"), 137);
    expect(chain.length).toBeGreaterThan(4);
    expect(chain.every((p, i) => i === 0 || p.z >= (chain[i - 1]?.z ?? 0))).toBe(true);
    const cs = chain.find((p) => p.z === 55 && p.level === 0);
    expect(cs?.cumulative).toBeGreaterThan(0.06);
  });
});
