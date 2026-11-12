/**
 * decayChains.ts
 *
 * Traces decay chains from the snapshot's decay branches. Nothing is hand-listed: starting from a parent, every
 * branch stronger than CHAIN_BRANCH_THRESHOLD is followed until stable nuclides are reached.
 *
 * Two corrections to the raw ground-state table:
 *   - ENSDF quotes delayed-particle branches (β⁻n, β⁻2n, β⁻α, ECp, β⁺p) as parts of the parent β branch,
 *     so they are subtracted from it, so the fractions add up to 100 %.
 *   - Th-234 β⁻ decay feeds the 1.16 min isomer Pa-234m, not the 6.7 h ground state, so the chain goes through
 *     Pa-234m (data/isomers.json), whose 0.16 % IT branch reaches Pa-234.
 *
 * Because α decay changes A by 4 and β decay leaves A unchanged, every member of a heavy chain shares A mod 4:
 * the four families 4n (thorium), 4n+1 (neptunium), 4n+2 (uranium) and 4n+3 (actinium).
 */

import { CHAIN_BRANCH_THRESHOLD, LN2 } from "./NuclearConstants.js";
import { type DecayBranch, ISOMERS, NUCLIDE_TABLE, type NuclideTable } from "./NuclideTable.js";

/** (ΔZ, ΔN) from parent to daughter for each ENSDF decay mode that leads to a single daughter. */
export const MODE_SHIFT: Readonly<Record<string, readonly [number, number]>> = {
  A: [-2, -2],
  "B-": [1, -1],
  "B-N": [1, -2],
  "B-2N": [1, -3],
  "B-A": [-1, -3],
  "B+": [-1, 1],
  EC: [-1, 1],
  "EC+B+": [-1, 1],
  ECP: [-2, 1],
  "B+P": [-2, 1],
  P: [-1, 0],
  "2P": [-2, 0],
  N: [0, -1],
  "2N": [0, -2],
  "2B-": [2, -2],
  "2B+": [-2, 2],
  "2EC": [-2, 2],
  IT: [0, 0],
};

/** Delayed-particle modes and the β branch whose percentage already includes them. */
const SUB_BRANCHES: Readonly<Record<string, readonly string[]>> = {
  "B-": ["B-N", "B-2N", "B-A"],
  "EC+B+": ["ECP", "B+P"],
  EC: ["ECP"],
  "B+": ["B+P"],
};

/** Decays that the chain follows into an isomer instead of the ground state: "Z-N" of parent → isomer label. */
const ISOMER_FEEDING: Readonly<Record<string, string>> = {
  "90-144": "Pa-234m",
};

export type ChainLink = {
  /** Key of the daughter node. */
  readonly to: string;
  readonly mode: string;
  /** Fraction (0–1) of this node's decays that take this branch, after thresholding and renormalizing. */
  readonly fraction: number;
};

export type ChainNode = {
  /** "Z-N" for a ground state, "Z-N-m" for an isomer. */
  readonly key: string;
  readonly label: string;
  readonly z: number;
  readonly n: number;
  readonly a: number;
  readonly isomer: boolean;
  /** Half-life (s); null for a stable end point. */
  readonly halfLife: number | null;
  readonly halfLifeText: string;
  /** Decay constant (1/s); 0 for a stable end point. */
  readonly lambda: number;
  readonly links: readonly ChainLink[];
};

export type DecayChain = {
  readonly parent: ChainNode;
  /** All members, parents before daughters (topological order). */
  readonly nodes: readonly ChainNode[];
  /** A mod 4 of the parent, or null when members disagree (a chain that emits nucleons). */
  readonly family: number | null;
};

type State = {
  key: string;
  label: string;
  z: number;
  n: number;
  isomer: boolean;
  halfLife: number | null;
  halfLifeText: string;
  stable: boolean;
  branches: readonly DecayBranch[];
};

function groundKey(z: number, n: number): string {
  return `${z}-${n}`;
}

function stateFor(key: string, table: NuclideTable): State | null {
  const isomer = key.endsWith("-m");
  const [zText, nText] = key.split("-");
  const z = Number(zText);
  const n = Number(nText);
  if (isomer) {
    const level = ISOMERS.find((i) => i.z === z && i.n === n);
    return level
      ? {
          key,
          label: level.label,
          z,
          n,
          isomer: true,
          halfLife: level.halfLife,
          halfLifeText: level.halfLifeText,
          stable: level.branches.length === 0,
          branches: level.branches,
        }
      : null;
  }
  const nuclide = table.get(z, n);
  return nuclide
    ? {
        key,
        label: nuclide.label,
        z,
        n,
        isomer: false,
        halfLife: nuclide.halfLife,
        halfLifeText: nuclide.halfLifeText,
        stable: nuclide.isStable || nuclide.branches.length === 0,
        branches: nuclide.branches,
      }
    : null;
}

