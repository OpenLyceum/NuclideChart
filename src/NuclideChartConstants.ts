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

/** Settings for binding-energy/model/BindingEnergyModel.ts. */
export const BINDING_ENERGY_MODEL_SETTINGS = {
  /** Coefficient ranges range min (MeV). */
  COEFFICIENT_RANGES_RANGE_MIN: 10,
  /** Coefficient ranges range max (MeV). */
  COEFFICIENT_RANGES_RANGE_MAX: 20,
  /** Light fragment a default (nucleons). */
  LIGHT_FRAGMENT_A_DEFAULT: 95,
} as const;

/** Settings for binding-energy/view/BindingChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BINDING_CHART_NODE_SETTINGS = {
  STYLES_ITEM_1_ALPHA: 0.6, // dimensionless
  STYLES_ITEM_2_RADIUS: 1.8, // px
  STYLES_ITEM_2_ALPHA: 0.85, // dimensionless
  STYLES_ITEM_3_RADIUS: 2.4, // px

  GAP_PATH_LINE_DASH_DASH: 3, // px
  GAP_LABEL_MAX_WIDTH_FACTOR: 0.4, // dimensionless
  UPDATE_MASS_GAP_LEFT: 10, // px
  UPDATE_MASS_GAP_CENTER_Y: 4.6, // px
  PLOT_VALUE_Y_FACTOR: 1000, // dimensionless
  LEADER_LABEL_LEFT_OFFSET: 4, // px
  UPDATE_SELECTION_RIGHT_OFFSET: 8, // px

  STYLES_RADIUS: 1.6,
  FORMULA_PATH_LINE_WIDTH: 1.5,
  /** Selection background opacity (dimensionless). */
  SELECTION_BACKGROUND_OPACITY: 0.8,
  SELECTION_BACKGROUND_CORNER_RADIUS: 3,
  LINE_LINE_WIDTH: 0.6,
  UPDATE_REACTION_MARKERS_WIDTH: 8,
  UPDATE_REACTION_MARKERS_HEIGHT: 8,
  UPDATE_REACTION_MARKERS_LINE_WIDTH: 2,
  TOP_TOP: 8,
} as const;

/** Settings for binding-energy/view/BindingEnergyScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BINDING_ENERGY_SCREEN_VIEW_SETTINGS = {
  CURVE_LABEL_MAX_WIDTH: 220, // px
  RESIDUAL_N_LABEL_MAX_WIDTH: 220, // px
  RESIDUAL_Z_LABEL_MAX_WIDTH: 220, // px
  BOX_MAX_WIDTH: 110, // px
  RMS_TEXT_DECIMALS: 2, // digits
  FISSION_LABEL_MAX_WIDTH: 100, // px
  FUSION_LABEL_MAX_WIDTH: 100, // px
  FRAGMENT_SLIDER_WIDTH: 130, // px
  FISSION_ESTIMATE_DECIMALS: 3, // digits
  FRAGMENT_A_LABEL_MAX_WIDTH: 90, // px
  FUSION_GAIN_DECIMALS: 2, // digits
  FUSION_Q_DECIMALS: 2, // digits

  CONSTRUCTOR_FORMULA_PANEL_SPACING: 8, // px
  CONSTRUCTOR_FISSION_CONTENT_SPACING: 8, // px

  DEFAULT_MAX_WIDTH: 220,
  BUTTON_MAX_WIDTH: 130,
  VIEW_GROUP_SPACING: 5,
  VIEW_PANEL_SPACING: 6,
  READOUT_MAX_WIDTH: 50,
  FORMULA_GRID_X_SPACING: 8,
  FORMULA_GRID_Y_SPACING: 4,
  FORMULA_PANEL_SPACING: 6,
  MODE_GROUP_SPACING: 16,
  /** Fragment slider page keyboard step (dimensionless). */
  FRAGMENT_SLIDER_PAGE_KEYBOARD_STEP: 5,
  FISSION_CONTENT_SPACING: 5,
  REACTION_BOX_MAX_WIDTH: 230,
  FUSION_CONTENT_SPACING: 5,
  ENERGY_PANEL_SPACING: 6,
} as const;

