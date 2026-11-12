/**
 * PlotFrameNode.ts
 *
 * A bamboo chart frame (background, gridlines, ticks, tick labels, axis titles, a clipped plot
 * layer and an unclipped overlay layer) whose axes can each be linear or logarithmic. On a log
 * axis the chart works in log10 of the value, so gridlines fall on whole decades and are
 * labelled 0.1, 1, 10, 100, 1000, 10⁴, … Copied from ExoplanetsDatabase (adapted from TransitHunter's ChartFrameNode).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { ChartRectangle, ChartTransform, GridLineSet, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { Node, Path, RichText, Text } from "scenerystack/scenery";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";
import { formatDecade } from "./format.js";

/** An axis: data range (in data units, even when logarithmic) and scale. */
export type PlotAxis = {
  readonly range: Range;
  readonly log: boolean;
};

/** A "nice" step (1, 2 or 5 × 10ⁿ) giving about `divisions` segments across `span`. */
export const niceStep = (span: number, divisions = 5): number => {
  const raw = (Number.isFinite(span) && span > 0 ? span : 1) / divisions;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  return (normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10) * magnitude;
};

/** Converts a data value to chart (model) coordinates on this axis: log10 on a log axis. */
export const toAxis = (axis: PlotAxis, value: number): number =>
  axis.log ? (value > 0 ? Math.log10(value) : Number.NaN) : value;

const axisModelRange = (axis: PlotAxis): Range =>
  axis.log
    ? new Range(Math.log10(axis.range.min), Math.log10(axis.range.max))
    : new Range(axis.range.min, axis.range.max);

export class PlotFrameNode extends Node {
  public readonly chartTransform: ChartTransform;

  /** Points, curves and bars go here; clipped to the plotting rectangle. */
  public readonly plotLayer: Node;

  /** Markers and labels that may overhang the frame go here; not clipped. */
  public readonly overlayLayer: Node;

  public readonly viewWidth: number;
  public readonly viewHeight: number;

  private readonly gridX: GridLineSet;
  private readonly gridY: GridLineSet;
  private readonly ticksX: TickMarkSet;
  private readonly ticksY: TickMarkSet;
  private readonly labelsX: TickLabelSet;
  private readonly labelsY: TickLabelSet;
  private readonly minorGrid: Path;
  private readonly xAxisLabel: RichText;
  private readonly yAxisLabel: RichText;
  private xAxis: PlotAxis = { range: new Range(0, 1), log: false };
  private yAxis: PlotAxis = { range: new Range(0, 1), log: false };
  private xStep = 1;
  private yStep = 1;

  public constructor(viewWidth: number, viewHeight: number) {
    super();
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.chartTransform = new ChartTransform({
      viewWidth,
      viewHeight,
      modelXRange: new Range(0, 1),
      modelYRange: new Range(0, 1),
    });
    const transform = this.chartTransform;

    const background = new ChartRectangle(transform, {
      fill: NuclideChartColors.chartBackgroundColorProperty,
      stroke: NuclideChartColors.axisColorProperty,
    });
    this.minorGrid = new Path(null, {
      stroke: NuclideChartColors.gridLineColorProperty,
      lineWidth: 0.5,
      opacity: 0.5,
    });
    const gridOptions = { stroke: NuclideChartColors.gridLineColorProperty };
    this.gridX = new GridLineSet(transform, Orientation.HORIZONTAL, 1, gridOptions);
    this.gridY = new GridLineSet(transform, Orientation.VERTICAL, 1, gridOptions);
    const tickOptions = { edge: "min" as const, stroke: NuclideChartColors.axisColorProperty, extent: 5 };
    this.ticksX = new TickMarkSet(transform, Orientation.HORIZONTAL, 1, tickOptions);
    this.ticksY = new TickMarkSet(transform, Orientation.VERTICAL, 1, tickOptions);
    const label = (text: string): Text =>
      new Text(text, { font: FONTS.TICK_LABEL, fill: NuclideChartColors.textColorProperty });
    this.labelsX = new TickLabelSet(transform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      extent: 6,
      createLabel: (value: number) => label(this.formatTick(value, this.xAxis, this.xStep)),
    });
    this.labelsY = new TickLabelSet(transform, Orientation.VERTICAL, 1, {
      edge: "min",
      extent: 6,
      createLabel: (value: number) => label(this.formatTick(value, this.yAxis, this.yStep)),
    });

