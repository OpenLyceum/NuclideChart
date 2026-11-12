import { describe, expect, it } from "vitest";
import { BatemanSolution } from "../../src/common/model/bateman.js";
import { effectiveBranches, SERIES_PARENTS, traceChain } from "../../src/common/model/decayChains.js";
import { SECONDS_PER_YEAR } from "../../src/common/model/NuclearConstants.js";

const chainOf = (label: string) => {
  const parent = SERIES_PARENTS.find(([l]) => l === label);
  if (!parent) {
    throw new Error(label);
  }
  return traceChain(parent[1], parent[2]);
};
const labels = (label: string): string[] => chainOf(label).nodes.map((x) => x.label);

describe("decayChains", () => {
  it("traces the four natural series with their A mod 4 families", () => {
    expect(chainOf("Th-232").family).toBe(0);
    expect(chainOf("Np-237").family).toBe(1);
    expect(chainOf("U-238").family).toBe(2);
    expect(chainOf("U-235").family).toBe(3);
  });

  it("follows the U-238 series through Pa-234m, Rn-222 and the Bi-214 branch to Pb-206", () => {
    const u = labels("U-238");
    for (const member of [
      "Th-234",
      "Pa-234m",
      "U-234",
      "Th-230",
      "Ra-226",
      "Rn-222",
      "Po-218",
      "Pb-214",
      "Bi-214",
      "Po-214",
      "Tl-210",
      "Pb-210",
      "Bi-210",
      "Po-210",
    ]) {
      expect(u).toContain(member);
    }
    expect(u.at(-1)).toBe("Pb-206");
  });

  it("ends the other series at Pb-208, Pb-207 and Tl-205 (via Bi-209)", () => {
    expect(labels("Th-232").at(-1)).toBe("Pb-208");
    expect(labels("U-235").at(-1)).toBe("Pb-207");
    const np = labels("Np-237");
    expect(np).toContain("Bi-209");
    expect(np.at(-1)).toBe("Tl-205");
  });

  it("splits Bi-212 64/36 between β⁻ and α", () => {
    const bi212 = chainOf("Th-232").nodes.find((x) => x.label === "Bi-212");
    const beta = bi212?.links.find((l) => l.mode === "B-")?.fraction ?? 0;
    expect(beta).toBeCloseTo(0.6406, 3);
  });

  it("subtracts delayed-neutron branches from their β⁻ parent", () => {
    const branches = effectiveBranches([
      { mode: "B-", percent: 100 },
      { mode: "B-N", percent: 2.6 },
    ]);
    expect(branches.find((b) => b.mode === "B-")?.fraction).toBeCloseTo(0.974, 6);
    expect(branches.find((b) => b.mode === "B-N")?.fraction).toBeCloseTo(0.026, 6);
  });
});

describe("BatemanSolution", () => {
  it("matches the two-member closed form", () => {
    const chain = traceChain(38, 52); // Sr-90 → Y-90 → Zr-90
    expect(chain.nodes.map((x) => x.label)).toEqual(["Sr-90", "Y-90", "Zr-90"]);
    const [l1, l2] = chain.nodes.map((x) => x.lambda) as [number, number];
    const solution = new BatemanSolution(chain);
    for (const t of [3600, 86400 * 10, 3e8]) {
      const expected = (l1 / (l2 - l1)) * (Math.exp(-l1 * t) - Math.exp(-l2 * t));
      expect(solution.amounts(t)[1]).toBeCloseTo(expected, 12);
    }
  });

  it("conserves the number of atoms at every time", () => {
    for (const [label] of SERIES_PARENTS) {
      const solution = new BatemanSolution(chainOf(label));
      for (const t of [1, 1e6, 1e12, 1e17]) {
        expect(solution.amounts(t).reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
      }
    }
  });

  it("brings every U-238 daughter into secular equilibrium after 10 Myr", () => {
    const chain = chainOf("U-238");
    const activities = new BatemanSolution(chain).activities(1e7 * SECONDS_PER_YEAR);
    const parent = activities[0] ?? 1;
    for (const [i, node] of chain.nodes.entries()) {
      const fedFraction = ["Pa-234", "At-218", "Rn-218", "Tl-210"].includes(node.label);
      if (node.lambda > 0 && !fedFraction) {
        expect((activities[i] ?? 0) / parent).toBeCloseTo(1, 2);
      }
    }
  });

  it("stays positive and tiny for deep daughters at early times", () => {
    const chain = chainOf("U-238");
    const amounts = new BatemanSolution(chain).amounts(1);
    expect(amounts.every((x) => x >= 0)).toBe(true);
    const po210 = chain.nodes.findIndex((x) => x.label === "Po-210");
    expect(amounts[po210]).toBeLessThan(1e-15);
  });
});
