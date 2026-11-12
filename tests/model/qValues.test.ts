import { describe, expect, it } from "vitest";
import { NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";
import { analyzeChannel, qValue } from "../../src/common/model/qValues.js";

describe("qValues", () => {
  it("reproduces the textbook α Q value of U-238 (4.27 MeV)", () => {
    expect((qValue(T.require("U-238"), "alpha") ?? 0) / 1000).toBeCloseTo(4.27, 2);
    expect((qValue(T.require("Po-212"), "alpha") ?? 0) / 1000).toBeCloseTo(8.954, 3);
  });

  it("matches the API's tabulated Q values for every nuclide", () => {
    let worst = 0;
    for (const x of T.nuclides) {
      for (const [mine, theirs] of [
        [qValue(x, "alpha"), x.tabulatedQAlpha],
        [qValue(x, "betaMinus"), x.tabulatedQBetaMinus],
        [qValue(x, "electronCapture"), x.tabulatedQEC],
      ] as const) {
        if (mine !== null && theirs !== null) {
          worst = Math.max(worst, Math.abs(mine - theirs));
        }
      }
    }
    // The API rounds the masses it publishes, so a few keV of slack covers the rounding.
    expect(worst).toBeLessThan(5);
  });

  it("separates allowed-and-seen, allowed-but-unseen and forbidden channels", () => {
    const k40 = T.require("K-40");
    expect(analyzeChannel(k40, "betaMinus").verdict).toBe("allowedSeen");
    expect(analyzeChannel(k40, "electronCapture").verdict).toBe("allowedSeen");
    expect(analyzeChannel(k40, "alpha").verdict).toBe("forbidden");
    // U-238 could double-β decay (Q ≈ 1.1 MeV) but α wins by many orders of magnitude.
    expect(analyzeChannel(T.require("U-238"), "doubleBetaMinus").verdict).toBe("allowedUnseen");
    // β⁺ needs Q_EC > 2mₑc².
    const be7 = T.require("Be-7");
    expect(analyzeChannel(be7, "electronCapture").verdict).toBe("allowedSeen");
    expect(analyzeChannel(be7, "betaPlus").verdict).toBe("forbidden");
  });

  it("marks proton emission open beyond the proton drip line", () => {
    expect(analyzeChannel(T.require("Lu-151"), "proton").q).toBeGreaterThan(0);
  });
});
