/**
 * BindingChartNode.ts
 *
 * The Binding Energy screen's plot: B/A against A for every nuclide with a known mass (stable nuclides
 * highlighted, masses from systematics faint), or the residual measured − formula against N or Z. Over
 * it: the mass-formula curve along the valley of stability, the magic numbers, the light alpha-like nuclei,
 * the empty mass numbers 5 and 8, the selected nuclide, and the nuclides of the current fission or fusion
 * reaction. Click a point, or use the arrow keys, to select a nuclide.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import {
  Circle,
  KeyboardListener,
  Line,
  Node,
  type NodeOptions,
  Path,
  Rectangle,
  RichText,
  type TColor,
} from "scenerystack/scenery";
import { semfBinding, semfResidual, valleyZ } from "../../common/model/massFormula.js";
import { MAGIC_NUMBERS } from "../../common/model/NuclearConstants.js";
import { NUCLIDE_TABLE, type Nuclide } from "../../common/model/NuclideTable.js";
import { formatFixed } from "../../common/view/format.js";
import { nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { type PlotAxis, PlotFrameNode } from "../../common/view/PlotFrameNode.js";
import { PointCloudNode, type PointStyle } from "../../common/view/PointCloudNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS, PICK_DISTANCE } from "../../NuclideChartConstants.js";
import { type BindingEnergyModel, BindingView } from "../model/BindingEnergyModel.js";

/** Light nuclei that sit above the trend (alpha clustering). */
const ALPHA_LIKE = ["He-4", "C-12", "O-16", "Ne-20"];

/** The most tightly bound nuclides, labelled when zoomed on the peak. */
const PEAK_LABELS = [...NUCLIDE_TABLE.nuclides]
  .filter((x) => x.bindingPerNucleon !== null)
  .sort((p, q) => (q.bindingPerNucleon ?? 0) - (p.bindingPerNucleon ?? 0))
  .slice(0, 6)
  .map((x) => x.label);

/** B/A (MeV) at which each alpha-like label sits, in the empty strip left of the curve. */
const ALPHA_LABEL_HEIGHTS: Readonly<Record<string, number>> = {
  "Ne-20": 9.0,
  "O-16": 8.7,
  "C-12": 8.4,
  "He-4": 8.1,
};

const CURVE_AXES = { x: new Range(0, 270), y: new Range(0, 9.2) };
const PEAK_AXES = { x: new Range(46, 70), y: new Range(8.6, 8.81) };
const RESIDUAL_RANGE = new Range(-15, 15);

const css =
  (property: { value: { toCSS(): string } }): (() => string) =>
  () =>
    property.value.toCSS();

/** Point groups, drawn in this order (later on top). */
const STYLES: readonly PointStyle[] = [
  { css: css(NuclideChartColors.systematicPointColorProperty), radius: 1.6, alpha: 0.6 },
  { css: css(NuclideChartColors.pointColorProperty), radius: 1.8, alpha: 0.85 },
  { css: css(NuclideChartColors.stablePointColorProperty), radius: 2.4, alpha: 1 },
];

export type BindingChartNodeOptions = NodeOptions & {
  readonly accessibleName: TReadOnlyProperty<string>;
  readonly accessibleHelpText: TReadOnlyProperty<string>;
};

export class BindingChartNode extends Node {
  private readonly model: BindingEnergyModel;
  private readonly frame: PlotFrameNode;
  private readonly cloud: PointCloudNode;
  private pointNuclides: Nuclide[] = [];

  public constructor(model: BindingEnergyModel, width: number, height: number, options: BindingChartNodeOptions) {
    super({ tagName: "div", focusable: true, ...options });
    this.model = model;
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getBindingEnergyStrings();

    const frame = new PlotFrameNode(width, height);
    this.frame = frame;
    const cloud = new PointCloudNode(frame.chartTransform);
    this.cloud = cloud;

    const formulaPath = new Path(null, { stroke: NuclideChartColors.referenceLineColorProperty, lineWidth: 1.5 });
    const magicPath = new Path(null, {
      stroke: NuclideChartColors.magicLineColorProperty,
      lineWidth: 1,
      lineDash: [5, 4],
    });
    const gapPath = new Path(null, {
      stroke: NuclideChartColors.dripLineColorProperty,
      lineWidth: 1,
      lineDash: [3, 3],
    });
    const gapLabel = new RichText(strings.noA5A8StringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.dripLineColorProperty,
      maxWidth: width * 0.4,
    });
    const alphaLabels = new Node();
    const reactionMarkers = new Node();
    const selectionRing = new Circle(6, { stroke: NuclideChartColors.selectionColorProperty, lineWidth: 2 });
    const selectionLabel = new RichText("", { font: FONTS.LABEL, fill: NuclideChartColors.selectionColorProperty });
    const selectionBackground = new Rectangle(0, 0, 1, 1, {
      fill: NuclideChartColors.chartBackgroundColorProperty,
      opacity: 0.8,
      cornerRadius: 3,
    });

