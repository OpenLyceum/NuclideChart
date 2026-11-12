/**
 * ScreenLayout.ts
 *
 * Splits a screen's layoutBounds into named regions that never overlap (pattern from
 * PlanetaryConfigurations). Every screen places its content with {@link placeInRegion}, which aligns a
 * node inside its region and caps its size to the region, so longer translations shrink instead of
 * spilling onto a neighbour. tests/browser/layout.spec.ts checks this in every locale.
 *
 *   ┌───────────────────────┐ ┌──────────┐
 *   │                       │ │  panels  │
 *   │     chart             │ │          │
 *   │                       │ ├──────────┤
 *   │                       │ │  footer  │
 *   └───────────────────────┘ └──────────┘
 */

import { Bounds2 } from "scenerystack/dot";
import { AlignBox, type Node } from "scenerystack/scenery";
import { PANEL_COLUMN_WIDTH, REGION_GAP, SCREEN_VIEW_MARGIN } from "../../NuclideChartConstants.js";

/** Height of the footer (Reset All, and anything placed beside it). */
const FOOTER_HEIGHT = 46;

export type ChartAndPanelsLayout = {
  readonly chart: Bounds2;
  readonly panels: Bounds2;
  readonly footer: Bounds2;
};

export const chartAndPanelsLayout = (layoutBounds: Bounds2, panelWidth = PANEL_COLUMN_WIDTH): ChartAndPanelsLayout => {
  const b = layoutBounds.eroded(SCREEN_VIEW_MARGIN);
  const left = b.maxX - panelWidth;
  const footerTop = b.maxY - FOOTER_HEIGHT;
  return {
    chart: new Bounds2(b.minX, b.minY, left - REGION_GAP, b.maxY),
    panels: new Bounds2(left, b.minY, b.maxX, footerTop - REGION_GAP),
    footer: new Bounds2(left, footerTop, b.maxX, b.maxY),
  };
};

export type ChartStripAndPanelsLayout = ChartAndPanelsLayout & {
  /** Under the chart: the chart's own settings. */
  readonly strip: Bounds2;
};

/** Default height of the settings strip under the chart. */
const STRIP_HEIGHT = 64;

/**
 * The chart-and-panels layout with a settings strip under the chart, for screens whose panel column is
 * full of other controls.
 *
 *   ┌───────────────────────┐ ┌──────────┐
 *   │      chart            │ │  panels  │
 *   ├───────────────────────┤ ├──────────┤
 *   │   chart settings      │ │  footer  │
 *   └───────────────────────┘ └──────────┘
 */
export const chartStripAndPanelsLayout = (
  layoutBounds: Bounds2,
  panelWidth = PANEL_COLUMN_WIDTH,
  stripHeight = STRIP_HEIGHT,
): ChartStripAndPanelsLayout => {
  const base = chartAndPanelsLayout(layoutBounds, panelWidth);
  const stripTop = base.chart.maxY - stripHeight;
  return {
    ...base,
    chart: new Bounds2(base.chart.minX, base.chart.minY, base.chart.maxX, stripTop - REGION_GAP),
    strip: new Bounds2(base.chart.minX, stripTop, base.chart.maxX, base.chart.maxY),
  };
};

export type RegionAlign = {
  readonly xAlign?: "left" | "center" | "right";
  readonly yAlign?: "top" | "center" | "bottom";
};

/** Wraps `content` in an AlignBox over `region`, capping the content to the region's size. */
export const placeInRegion = (content: Node, region: Bounds2, align: RegionAlign = {}): AlignBox => {
  content.maxWidth = region.width;
  content.maxHeight = region.height;
  return new AlignBox(content, {
    alignBounds: region,
    xAlign: align.xAlign ?? "center",
    yAlign: align.yAlign ?? "center",
  });
};