/** Settings for chart/view/CensusDialog.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CENSUS_DIALOG_SETTINGS = {
  EVEN_N_TEXT_MAX_WIDTH: 110, // px
  ODD_N_TEXT_MAX_WIDTH: 110, // px
  EVEN_Z_TEXT_MAX_WIDTH: 110, // px
  ODD_Z_TEXT_MAX_WIDTH: 110, // px
  ENSDF_TEXT_MAX_WIDTH: 300, // px
  EFFECTIVE_TEXT_MAX_WIDTH: 300, // px
  ITEM_1_SPACING: 4, // px

  TABLE_X_SPACING: 30,
  TABLE_Y_SPACING: 8,
  DEFINITION_GROUP_SPACING: 4,
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Settings for chart/view/ChartScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CHART_SCREEN_VIEW_SETTINGS = {
  ZOOM_SLIDER_WIDTH: 110, // px
  MAGIC_NUMBERS_VISIBLE_CHECKBOX_MAX_WIDTH: 140, // px
  N_EQUALS_Z_VISIBLE_CHECKBOX_MAX_WIDTH: 140, // px
  VALLEY_VISIBLE_CHECKBOX_MAX_WIDTH: 160, // px
  DRIP_LINES_VISIBLE_CHECKBOX_MAX_WIDTH: 140, // px
  ESTIMATED_MASSES_MARKED_CHECKBOX_MAX_WIDTH: 160, // px
  COLOR_BY_LABEL_MAX_WIDTH: 70, // px
  HALF_LIFE_FILTER_ENABLED_CHECKBOX_MAX_WIDTH: 230, // px
  THRESHOLD_SLIDER_WIDTH: 170, // px

  X_TITLE_TOP_OFFSET: 4, // px
  CONSTRUCTOR_FILTER_PANEL_SPACING: 10, // px

  DEFAULT_MAX_WIDTH: 170,
  BUTTON_MAX_WIDTH: 120,
  Y_TITLE_RIGHT: -6,
  ZOOM_OUT_WIDTH: 10,
  ZOOM_OUT_HEIGHT: 2,
  ZOOM_IN_WIDTH: 10,
  ZOOM_IN_HEIGHT: 2,
  /** Zoom slider keyboard step (dimensionless). */
  ZOOM_SLIDER_KEYBOARD_STEP: 0.5,
  /** Zoom slider page keyboard step (dimensionless). */
  ZOOM_SLIDER_PAGE_KEYBOARD_STEP: 2,
  ZOOM_CONTROLS_SPACING: 6,
  OVERLAYS_X_SPACING: 12,
  OVERLAYS_Y_SPACING: 6,
  STRIP_SPACING: 20,
  COLORING_BOX_MAX_WIDTH: 190,
  COLORING_PANEL_SPACING: 8,
  CARD_PANEL_SPACING: 8,
  /** Threshold slider keyboard step (dimensionless). */
  THRESHOLD_SLIDER_KEYBOARD_STEP: 0.5,
  /** Threshold slider shift keyboard step (dimensionless). */
  THRESHOLD_SLIDER_SHIFT_KEYBOARD_STEP: 0.1,
  /** Threshold slider page keyboard step (dimensionless). */
  THRESHOLD_SLIDER_PAGE_KEYBOARD_STEP: 2,
  CONSTRUCTOR_MAX_WIDTH: 110,
  FILTER_PANEL_SPACING: 4,
  FILTER_PANEL_MAX_WIDTH: 80,
} as const;