    this.plotLayer = new Node({ clipArea: Shape.rect(0, 0, viewWidth, viewHeight) });
    this.overlayLayer = new Node();
    this.xAxisLabel = new RichText("", {
      font: FONTS.AXIS_LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: viewWidth,
    });
    this.yAxisLabel = new RichText("", {
      font: FONTS.AXIS_LABEL,
      fill: NuclideChartColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: viewHeight,
    });
    const placeAxisLabels = (): void => {
      this.xAxisLabel.centerX = viewWidth / 2;
      this.xAxisLabel.top = viewHeight + 20;
      this.yAxisLabel.centerY = viewHeight / 2;
      const labelsLeft = this.labelsY.bounds.isFinite() ? this.labelsY.left : 0;
      this.yAxisLabel.right = Math.min(-30, labelsLeft - 6);
    };
    this.xAxisLabel.boundsProperty.lazyLink(placeAxisLabels);
    this.yAxisLabel.boundsProperty.lazyLink(placeAxisLabels);
    this.labelsY.boundsProperty.lazyLink(placeAxisLabels);
    placeAxisLabels();

    this.children = [
      background,
      this.minorGrid,
      this.gridX,
      this.gridY,
      this.plotLayer,
      this.ticksX,
      this.ticksY,
      this.labelsX,
      this.labelsY,
      this.xAxisLabel,
      this.yAxisLabel,
      this.overlayLayer,
    ];
  }

  /** Axis titles (rich text). Lives as long as the chart; the caller owns the Properties. */
  public setAxisLabels(xLabel: TReadOnlyProperty<string>, yLabel: TReadOnlyProperty<string>): void {
    this.xAxisLabel.stringProperty = xLabel;
    this.yAxisLabel.stringProperty = yLabel;
  }

  public get axes(): { x: PlotAxis; y: PlotAxis } {
    return { x: this.xAxis, y: this.yAxis };
  }

  /** Changes both axes and re-chooses the gridline spacing. */
  public setAxes(xAxis: PlotAxis, yAxis: PlotAxis): void {
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    const xRange = axisModelRange(xAxis);
    const yRange = axisModelRange(yAxis);
    this.xStep = xAxis.log ? Math.max(1, Math.ceil(xRange.getLength() / 9)) : niceStep(xRange.getLength(), 6);
    this.yStep = yAxis.log ? Math.max(1, Math.ceil(yRange.getLength() / 9)) : niceStep(yRange.getLength(), 5);
    // Park the spacing while the range changes so a big jump never draws thousands of ticks.
    const sets = [this.gridX, this.ticksX, this.labelsX, this.gridY, this.ticksY, this.labelsY];
    for (const set of sets) {
      set.setSpacing(Number.MAX_SAFE_INTEGER);
    }
    this.chartTransform.setModelXRange(xRange);
    this.chartTransform.setModelYRange(yRange);
    for (const set of [this.gridX, this.ticksX, this.labelsX]) {
      set.setSpacing(this.xStep);
    }
    for (const set of [this.gridY, this.ticksY, this.labelsY]) {
      set.setSpacing(this.yStep);
    }
    this.labelsX.invalidateTickLabelSet();
    this.labelsY.invalidateTickLabelSet();
    this.drawMinorGrid();
  }

  /** View position of a data point (data units), or null if it can't be placed on these axes. */
  public dataToView(x: number, y: number): { x: number; y: number } | null {
    const u = toAxis(this.xAxis, x);
    const v = toAxis(this.yAxis, y);
    if (!(Number.isFinite(u) && Number.isFinite(v))) {
      return null;
    }
    return { x: this.chartTransform.modelToViewX(u), y: this.chartTransform.modelToViewY(v) };
  }

  /** Faint 2…9 lines inside each decade of a log axis that spans few decades. */
  private drawMinorGrid(): void {
    const shape = new Shape();
    const transform = this.chartTransform;
    const addMinor = (axis: PlotAxis, horizontal: boolean): void => {
      const range = axisModelRange(axis);
      if (!axis.log || range.getLength() > 5) {
        return;
      }
      for (let decade = Math.floor(range.min); decade < range.max; decade++) {
        for (let k = 2; k <= 9; k++) {
          const u = decade + Math.log10(k);
          if (u > range.min && u < range.max) {
            if (horizontal) {
              const x = transform.modelToViewX(u);
              shape.moveTo(x, 0).lineTo(x, this.viewHeight);
            } else {
              const y = transform.modelToViewY(u);
              shape.moveTo(0, y).lineTo(this.viewWidth, y);
            }
          }
        }
      }
    };
    addMinor(this.xAxis, true);
    addMinor(this.yAxis, false);
    this.minorGrid.shape = shape;
  }

  private formatTick(value: number, axis: PlotAxis, step: number): string {
    if (axis.log) {
      return formatDecade(value);
    }
    const decimals = step >= 1 ? 0 : Math.min(4, -Math.floor(Math.log10(step)));
    return String(Number(value.toFixed(decimals))).replace("-", "−");
  }
}
