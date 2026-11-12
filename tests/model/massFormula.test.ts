import { describe, expect, it } from "vitest";
import {
  ALL_TERMS,
  fitMassFormula,
  KRANE_COEFFICIENTS,
  pairingSign,
  semfBinding,
  semfResidual,
  solveLinearSystem,
  valleyZ,
} from "../../src/common/model/massFormula.js";
import { NUCLIDE_TABLE as T } from "../../src/common/model/NuclideTable.js";

describe("massFormula", () => {
  it("evaluates Krane's formula", () => {
    // Fe-56 by hand: 868.0 − 245.9 − 122.3 − 6.6 + 1.7 ≈ 494.9 MeV (measured 492.3 MeV).
    expect(semfBinding(26, 56, KRANE_COEFFICIENTS)).toBeCloseTo(494.9, 0);
    expect(pairingSign(26, 56)).toBe(1);
    expect(pairingSign(27, 56)).toBe(-1);
    expect(pairingSign(26, 57)).toBe(0);
  });

  it("puts the valley bottom at Z ≈ 91.6 for A = 238 (textbook: 91.5)", () => {
    expect(valleyZ(238, KRANE_COEFFICIENTS)).toBeCloseTo(91.6, 1);
    expect(valleyZ(16, KRANE_COEFFICIENTS)).toBeCloseTo(7.6, 1);
  });

  it("solves a linear system", () => {
    expect(
      solveLinearSystem([
        [2, 1, 5],
        [1, 3, 10],
      ]),
    ).toEqual([1, 3]);
  });

  it("fits the five coefficients far better than the textbook set", () => {
    const fit = fitMassFormula(T.nuclides, ALL_TERMS, KRANE_COEFFICIENTS);
    expect(fit.count).toBeGreaterThan(2000);
    expect(fit.coefficients.volume).toBeGreaterThan(15);
    expect(fit.coefficients.volume).toBeLessThan(16.5);
    expect(fit.coefficients.asymmetry).toBeGreaterThan(20);
    expect(fit.rmsResidual).toBeLessThan(4);
  });

  it("leaves shell-closure bumps in the residuals at N = 82 and 126", () => {
    const fit = fitMassFormula(T.nuclides, ALL_TERMS, KRANE_COEFFICIENTS);
    const pb208 = semfResidual(T.require("Pb-208"), fit.coefficients) ?? 0;
    const pb198 = semfResidual(T.require("Pb-198"), fit.coefficients) ?? 0;
    const sn132 = semfResidual(T.require("Sn-132"), fit.coefficients) ?? 0;
    expect(pb208).toBeGreaterThan(5);
    expect(pb208).toBeGreaterThan(pb198 + 3);
    expect(sn132).toBeGreaterThan(5);
  });

  it("drops a disabled term from the fit", () => {
    const noPairing = fitMassFormula(T.nuclides, { ...ALL_TERMS, pairing: false }, KRANE_COEFFICIENTS);
    const full = fitMassFormula(T.nuclides, ALL_TERMS, KRANE_COEFFICIENTS);
    expect(noPairing.coefficients.pairing).toBe(KRANE_COEFFICIENTS.pairing);
    expect(noPairing.rmsResidual).toBeGreaterThan(full.rmsResidual);
  });
});
