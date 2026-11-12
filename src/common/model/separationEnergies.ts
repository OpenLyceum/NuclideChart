/**
 * separationEnergies.ts
 *
 * Nucleon separation energies from total binding energies B (keV):
 *
 *   S_n(Z, N)  = B(Z, N) − B(Z, N−1)        S_p(Z, N)  = B(Z, N) − B(Z−1, N)
 *   S₂ₙ(Z, N)  = B(Z, N) − B(Z, N−2)        S₂ₚ(Z, N)  = B(Z, N) − B(Z−2, N)
 *
 * S₂ₙ compares nuclides of the same neutron-number parity, so the pairing zig-zag of S_n cancels and the shell
 * closures show up as sudden drops just past each magic number. Negative separation energies mark the drip
 * lines: beyond them the nucleus is unbound against nucleon emission.
 */

import { NUCLIDE_TABLE, type Nuclide, type NuclideTable } from "./NuclideTable.js";

export type SeparationKind = "oneNeutron" | "twoNeutron" | "oneProton" | "twoProton";

const REMOVED: Readonly<Record<SeparationKind, readonly [number, number]>> = {
  oneNeutron: [0, 1],
  twoNeutron: [0, 2],
  oneProton: [1, 0],
  twoProton: [2, 0],
};

/** Separation energy (keV), or null when either binding energy is unknown. */
export function separationEnergy(
  nuclide: Nuclide,
  kind: SeparationKind,
  table: NuclideTable = NUCLIDE_TABLE,
  includeSystematic = true,
): number | null {
  const [dz, dn] = REMOVED[kind];
  const lighter = table.get(nuclide.z - dz, nuclide.n - dn);
  if (nuclide.binding === null || !lighter || lighter.binding === null) {
    return null;
  }
  if (!includeSystematic && (nuclide.isSystematic || lighter.isSystematic)) {
    return null;
  }
  return nuclide.binding - lighter.binding;
}

export type SeparationPoint = {
  readonly nuclide: Nuclide;
  /** N for neutron separation, Z for proton separation. */
  readonly x: number;
  /** keV */
  readonly energy: number;
  /** True when either mass comes from systematics. */
  readonly systematic: boolean;
};

/**
 * One line of the Shells plot: S_n or S₂ₙ along the isotopes of element Z (x = N), or S_p or S₂ₚ along the
 * isotones with N neutrons (x = Z).
 */
export function separationLine(
  kind: SeparationKind,
  fixed: number,
  table: NuclideTable = NUCLIDE_TABLE,
): SeparationPoint[] {
  const neutronKind = kind === "oneNeutron" || kind === "twoNeutron";
  const members = neutronKind ? table.isotopes(fixed) : table.nuclides.filter((x) => x.n === fixed);
  const [dz, dn] = REMOVED[kind];
  const points: SeparationPoint[] = [];
  for (const nuclide of members) {
    const energy = separationEnergy(nuclide, kind, table);
    if (energy !== null) {
      const lighter = table.get(nuclide.z - dz, nuclide.n - dn);
      points.push({
        nuclide,
        x: neutronKind ? nuclide.n : nuclide.z,
        energy,
        systematic: nuclide.isSystematic || (lighter?.isSystematic ?? false),
      });
    }
  }
  return points.sort((p, q) => p.x - q.x);
}

/**
 * True when the nuclide is bound against emitting one or two nucleons: S_n, S_p, S₂ₙ and S₂ₚ all positive
 * (a two-nucleon energy that cannot be computed is not held against it). O-26 shows why S₂ₙ matters: its
 * S_n is positive, yet it lies above O-24 and decays by emitting two neutrons.
 */
export function isParticleBound(nuclide: Nuclide, table: NuclideTable = NUCLIDE_TABLE): boolean {
  if ((nuclide.sn ?? -1) <= 0 || (nuclide.sp ?? -1) <= 0) {
    return false;
  }
  const s2n = separationEnergy(nuclide, "twoNeutron", table);
  const s2p = separationEnergy(nuclide, "twoProton", table);
  return (s2n === null || s2n > 0) && (s2p === null || s2p > 0);
}

/** For each Z, the smallest and largest N of the particle-bound isotopes. */
export function boundRange(z: number, table: NuclideTable = NUCLIDE_TABLE): { minN: number; maxN: number } | null {
  const bound = table.isotopes(z).filter((x) => isParticleBound(x, table));
  if (bound.length === 0) {
    return null;
  }
  return { minN: Math.min(...bound.map((x) => x.n)), maxN: Math.max(...bound.map((x) => x.n)) };
}
