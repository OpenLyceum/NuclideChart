/**
 * NuclideScatterNode.ts
 *
 * A chart of nuclides as points: a PlotFrameNode, a PointCloudNode, click-to-select (nearest point), arrow-key
 * selection (the nearest point in the arrow's direction), and a ring around the selected nuclide. Screens
 * supply the points and their styles, and draw their own guides into `underLayer` (below the points) and
 * `overLayer` (above them).
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Circle, KeyboardListener, Node, type NodeOptions, Rectangle } from "scenerystack/scenery";
import NuclideChartColors from "../../NuclideChartColors.js";
import { PICK_DISTANCE } from "../../NuclideChartConstants.js";
import type { Nuclide } from "../model/NuclideTable.js";
import { type PlotAxis, PlotFrameNode, toAxis } from "./PlotFrameNode.js";
import { PointCloudNode, type PointStyle } from "./PointCloudNode.js";

/** One plotted nuclide, in data units (the frame converts log axes). */
export type ScatterPoint = {
  readonly nuclide: Nuclide;
  readonly x: number;
  readonly y: number;
  /** Index into the style list. */
  readonly group: number;
};

export type NuclideScatterNodeOptions = NodeOptions & {
  readonly accessibleName: TReadOnlyProperty<string>;
  readonly accessibleHelpText: TReadOnlyProperty<string>;
};

export class NuclideScatterNode extends Node {
  public readonly frame: PlotFrameNode;
  /** Guides drawn below the points (lines, bands). */
  public readonly underLayer = new Node({ pickable: false });
  /** Guides and labels drawn above the points. */
  public readonly overLayer = new Node({ pickable: false });

  private readonly cloud: PointCloudNode;
  private readonly ring: Circle;
  private readonly selectedProperty: Property<Nuclide>;
  private points: readonly ScatterPoint[] = [];

  public constructor(
    selectedProperty: Property<Nuclide>,
    width: number,
    height: number,
    options: NuclideScatterNodeOptions,
  ) {
    super({ tagName: "div", focusable: true, ...options });
    this.selectedProperty = selectedProperty;
    this.frame = new PlotFrameNode(width, height);
    this.cloud = new PointCloudNode(this.frame.chartTransform);
    this.ring = new Circle(6, { stroke: NuclideChartColors.selectionColorProperty, lineWidth: 2, pickable: false });

    const hitArea = new Rectangle(0, 0, width, height, { fill: "rgba(0,0,0,0)", cursor: "pointer" });
    hitArea.addInputListener({
      down: (event) => {
        const local = this.frame.plotLayer.globalToLocalPoint(event.pointer.point);
        const k = this.cloud.nearest(local.x, local.y, PICK_DISTANCE * 2);
        const point = k === null ? null : this.points[k];
        if (point) {
          selectedProperty.value = point.nuclide;
        }
      },
    });
    this.frame.plotLayer.children = [hitArea, this.underLayer, this.cloud, this.overLayer, this.ring];
    this.children = [this.frame];

    selectedProperty.link(() => this.updateRing());
    this.frame.chartTransform.changedEmitter.addListener(() => this.updateRing());

    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
        fire: (_event, keysPressed) => {
          const direction = {
            arrowLeft: new Vector2(-1, 0),
            arrowRight: new Vector2(1, 0),
            arrowUp: new Vector2(0, -1),
            arrowDown: new Vector2(0, 1),
          }[keysPressed as "arrowLeft" | "arrowRight" | "arrowUp" | "arrowDown"];
          this.stepSelection(direction);
        },
      }),
    );
  }

  /** Replaces the plotted points. */
  public setPoints(points: readonly ScatterPoint[], styles: readonly PointStyle[]): void {
    this.points = points;
    const axes = this.frame.axes;
    this.cloud.setPoints(
      {
        xs: Float64Array.from(points, (p) => toAxis(axes.x, p.x)),
        ys: Float64Array.from(points, (p) => toAxis(axes.y, p.y)),
        groups: Uint8Array.from(points, (p) => p.group),
      },
      styles,
    );
    this.updateRing();
  }

  /** Changes the axes; call setPoints afterwards so log axes convert the points. */
  public setAxes(x: PlotAxis, y: PlotAxis): void {
    this.frame.setAxes(x, y);
  }

  public repaint(): void {
    this.cloud.repaint();
  }

  /** View position of a data point, or null. */
  public viewPosition(x: number, y: number): Vector2 | null {
    const p = this.frame.dataToView(x, y);
    return p ? new Vector2(p.x, p.y) : null;
  }

  /** The plotted point of a nuclide, or null. */
  public pointOf(nuclide: Nuclide): ScatterPoint | null {
    return this.points.find((p) => p.nuclide === nuclide) ?? null;
  }

  private updateRing(): void {
    const point = this.pointOf(this.selectedProperty.value);
    const view = point ? this.viewPosition(point.x, point.y) : null;
    const inside =
      view !== null && view.x >= 0 && view.x <= this.frame.viewWidth && view.y >= 0 && view.y <= this.frame.viewHeight;
    this.ring.visible = inside;
    if (view && inside) {
      this.ring.center = view;
    }
  }

  /** Selects the nearest point in a direction (view coordinates), favouring points close to the axis of travel. */
  private stepSelection(direction: Vector2): void {
    const current = this.pointOf(this.selectedProperty.value);
    const from = current ? this.viewPosition(current.x, current.y) : null;
    let best: ScatterPoint | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const point of this.points) {
      const view = this.viewPosition(point.x, point.y);
      if (!view || point === current) {
        continue;
      }
      if (!from) {
        best = point;
        break;
      }
      const delta = view.minus(from);
      const along = delta.dot(direction);
      const across = Math.abs(delta.crossScalar(direction));
      if (along > 0.5 && across <= 2 * along + 4) {
        const score = along + 3 * across;
        if (score < bestScore) {
          bestScore = score;
          best = point;
        }
      }
    }
    if (best) {
      this.selectedProperty.value = best.nuclide;
    }
  }
}
