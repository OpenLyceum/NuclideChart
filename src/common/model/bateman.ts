/**
 * bateman.ts
 *
 * Exact solution of the decay equations for a branching chain (the Bateman solution generalized to a directed
 * acyclic graph):
 *
 *   dN_i/dt = −λ_i N_i + Σ_p f_pi λ_p N_p,
 *
 * where f_pi is the fraction of p's decays that feed i. Every N_i(t) is a sum of exponentials,
 * N_i(t) = Σ_j c_ij e^(−λ_j t), with
 *
 *   c_ij = Σ_p f_pi λ_p c_pj / (λ_i − λ_j)   for j ≠ i,      c_ii = N_i(0) − Σ_(j≠i) c_ij.
 *
 * The coefficients are computed once per chain, so any time from 1 s to 10 Gy is evaluated directly, with no
 * time stepping, however stiff the chain (λ spans about 10²¹ in the U-238 series). Two numerical safeguards:
 *   - when an ancestor and a descendant have equal λ (a degenerate Bateman term), the descendant's λ is
 *     nudged by one part in 10⁶ for the coefficient only;
 *   - the alternating sum cancels to roughly ε·Σ|c_ij| absolute error, about 10⁻¹⁶ of the parent's
 *     amount, far below any activity the plots show.
 */

import type { DecayChain } from "./decayChains.js";

/** Relative nudge applied to a λ that coincides with an ancestor's. */
const DEGENERACY_NUDGE = 1e-6;

type Feed = { readonly from: number; readonly fraction: number };

/** For each node, the nodes that decay into it and the fraction of their decays that do. */
function feedsOf(chain: DecayChain): Feed[][] {
  const index = new Map(chain.nodes.map((node, i) => [node.key, i]));
  const feeds: Feed[][] = chain.nodes.map(() => []);
  chain.nodes.forEach((node, from) => {
    for (const link of node.links) {
      const to = index.get(link.to);
      if (to !== undefined) {
        feeds[to]?.push({ from, fraction: link.fraction });
      }
    }
  });
  return feeds;
}

/** λ_i, nudged when it coincides with the λ of an ancestor term already present in a parent's coefficients. */
function nudgedLambda(i: number, lambdas: readonly number[], feeds: readonly Feed[], c: readonly number[][]): number {
  const lambdaI = lambdas[i] ?? 0;
  for (const { from } of feeds) {
    for (let j = 0; j < lambdas.length; j++) {
      const lj = lambdas[j] ?? 0;
      if (j !== i && (c[from]?.[j] ?? 0) !== 0 && Math.abs(lambdaI - lj) <= 1e-12 * lj) {
        return lj * (1 + DEGENERACY_NUDGE);
      }
    }
  }
  return lambdaI;
}

export class BatemanSolution {
  public readonly chain: DecayChain;

  /** coefficients[i][j] multiplies e^(−λ_j t) in N_i(t). */
  private readonly coefficients: readonly (readonly number[])[];
  private readonly lambdas: readonly number[];

  /**
   * @param chain - the chain, parents before daughters
   * @param initial - N_i(0) for each node, in the chain's node order (defaults to 1 for the parent)
   */
  public constructor(chain: DecayChain, initial?: readonly number[]) {
    this.chain = chain;
    const count = chain.nodes.length;
    const lambdas = chain.nodes.map((node) => node.lambda);
    const n0 = initial ?? chain.nodes.map((_, i) => (i === 0 ? 1 : 0));
    const feeds = feedsOf(chain);

    const c: number[][] = chain.nodes.map(() => new Array<number>(count).fill(0));
    for (let i = 0; i < count; i++) {
      const row = c[i] as number[];
      const lambdaI = nudgedLambda(i, lambdas, feeds[i] ?? [], c);
      let sum = 0;
      for (let j = 0; j < count; j++) {
        let feed = 0;
        for (const { from, fraction } of feeds[i] ?? []) {
          feed += fraction * (lambdas[from] ?? 0) * (c[from]?.[j] ?? 0);
        }
        if (j !== i && feed !== 0) {
          row[j] = feed / (lambdaI - (lambdas[j] ?? 0));
          sum += row[j] ?? 0;
        }
      }
      row[i] = (n0[i] ?? 0) - sum;
    }
    this.coefficients = c;
    this.lambdas = lambdas;
  }

  /** Number of atoms of every member at time t (s), in the chain's node order. */
  public amounts(t: number): number[] {
    const exps = this.lambdas.map((l) => Math.exp(-l * t));
    return this.coefficients.map((row) => {
      let s = 0;
      for (let j = 0; j < row.length; j++) {
        s += (row[j] ?? 0) * (exps[j] ?? 0);
      }
      return Math.max(0, s);
    });
  }

  /** Activity λ_i N_i (decays per second) of every member at time t, in the chain's node order. */
  public activities(t: number): number[] {
    return this.amounts(t).map((x, i) => x * (this.lambdas[i] ?? 0));
  }
}
