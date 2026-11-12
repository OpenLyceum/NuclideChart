/**
 * ActivityChartNode.ts
 *
 * Activity of every radioactive member of a decay chain against time (both axes logarithmic), relative to the
 * parent's starting activity, from the exact Bateman solution. A vertical line marks the chosen time. The
 * selected member's curve is drawn thick and labelled; in the U-238 series Rn-222 is always labelled too,
 * since it is the one that seeps into basements.
 */

import { Multilink, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path, RichText } from "scenerystack/scenery";
import type { BatemanSolution } from "../../common/model/bateman.js";
import { categoryOfMode, DecayCategory } from "../../common/model/DecayCategory.js";
import type { ChainNode } from "../../common/model/decayChains.js";
import type { Nuclide } from "../../common/model/NuclideTable.js";
import { PlotFrameNode } from "../../common/view/PlotFrameNode.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";
import { LOG_TIME_RANGE } from "../model/DecayChainsModel.js";

const SAMPLES = 260;
const ACTIVITY_RANGE = new Range(1e-6, 3);
const ALWAYS_LABELLED = new Set(["Rn-222"]);

export class ActivityChartNode extends Node {
  public constructor(
    solutionProperty: TReadOnlyProperty<BatemanSolution>,
    logTimeProperty: TReadOnlyProperty<number>,
    selectedProperty: Property<Nuclide>,
    width: number,
    height: number,
    axisLabels: { time: TReadOnlyProperty<string>; activity: TReadOnlyProperty<string> },
  ) {
    super();
    const frame = new PlotFrameNode(width, height);
    frame.setAxes(
      { range: new Range(10 ** LOG_TIME_RANGE.min, 10 ** LOG_TIME_RANGE.max), log: true },
      { range: ACTIVITY_RANGE, log: true },
    );
    frame.setAxisLabels(axisLabels.time, axisLabels.activity);
    const alphaPath = new Path(null, { stroke: NuclideChartColors.alphaColorProperty, lineWidth: 1, opacity: 0.75 });
    const betaPath = new Path(null, { stroke: NuclideChartColors.betaMinusColorProperty, lineWidth: 1, opacity: 0.75 });
    const otherPath = new Path(null, { stroke: NuclideChartColors.isomericColorProperty, lineWidth: 1, opacity: 0.75 });
    const highlightPath = new Path(null, { stroke: NuclideChartColors.highlightColorProperty, lineWidth: 2.6 });
    const timeLine = new Path(null, {
      stroke: NuclideChartColors.selectionColorProperty,
      lineWidth: 1.2,
      lineDash: [5, 3],
    });
    const labels = new Node();
    frame.plotLayer.children = [alphaPath, betaPath, otherPath, highlightPath, timeLine, labels];
    this.children = [frame];

    const transform = frame.chartTransform;
    const times = Array.from(
      { length: SAMPLES },
      (_, i) => 10 ** (LOG_TIME_RANGE.min + (LOG_TIME_RANGE.getLength() * i) / (SAMPLES - 1)),
    );
    let curves: { node: ChainNode; points: (Vector2 | null)[] }[] = [];

    const curveShape = (points: readonly (Vector2 | null)[]): Shape => {
      const shape = new Shape();
      let drawing = false;
      for (const p of points) {
        if (!p) {
          drawing = false;
        } else if (drawing) {
          shape.lineToPoint(p);
        } else {
          shape.moveToPoint(p);
          drawing = true;
        }
      }
      return shape;
    };

    const rebuildCurves = (solution: BatemanSolution): void => {
      const nodes = solution.chain.nodes;
      const parentActivity = nodes[0]?.lambda ?? 1;
      const series = times.map((t) => solution.activities(t));
      curves = nodes
        .map((node, i) => ({
          node,
          points: series.map((activities, k) => {
            const relative = (activities[i] ?? 0) / parentActivity;
            if (!(relative >= ACTIVITY_RANGE.min / 10)) {
              return null;
            }
            const clamped = Math.min(relative, ACTIVITY_RANGE.max);
            return new Vector2(
              transform.modelToViewX(Math.log10(times[k] ?? 1)),
              transform.modelToViewY(Math.log10(clamped)),
            );
          }),
        }))
        .filter((curve) => curve.node.lambda > 0);
      const byMode = (category: DecayCategory | null): Shape =>
        new Shape(
          curves
            .filter((c) => {
              const strongest = [...c.node.links].sort((p, q) => q.fraction - p.fraction)[0];
              const nodeCategory = strongest ? categoryOfMode(strongest.mode) : DecayCategory.UNKNOWN;
              return category === null
                ? nodeCategory !== DecayCategory.ALPHA && nodeCategory !== DecayCategory.BETA_MINUS
                : nodeCategory === category;
            })
            .flatMap((c) => curveShape(c.points).subpaths),
        );
      alphaPath.shape = byMode(DecayCategory.ALPHA);
      betaPath.shape = byMode(DecayCategory.BETA_MINUS);
      otherPath.shape = byMode(null);
    };

    const updateHighlight = (): void => {
      const selected = selectedProperty.value;
      for (const child of labels.children) {
        child.dispose();
      }
      const labelNodes: Node[] = [];
      const highlighted: Shape[] = [];
      // With no member selected, the parent's curve is highlighted.
      const inChain = curves.some((c) => !c.node.isomer && c.node.z === selected.z && c.node.n === selected.n);
      for (const [index, curve] of curves.entries()) {
        const isSelected = inChain
          ? !curve.node.isomer && curve.node.z === selected.z && curve.node.n === selected.n
          : index === 0;
        if (isSelected || ALWAYS_LABELLED.has(curve.node.label)) {
          if (isSelected) {
            highlighted.push(curveShape(curve.points));
          }
          // Label the curve where it first reaches its plateau (or at its last point).
          const visible = curve.points.filter((p): p is Vector2 => p !== null);
          const anchor = visible[Math.floor(visible.length * 0.15)] ?? visible[0];
          if (anchor) {
            const [symbol, a] = curve.node.label.split("-");
            labelNodes.push(
              new RichText(`<sup>${a}${curve.node.isomer ? "m" : ""}</sup>${symbol}`, {
                font: FONTS.CHART_LABEL,
                fill: isSelected ? NuclideChartColors.highlightColorProperty : NuclideChartColors.textColorProperty,
                left: anchor.x + 3,
                bottom: anchor.y - 2,
              }),
            );
          }
        }
      }
      highlightPath.shape = new Shape(highlighted.flatMap((s) => s.subpaths));
      labels.children = labelNodes;
    };

    Multilink.multilink([solutionProperty], (solution) => {
      rebuildCurves(solution);
      updateHighlight();
    });
    selectedProperty.lazyLink(updateHighlight);
    logTimeProperty.link((logTime) => {
      const x = transform.modelToViewX(logTime);
      timeLine.shape = new Shape().moveTo(x, 0).lineTo(x, height);
    });
  }
}
