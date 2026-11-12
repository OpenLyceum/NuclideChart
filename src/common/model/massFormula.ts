/**
 * massFormula.ts
 *
 * The semi-empirical (Weizsäcker) mass formula, written as in the modernPhysics textbook (Krane's form):
 *
 *   B(Z, A) = a_V A − a_S A^(2/3) − a_C Z(Z−1)/A^(1/3) − a_A (A−2Z)²/A + δ(A, Z),
 *   δ = +a_P A^(−3/4) (even–even), 0 (odd A), −a_P A^(−3/4) (odd–odd).
 *
 * Coefficients are in MeV and the formula returns MeV. B is linear in the five coefficients, so a least-squares
 * fit to measured binding energies is a small linear problem (normal equations, solved exactly).
 */

import type { Nuclide } from "./NuclideTable.js";

export type MassFormulaTerm = "volume" | "surface" | "coulomb" | "asymmetry" | "pairing";

export const MASS_FORMULA_TERMS: readonly MassFormulaTerm[] = ["volume", "surface", "coulomb", "asymmetry", "pairing"];

export type MassFormulaCoefficients = Readonly<Record<MassFormulaTerm, number>>;

/** Krane's coefficients, the ones the textbook quotes (MeV). */
export const KRANE_COEFFICIENTS: MassFormulaCoefficients = {
  volume: 15.5,
  surface: 16.8,
  coulomb: 0.72,
  asymmetry: 23,
  pairing: 34,
};

/** Which terms are switched on. */
export type MassFormulaTermSet = Readonly<Record<MassFormulaTerm, boolean>>;

export const ALL_TERMS: MassFormulaTermSet = {
  volume: true,
  surface: true,
  coulomb: true,
  asymmetry: true,
  pairing: true,
};

/** +1 for even–even, −1 for odd–odd, 0 for odd A. */
export function pairingSign(z: number, a: number): number {
  const n = a - z;
  if (a % 2 === 1) {
    return 0;
  }
  return z % 2 === 0 && n % 2 === 0 ? 1 : -1;
}

/** Each term's value per unit coefficient (MeV per MeV), signed as it enters B. */
export function termBasis(term: MassFormulaTerm, z: number, a: number): number {
  switch (term) {
    case "volume":
      return a;
    case "surface":
      return -(a ** (2 / 3));
    case "coulomb":
      return -(z * (z - 1)) / a ** (1 / 3);
    case "asymmetry":
      return -((a - 2 * z) ** 2) / a;
    case "pairing":
      return pairingSign(z, a) * a ** -0.75;
  }
}

/** One term's contribution to B (MeV). */
export function termEnergy(term: MassFormulaTerm, z: number, a: number, coefficients: MassFormulaCoefficients): number {
  return coefficients[term] * termBasis(term, z, a);
}

/** Total binding energy predicted by the formula (MeV), with only the enabled terms. */
export function semfBinding(
  z: number,
  a: number,
  coefficients: MassFormulaCoefficients,
  terms: MassFormulaTermSet = ALL_TERMS,
): number {
  let b = 0;
  for (const term of MASS_FORMULA_TERMS) {
    if (terms[term]) {
      b += termEnergy(term, z, a, coefficients);
    }
  }
  return b;
}

/**
 * The Z that maximizes B at fixed A (the bottom of the valley of stability), from dB/dZ = 0 with the
 * Coulomb and asymmetry terms: Z = (4a_A + a_C A^(−1/3)) / (8a_A/A + 2a_C A^(−1/3)).
 * With both terms switched off there is no optimum, and A/2 is returned.
 */
export function valleyZ(
  a: number,
  coefficients: MassFormulaCoefficients,
  terms: MassFormulaTermSet = ALL_TERMS,
): number {
  const aC = terms.coulomb ? coefficients.coulomb : 0;
  const aA = terms.asymmetry ? coefficients.asymmetry : 0;
  const cube = a ** (-1 / 3);
  const denominator = (8 * aA) / a + 2 * aC * cube;
  if (denominator <= 0) {
    return a / 2;
  }
  return (4 * aA + aC * cube) / denominator;
}

