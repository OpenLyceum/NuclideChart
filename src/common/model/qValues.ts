/**
 * qValues.ts
 *
 * Decay Q values from atomic mass excesses Δ (keV). Atomic (not nuclear) masses already include the electrons, so
 *
 *   Q_α   = Δ(Z, N) − Δ(Z−2, N−2) − Δ(⁴He)
 *   Q_β⁻  = Δ(Z, N) − Δ(Z+1, N−1)
 *   Q_EC  = Δ(Z, N) − Δ(Z−1, N+1)
 *   Q_β⁺  = Q_EC − 2 mₑc²
 *   Q_ββ  = Δ(Z, N) − Δ(Z+2, N−2)            (double β⁻)
 *   Q_p   = −S_p,  Q_n = −S_n                 (proton and neutron emission)
 *
 * A decay can happen only when its Q > 0. Whether it is seen also depends on the rate: tunnelling (α, p),
 * spin/parity forbiddenness (β) and competition with faster modes.
 */

import { ELECTRON_REST_ENERGY_KEV } from "./NuclearConstants.js";
import { hasMode, NUCLIDE_TABLE, type Nuclide, type NuclideTable } from "./NuclideTable.js";

export type DecayChannel =
  | "alpha"
  | "betaMinus"
  | "electronCapture"
  | "betaPlus"
  | "doubleBetaMinus"
  | "proton"
  | "neutron";

export const DECAY_CHANNELS: readonly DecayChannel[] = [
  "alpha",
  "betaMinus",
  "electronCapture",
  "betaPlus",
  "doubleBetaMinus",
  "proton",
  "neutron",
];

/** The ENSDF mode codes that count as an observation of each channel. */
export const CHANNEL_MODES: Readonly<Record<DecayChannel, readonly string[]>> = {
  alpha: ["A"],
  betaMinus: ["B-", "B-N", "B-2N", "B-A"],
  electronCapture: ["EC", "EC+B+", "ECP", "ECSF", "B+P"],
  betaPlus: ["B+", "EC+B+", "B+P"],
  doubleBetaMinus: ["2B-"],
  proton: ["P", "2P"],
  neutron: ["N", "2N"],
};

/** (ΔZ, ΔN) from parent to daughter for each channel. */
const CHANNEL_SHIFT: Readonly<Record<DecayChannel, readonly [number, number]>> = {
  alpha: [-2, -2],
  betaMinus: [1, -1],
  electronCapture: [-1, 1],
  betaPlus: [-1, 1],
  doubleBetaMinus: [2, -2],
  proton: [-1, 0],
  neutron: [0, -1],
};

export function daughterOf(
  nuclide: Nuclide,
  channel: DecayChannel,
  table: NuclideTable = NUCLIDE_TABLE,
): Nuclide | null {
  const [dz, dn] = CHANNEL_SHIFT[channel];
  return table.get(nuclide.z + dz, nuclide.n + dn);
}

/** Q value (keV) for the channel, or null when a mass is missing. */
export function qValue(nuclide: Nuclide, channel: DecayChannel, table: NuclideTable = NUCLIDE_TABLE): number | null {
  if (channel === "proton") {
    return nuclide.sp === null ? null : -nuclide.sp;
  }
  if (channel === "neutron") {
    return nuclide.sn === null ? null : -nuclide.sn;
  }
  const parent = nuclide.massExcess;
  const daughter = daughterOf(nuclide, channel, table)?.massExcess ?? null;
  if (parent === null || daughter === null) {
    return null;
  }
  switch (channel) {
    case "alpha": {
      const helium = table.get(2, 2)?.massExcess ?? null;
      return helium === null ? null : parent - daughter - helium;
    }
    case "betaPlus":
      return parent - daughter - 2 * ELECTRON_REST_ENERGY_KEV;
    default:
      return parent - daughter;
  }
}

/** How a channel's energetics compare with what is observed. */
export type ChannelVerdict =
  /** Q > 0 and the mode is observed. */
  | "allowedSeen"
  /** Q > 0 but not observed: too slow (tunnelling, forbidden β) or out-competed by a faster mode. */
  | "allowedUnseen"
  /** Q ≤ 0: energetically forbidden. */
  | "forbidden"
  /** A mass is missing, so Q is unknown. */
  | "unknown";

export type ChannelAnalysis = {
  readonly channel: DecayChannel;
  readonly q: number | null;
  readonly observed: boolean;
  readonly verdict: ChannelVerdict;
};

export function analyzeChannel(
  nuclide: Nuclide,
  channel: DecayChannel,
  table: NuclideTable = NUCLIDE_TABLE,
): ChannelAnalysis {
  const q = qValue(nuclide, channel, table);
  const observed = hasMode(nuclide, ...CHANNEL_MODES[channel]);
  let verdict: ChannelVerdict;
  if (q === null) {
    verdict = "unknown";
  } else if (q > 0) {
    verdict = observed ? "allowedSeen" : "allowedUnseen";
  } else {
    verdict = "forbidden";
  }
  return { channel, q, observed, verdict };
}

/** The Q-value predictor's analysis of every channel. */
export function analyzeAllChannels(nuclide: Nuclide, table: NuclideTable = NUCLIDE_TABLE): ChannelAnalysis[] {
  return DECAY_CHANNELS.map((channel) => analyzeChannel(nuclide, channel, table));
}
