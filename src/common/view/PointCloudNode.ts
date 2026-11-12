/**
 * PointCloudNode.ts
 *
 * Many points painted straight onto a canvas, one colour per group, in the chart's model coordinates.
 * Groups are painted in order, so later groups land on top: pass the rarest last. Adapted from
 * ExoplanetsDatabase's PointCloudNode via HRDiagram; per-group radius, alpha and picking.
 */

import type { ChartTransform } from "scenerystack/bamboo";
import { Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { CanvasNode } from "scenerystack/scenery";

/** Group index that is never drawn. */
export const HIDDEN_GROUP = 255;

/** Points in chart (model) coordinates, each with a group. */
export type PointSet = {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly groups: Uint8Array;
};

export const EMPTY_POINTS: PointSet = {
  xs: new Float64Array(0),
  ys: new Float64Array(0),
  groups: new Uint8Array(0),
};

/** How one group of points is drawn. */
export type PointStyle = {
  /** CSS colour, read at paint time so colour-profile changes take effect on repaint. */
  readonly css: () => string;
  readonly radius: number;
  readonly alpha: number;
  /** Optional outline colour. */
  readonly stroke?: () => string;
  /** Marker shape (circle by default), so colour is never the only cue. */
  readonly shape?: MarkerShape;
};

export type MarkerShape = "circle" | "diamond" | "square";

/** Adds one marker of the given shape and radius to the current canvas path. */
export const traceMarker = (
  context: CanvasRenderingContext2D,
  shape: MarkerShape,
  x: number,
  y: number,
  r: number,
): void => {
  if (shape === "diamond") {
    const d = r * 1.3;
    context.moveTo(x, y - d);
    context.lineTo(x + d, y);
    context.lineTo(x, y + d);
    context.lineTo(x - d, y);
    context.closePath();
  } else if (shape === "square") {
    const d = r * 0.95;
    context.rect(x - d, y - d, 2 * d, 2 * d);
  } else {
    context.moveTo(x + r, y);
    context.arc(x, y, r, 0, 2 * Math.PI);
  }
};

/** The same marker as a kite Shape centred on the origin, for legends. */
export const markerShape = (shape: MarkerShape, r: number): Shape => {
  if (shape === "diamond") {
    const d = r * 1.3;
    return new Shape().moveTo(0, -d).lineTo(d, 0).lineTo(0, d).lineTo(-d, 0).close();
  }
  if (shape === "square") {
    const d = r * 0.95;
    return Shape.rect(-d, -d, 2 * d, 2 * d);
  }
  return Shape.circle(0, 0, r);
};

export class PointCloudNode extends CanvasNode {
  private readonly chartTransform: ChartTransform;
  private points: PointSet = EMPTY_POINTS;
  private styles: readonly PointStyle[] = [];

  /** View positions from the last paint, for picking. */
  private viewXs = new Float32Array(0);
  private viewYs = new Float32Array(0);

  public constructor(transform: ChartTransform) {
    super({ canvasBounds: new Bounds2(0, 0, transform.viewWidth, transform.viewHeight), pickable: false });
    this.chartTransform = transform;
    const repaint = (): void => this.invalidatePaint();
    transform.changedEmitter.addListener(repaint);
    this.disposeEmitter.addListener(() => transform.changedEmitter.removeListener(repaint));
  }

  public setPoints(points: PointSet, styles: readonly PointStyle[]): void {
    this.points = points;
    this.styles = styles;
    this.invalidatePaint();
  }

  /** Repaints, e.g. after a colour-profile change. */
  public repaint(): void {
    this.invalidatePaint();
  }

  /** Index of the drawn point nearest a view position, within `maxDistance` px, or null. */
  public nearest(x: number, y: number, maxDistance: number): number | null {
    let best = -1;
    let bestDistance = maxDistance * maxDistance;
    for (let k = 0; k < this.viewXs.length; k++) {
      if (this.points.groups[k] === HIDDEN_GROUP) {
        continue;
      }
      const dx = (this.viewXs[k] ?? Number.NaN) - x;
      const dy = (this.viewYs[k] ?? Number.NaN) - y;
      const distance = dx * dx + dy * dy;
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = k;
      }
    }
    return best < 0 ? null : best;
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const transform = this.chartTransform;
    const { xs, ys, groups } = this.points;
    const n = xs.length;
    if (this.viewXs.length !== n) {
      this.viewXs = new Float32Array(n);
      this.viewYs = new Float32Array(n);
    }
    for (let k = 0; k < n; k++) {
      this.viewXs[k] = transform.modelToViewX(xs[k] ?? Number.NaN);
      this.viewYs[k] = transform.modelToViewY(ys[k] ?? Number.NaN);
    }
    this.styles.forEach((style, group) => {
      context.beginPath();
      for (let k = 0; k < n; k++) {
        const x = this.viewXs[k] ?? Number.NaN;
        const y = this.viewYs[k] ?? Number.NaN;
        if (groups[k] === group && Number.isFinite(x) && Number.isFinite(y)) {
          traceMarker(context, style.shape ?? "circle", x, y, style.radius);
        }
      }
      context.globalAlpha = style.alpha;
      context.fillStyle = style.css();
      context.fill();
      if (style.stroke) {
        context.globalAlpha = 1;
        context.lineWidth = 0.6;
        context.strokeStyle = style.stroke();
        context.stroke();
      }
    });
    context.globalAlpha = 1;
  }
}