/** Options for which measured nuclides enter a fit. */
export type FitSelection = {
  /** Smallest mass number used (the formula is poor for the lightest nuclei). */
  readonly minA: number;
  /** Include masses estimated from systematics. */
  readonly includeSystematic: boolean;
};

export const DEFAULT_FIT_SELECTION: FitSelection = { minA: 16, includeSystematic: false };

export type MassFormulaFit = {
  readonly coefficients: MassFormulaCoefficients;
  /** Root-mean-square residual of the fitted nuclides (MeV). */
  readonly rmsResidual: number;
  readonly count: number;
};

/**
 * Least-squares fit of the enabled terms' coefficients to measured total binding energies. Disabled terms keep
 * their current coefficient (they do not enter B anyway).
 */
export function fitMassFormula(
  nuclides: readonly Nuclide[],
  terms: MassFormulaTermSet,
  current: MassFormulaCoefficients,
  selection: FitSelection = DEFAULT_FIT_SELECTION,
): MassFormulaFit {
  const enabled = MASS_FORMULA_TERMS.filter((t) => terms[t]);
  const used = nuclides.filter(
    (x) => x.binding !== null && x.a >= selection.minA && (selection.includeSystematic || !x.isSystematic),
  );
  const k = enabled.length;
  const normal = Array.from({ length: k }, () => new Array<number>(k + 1).fill(0));
  for (const x of used) {
    const b = (x.binding ?? 0) / 1000;
    const basis = enabled.map((t) => termBasis(t, x.z, x.a));
    for (let i = 0; i < k; i++) {
      const row = normal[i] as number[];
      for (let j = 0; j < k; j++) {
        row[j] = (row[j] ?? 0) + (basis[i] ?? 0) * (basis[j] ?? 0);
      }
      row[k] = (row[k] ?? 0) + (basis[i] ?? 0) * b;
    }
  }
  const solution = solveLinearSystem(normal);
  const coefficients: Record<MassFormulaTerm, number> = { ...current };
  enabled.forEach((t, i) => {
    coefficients[t] = solution[i] ?? 0;
  });
  let sumSquares = 0;
  for (const x of used) {
    const r = (x.binding ?? 0) / 1000 - semfBinding(x.z, x.a, coefficients, terms);
    sumSquares += r * r;
  }
  return {
    coefficients,
    rmsResidual: used.length > 0 ? Math.sqrt(sumSquares / used.length) : 0,
    count: used.length,
  };
}

/** Measured minus predicted total binding energy (MeV), or null when the mass is unknown. */
export function semfResidual(
  nuclide: Nuclide,
  coefficients: MassFormulaCoefficients,
  terms: MassFormulaTermSet = ALL_TERMS,
): number | null {
  return nuclide.binding === null
    ? null
    : nuclide.binding / 1000 - semfBinding(nuclide.z, nuclide.a, coefficients, terms);
}

/** Gaussian elimination with partial pivoting on an augmented k × (k+1) matrix. Singular rows give 0. */
export function solveLinearSystem(augmented: number[][]): number[] {
  const m = augmented.map((row) => row.slice());
  const k = m.length;
  for (let col = 0; col < k; col++) {
    let pivot = col;
    for (let r = col + 1; r < k; r++) {
      if (Math.abs(m[r]?.[col] ?? 0) > Math.abs(m[pivot]?.[col] ?? 0)) {
        pivot = r;
      }
    }
    [m[col], m[pivot]] = [m[pivot] as number[], m[col] as number[]];
    const pivotRow = m[col] as number[];
    const p = pivotRow[col] ?? 0;
    if (Math.abs(p) < 1e-300) {
      continue;
    }
    for (let r = 0; r < k; r++) {
      if (r !== col) {
        const row = m[r] as number[];
        const factor = (row[col] ?? 0) / p;
        for (let c = col; c <= k; c++) {
          row[c] = (row[c] ?? 0) - factor * (pivotRow[c] ?? 0);
        }
      }
    }
  }
  return m.map((row, i) => {
    const p = row[i] ?? 0;
    return Math.abs(p) < 1e-300 ? 0 : (row[k] ?? 0) / p;
  });
}
