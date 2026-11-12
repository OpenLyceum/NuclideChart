/**
 * DecayChainsModel.ts
 *
 * The Decay Chains screen, two modes:
 *   - Natural series: the four chains Th-232 (4n), Np-237 (4n+1, extinct), U-238 (4n+2) and U-235 (4n+3),
 *     traced from the data, with the exact branching Bateman solution giving every member's activity over
 *     time. After a few half-lives of the longest-lived daughter, every activity equals the parent's
 *     (secular equilibrium), and the stable end over the parent is a clock.
 *   - Fission products: mass-chain yields of U-235, Pu-239 and U-238 fission (two humps), and the β⁻ chain
 *     along one mass number.
 */

import { DerivedProperty, NumberProperty, StringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { BatemanSolution } from "../../common/model/bateman.js";
import { type DecayChain, SERIES_PARENTS, traceChain } from "../../common/model/decayChains.js";
import { FISSION_SYSTEMS } from "../../common/model/FissionYields.js";
import { SECONDS_PER_YEAR } from "../../common/model/NuclearConstants.js";
import type { SharedModel } from "../../common/model/SharedModel.js";

/** Time slider range: log₁₀ of seconds, from 1 s to 30 billion years. */
export const LOG_TIME_RANGE = new Range(0, Math.log10(3e10 * SECONDS_PER_YEAR));

/** Mass numbers of fission-product chains worth a look. */
export const QUICK_FISSION_A: readonly number[] = [87, 90, 131, 135, 137];

/** The four natural series, traced once. */
export const SERIES: readonly DecayChain[] = SERIES_PARENTS.map(([, z, n]) => traceChain(z, n));

export type ChainsMode = "series" | "fission";

export class DecayChainsModel implements TModel {
  public readonly shared: SharedModel;
  public readonly modeProperty = new StringProperty("series", { validValues: ["series", "fission"] });
  /** Index into SERIES; U-238 by default. */
  public readonly seriesIndexProperty = new NumberProperty(2, {
    range: new Range(0, SERIES.length - 1),
    numberType: "Integer",
  });
  /** log₁₀ of the elapsed time in seconds; one billion years by default, when the chain is in equilibrium. */
  public readonly logTimeProperty = new NumberProperty(Math.log10(1e9 * SECONDS_PER_YEAR), { range: LOG_TIME_RANGE });
  public readonly chainProperty: TReadOnlyProperty<DecayChain>;
  public readonly solutionProperty: TReadOnlyProperty<BatemanSolution>;

  /** Index into FISSION_SYSTEMS (U-235 thermal by default). */
  public readonly fissionSystemIndexProperty = new NumberProperty(0, {
    range: new Range(0, FISSION_SYSTEMS.length - 1),
    numberType: "Integer",
  });
  public readonly fissionMassNumberProperty = new NumberProperty(137, {
    range: new Range(66, 172),
    numberType: "Integer",
  });

  public constructor(shared: SharedModel) {
    this.shared = shared;
    this.chainProperty = new DerivedProperty([this.seriesIndexProperty], (i) => SERIES[i] ?? (SERIES[0] as DecayChain));
    this.solutionProperty = new DerivedProperty([this.chainProperty], (chain) => new BatemanSolution(chain));
  }

  public get time(): number {
    return 10 ** this.logTimeProperty.value;
  }

  public reset(): void {
    this.shared.reset();
    this.modeProperty.reset();
    this.seriesIndexProperty.reset();
    this.logTimeProperty.reset();
    this.fissionSystemIndexProperty.reset();
    this.fissionMassNumberProperty.reset();
  }

  public step(_dt: number): void {
    // Time is chosen with a slider, not animated.
  }
}

/**
 * The parent-to-end clock: N(stable end)/N(parent) at time t, and the age it implies, t = ln(1 + ratio)/λ,
 * which assumes every intermediate is in equilibrium and is exact once they are.
 */
export function datingClock(chain: DecayChain, solution: BatemanSolution, t: number): { ratio: number; age: number } {
  const amounts = solution.amounts(t);
  const parent = amounts[0] ?? 0;
  const end = chain.nodes.reduce((sum, node, i) => (node.lambda === 0 ? sum + (amounts[i] ?? 0) : sum), 0);
  const ratio = parent > 0 ? end / parent : Number.POSITIVE_INFINITY;
  return { ratio, age: Math.log1p(ratio) / chain.parent.lambda };
}
