import { describe, expect, it } from "vitest";
import { BatemanSolution } from "../../src/common/model/bateman.js";
import { SECONDS_PER_YEAR } from "../../src/common/model/NuclearConstants.js";
import { datingClock, SERIES } from "../../src/decay-chains/model/DecayChainsModel.js";

describe("DecayChainsModel", () => {
  it("reads the age of an equilibrium U-238 sample from Pb-206/U-238", () => {
    const chain = SERIES[2];
    if (!chain) {
      throw new Error("no U-238 series");
    }
    const solution = new BatemanSolution(chain);
    const t = 1e9 * SECONDS_PER_YEAR;
    const clock = datingClock(chain, solution, t);
    expect(clock.ratio).toBeCloseTo(Math.expm1(chain.parent.lambda * t), 3);
    expect(clock.age / t).toBeCloseTo(1, 3);
  });
});