/** Branch fractions after subtracting delayed-particle sub-branches, thresholding and renormalizing. */
export function effectiveBranches(
  branches: readonly DecayBranch[],
  threshold = CHAIN_BRANCH_THRESHOLD,
): { mode: string; fraction: number }[] {
  const known = branches.filter((b) => MODE_SHIFT[b.mode] !== undefined);
  const percent = (b: DecayBranch): number => b.percent ?? (branches.length === 1 ? 100 : 0);
  const raw = known.map((b) => {
    let p = percent(b);
    for (const sub of SUB_BRANCHES[b.mode] ?? []) {
      const included = branches.find((x) => x.mode === sub);
      if (included) {
        p -= percent(included);
      }
    }
    return { mode: b.mode, fraction: Math.max(0, p) / 100 };
  });
  const kept = raw.filter((b) => b.fraction >= threshold);
  const total = kept.reduce((s, b) => s + b.fraction, 0);
  return total > 0 ? kept.map((b) => ({ mode: b.mode, fraction: b.fraction / total })) : [];
}

/** The daughter state key a branch leads to. */
function daughterKey(state: State, mode: string): string {
  if (mode === "IT") {
    return groundKey(state.z, state.n);
  }
  const shift = MODE_SHIFT[mode] as readonly [number, number];
  const key = groundKey(state.z + shift[0], state.n + shift[1]);
  const feedsIsomer = !state.isomer && ISOMER_FEEDING[groundKey(state.z, state.n)] !== undefined;
  return feedsIsomer && mode === "B-" ? `${key}-m` : key;
}

/** The links out of a state, renormalized over the daughters that exist in the table. */
function linksFrom(state: State, table: NuclideTable, threshold: number): ChainLink[] {
  if (state.stable || state.halfLife === null) {
    return [];
  }
  const out = effectiveBranches(state.branches, threshold)
    .map((branch) => ({ to: daughterKey(state, branch.mode), mode: branch.mode, fraction: branch.fraction }))
    .filter((link) => stateFor(link.to, table) !== null);
  const total = out.reduce((s, link) => s + link.fraction, 0);
  return out.map((link) => ({ ...link, fraction: link.fraction / total }));
}

/** Traces the chain that starts at the ground state (z, n), or at an isomer when `isomer` is set. */
export function traceChain(
  z: number,
  n: number,
  table: NuclideTable = NUCLIDE_TABLE,
  threshold = CHAIN_BRANCH_THRESHOLD,
  isomer = false,
): DecayChain {
  const states = new Map<string, State>();
  const links = new Map<string, ChainLink[]>();
  const startKey = isomer ? `${groundKey(z, n)}-m` : groundKey(z, n);
  const queue = [startKey];
  while (queue.length > 0) {
    const key = queue.shift() as string;
    const state = states.has(key) ? null : stateFor(key, table);
    if (state) {
      states.set(key, state);
      const out = linksFrom(state, table, threshold);
      links.set(key, out);
      queue.push(...out.map((link) => link.to));
    }
  }

  const order = topologicalOrder(startKey, links);
  const nodes = order.map((key): ChainNode => {
    const s = states.get(key) as State;
    const decays = !s.stable && s.halfLife !== null && s.halfLife > 0;
    return {
      key,
      label: s.label,
      z: s.z,
      n: s.n,
      a: s.z + s.n,
      isomer: s.isomer,
      halfLife: decays ? s.halfLife : null,
      halfLifeText: s.halfLifeText,
      lambda: decays ? LN2 / (s.halfLife as number) : 0,
      links: links.get(key) ?? [],
    };
  });
  const families = new Set(nodes.map((x) => x.a % 4));
  return {
    parent: nodes[0] as ChainNode,
    nodes,
    family: families.size === 1 ? (nodes[0] as ChainNode).a % 4 : null,
  };
}

function topologicalOrder(start: string, links: ReadonlyMap<string, readonly ChainLink[]>): string[] {
  const indegree = new Map<string, number>();
  for (const [key, out] of links) {
    indegree.set(key, indegree.get(key) ?? 0);
    for (const link of out) {
      indegree.set(link.to, (indegree.get(link.to) ?? 0) + 1);
    }
  }
  const ready = [start];
  const order: string[] = [];
  while (ready.length > 0) {
    const key = ready.shift() as string;
    order.push(key);
    for (const link of links.get(key) ?? []) {
      const d = (indegree.get(link.to) ?? 0) - 1;
      indegree.set(link.to, d);
      if (d === 0) {
        ready.push(link.to);
      }
    }
  }
  return order;
}

/** The four natural-series parents, as [label, Z, N]. Np-237 heads the extinct 4n+1 series. */
export const SERIES_PARENTS: readonly (readonly [string, number, number])[] = [
  ["Th-232", 90, 142],
  ["Np-237", 93, 144],
  ["U-238", 92, 146],
  ["U-235", 92, 143],
];