/** Settings for chart/view/MapLegendNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const MAP_LEGEND_NODE_SETTINGS = {
  LAYOUT_SCALE_TOP_OFFSET: 4, // px

  SWATCH_LINE_WIDTH: 0.5,
  ENTRY_SPACING: 5,
  DECAY_LEGEND_X_SPACING: 10,
  DECAY_LEGEND_Y_SPACING: 3,
  MEASUREMENT_LEGEND_SPACING: 3,
  BAR_LINE_WIDTH: 0.5,
  EXTRA_SPACING: 12,
} as const;

/** Settings for chart/view/NuclideMapNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const NUCLIDE_MAP_NODE_SETTINGS = {
  POLYLINE_WIDTH: 1.2, // px
  POLYLINE_WIDTH_SEGMENT_2: 2, // px
  POLYLINE_WIDTH_SEGMENT_3: 1.5, // px

  PAINT_CELLS_LINE_WIDTH: 0.6, // px
  PAINT_CELLS_LINE_WIDTH_FACTOR: 0.06, // dimensionless
  PAINT_MINIMAP_LINE_WIDTH: 1.5, // px

  PAINT_OVERLAYS_X: -0.5,
  PAINT_OVERLAYS_Y: -0.5,
  LINE_WIDTH_LINE_WIDTH: 2,
} as const;

/** Settings for chart/view/QValueDialog.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const Q_VALUE_DIALOG_SETTINGS = {
  MEV_DECIMALS: 3, // digits

  TABLE_X_SPACING: 18,
  TABLE_Y_SPACING: 5,
  REVEAL_BUTTON_MAX_WIDTH: 200,
  CONSTRUCTOR_SPACING: 12,
  TEXT_MAX_WIDTH: 170,
} as const;

/** Settings for common/NuclideChartControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const NUCLIDE_CHART_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** Nuclide chart number control options scale (dimensionless). */
  NUCLIDE_CHART_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  NUCLIDE_CHART_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  NUCLIDE_CHART_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  NUCLIDE_CHART_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  NUCLIDE_CHART_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/NuclideChartScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const NUCLIDE_CHART_SCREEN_ICONS_SETTINGS = {
  CREATE_BINDING_ENERGY_ICON_RADIUS: 7, // px
  CREATE_SHELLS_ICON_LINE_WIDTH_VARIANT_2: 7, // px
  X_CIRCLE_RADIUS: 17, // px
  CREATE_HALF_LIVES_ICON_RADIUS: 9, // px

  CREATE_SHELLS_ICON_LINE_DASH_DASH: 14, // px
  AT_X_OFFSET: 50, // px
  CREATE_ISOBARS_ICON_AT_X_OFFSET: 100, // px
  AT_Y_OFFSET: 50, // px
  AT_Y_FACTOR: 1150, // dimensionless

  CREATE_SHELLS_ICON_Y: 20,
  CREATE_SHELLS_ICON_LINE_WIDTH: 5,
  ARROW_TAIL_WIDTH: 8,
  ARROW_HEAD_WIDTH: 26,
  ARROW_HEAD_HEIGHT: 20,
  CREATE_ISOBARS_ICON_LINE_WIDTH: 4,
  /** Create isobars icon opacity (dimensionless). */
  CREATE_ISOBARS_ICON_OPACITY: 0.7,
  CREATE_HALF_LIVES_ICON_Y: 40,
  CREATE_HALF_LIVES_ICON_LINE_WIDTH: 4,
  /** Create half lives icon opacity (dimensionless). */
  CREATE_HALF_LIVES_ICON_OPACITY: 0.7,
  CREATE_DECAY_CHAINS_ICON_TAIL_WIDTH: 6,
  CREATE_DECAY_CHAINS_ICON_HEAD_WIDTH: 18,
  CREATE_DECAY_CHAINS_ICON_HEAD_HEIGHT: 14,
  CREATE_DECAY_CHAINS_ICON_CORNER_X: 5,
  CREATE_DECAY_CHAINS_ICON_CORNER_Y: 5,
} as const;

/** Settings for common/model/bateman.ts. */
export const BATEMAN_SETTINGS = {
  /** Relative threshold for nearly equal decay rates (dimensionless). */
  RATE_RELATIVE_TOLERANCE: 1e-12,
  /** Relative nudge applied to a λ that coincides with an ancestor's. */
  DEGENERACY_NUDGE: 1e-6,
} as const;

/** Settings for common/model/energyRelease.ts. */
export const ENERGY_RELEASE_SETTINGS = {
  /** Prompt neutrons per fission in the simplified reaction. */
  FISSION_NEUTRONS: 2,
} as const;

/** Settings for common/model/isobars.ts. */
export const ISOBARS_SETTINGS = {
  /** Isobars within this many charge units of the valley bottom enter the parabola fit. */
  PARABOLA_FIT_HALF_WIDTH: 4,
  /** A missing neighbour counts as "no decay that way" only this close (in Z) to the valley bottom. */
  EDGE_TRUST_HALF_WIDTH: 3,
} as const;

