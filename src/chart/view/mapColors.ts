/**
 * mapColors.ts
 *
 * Colour scales for the nuclide map. Decay modes use the chart-of-nuclides convention (black or white for
 * stable, blue β⁻, red β⁺/EC, yellow α, green fission, …) from NuclideChartColors. Continuous quantities use
 * perceptually uniform maps: viridis for sequential values and a blue–white–red map for signed values.
 *
 * The scale stops are data-visualization palettes, not theme colours, so they are the same in both colour
 * profiles and live here rather than in NuclideChartColors.
 */

import type { ProfileColorProperty } from "scenerystack/scenery";
import { DecayCategory } from "../../common/model/DecayCategory.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import type { MapColoring } from "../model/MapColoring.js";

/** Viridis, sampled at nine evenly spaced stops. */
const VIRIDIS: readonly (readonly [number, number, number])[] = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [110, 206, 88],
  [253, 231, 37],
];

/** Blue–white–red diverging map (ColorBrewer RdBu, reversed so positive is red). */
const DIVERGING: readonly (readonly [number, number, number])[] = [
  [33, 102, 172],
  [103, 169, 207],
  [209, 229, 240],
  [247, 247, 247],
  [253, 219, 199],
  [239, 138, 98],
  [178, 24, 43],
];

const interpolate = (stops: readonly (readonly [number, number, number])[], t: number): string => {
  const clamped = Math.min(1, Math.max(0, t));
  const position = clamped * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(position));
  const f = position - i;
  const a = stops[i] as readonly [number, number, number];
  const b = stops[i + 1] as readonly [number, number, number];
  const channel = (k: 0 | 1 | 2): number => Math.round(a[k] + (b[k] - a[k]) * f);
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`;
};

/** Colour of a continuous value on the colouring's scale. */
export function scaleColor(coloring: MapColoring, value: number): string {
  const t = (value - coloring.min) / (coloring.max - coloring.min);
  return interpolate(coloring.scale === "diverging" ? DIVERGING : VIRIDIS, t);
}

/** CSS gradient stops (offset 0–1, colour) for a colouring's legend bar. */
export function scaleStops(coloring: MapColoring): { offset: number; color: string }[] {
  const stops = coloring.scale === "diverging" ? DIVERGING : VIRIDIS;
  return stops.map((rgb, i) => ({ offset: i / (stops.length - 1), color: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }));
}

/** The theme colour of each decay category. */
export const DECAY_CATEGORY_COLORS: ReadonlyMap<DecayCategory, ProfileColorProperty> = new Map([
  [DecayCategory.STABLE, NuclideChartColors.stableColorProperty],
  [DecayCategory.BETA_MINUS, NuclideChartColors.betaMinusColorProperty],
  [DecayCategory.BETA_PLUS, NuclideChartColors.betaPlusColorProperty],
  [DecayCategory.ALPHA, NuclideChartColors.alphaColorProperty],
  [DecayCategory.FISSION, NuclideChartColors.fissionColorProperty],
  [DecayCategory.PROTON, NuclideChartColors.protonColorProperty],
  [DecayCategory.NEUTRON, NuclideChartColors.neutronColorProperty],
  [DecayCategory.ISOMERIC, NuclideChartColors.isomericColorProperty],
  [DecayCategory.UNKNOWN, NuclideChartColors.noDataColorProperty],
]);

/** Measured masses and masses from systematics, for the "measured or estimated" colouring. */
export const MEASUREMENT_COLORS: readonly ProfileColorProperty[] = [
  NuclideChartColors.highlightColorProperty,
  NuclideChartColors.alphaColorProperty,
];
