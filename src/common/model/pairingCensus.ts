/**
 * pairingCensus.ts
 *
 * Counts stable nuclides by the parity of Z and N. Pairing makes even–even nuclei the most bound, so they
 * dominate; odd–odd nuclei are the least bound, and only a handful of light ones are stable. The counts depend
 * on what "stable" means, so both definitions are offered.
 */

import {
  isStableUnder,
  NUCLIDE_TABLE,
  type Nuclide,
  type NuclideTable,
  type StabilityDefinition,
} from "./NuclideTable.js";

export type ParityClass = "evenEven" | "evenOdd" | "oddEven" | "oddOdd";

/** Classified as (Z parity)(N parity). */
export function parityClass(nuclide: Nuclide): ParityClass {
  const zEven = nuclide.z % 2 === 0;
  const nEven = nuclide.n % 2 === 0;
  if (zEven) {
    return nEven ? "evenEven" : "evenOdd";
  }
  return nEven ? "oddEven" : "oddOdd";
}

export type PairingCensus = Readonly<Record<ParityClass, readonly Nuclide[]>> & { readonly total: number };

export function pairingCensus(definition: StabilityDefinition, table: NuclideTable = NUCLIDE_TABLE): PairingCensus {
  const census: Record<ParityClass, Nuclide[]> = { evenEven: [], evenOdd: [], oddEven: [], oddOdd: [] };
  for (const nuclide of table.nuclides) {
    if (isStableUnder(nuclide, definition)) {
      census[parityClass(nuclide)].push(nuclide);
    }
  }
  return {
    ...census,
    total: census.evenEven.length + census.evenOdd.length + census.oddEven.length + census.oddOdd.length,
  };
}
