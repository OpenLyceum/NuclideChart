/**
 * energyRelease.ts
 *
 * Energy released by fission and fusion, two ways:
 *   - exactly, from atomic mass excesses: Q = Σ Δ(before) − Σ Δ(after);
 *   - as students estimate it from the binding-energy curve: the gain in B/A times the number of nucleons.
 *
 * Fission takes U-235 + n → light + heavy fragment + 2 n. Each fragment is taken at the end of its β⁻ chain
 * (the most bound isobar), so Q includes the energy of the fragments' β decays: about 200 MeV in all.
 */

import { NUCLIDE_TABLE, type Nuclide, type NuclideTable } from "./NuclideTable.js";

/** Prompt neutrons per fission in the simplified reaction. */
export const FISSION_NEUTRONS = 2;

/** The fissioning nucleus (U-235, hit by one neutron). */
export const FISSION_TARGET = "U-235";

/** Range of the light fragment's mass number. */
export const LIGHT_FRAGMENT_RANGE = { min: 72, max: 117 } as const;

/** The most bound isobar of mass number A (largest B/A among measured masses), or null. */
export function mostBoundIsobar(a: number, table: NuclideTable = NUCLIDE_TABLE): Nuclide | null {
  let best: Nuclide | null = null;
  for (const x of table.isobars(a)) {
    if (
      x.bindingPerNucleon !== null &&
      !x.isSystematic &&
      (best === null || x.bindingPerNucleon > (best.bindingPerNucleon ?? 0))
    ) {
      best = x;
    }
  }
  return best;
}

export type FissionRelease = {
  readonly target: Nuclide;
  readonly light: Nuclide;
  readonly heavy: Nuclide;
  /** Q from the masses (keV). */
  readonly q: number;
  /** Gain in B/A, nucleon-weighted fragments minus target (keV). */
  readonly gainPerNucleon: number;
  /** The curve estimate: gain × the target's nucleons (keV). */
  readonly estimate: number;
};

export function fissionRelease(lightA: number, table: NuclideTable = NUCLIDE_TABLE): FissionRelease | null {
  const target = table.require(FISSION_TARGET);
  const neutron = table.get(0, 1);
  const heavyA = target.a + 1 - FISSION_NEUTRONS - lightA;
  const light = mostBoundIsobar(lightA, table);
  const heavy = mostBoundIsobar(heavyA, table);
  if (!(light && heavy && neutron) || target.massExcess === null || neutron.massExcess === null) {
    return null;
  }
  const q =
    target.massExcess +
    neutron.massExcess -
    (light.massExcess ?? 0) -
    (heavy.massExcess ?? 0) -
    FISSION_NEUTRONS * neutron.massExcess;
  const fragmentsB = (light.binding ?? 0) + (heavy.binding ?? 0);
  const gainPerNucleon = fragmentsB / (light.a + heavy.a) - (target.bindingPerNucleon ?? 0);
  return { target, light, heavy, q, gainPerNucleon, estimate: gainPerNucleon * target.a };
}

/** A fusion reaction: nuclide labels with multiplicities ("n" and "p" are allowed). */
export type FusionReaction = {
  readonly key: string;
  readonly markup: string;
  readonly reactants: readonly (readonly [string, number])[];
  readonly products: readonly (readonly [string, number])[];
};

export const FUSION_REACTIONS: readonly FusionReaction[] = [
  {
    key: "dt",
    markup: "<sup>2</sup>H + <sup>3</sup>H → <sup>4</sup>He + n",
    reactants: [
      ["H-2", 1],
      ["H-3", 1],
    ],
    products: [
      ["He-4", 1],
      ["n-1", 1],
    ],
  },
  {
    key: "ddn",
    markup: "<sup>2</sup>H + <sup>2</sup>H → <sup>3</sup>He + n",
    reactants: [["H-2", 2]],
    products: [
      ["He-3", 1],
      ["n-1", 1],
    ],
  },
  {
    key: "ddp",
    markup: "<sup>2</sup>H + <sup>2</sup>H → <sup>3</sup>H + p",
    reactants: [["H-2", 2]],
    products: [
      ["H-3", 1],
      ["H-1", 1],
    ],
  },
  {
    key: "he3he3",
    markup: "<sup>3</sup>He + <sup>3</sup>He → <sup>4</sup>He + 2p",
    reactants: [["He-3", 2]],
    products: [
      ["He-4", 1],
      ["H-1", 2],
    ],
  },
  {
    key: "pp",
    markup: "4 <sup>1</sup>H → <sup>4</sup>He (pp chain, net)",
    reactants: [["H-1", 4]],
    products: [["He-4", 1]],
  },
  {
    key: "tripleAlpha",
    markup: "3 <sup>4</sup>He → <sup>12</sup>C",
    reactants: [["He-4", 3]],
    products: [["C-12", 1]],
  },
  {
    key: "carbonAlpha",
    markup: "<sup>12</sup>C + <sup>4</sup>He → <sup>16</sup>O",
    reactants: [
      ["C-12", 1],
      ["He-4", 1],
    ],
    products: [["O-16", 1]],
  },
  {
    key: "carbonCarbon",
    markup: "<sup>12</sup>C + <sup>12</sup>C → <sup>20</sup>Ne + <sup>4</sup>He",
    reactants: [["C-12", 2]],
    products: [
      ["Ne-20", 1],
      ["He-4", 1],
    ],
  },
  {
    key: "ironAlpha",
    markup: "<sup>56</sup>Fe + <sup>4</sup>He → <sup>60</sup>Ni",
    reactants: [
      ["Fe-56", 1],
      ["He-4", 1],
    ],
    products: [["Ni-60", 1]],
  },
];

export type FusionRelease = {
  readonly reaction: FusionReaction;
  /** Q from the atomic masses (keV); for the pp chain it includes positron annihilation. */
  readonly q: number;
  /** Change in total binding energy, products minus reactants (keV). */
  readonly bindingGain: number;
  readonly reactantNuclides: readonly Nuclide[];
  readonly productNuclides: readonly Nuclide[];
};

export function fusionRelease(reaction: FusionReaction, table: NuclideTable = NUCLIDE_TABLE): FusionRelease {
  const side = (
    list: readonly (readonly [string, number])[],
  ): { delta: number; binding: number; nuclides: Nuclide[] } => {
    let delta = 0;
    let binding = 0;
    const nuclides: Nuclide[] = [];
    for (const [label, count] of list) {
      const nuclide = table.require(label);
      delta += count * (nuclide.massExcess ?? 0);
      binding += count * (nuclide.binding ?? 0);
      nuclides.push(nuclide);
    }
    return { delta, binding, nuclides };
  };
  const before = side(reaction.reactants);
  const after = side(reaction.products);
  return {
    reaction,
    q: before.delta - after.delta,
    bindingGain: after.binding - before.binding,
    reactantNuclides: before.nuclides,
    productNuclides: after.nuclides,
  };
}