/** Settings for common/view/NuclideCardNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const NUCLIDE_CARD_NODE_SETTINGS = {
  FORMAT_PERCENT_SIGNIFICANT_FIGURES_SEGMENT_2: 2, // digits
  MEV_PATTERN_PATTERN_DECIMALS: 4, // digits
  MEV_PATTERN_PATTERN_DECIMALS_SEGMENT_2: 3, // digits
  PERCENT_PATTERN_PATTERN_DECIMALS: 3, // digits
  ITEM_1_SPACING: 2, // px

  FORMAT_PERCENT_SIGNIFICANT_FIGURES: 4, // digits
  LABEL_MAX_WIDTH_FACTOR: 0.38, // dimensionless
  VALUE_MAX_WIDTH_FACTOR: 0.6, // dimensionless
  TITLE_MAX_WIDTH_FACTOR: 0.3, // dimensionless
  ZNA_MAX_WIDTH_FACTOR: 0.68, // dimensionless

  ROWS_X_SPACING: 10,
  ROWS_Y_SPACING: 3,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for common/view/PlotFrameNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PLOT_FRAME_NODE_SETTINGS = {
  PLACE_AXIS_LABELS_TOP_OFFSET: 20, // px
  PLACE_AXIS_LABELS_RIGHT_OFFSET: 6, // px

  MINOR_GRID_LINE_WIDTH: 0.5,
  /** Minor grid opacity (dimensionless). */
  MINOR_GRID_OPACITY: 0.5,
} as const;

/** Settings for common/view/PointCloudNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const POINT_CLOUD_NODE_SETTINGS = {
  /** Group index that is never drawn. */
  HIDDEN_GROUP: 255,
  LINE_WIDTH_LINE_WIDTH: 0.6,
} as const;

/** Settings for common/view/format.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FORMAT_SETTINGS = {
  DEFAULT_DIGITS: 3,
} as const;

/** Settings for decay-chains/model/DecayChainsModel.ts. */
export const DECAY_CHAINS_MODEL_SETTINGS = {
  /** Series index default (dimensionless). */
  SERIES_INDEX_DEFAULT: 2,
  /** Fission mass number default (dimensionless). */
  FISSION_MASS_NUMBER_DEFAULT: 137,
} as const;

/** Settings for decay-chains/view/ActivityChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ACTIVITY_CHART_NODE_SETTINGS = {
  TIME_LINE_LINE_DASH_DASH: 5, // px
  CONSTRUCTOR_TIME_LINE_LINE_DASH_DASH: 3, // px
  LABEL_FOR_LEFT_OFFSET: 3, // px

  /** Alpha path opacity (dimensionless). */
  ALPHA_PATH_OPACITY: 0.75,
  /** Beta path opacity (dimensionless). */
  BETA_PATH_OPACITY: 0.75,
  /** Other path opacity (dimensionless). */
  OTHER_PATH_OPACITY: 0.75,
  HIGHLIGHT_PATH_LINE_WIDTH: 2.6,
  TIME_LINE_LINE_WIDTH: 1.2,
} as const;

/** Settings for decay-chains/view/ChainDiagramNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CHAIN_DIAGRAM_NODE_SETTINGS = {
  TEXT_SIGNIFICANT_FIGURES: 2, // digits

  HIGHLIGHT_LINE_WIDTH: 2.5,
  NODES_HEAD_HEIGHT: 6,
  NODES_HEAD_WIDTH: 7,
  NODES_TAIL_WIDTH: 2,
} as const;

/** Settings for decay-chains/view/DecayChainsScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const DECAY_CHAINS_SCREEN_VIEW_SETTINGS = {
  SERIES_LABEL_MAX_WIDTH: 240, // px
  FISSION_LABEL_MAX_WIDTH: 240, // px
  SERIES_GROUP_MAX_WIDTH: 80, // px
  RATIO_FORMAT_VALUE_DIGITS: 3, // digits
  SERIES_TITLE_LABEL_MAX_WIDTH: 200, // px
  SYSTEM_GROUP_MAX_WIDTH: 220, // px
  A_SLIDER_WIDTH: 180, // px
  FISSION_SYSTEM_TITLE_LABEL_MAX_WIDTH: 220, // px
  MASS_NUMBER_LABEL_MAX_WIDTH: 220, // px
  FISSION_CONTROLS_ITEM_5_SPACING: 4, // px
  QUICK_PICKS_LABEL_MAX_WIDTH: 40, // px

  CONSTRUCTOR_SERIES_CONTENT_SPACING: 3, // px
  CONSTRUCTOR_FISSION_CONTROLS_SPACING: 8, // px

  SERIES_CONTENT_SPACING: 6,
  MODE_GROUP_SPACING: 5,
  SERIES_GROUP_SPACING: 12,
  /** Time slider keyboard step (dimensionless). */
  TIME_SLIDER_KEYBOARD_STEP: 0.25,
  /** Time slider shift keyboard step (dimensionless). */
  TIME_SLIDER_SHIFT_KEYBOARD_STEP: 0.05,
  SERIES_CONTROLS_SPACING: 6,
  SYSTEM_GROUP_SPACING: 4,
  /** A slider page keyboard step (dimensionless). */
  A_SLIDER_PAGE_KEYBOARD_STEP: 5,
  FISSION_CONTROLS_SPACING: 6,
  CONTROLS_PANEL_SPACING: 10,
} as const;