    // Clicking picks the nearest point.
    const hitArea = new Rectangle(0, 0, width, height, { fill: "rgba(0,0,0,0)", cursor: "pointer" });
    hitArea.addInputListener({
      down: (event) => {
        const local = frame.plotLayer.globalToLocalPoint(event.pointer.point);
        const k = cloud.nearest(local.x, local.y, PICK_DISTANCE * 2);
        const nuclide = k === null ? null : this.pointNuclides[k];
        if (nuclide) {
          model.shared.selectedNuclideProperty.value = nuclide;
        }
      },
    });
    for (const decoration of [magicPath, gapPath, formulaPath, alphaLabels, reactionMarkers, selectionRing]) {
      decoration.pickable = false;
    }
    frame.plotLayer.children = [
      hitArea,
      magicPath,
      gapPath,
      cloud,
      formulaPath,
      alphaLabels,
      reactionMarkers,
      selectionRing,
    ];
    frame.overlayLayer.children = [gapLabel, selectionBackground, selectionLabel];
    this.children = [frame];

    const update = (): void => {
      const view = model.viewProperty.value;
      const curve = view === BindingView.CURVE;
      const zoom = curve && model.zoomOnPeakProperty.value;
      const axes = curve
        ? zoom
          ? PEAK_AXES
          : CURVE_AXES
        : { x: new Range(0, view === BindingView.RESIDUAL_N ? 160 : 110), y: RESIDUAL_RANGE };
      const xAxis: PlotAxis = { range: axes.x, log: false };
      const yAxis: PlotAxis = { range: axes.y, log: false };
      frame.setAxes(xAxis, yAxis);
      frame.setAxisLabels(
        curve
          ? common.axes.massNumberStringProperty
          : view === BindingView.RESIDUAL_N
            ? common.axes.neutronNumberStringProperty
            : common.axes.protonNumberStringProperty,
        curve ? common.axes.bindingPerNucleonStringProperty : common.axes.residualStringProperty,
      );
      this.updatePoints();
      this.updateFormulaPath(formulaPath);
      this.updateMagicLines(magicPath);

      this.updateMassGap(gapPath, gapLabel, curve && !zoom);

      // Alpha-like light nuclei.
      for (const child of alphaLabels.children) {
        child.dispose();
      }
      if (zoom) {
        alphaLabels.children = PEAK_LABELS.map((label) =>
          this.pointLabel(NUCLIDE_TABLE.require(label), NuclideChartColors.textColorProperty),
        );
      } else {
        alphaLabels.children = curve
          ? ALPHA_LIKE.map((label) => this.leaderLabel(NUCLIDE_TABLE.require(label), ALPHA_LABEL_HEIGHTS[label] ?? 8))
          : [];
      }

      this.updateReactionMarkers(reactionMarkers);
      this.updateSelection(selectionRing, selectionLabel, selectionBackground);
    };
    Multilink.multilink(
      [
        model.viewProperty,
        model.zoomOnPeakProperty,
        model.formulaVisibleProperty,
        model.formulaProperty,
        model.shared.magicNumbersVisibleProperty,
      ],
      update,
    );
    Multilink.multilink([model.energyModeProperty, model.fissionProperty, model.fusionProperty], () =>
      this.updateReactionMarkers(reactionMarkers),
    );
    model.shared.selectedNuclideProperty.link(() =>
      this.updateSelection(selectionRing, selectionLabel, selectionBackground),
    );
    Multilink.multilinkAny(
      [
        NuclideChartColors.systematicPointColorProperty,
        NuclideChartColors.pointColorProperty,
        NuclideChartColors.stablePointColorProperty,
      ],
      () => cloud.repaint(),
    );

    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
        fire: (_event, keysPressed) => this.step(keysPressed),
      }),
    );
  }

  /** Marks A = 5 and A = 8, where no nucleus is stable, on the full B/A curve. */
  private updateMassGap(path: Path, label: Node, visible: boolean): void {
    const transform = this.frame.chartTransform;
    const shape = new Shape();
    if (visible) {
      for (const a of [5, 8]) {
        const x = transform.modelToViewX(a);
        shape.moveTo(x, transform.modelToViewY(0)).lineTo(x, transform.modelToViewY(4.5));
      }
      label.left = transform.modelToViewX(10);
      label.centerY = transform.modelToViewY(4.6);
    }
    path.shape = shape;
    label.visible = visible;
  }

  /** The (x, y) a nuclide is plotted at in the current view, or null. */
  private plotValue(nuclide: Nuclide): { x: number; y: number } | null {
    const view = this.model.viewProperty.value;
    if (view === BindingView.CURVE) {
      return nuclide.bindingPerNucleon === null || nuclide.a < 2
        ? null
        : { x: nuclide.a, y: nuclide.bindingPerNucleon / 1000 };
    }
    if (nuclide.a < 16) {
      return null;
    }
    const formula = this.model.formulaProperty.value;
    const residual = semfResidual(nuclide, formula.coefficients, formula.terms);
    if (residual === null) {
      return null;
    }
    return { x: view === BindingView.RESIDUAL_N ? nuclide.n : nuclide.z, y: residual };
  }

  private updatePoints(): void {
    const nuclides: Nuclide[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    const groups: number[] = [];
    for (const nuclide of NUCLIDE_TABLE.nuclides) {
      const p = this.plotValue(nuclide);
      if (p) {
        nuclides.push(nuclide);
        xs.push(p.x);
        ys.push(p.y);
        groups.push(nuclide.isSystematic ? 0 : nuclide.isStable ? 2 : 1);
      }
    }
    this.pointNuclides = nuclides;
    this.cloud.setPoints(
      { xs: Float64Array.from(xs), ys: Float64Array.from(ys), groups: Uint8Array.from(groups) },
      STYLES,
    );
  }

  private updateFormulaPath(path: Path): void {
    const model = this.model;
    const view = model.viewProperty.value;
    const transform = this.frame.chartTransform;
    const shape = new Shape();
    if (model.formulaVisibleProperty.value) {
      if (view === BindingView.CURVE) {
        const { coefficients, terms } = model.formulaProperty.value;
        const smooth = { ...terms, pairing: false };
        for (let a = 4; a <= 270; a += 0.5) {
          const z = valleyZ(a, coefficients, terms);
          const y = semfBinding(z, a, coefficients, smooth) / a;
          const point = new Vector2(transform.modelToViewX(a), transform.modelToViewY(y));
          if (a === 4) {
            shape.moveToPoint(point);
          } else {
            shape.lineToPoint(point);
          }
        }
      } else {
        shape.moveTo(0, transform.modelToViewY(0)).lineTo(this.frame.viewWidth, transform.modelToViewY(0));
      }
    }
    path.shape = shape;
  }

  private updateMagicLines(path: Path): void {
    const view = this.model.viewProperty.value;
    const shape = new Shape();
    if (view !== BindingView.CURVE && this.model.shared.magicNumbersVisibleProperty.value) {
      const transform = this.frame.chartTransform;
      for (const m of MAGIC_NUMBERS) {
        const x = transform.modelToViewX(m);
        shape.moveTo(x, 0).lineTo(x, this.frame.viewHeight);
      }
    }
    path.shape = shape;
  }

  /** A label in the empty strip at the left of the curve, joined to its point by a thin line. */
  private leaderLabel(nuclide: Nuclide, labelBA: number): Node {
    const transform = this.frame.chartTransform;
    const p = this.plotValue(nuclide);
    const label = new RichText(nuclideMarkup(nuclide), {
      font: FONTS.CHART_LABEL,
      fill: NuclideChartColors.highlightColorProperty,
    });
    label.left = transform.modelToViewX(0) + 4;
    label.centerY = transform.modelToViewY(labelBA);
    if (!p) {
      return label;
    }
    const line = new Line(label.right + 2, label.centerY, transform.modelToViewX(p.x), transform.modelToViewY(p.y), {
      stroke: NuclideChartColors.highlightColorProperty,
      lineWidth: 0.6,
    });
    return new Node({ children: [line, label] });
  }

  /** A small label beside a nuclide's point. */
  private pointLabel(
    nuclide: Nuclide,
    fill: TColor = NuclideChartColors.highlightColorProperty,
    offset: readonly [number, number] = [5, -2],
  ): Node {
    const p = this.plotValue(nuclide);
    const label = new RichText(nuclideMarkup(nuclide), { font: FONTS.CHART_LABEL, fill });
    if (p) {
      label.left = this.frame.chartTransform.modelToViewX(p.x) + offset[0];
      label.bottom = this.frame.chartTransform.modelToViewY(p.y) + offset[1];
    }
    return label;
  }

  private updateReactionMarkers(markers: Node): void {
    for (const child of markers.children) {
      child.dispose();
    }
    const model = this.model;
    if (model.viewProperty.value !== BindingView.CURVE) {
      markers.children = [];
      return;
    }
    const nuclides: Nuclide[] = [];
    if (model.energyModeProperty.value === "fission") {
      const fission = model.fissionProperty.value;
      if (fission) {
        nuclides.push(fission.target, fission.light, fission.heavy);
      }
    } else {
      const fusion = model.fusionProperty.value;
      nuclides.push(...fusion.reactantNuclides, ...fusion.productNuclides);
    }
    const children: Node[] = [];
    for (const nuclide of new Set(nuclides)) {
      const p = this.plotValue(nuclide);
      if (p) {
        const x = this.frame.chartTransform.modelToViewX(p.x);
        const y = this.frame.chartTransform.modelToViewY(p.y);
        children.push(
          new Rectangle(x - 4, y - 4, 8, 8, { stroke: NuclideChartColors.highlightColorProperty, lineWidth: 2 }),
          this.pointLabel(nuclide),
        );
      }
    }
    markers.children = children;
  }

  private updateSelection(ring: Circle, label: RichText, background: Rectangle): void {
    const nuclide = this.model.shared.selectedNuclideProperty.value;
    const p = this.plotValue(nuclide);
    const transform = this.frame.chartTransform;
    const inside = p !== null && transform.modelXRange.contains(p.x) && transform.modelYRange.contains(p.y);
    ring.visible = inside;
    label.visible = p !== null;
    background.visible = p !== null;
    if (!p) {
      return;
    }
    ring.center = new Vector2(transform.modelToViewX(p.x), transform.modelToViewY(p.y));
    const strings = StringManager.getInstance().getBindingEnergyStrings();
    const value = formatFixed(p.y, this.model.viewProperty.value === BindingView.CURVE ? 4 : 2);
    const pattern =
      this.model.viewProperty.value === BindingView.CURVE
        ? strings.cursor.readoutPatternStringProperty.value
        : strings.cursor.residualPatternStringProperty.value;
    label.string = StringUtils.fillIn(pattern, {
      label: nuclideMarkup(nuclide),
      value,
    });
    label.right = this.frame.viewWidth - 8;
    label.top = 8;
    background.setRect(label.left - 4, label.top - 2, label.width + 8, label.height + 4);
  }

  /** Arrow keys: left/right change A (to the most bound isobar), up/down step through one A's isobars. */
  private step(key: string): void {
    const selected = this.model.shared.selectedNuclideProperty;
    const from = selected.value;
    const view = this.model.viewProperty.value;
    const isPlotted = (x: Nuclide): boolean => this.plotValue(x) !== null;
    let target: Nuclide | null = null;
    if (key === "arrowUp" || key === "arrowDown") {
      const dz = key === "arrowUp" ? 1 : -1;
      const members =
        view === BindingView.CURVE
          ? NUCLIDE_TABLE.isobars(from.a)
          : view === BindingView.RESIDUAL_N
            ? NUCLIDE_TABLE.nuclides.filter((x) => x.n === from.n)
            : NUCLIDE_TABLE.isotopes(from.z);
      const sorted = members
        .filter(isPlotted)
        .sort((p, q) => (this.plotValue(p)?.y ?? 0) - (this.plotValue(q)?.y ?? 0));
      const i = sorted.indexOf(from);
      target = sorted[i < 0 ? 0 : i + dz] ?? null;
    } else {
      const dx = key === "arrowRight" ? 1 : -1;
      const coordinate = (x: Nuclide): number =>
        view === BindingView.CURVE ? x.a : view === BindingView.RESIDUAL_N ? x.n : x.z;
      for (let step = 1; step < 300 && !target; step++) {
        const value = coordinate(from) + dx * step;
        const column = NUCLIDE_TABLE.nuclides.filter((x) => coordinate(x) === value && isPlotted(x) && !x.isSystematic);
        target = column.reduce<Nuclide | null>(
          (best, x) => (best === null || (this.plotValue(x)?.y ?? 0) > (this.plotValue(best)?.y ?? 0) ? x : best),
          null,
        );
        if (value < 0 || value > 300) {
          break;
        }
      }
    }
    if (target) {
      selected.value = target;
    }
  }
}
