/**
 * NuclideChartColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import NuclideChartColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import NuclideChartColors from "../../NuclideChartColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: NuclideChartColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the NuclideChartColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import NuclideChartNamespace from "./NuclideChartNamespace.js";

const NuclideChartColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(NuclideChartNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(NuclideChartNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(NuclideChartNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(NuclideChartNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(NuclideChartNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Charts ───────────────────────────────────────────────────────────────────

  /** Plotting-area background of every chart and of the nuclide map. */
  chartBackgroundColorProperty: new ProfileColorProperty(NuclideChartNamespace, "chartBackground", {
    default: "#0d1424",
    projector: "#ffffff",
  }),

  /** Chart frame, tick marks and tick labels. */
  axisColorProperty: new ProfileColorProperty(NuclideChartNamespace, "axis", {
    default: "#9aa7bd",
    projector: "#333333",
  }),

  /** Gridlines. */
  gridLineColorProperty: new ProfileColorProperty(NuclideChartNamespace, "gridLine", {
    default: "#24314d",
    projector: "#dddddd",
  }),

  /** Magic-number guide lines (N or Z = 2, 8, 20, 28, 50, 82, 126). */
  magicLineColorProperty: new ProfileColorProperty(NuclideChartNamespace, "magicLine", {
    default: "#ff6b9a",
    projector: "#c2185b",
  }),

  /** N = Z line, the mass-formula curve and other reference curves. */
  referenceLineColorProperty: new ProfileColorProperty(NuclideChartNamespace, "referenceLine", {
    default: "#ffffff",
    projector: "#000000",
  }),

  /** The valley-of-stability curve on the map. */
  valleyLineColorProperty: new ProfileColorProperty(NuclideChartNamespace, "valleyLine", {
    default: "#7cf29c",
    projector: "#1b7f3a",
  }),

  /** Drip lines (the edge of particle-bound nuclei). */
  dripLineColorProperty: new ProfileColorProperty(NuclideChartNamespace, "dripLine", {
    default: "#ffb74d",
    projector: "#e65100",
  }),

  /** Outline of the selected nuclide, and the cursor. */
  selectionColorProperty: new ProfileColorProperty(NuclideChartNamespace, "selection", {
    default: "#ffffff",
    projector: "#000000",
  }),

  /** Nuclides with no value for the current colouring (unknown half-life, no measured moment, …). */
  noDataColorProperty: new ProfileColorProperty(NuclideChartNamespace, "noData", {
    default: "#3a4458",
    projector: "#d9d9d9",
  }),

  /** Nuclides dimmed by a filter. */
  dimmedColorProperty: new ProfileColorProperty(NuclideChartNamespace, "dimmed", {
    default: "#1d2536",
    projector: "#f0f0f0",
  }),

  /** Plotted points: measured masses. */
  pointColorProperty: new ProfileColorProperty(NuclideChartNamespace, "point", {
    default: "#8fa3c7",
    projector: "#6b7a99",
  }),

  /** Plotted points: stable nuclides. */
  stablePointColorProperty: new ProfileColorProperty(NuclideChartNamespace, "stablePoint", {
    default: "#ffe082",
    projector: "#000000",
  }),

  /** Plotted points: masses estimated from systematics. */
  systematicPointColorProperty: new ProfileColorProperty(NuclideChartNamespace, "systematicPoint", {
    default: "#4b5a78",
    projector: "#bbbbbb",
  }),

  /** Highlighted points and labels (named light nuclei, fission fragments). */
  highlightColorProperty: new ProfileColorProperty(NuclideChartNamespace, "highlight", {
    default: "#4fc3f7",
    projector: "#0d47a1",
  }),

  // ── Decay modes (chart-of-nuclides conventions) ──────────────────────────────

  stableColorProperty: new ProfileColorProperty(NuclideChartNamespace, "stable", {
    default: "#f5f5f5",
    projector: "#111111",
  }),
  betaMinusColorProperty: new ProfileColorProperty(NuclideChartNamespace, "betaMinus", {
    default: "#4a90e2",
    projector: "#4a90e2",
  }),
  betaPlusColorProperty: new ProfileColorProperty(NuclideChartNamespace, "betaPlus", {
    default: "#e5534b",
    projector: "#e5534b",
  }),
  alphaColorProperty: new ProfileColorProperty(NuclideChartNamespace, "alpha", {
    default: "#f2c94c",
    projector: "#e0b423",
  }),
  fissionColorProperty: new ProfileColorProperty(NuclideChartNamespace, "fission", {
    default: "#4caf50",
    projector: "#3c9a40",
  }),
  protonColorProperty: new ProfileColorProperty(NuclideChartNamespace, "proton", {
    default: "#ff9f43",
    projector: "#f08a24",
  }),
  neutronColorProperty: new ProfileColorProperty(NuclideChartNamespace, "neutron", {
    default: "#b07cd8",
    projector: "#9b5fc9",
  }),
  isomericColorProperty: new ProfileColorProperty(NuclideChartNamespace, "isomeric", {
    default: "#9e9e9e",
    projector: "#9e9e9e",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(NuclideChartNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(NuclideChartNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(NuclideChartNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
};

export default NuclideChartColors;