/** Settings for decay-chains/view/FissionProductsNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FISSION_PRODUCTS_NODE_SETTINGS = {
  CHAIN_ROW_DIGITS: 2, // digits
  CHAIN_TITLE_DIGITS: 3, // digits

  CONSTRUCTOR_TOP_OFFSET: 40, // px
  TEXTS_MAX_WIDTH_OFFSET: 8, // px
  TEXTS_LEFT_OFFSET: 6, // px

  CHAIN_BOX_SPACING: 8,
  BACKGROUND_CORNER_X: 3,
  BACKGROUND_CORNER_Y: 3,
} as const;

/** Settings for half-lives/view/HalfLivesScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const HALF_LIVES_SCREEN_VIEW_SETTINGS = {
  CATEGORY_STYLES_ALPHA: 0.85, // dimensionless
  TWO_STYLES_ITEM_1_ALPHA: 0.8, // dimensionless
  TWO_STYLES_ITEM_2_RADIUS: 3.2, // px
  CHECKBOX_MAX_WIDTH: 230, // px
  VIEW_GROUP_MAX_WIDTH: 240, // px
  MASS_NUMBER_LABEL_MAX_WIDTH: 200, // px
  VALLEY_DISTANCE_LABEL_MAX_WIDTH: 200, // px
  X_AXIS_TITLE_LABEL_MAX_WIDTH: 200, // px
  R_SQUARED_FORMAT_FIXED_DECIMALS: 3, // digits
  COMPARISON_TEXT_DECIMALS: 2, // digits
  SARGENT_TEXT_DECIMALS: 2, // digits

  GUIDE_PATH_LINE_DASH_DASH: 4, // px
  HORIZONTAL_GUIDE_RIGHT_OFFSET: 4, // px
  ISOMER_CALLOUT_LEFT_OFFSET: 5, // px
  POINTS_Y_FACTOR: 1e9, // dimensionless
  UPDATE_EXPLORER_LINE_WRAP_OFFSET: 40, // px
  UPDATE_GEIGER_NUTTALL_POINTS_Y_FACTOR: 10, // dimensionless
  UPDATE_GEIGER_NUTTALL_LEFT_OFFSET: 7, // px
  UPDATE_SARGENT_Y_FACTOR: 10, // dimensionless

  CATEGORY_STYLES_RADIUS: 1.8,
  TWO_STYLES_RADIUS: 2.2,
  EARTH_PATH_LINE_WIDTH: 2,
  FITS_PATH_LINE_WIDTH: 0.8,
  /** Fits path opacity (dimensionless). */
  FITS_PATH_OPACITY: 0.6,
  HIGHLIGHT_FIT_PATH_LINE_WIDTH: 2.2,
  LEFT_LEFT: 4,
  ISOMER_CALLOUT_WIDTH: 6,
  ISOMER_CALLOUT_HEIGHT: 6,
  NOTABLE_CALLOUTS_LINE_WIDTH: 0.5,
  UPDATE_EXPLORER_LEFT: 20,
  UPDATE_EXPLORER_TOP: 30,
  STEPS: 40,
  CHILDREN_WIDTH: 10,
  CHILDREN_HEIGHT: 10,
  CHILDREN_LINE_WIDTH: 2,
  VIEW_GROUP_SPACING: 5,
  AXIS_GROUP_SPACING: 4,
  EXPLORER_CONTROLS_SPACING: 5,
  GEIGER_CONTROLS_SPACING: 5,
  CONTROLS_PANEL_SPACING: 8,
} as const;

