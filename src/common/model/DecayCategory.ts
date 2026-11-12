/**
 * DecayCategory.ts
 *
 * The broad decay-mode classes a chart of nuclides is coloured by: stable, β⁻, β⁺/EC, α, spontaneous fission,
 * proton emission, neutron emission, isomeric transition, and unknown. A nuclide's category is that of its
 * strongest branch; delayed-particle modes (β⁻n, ECp, …) count with their parent β mode.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { type DecayBranch, isStableUnder, type Nuclide, type StabilityDefinition } from "./NuclideTable.js";

export class DecayCategory extends EnumerationValue {
  public static readonly STABLE = new DecayCategory("stable");
  public static readonly BETA_MINUS = new DecayCategory("betaMinus");
  public static readonly BETA_PLUS = new DecayCategory("betaPlus");
  public static readonly ALPHA = new DecayCategory("alpha");
  public static readonly FISSION = new DecayCategory("fission");
  public static readonly PROTON = new DecayCategory("proton");
  public static readonly NEUTRON = new DecayCategory("neutron");
  public static readonly ISOMERIC = new DecayCategory("isomeric");
  public static readonly UNKNOWN = new DecayCategory("unknown");

  public static readonly enumeration = new Enumeration(DecayCategory);

  /** Key into the `decayModes` string group and the colour map. */
  public readonly key: string;

  public constructor(key: string) {
    super();
    this.key = key;
  }
}

const MODE_CATEGORY: Readonly<Record<string, DecayCategory>> = {
  "B-": DecayCategory.BETA_MINUS,
  "B-N": DecayCategory.BETA_MINUS,
  "B-2N": DecayCategory.BETA_MINUS,
  "B-A": DecayCategory.BETA_MINUS,
  "2B-": DecayCategory.BETA_MINUS,
  "B+": DecayCategory.BETA_PLUS,
  EC: DecayCategory.BETA_PLUS,
  "EC+B+": DecayCategory.BETA_PLUS,
  ECP: DecayCategory.BETA_PLUS,
  "B+P": DecayCategory.BETA_PLUS,
  "2EC": DecayCategory.BETA_PLUS,
  "2B+": DecayCategory.BETA_PLUS,
  A: DecayCategory.ALPHA,
  SF: DecayCategory.FISSION,
  ECSF: DecayCategory.FISSION,
  P: DecayCategory.PROTON,
  "2P": DecayCategory.PROTON,
  N: DecayCategory.NEUTRON,
  "2N": DecayCategory.NEUTRON,
  IT: DecayCategory.ISOMERIC,
};

/** The category of one ENSDF mode code, or UNKNOWN. */
export function categoryOfMode(mode: string): DecayCategory {
  return MODE_CATEGORY[mode] ?? DecayCategory.UNKNOWN;
}

/** The branch with the largest branching ratio (a lone branch without a ratio counts as 100 %). */
export function strongestBranch(branches: readonly DecayBranch[]): DecayBranch | null {
  let best: DecayBranch | null = null;
  let bestPercent = -1;
  for (const branch of branches) {
    const percent = branch.percent ?? (branches.length === 1 ? 100 : 0);
    if (percent > bestPercent) {
      best = branch;
      bestPercent = percent;
    }
  }
  return best;
}

/** The category a nuclide is coloured by, under the given definition of stability. */
export function decayCategoryOf(nuclide: Nuclide, definition: StabilityDefinition = "ensdf"): DecayCategory {
  if (isStableUnder(nuclide, definition)) {
    return DecayCategory.STABLE;
  }
  const branch = strongestBranch(nuclide.branches);
  return branch ? categoryOfMode(branch.mode) : DecayCategory.UNKNOWN;
}
