/**
 * halfLifeTrends.ts
 *
 * The half-life systematics the Half-Lives screen plots:
 *
 *   - Geiger–Nuttall: for even–even α emitters of one element, log₁₀ t½(α) is close to linear in Q_α^(−1/2),
 *     because the WKB tunnelling exponent through the Coulomb barrier is ∝ Z/√E. The partial α half-life is
 *     t½ / (α branching fraction).
 *   - Sargent: β⁻ rates grow roughly as Q⁵ (allowed transitions), so log t½ falls with slope ≈ −5 in log Q.
 *   - Distance from the valley: Z − Z_valley(A), from the mass formula.
 */

import { type MassFormulaCoefficients, valleyZ } from "./massFormula.js";
import { branchFraction, NUCLIDE_TABLE, type Nuclide, type NuclideTable } from "./NuclideTable.js";
import { qValue } from "./qValues.js";

export type GeigerNuttallPoint = {
  readonly nuclide: Nuclide;
  /** Q_α (MeV) */
  readonly qAlpha: number;
  /** Q_α^(−1/2) (MeV^(−1/2)) */
  readonly x: number;
  /** log₁₀ of the partial α half-life in seconds */
  readonly logHalfLife: number;
};

/** True for a half-life that is a measured value, not a limit. */
function isMeasured(nuclide: Nuclide): boolean {
  return nuclide.halfLife !== null && nuclide.halfLife > 0 && nuclide.halfLifeOperator === "";
}

/** Even–even α emitters with a measured half-life, a known α fraction and Q_α > 0. */
export function geigerNuttallPoints(table: NuclideTable = NUCLIDE_TABLE, evenEvenOnly = true): GeigerNuttallPoint[] {
  const points: GeigerNuttallPoint[] = [];
  for (const nuclide of table.nuclides) {
    if (evenEvenOnly && (nuclide.z % 2 !== 0 || nuclide.n % 2 !== 0)) {
      continue;
    }
    const fraction = branchFraction(nuclide, "A");
    const q = qValue(nuclide, "alpha", table);
    if (!isMeasured(nuclide) || fraction <= 0 || q === null || q <= 0 || nuclide.isSystematic) {
      continue;
    }
    const qMeV = q / 1000;
    points.push({
      nuclide,
      qAlpha: qMeV,
      x: 1 / Math.sqrt(qMeV),
      logHalfLife: Math.log10((nuclide.halfLife as number) / fraction),
    });
  }
  return points;
}

export type LineFit = {
  readonly slope: number;
  readonly intercept: number;
  /** Coefficient of determination. */
  readonly rSquared: number;
  readonly count: number;
};

/** Ordinary least-squares straight line y = slope·x + intercept. Null with fewer than three points. */
export function fitLine(xs: readonly number[], ys: readonly number[]): LineFit | null {
  const count = xs.length;
  if (count < 3) {
    return null;
  }
  const mx = xs.reduce((s, x) => s + x, 0) / count;
  const my = ys.reduce((s, y) => s + y, 0) / count;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < count; i++) {
    const dx = (xs[i] ?? 0) - mx;
    const dy = (ys[i] ?? 0) - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx === 0) {
    return null;
  }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx, rSquared: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy), count };
}

/** One Geiger–Nuttall line per element with at least three even–even α emitters. */
export function geigerNuttallFits(points: readonly GeigerNuttallPoint[]): Map<number, LineFit> {
  const byZ = new Map<number, GeigerNuttallPoint[]>();
  for (const p of points) {
    const list = byZ.get(p.nuclide.z) ?? [];
    list.push(p);
    byZ.set(p.nuclide.z, list);
  }
  const fits = new Map<number, LineFit>();
  for (const [z, list] of byZ) {
    const fit = fitLine(
      list.map((p) => p.x),
      list.map((p) => p.logHalfLife),
    );
    if (fit) {
      fits.set(z, fit);
    }
  }
  return fits;
}

export type SargentPoint = {
  readonly nuclide: Nuclide;
  /** Q_β⁻ (MeV) */
  readonly qBeta: number;
  /** log₁₀ partial β⁻ half-life (s) */
  readonly logHalfLife: number;
};

/** β⁻ emitters with a measured half-life and Q_β⁻ > 0. */
export function sargentPoints(table: NuclideTable = NUCLIDE_TABLE): SargentPoint[] {
  const points: SargentPoint[] = [];
  for (const nuclide of table.nuclides) {
    const fraction = branchFraction(nuclide, "B-");
    const q = qValue(nuclide, "betaMinus", table);
    if (!isMeasured(nuclide) || fraction <= 0 || q === null || q <= 0 || nuclide.isSystematic) {
      continue;
    }
    points.push({
      nuclide,
      qBeta: q / 1000,
      logHalfLife: Math.log10((nuclide.halfLife as number) / fraction),
    });
  }
  return points;
}

/** Z − Z_valley(A): positive on the proton-rich side of the valley, negative on the neutron-rich side. */
export function distanceFromValley(nuclide: Nuclide, coefficients: MassFormulaCoefficients): number {
  return nuclide.z - valleyZ(nuclide.a, coefficients);
}
