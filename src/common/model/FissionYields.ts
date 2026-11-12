/**
 * FissionYields.ts
 *
 * The bundled fission-product yields (data/fissionYields.json): independent yields (made directly by the
 * fission, before any decay) and cumulative yields (made directly or by the decay of precursors).
 *
 * Mass-chain yield Y(A) is the sum of independent yields over every product with mass number A. It
 * shows the asymmetric two-humped distribution, with peaks near A ≈ 95 and A ≈ 140, and sums to 2 because each
 * fission makes two fragments.
 */

import fissionJson from "./data/fissionYields.json";

export type FissionProduct = {
  readonly z: number;
  readonly a: number;
  /** Daughter level index: 0 = ground state, 1+ = isomer. */
  readonly level: number;
  /** Independent yield (per fission), or null. */
  readonly independent: number | null;
  /** Cumulative yield (per fission), or null. */
  readonly cumulative: number | null;
};

export type FissionSystem = {
  /** "U-235", "Pu-239", "U-238". */
  readonly parent: string;
  readonly neutronEnergy: "thermal" | "fast";
  readonly products: readonly FissionProduct[];
};

type SystemJson = {
  parent: string;
  neutronEnergy: "thermal" | "fast";
  z: number[];
  a: number[];
  lvl: number[];
  ind: (number | null)[];
  cum: (number | null)[];
};

export const FISSION_SYSTEMS: readonly FissionSystem[] = (fissionJson.systems as SystemJson[]).map((s) => ({
  parent: s.parent,
  neutronEnergy: s.neutronEnergy,
  products: s.z.map((z, i) => ({
    z,
    a: s.a[i] ?? 0,
    level: s.lvl[i] ?? 0,
    independent: s.ind[i] ?? null,
    cumulative: s.cum[i] ?? null,
  })),
}));

export function requireFissionSystem(parent: string): FissionSystem {
  const system = FISSION_SYSTEMS.find((s) => s.parent === parent);
  if (!system) {
    throw new Error(`no fission system ${parent}`);
  }
  return system;
}

/** Mass-chain yields Y(A) (per fission), indexed by A from 0 to the heaviest product. */
export function massChainYields(system: FissionSystem): number[] {
  const maxA = Math.max(...system.products.map((p) => p.a));
  const yields = new Array<number>(maxA + 1).fill(0);
  for (const p of system.products) {
    yields[p.a] = (yields[p.a] ?? 0) + (p.independent ?? 0);
  }
  return yields;
}

/** The products along one isobaric chain, by increasing Z (the direction β⁻ decay moves them). */
export function isobaricChain(system: FissionSystem, a: number): FissionProduct[] {
  return system.products.filter((p) => p.a === a).sort((p, q) => p.z - q.z || p.level - q.level);
}
