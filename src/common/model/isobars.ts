/**
 * isobars.ts
 *
 * Mass parabolas along a line of fixed A. Near the valley bottom the mass excess is quadratic in Z (from the
 * Coulomb and asymmetry terms). For odd A every isobar lies on one parabola, so usually exactly one is stable.
 * For even A the pairing term splits the isobars onto two parabolas, even–even below odd–odd by 2δ. Some
 * even–even nuclides then cannot β-decay to either neighbour (both are odd–odd and heavier) but can still go
 * two steps down by double β decay: Ge-76 → Se-76, Te-130 → Xe-130, Xe-136 → Ba-136.
 */

import { type MassFormulaCoefficients, valleyZ } from "./massFormula.js";
import { ELECTRON_REST_ENERGY_KEV } from "./NuclearConstants.js";
import { NUCLIDE_TABLE, type Nuclide, type NuclideTable } from "./NuclideTable.js";

/** Isobars within this many charge units of the valley bottom enter the parabola fit. */
export const PARABOLA_FIT_HALF_WIDTH = 4;

export type Parabola = {
  /** Mass excess (keV) = minimum + curvature (Z − zMin)². */
  readonly zMin: number;
  readonly minimum: number;
  readonly curvature: number;
  /** "all" for odd A; "evenEven" or "oddOdd" for even A. */
  readonly kind: "all" | "evenEven" | "oddOdd";
};

/**
 * Least-squares parabola Δ = c₀ + c₁Z + c₂Z² through the given (Z, Δ) points, with its vertex form.
 * Null with fewer than three points or a non-positive curvature.
 */
export function fitParabola(
  points: readonly { z: number; massExcess: number }[],
  kind: Parabola["kind"],
): Parabola | null {
  if (points.length < 3) {
    return null;
  }
  // Shift Z to the mean to keep the normal equations well conditioned.
  const zBar = points.reduce((s, p) => s + p.z, 0) / points.length;
  const sums = new Array<number>(5).fill(0);
  const rhs = new Array<number>(3).fill(0);
  for (const p of points) {
    const u = p.z - zBar;
    for (let k = 0; k < 5; k++) {
      sums[k] = (sums[k] ?? 0) + u ** k;
    }
    for (let k = 0; k < 3; k++) {
      rhs[k] = (rhs[k] ?? 0) + p.massExcess * u ** k;
    }
  }
  const sum = (k: number): number => sums[k] ?? 0;
  const matrix = [
    [sum(0), sum(1), sum(2), rhs[0] ?? 0],
    [sum(1), sum(2), sum(3), rhs[1] ?? 0],
    [sum(2), sum(3), sum(4), rhs[2] ?? 0],
  ];
  const [c0, c1, c2] = solve3(matrix);
  if (!(c2 > 0)) {
    return null;
  }
  const uMin = -c1 / (2 * c2);
  return { zMin: zBar + uMin, minimum: c0 - (c1 * c1) / (4 * c2), curvature: c2, kind };
}

function solve3(m: number[][]): [number, number, number] {
  const det = (a: number[][]): number =>
    (a[0]?.[0] ?? 0) * ((a[1]?.[1] ?? 0) * (a[2]?.[2] ?? 0) - (a[1]?.[2] ?? 0) * (a[2]?.[1] ?? 0)) -
    (a[0]?.[1] ?? 0) * ((a[1]?.[0] ?? 0) * (a[2]?.[2] ?? 0) - (a[1]?.[2] ?? 0) * (a[2]?.[0] ?? 0)) +
    (a[0]?.[2] ?? 0) * ((a[1]?.[0] ?? 0) * (a[2]?.[1] ?? 0) - (a[1]?.[1] ?? 0) * (a[2]?.[0] ?? 0));
  const base = m.map((row) => row.slice(0, 3));
  const d = det(base);
  const column = (k: number): number[][] => base.map((row, i) => row.map((v, j) => (j === k ? (m[i]?.[3] ?? 0) : v)));
  return d === 0 ? [0, 0, 0] : [det(column(0)) / d, det(column(1)) / d, det(column(2)) / d];
}

export type IsobarTransition = {
  readonly from: Nuclide;
  readonly to: Nuclide;
  /** "betaMinus" (Z → Z+1), "electronCapture" (Z → Z−1), "doubleBetaMinus" (Z → Z+2) or "doubleEC" (Z → Z−2). */
  readonly kind: "betaMinus" | "electronCapture" | "doubleBetaMinus" | "doubleElectronCapture";
  /** Q (keV) */
  readonly q: number;
  /** For electron capture, whether β⁺ emission is also open (Q > 2mₑc²). */
  readonly betaPlusOpen: boolean;
};

