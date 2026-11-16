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
 *
 * Also builds the plot-ready series the Half-Lives model exposes (explorer / Geiger–Nuttall / Sargent points and
 * fit segments). The view only turns those into Scenery shapes.
 */

import { type DecayCategory, decayCategoryOf } from "./DecayCategory.js";
import { type MassFormulaCoefficients, valleyZ } from "./massFormula.js";
import { SECONDS_PER_YEAR } from "./NuclearConstants.js";
import {
  branchFraction,
  NUCLIDE_TABLE,
  type Nuclide,
  type NuclideTable,
  type StabilityDefinition,
} from "./NuclideTable.js";
import { qValue } from "./qValues.js";

/** Billion years in years — linear explorer axis is half-life in Gyr. */
const YEARS_PER_GYR = 1e9;

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

/**
 * Ordinary least-squares straight line y = slope·x + intercept. Null with fewer than three points.
 * @internal Exported to test regression coefficients and undersized samples independently of the nuclide data.
 */
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
function distanceFromValley(nuclide: Nuclide, coefficients: MassFormulaCoefficients): number {
  return nuclide.z - valleyZ(nuclide.a, coefficients);
}

/** Measured half-lives (no limits) of radioactive ground states. */
export function measuredRadioactiveNuclides(table: NuclideTable = NUCLIDE_TABLE): readonly Nuclide[] {
  return table.nuclides.filter(
    (x) => !x.isStable && x.halfLife !== null && x.halfLife > 0 && x.halfLifeOperator === "",
  );
}

/** Ordinary least-squares fit of Sargent's rule: log₁₀ t½ against log₁₀ Q_β. */
export function sargentLineFit(points: readonly SargentPoint[]): LineFit | null {
  return fitLine(
    points.map((p) => Math.log10(p.qBeta)),
    points.map((p) => p.logHalfLife),
  );
}

export type ExplorerAxis = "massNumber" | "valleyDistance";

/** One explorer point in plot coordinates (y in seconds on a log scale, Gyr on a linear scale). */
export type ExplorerTrendPoint = {
  readonly nuclide: Nuclide;
  readonly x: number;
  readonly y: number;
  readonly category: DecayCategory;
};

/** Half-life in the explorer's y units. */
export function explorerHalfLifeY(halfLifeSeconds: number, logScale: boolean): number {
  return logScale ? halfLifeSeconds : halfLifeSeconds / SECONDS_PER_YEAR / YEARS_PER_GYR;
}

/** Explorer x: mass number A, or Z − Z_valley(A). */
export function explorerX(nuclide: Nuclide, axis: ExplorerAxis, coefficients: MassFormulaCoefficients): number {
  return axis === "massNumber" ? nuclide.a : distanceFromValley(nuclide, coefficients);
}

/** Plot-ready explorer series for the current axis, scale and stability definition. */
export function explorerTrendPoints(
  nuclides: readonly Nuclide[],
  axis: ExplorerAxis,
  logScale: boolean,
  definition: StabilityDefinition,
  coefficients: MassFormulaCoefficients,
): ExplorerTrendPoint[] {
  return nuclides.map((x) => ({
    nuclide: x,
    x: explorerX(x, axis, coefficients),
    y: explorerHalfLifeY(x.halfLife as number, logScale),
    category: decayCategoryOf(x, definition),
  }));
}

/** A Geiger–Nuttall or Sargent point in plot coordinates (y = partial half-life in seconds). */
export type HighlightedTrendPoint = {
  readonly nuclide: Nuclide;
  readonly x: number;
  readonly y: number;
  readonly highlighted: boolean;
};

/** Geiger–Nuttall points with the selected element's emitters highlighted (drawn last). */
export function geigerNuttallPlotPoints(
  points: readonly GeigerNuttallPoint[],
  selectedZ: number,
): HighlightedTrendPoint[] {
  const mapped = points.map((p) => ({
    nuclide: p.nuclide,
    x: p.x,
    y: 10 ** p.logHalfLife,
    highlighted: p.nuclide.z === selectedZ,
  }));
  mapped.sort((p, q) => Number(p.highlighted) - Number(q.highlighted));
  return mapped;
}

/** Sargent points in plot coordinates. */
export function sargentPlotPoints(points: readonly SargentPoint[]): HighlightedTrendPoint[] {
  return points.map((p) => ({
    nuclide: p.nuclide,
    x: p.qBeta,
    y: 10 ** p.logHalfLife,
    highlighted: false,
  }));
}

/** One element's Geiger–Nuttall fit and the x-span of its emitters. */
export type GeigerNuttallFitSegment = {
  readonly z: number;
  readonly fit: LineFit;
  readonly xMin: number;
  readonly xMax: number;
};

/** Per-element fit segments with the x-range of the points that entered each fit. */
export function geigerNuttallFitSegments(
  points: readonly GeigerNuttallPoint[],
  fits: ReadonlyMap<number, LineFit>,
): readonly GeigerNuttallFitSegment[] {
  const segments: GeigerNuttallFitSegment[] = [];
  for (const [z, fit] of fits) {
    const xs = points.filter((p) => p.nuclide.z === z).map((p) => p.x);
    if (xs.length === 0) {
      continue;
    }
    segments.push({ z, fit, xMin: Math.min(...xs), xMax: Math.max(...xs) });
  }
  return segments;
}

/**
 * Fits to draw: other elements with ≥ 5 points when fits are visible, plus the selected element's line
 * (padded) when it has ≥ 3 points.
 */
export function visibleGeigerNuttallFits(
  segments: readonly GeigerNuttallFitSegment[],
  selectedZ: number,
  fitsVisible: boolean,
): { readonly background: readonly GeigerNuttallFitSegment[]; readonly highlight: GeigerNuttallFitSegment | null } {
  const background = fitsVisible ? segments.filter((s) => s.fit.count >= 5 && s.z !== selectedZ) : [];
  const own = segments.find((s) => s.z === selectedZ);
  const highlight = own && own.fit.count >= 3 ? { ...own, xMin: own.xMin - 0.01, xMax: own.xMax + 0.01 } : null;
  return { background, highlight };
}
