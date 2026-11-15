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

import { Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import { SECONDS_PER_YEAR } from "./common/model/NuclearConstants.js";
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
const PICK_DISTANCE = 9;

/** Panel margins and content insets (px). */
export const PANEL = {
  X_MARGIN: 12,
  Y_MARGIN: 10,
  /** Inset from PANEL_COLUMN_WIDTH for labels and card content. */
  CONTENT_INSET: 24,
  /** Inset from PANEL_COLUMN_WIDTH for the data-credit line wrap. */
  CREDIT_INSET: 60,
} as const;

/** Usable width inside the right-hand panel column (px). */
export const PANEL_CONTENT_WIDTH = PANEL_COLUMN_WIDTH - PANEL.CONTENT_INSET;

/** Max width for the data-credit line beside Reset All (px). */
export const PANEL_CREDIT_WIDTH = PANEL_COLUMN_WIDTH - PANEL.CREDIT_INSET;

/** Shared screen-layout heights and spacings (px). */
export const LAYOUT = {
  FOOTER_HEIGHT: 46,
  /** Default height of the settings strip under the chart. */
  STRIP_HEIGHT: 64,
  /** Vertical gap between stacked control panels. */
  PANEL_STACK_SPACING: 8,
  /** Gap between the data-credit line and Reset All. */
  FOOTER_SPACING: 10,
} as const;

/** Shared control chrome (px). */
export const CONTROLS = {
  RADIO_RADIUS: 7,
  RADIO_RADIUS_SMALL: 6,
} as const;

/** Fonts used across the sim. */
export const FONTS = {
  TITLE: new PhetFont({ size: 15, weight: "bold" }),
  LABEL: new PhetFont(13),
  HEADER: new PhetFont({ size: 13, weight: "bold" }),
  READOUT: new PhetFont(13),
  AXIS_LABEL: new PhetFont(14),
  TICK_LABEL: new PhetFont(11),
  CHART_LABEL: new PhetFont(11),
  SMALL: new PhetFont(11),
  CELL_SYMBOL: new PhetFont({ size: 10, weight: "bold" }),
  BIG_LABEL: new PhetFont({ size: 22, weight: "bold" }),
  PREFERENCES_TITLE: new PhetFont({ size: 18, weight: "bold" }),
  PREFERENCES_LABEL: new PhetFont(14),
} as const;

/** Selection ring and click pick radius (view px). */
export const SELECTION = {
  RING_RADIUS: 6,
  RING_LINE_WIDTH: 2,
  /** Hit radius for click-to-select on scatter charts. */
  CLICK_PICK_DISTANCE: PICK_DISTANCE * 2,
} as const;

/** Shared stroke patterns for chart guides. */
export const STROKE = {
  MAGIC_DASH: [5, 4] as const,
} as const;

/** Shared scatter-chart frame size (view px) for Binding Energy, Shells, Half-Lives. */
export const SCATTER_CHART = {
  WIDTH: 590,
  HEIGHT: 500,
} as const;

// ── Nuclide map (N–Z chart) ───────────────────────────────────────────────────

/** Smallest and largest zoom factors of the nuclide map (1 = whole chart). */
export const MAP_ZOOM_RANGE = { min: 1, max: 16 } as const;

/** Cell size (view px) above which each cell shows its element symbol and A. */
export const MAP_LABEL_CELL_SIZE = 26;

/** Map viewport, minimap and interaction (view px unless noted). */
export const MAP = {
  /** Zoom factor per button / keyboard / wheel step (dimensionless). */
  ZOOM_STEP: 1.5,
  /** Pointer travel below which a press-and-release counts as a click (view px). */
  CLICK_TOLERANCE: 4,
  /** Selected cells closer than this fraction of the view to an edge pull the view along. */
  KEEP_IN_VIEW_MARGIN: 0.08,
  MINIMAP_WIDTH: 120,
  MINIMAP_MARGIN: 8,
  /** Extra left offset so the minimap sits in the empty upper-left corner (view px). */
  MINIMAP_OFFSET_X: 18,
  /** Extra cells of padding around the chart when fitting zoom 1. */
  CHART_PADDING_CELLS: 3,
  LEGEND_SWATCH: 11,
  LEGEND_BAR_HEIGHT: 12,
} as const;

/** Chart screen: map size and strip height (view px). */
export const CHART = {
  MAP_WIDTH: 630,
  MAP_HEIGHT: 452,
  STRIP_HEIGHT: 62,
  /** Half-life filter slider range as log₁₀ of seconds (1 s to 10²⁵ s). */
  HALF_LIFE_FILTER_RANGE: new Range(0, 25),
} as const;

/** Dialog content widths (view px). */
export const DIALOG = {
  QVALUE_WIDTH: 560,
  CENSUS_WIDTH: 420,
} as const;

// ── Binding Energy ────────────────────────────────────────────────────────────

/** Binding Energy plot axes and controls. Energies in MeV; A dimensionless. */
export const BINDING = {
  CURVE_AXES: { x: new Range(0, 270), y: new Range(0, 9.2) },
  PEAK_AXES: { x: new Range(46, 70), y: new Range(8.6, 8.81) },
  RESIDUAL_RANGE: new Range(-15, 15),
  /** Residual-against-N horizontal axis max (dimensionless). */
  RESIDUAL_N_MAX: 160,
  /** Residual-against-Z horizontal axis max (dimensionless). */
  RESIDUAL_Z_MAX: 110,
  COEFFICIENT_SLIDER_WIDTH: 80,
} as const;

// ── Shells ────────────────────────────────────────────────────────────────────

/** Shells screen axis extents (N/Z dimensionless; S in MeV). */
export const SHELLS = {
  N_MAX: 165,
  Z_MAX: 120,
  Y_MIN: -5,
  Y_MAX_ONE: 28,
  Y_MAX_TWO: 40,
} as const;

// ── Isobars ───────────────────────────────────────────────────────────────────

/** Isobars chart size and marker geometry (view px); Z half-width dimensionless. */
export const ISOBARS = {
  CHART_WIDTH: 600,
  CHART_HEIGHT: 440,
  STRIP_HEIGHT: 50,
  /** Charge numbers shown either side of the valley bottom. */
  Z_HALF_WIDTH: 6,
  MARKER_RADIUS: 6,
} as const;

// ── Half-Lives ────────────────────────────────────────────────────────────────

/** Half-Lives explorer / Geiger–Nuttall / Sargent axes. Times in seconds. */
export const HALF_LIVES = {
  /** Age of the Universe (s), for the explorer guide line. */
  AGE_OF_UNIVERSE_S: 13.8e9 * SECONDS_PER_YEAR,
  EXPLORER_A_MAX: 300,
  EXPLORER_VALLEY_X: new Range(-16, 12),
  EXPLORER_LOG_Y: new Range(1e-24, 1e34),
  EXPLORER_LINEAR_Y: new Range(0, 16),
  GEIGER_X: new Range(0.3, 0.56),
  GEIGER_Y: new Range(1e-8, 1e24),
  SARGENT_X: new Range(0.01, 30),
  SARGENT_Y: new Range(1e-4, 1e20),
} as const;

// ── Decay Chains ──────────────────────────────────────────────────────────────

/** Decay Chains layout (view px) and fission / activity ranges. */
export const DECAY_CHAINS = {
  LEFT_WIDTH: 600,
  DIAGRAM_HEIGHT: 262,
  ACTIVITY_HEIGHT: 214,
  YIELD_HEIGHT: 300,
  /** Largest cell size on the chain diagram (view px). */
  MAX_CELL: 34,
  ACTIVITY_SAMPLES: 260,
  ACTIVITY_RANGE: new Range(1e-6, 3),
  /** Mass numbers with fission-product yield data. */
  FISSION_A_RANGE: new Range(66, 172),
  YIELD_MAX: 8,
  /** Independent yield below which a chain member is omitted (fraction). */
  MIN_INDEPENDENT: 1e-6,
  FISSION_ROW_HEIGHT: 21,
} as const;

NuclideChartNamespace.register("NuclideChartConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  REGION_GAP,
  PANEL_COLUMN_WIDTH,
  PICK_DISTANCE,
  PANEL,
  PANEL_CONTENT_WIDTH,
  PANEL_CREDIT_WIDTH,
  LAYOUT,
  CONTROLS,
  FONTS,
  SELECTION,
  STROKE,
  SCATTER_CHART,
  MAP_ZOOM_RANGE,
  MAP_LABEL_CELL_SIZE,
  MAP,
  CHART,
  DIALOG,
  BINDING,
  SHELLS,
  ISOBARS,
  HALF_LIVES,
  DECAY_CHAINS,
});