export type IsobarAnalysis = {
  readonly a: number;
  readonly members: readonly Nuclide[];
  readonly parabolas: readonly Parabola[];
  /** Energetically allowed single-β transitions between neighbours, plus double-β where single β is closed. */
  readonly transitions: readonly IsobarTransition[];
  /** Members with no energetically allowed single-β decay (candidates for stability). */
  readonly betaStable: readonly Nuclide[];
};

/** A missing neighbour counts as "no decay that way" only this close (in Z) to the valley bottom. */
const EDGE_TRUST_HALF_WIDTH = 3;

function fitIsobarParabolas(a: number, members: readonly Nuclide[], zValley: number): Parabola[] {
  const fitPoints = members
    .filter((x) => !x.isSystematic && Math.abs(x.z - zValley) <= PARABOLA_FIT_HALF_WIDTH + 1)
    .map((x) => ({ z: x.z, massExcess: x.massExcess as number, even: x.z % 2 === 0 }));
  const fits =
    a % 2 === 1
      ? [fitParabola(fitPoints, "all")]
      : // For even A, Z even ⇔ N even, so the two families split on Z parity.
        [
          fitParabola(
            fitPoints.filter((p) => p.even),
            "evenEven",
          ),
          fitParabola(
            fitPoints.filter((p) => !p.even),
            "oddOdd",
          ),
        ];
  return fits.filter((p): p is Parabola => p !== null);
}

function massExcessOf(x: Nuclide): number {
  return x.massExcess as number;
}

/** Energetically allowed single-β transitions from x to its neighbours. */
function singleBetaTransitions(x: Nuclide, byZ: ReadonlyMap<number, Nuclide>): IsobarTransition[] {
  const transitions: IsobarTransition[] = [];
  const up = byZ.get(x.z + 1);
  const down = byZ.get(x.z - 1);
  if (up && massExcessOf(x) > massExcessOf(up)) {
    transitions.push({
      from: x,
      to: up,
      kind: "betaMinus",
      q: massExcessOf(x) - massExcessOf(up),
      betaPlusOpen: false,
    });
  }
  if (down && massExcessOf(x) > massExcessOf(down)) {
    const q = massExcessOf(x) - massExcessOf(down);
    transitions.push({ from: x, to: down, kind: "electronCapture", q, betaPlusOpen: q > 2 * ELECTRON_REST_ENERGY_KEV });
  }
  return transitions;
}

/** Double-β transitions (two charge units) that are energetically open. */
function doubleBetaTransitions(x: Nuclide, byZ: ReadonlyMap<number, Nuclide>): IsobarTransition[] {
  const transitions: IsobarTransition[] = [];
  const up2 = byZ.get(x.z + 2);
  const down2 = byZ.get(x.z - 2);
  if (up2 && massExcessOf(x) > massExcessOf(up2)) {
    transitions.push({
      from: x,
      to: up2,
      kind: "doubleBetaMinus",
      q: massExcessOf(x) - massExcessOf(up2),
      betaPlusOpen: false,
    });
  }
  if (down2 && massExcessOf(x) > massExcessOf(down2)) {
    transitions.push({
      from: x,
      to: down2,
      kind: "doubleElectronCapture",
      q: massExcessOf(x) - massExcessOf(down2),
      betaPlusOpen: false,
    });
  }
  return transitions;
}

export function analyzeIsobars(
  a: number,
  coefficients: MassFormulaCoefficients,
  table: NuclideTable = NUCLIDE_TABLE,
): IsobarAnalysis {
  const members = table.isobars(a).filter((x) => x.massExcess !== null);
  const zValley = valleyZ(a, coefficients);
  const byZ = new Map(members.map((x) => [x.z, x]));
  const transitions: IsobarTransition[] = [];
  const betaStable: Nuclide[] = [];
  for (const x of members) {
    const single = singleBetaTransitions(x, byZ);
    transitions.push(...single);
    const neighboursKnown = (byZ.has(x.z + 1) && byZ.has(x.z - 1)) || Math.abs(x.z - zValley) < EDGE_TRUST_HALF_WIDTH;
    if (single.length === 0 && neighboursKnown) {
      betaStable.push(x);
      transitions.push(...doubleBetaTransitions(x, byZ));
    }
  }
  return { a, members, parabolas: fitIsobarParabolas(a, members, zValley), transitions, betaStable };
}

/** Mattauch's isobar rule: no two neighbouring isobars (ΔZ = 1) are both β-stable. Returns violating pairs. */
export function mattauchViolations(analysis: IsobarAnalysis): [Nuclide, Nuclide][] {
  const stableZ = new Set(analysis.betaStable.map((x) => x.z));
  return analysis.betaStable
    .filter((x) => stableZ.has(x.z + 1))
    .map((x) => [x, analysis.members.find((y) => y.z === x.z + 1) as Nuclide]);
}
