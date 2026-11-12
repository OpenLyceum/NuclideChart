/**
 * NuclideChartConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Layout / chrome values are in screen pixels.
 *  - Nuclear physics constants live in src/common/model/NuclearConstants.ts, in the snapshot's units
 *    (keV, seconds).
 *  - Colour strings live in NuclideChartColors.ts, not here.
 */

import { PhetFont } from "scenerystack/scenery-phet";
import NuclideChartNamespace from "./NuclideChartNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Gap between neighbouring layout regions. */
export const REGION_GAP = 12;

/** Width of the right-hand control column. */
export const PANEL_COLUMN_WIDTH = 300;

/** Radius (view px) within which a click picks the nearest plotted point. */
export const PICK_DISTANCE = 9;

/** Fonts used across the sim. */
export const FONTS = {
  TITLE: new PhetFont({ size: 15, weight: "bold" }),
  LABEL: new PhetFont(13),
  READOUT: new PhetFont(13),
  AXIS_LABEL: new PhetFont(14),
  TICK_LABEL: new PhetFont(11),
  CHART_LABEL: new PhetFont(11),
  SMALL: new PhetFont(11),
  CELL_SYMBOL: new PhetFont({ size: 10, weight: "bold" }),
  BIG_LABEL: new PhetFont({ size: 22, weight: "bold" }),
} as const;

// ── Nuclide map (N–Z chart) ───────────────────────────────────────────────────

/** Smallest and largest zoom factors of the nuclide map (1 = whole chart). */
export const MAP_ZOOM_RANGE = { min: 1, max: 16 } as const;

/** Cell size (view px) above which each cell shows its element symbol and A. */
export const MAP_LABEL_CELL_SIZE = 26;

NuclideChartNamespace.register("NuclideChartConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  REGION_GAP,
  PANEL_COLUMN_WIDTH,
  PICK_DISTANCE,
  MAP_ZOOM_RANGE,
  MAP_LABEL_CELL_SIZE,
});