/** Settings for isobars/view/IsobarsScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ISOBARS_SCREEN_VIEW_SETTINGS = {
  CHECKBOX_MAX_WIDTH: 220, // px
  A_SLIDER_WIDTH: 230, // px
  MASS_NUMBER_LABEL_MAX_WIDTH: 120, // px
  QUICK_PICKS_LABEL_MAX_WIDTH: 50, // px
  LEGEND_ENTRY_MAX_WIDTH: 110, // px
  ARROW_ENTRY_MAX_WIDTH: 110, // px
  TEXT_DECIMALS: 3, // digits

  UPDATE_BOTTOM_OFFSET: 3, // px
  CONSTRUCTOR_STRIP_SPACING: 6, // px
  CONSTRUCTOR_LEGEND_SPACING: 14, // px
  ARROW_FOR_TAIL_WIDTH: 1.5, // px

  PARABOLA_PATH_LINE_WIDTH: 1.2,
  /** Parabola path opacity (dimensionless). */
  PARABOLA_PATH_OPACITY: 0.7,
  /** Update range min (in the source module’s documented units). */
  UPDATE_RANGE_MIN: -0.4,
  /** A slider page keyboard step (dimensionless). */
  A_SLIDER_PAGE_KEYBOARD_STEP: 10,
  STRIP_SPACING: 14,
  LEGEND_ENTRY_SPACING: 6,
  LEGEND_ENTRY_LINE_WIDTH: 0.5,
  ARROW_ENTRY_SPACING: 6,
  ARROW_ENTRY_END_X: 22,
  ARROW_ENTRY_HEAD_HEIGHT: 7,
  ARROW_ENTRY_HEAD_WIDTH: 8,
  ARROW_ENTRY_TAIL_WIDTH: 2,
  LEGEND_SPACING: 3,
  CONTROLS_PANEL_SPACING: 6,
  READOUT_PANEL_SPACING: 5,
  ARROW_FOR_HEAD_HEIGHT: 8,
  ARROW_FOR_HEAD_WIDTH: 8,
  /** Arrow for opacity (dimensionless). */
  ARROW_FOR_OPACITY: 0.9,
} as const;

/** Settings for preferences/NuclideChartPreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const NUCLIDE_CHART_PREFERENCES_NODE_SETTINGS = {
  SHOW_EQUATIONS_CHECKBOX_SPACING: 8,
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Settings for shells/view/ShellsScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SHELLS_SCREEN_VIEW_SETTINGS = {
  STYLES_ITEM_1_ALPHA: 0.7, // dimensionless
  STYLES_ITEM_2_RADIUS: 1.4, // px
  STYLES_ITEM_2_ALPHA: 0.6, // dimensionless
  STYLES_ITEM_3_RADIUS: 3, // px
  CHECKBOX_MAX_WIDTH: 230, // px
  KIND_GROUP_MAX_WIDTH: 240, // px
  VALUE_TEXT_DECIMALS: 2, // digits
  DROP_TEXT_DECIMALS: 2, // digits

  UNBOUND_LABEL_MAX_WIDTH_OFFSET: 20, // px
  BUILD_LINES_Y_FACTOR: 1000, // dimensionless
  UPDATE_BOTTOM_OFFSET: 4, // px

  STYLES_RADIUS: 1.6,
  /** Unbound band opacity (dimensionless). */
  UNBOUND_BAND_OPACITY: 0.12,
  LINES_PATH_LINE_WIDTH: 0.6,
  /** Lines path opacity (dimensionless). */
  LINES_PATH_OPACITY: 0.5,
  HIGHLIGHT_PATH_LINE_WIDTH: 2.5,
  UPDATE_MAGIC_TOP: 3,
  LEFT_LEFT: 6,
  KIND_GROUP_SPACING: 5,
  CONTROLS_PANEL_SPACING: 6,
  READOUT_PANEL_SPACING: 5,
} as const;

/** Numerical settings; units are specified per value. */
export const MASS_FORMULA_NUMERICS = {
  /** Smallest usable least-squares pivot (dimensionless). */
  MIN_PIVOT: 1e-300,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const SHELLS_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  DETAILS_DECIMALS: 2, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const BINDING_ENERGY_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  DETAILS_DECIMALS: 4, // digits
  DETAILS_DECIMALS_SEGMENT_2: 2, // digits
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
