/**
 * IsobarsScreenView.ts
 *
 * The Isobars screen: the isobars of one mass number A as mass excess against Z, with the fitted mass
 * parabolas (one for odd A, two for even A), arrows for every energetically allowed β⁻ and β⁺/EC step, and
 * double-β arrows where single β is closed. A slider and quick picks choose A.
 */

import { DerivedProperty, Multilink, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, Path, RichText, type TColor, Text, VBox } from "scenerystack/scenery";
import { ArrowNode, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { Checkbox, HSlider, RectangularPushButton } from "scenerystack/sun";
import type { IsobarAnalysis, IsobarTransition } from "../../common/model/isobars.js";
import { isStableUnder, type Nuclide } from "../../common/model/NuclideTable.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/NuclideChartButtonOptions.js";
import {
  NUCLIDE_CHART_CHECKBOX_OPTIONS,
  NUCLIDE_CHART_SLIDER_OPTIONS,
} from "../../common/NuclideChartControlOptions.js";
import { NuclideChartPanel } from "../../common/NuclideChartPanel.js";
import { DataCreditNode } from "../../common/view/DataCreditNode.js";
import { formatFixed } from "../../common/view/format.js";
import { NuclideCardNode, nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { NuclideScatterNode, type ScatterPoint } from "../../common/view/NuclideScatterNode.js";
import { type MarkerShape, markerShape, type PointStyle } from "../../common/view/PointCloudNode.js";
import { chartStripAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS, PANEL_COLUMN_WIDTH } from "../../NuclideChartConstants.js";
import { type IsobarsModel, QUICK_MASS_NUMBERS } from "../model/IsobarsModel.js";
import { IsobarsScreenSummaryContent } from "./IsobarsScreenSummaryContent.js";

export type IsobarsScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 600;
const CHART_HEIGHT = 440;
const STRIP_HEIGHT = 50;
const PANEL_CONTENT_WIDTH = PANEL_COLUMN_WIDTH - 24;
/** Charge numbers shown either side of the valley bottom. */
const Z_HALF_WIDTH = 6;
const MARKER_RADIUS = 6;

const css =
  (property: { value: { toCSS(): string } }): (() => string) =>
  () =>
    property.value.toCSS();
const SHAPES: readonly MarkerShape[] = ["circle", "square", "diamond"];

/** Groups: parity (even–even, odd–odd, odd A) × (radioactive, stable). */
const STYLES: readonly PointStyle[] = [
  ...SHAPES.map((shape) => ({
    css: css(NuclideChartColors.pointColorProperty),
    radius: MARKER_RADIUS,
    alpha: 1,
    shape,
    stroke: css(NuclideChartColors.chartBackgroundColorProperty),
  })),
  ...SHAPES.map((shape) => ({
    css: css(NuclideChartColors.stablePointColorProperty),
    radius: MARKER_RADIUS,
    alpha: 1,
    shape,
    stroke: css(NuclideChartColors.chartBackgroundColorProperty),
  })),
];

const parityGroup = (nuclide: Nuclide): number => (nuclide.a % 2 === 1 ? 2 : nuclide.z % 2 === 0 ? 0 : 1);

export class IsobarsScreenView extends ScreenView {
  public constructor(model: IsobarsModel, providedOptions?: IsobarsScreenViewOptions) {
    const options = optionize<IsobarsScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new IsobarsScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getIsobarsStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getIsobarsA11yStrings();
    const layout = chartStripAndPanelsLayout(this.layoutBounds, PANEL_COLUMN_WIDTH, STRIP_HEIGHT);
    const selected = model.shared.selectedNuclideProperty;

    const label = (
      text: TReadOnlyProperty<string> | string,
      maxWidth = PANEL_CONTENT_WIDTH,
      font = FONTS.LABEL,
    ): RichText => new RichText(text, { font, fill: NuclideChartColors.textColorProperty, maxWidth });
    const checkbox = (property: Property<boolean>, text: TReadOnlyProperty<string>): Checkbox =>
      new Checkbox(property, label(text, 220), { ...NUCLIDE_CHART_CHECKBOX_OPTIONS, accessibleName: text });

    // ── Chart ─────────────────────────────────────────────────────────────────
    const chart = new NuclideScatterNode(selected, CHART_WIDTH, CHART_HEIGHT, {
      accessibleName: a11y.controls.chartStringProperty,
      accessibleHelpText: a11y.controls.chartHelpStringProperty,
    });
    chart.frame.setAxisLabels(common.axes.protonNumberStringProperty, strings.yAxisStringProperty);
    const parabolaPath = new Path(null, {
      stroke: NuclideChartColors.referenceLineColorProperty,
      lineWidth: 1.2,
      opacity: 0.7,
    });
    const arrows = new Node();
    const labels = new Node();
    chart.underLayer.children = [parabolaPath, arrows];
    chart.overLayer.children = [labels];

    const update = (): void => {
      const analysis = model.analysisProperty.value;
      const definition = model.shared.stabilityDefinition;
      const members = analysis.members;
      if (members.length === 0) {
        return;
      }
      const zCenter = Math.round(
        analysis.betaStable[0]?.z ??
          members.reduce((best, x) => ((x.massExcess ?? 0) < (best.massExcess ?? 0) ? x : best)).z,
      );
      const zRange = new Range(zCenter - Z_HALF_WIDTH - 0.5, zCenter + Z_HALF_WIDTH + 0.5);
      const shown = members.filter((x) => zRange.contains(x.z));
      const floor = Math.min(...shown.map((x) => x.massExcess ?? 0));
      const height = (x: Nuclide): number => ((x.massExcess ?? 0) - floor) / 1000;
      const top = Math.min(30, Math.max(6, Math.max(...shown.map(height)) * 1.08 + 0.5));
      chart.setAxes({ range: zRange, log: false }, { range: new Range(-0.4, top), log: false });

      const points: ScatterPoint[] = shown.map((x) => ({
        nuclide: x,
        x: x.z,
        y: height(x),
        group: parityGroup(x) + (isStableUnder(x, definition) ? 3 : 0),
      }));
      chart.setPoints(points, STYLES);

      // Parabolas, relative to the same floor.
      parabolaPath.shape = model.parabolasVisibleProperty.value
        ? this.parabolaShape(chart, analysis, zRange, floor)
        : null;

      // Allowed decays as arrows between isobars.
      for (const child of arrows.children) {
        child.dispose();
      }
      arrows.children = model.arrowsVisibleProperty.value
        ? analysis.transitions
            .filter((t) => zRange.contains(t.from.z) && zRange.contains(t.to.z))
            .map((t) => this.arrowFor(chart, t, height))
        : [];

      for (const child of labels.children) {
        child.dispose();
      }
      labels.children = points.map((p) => {
        const view = chart.viewPosition(p.x, p.y) ?? Vector2.ZERO;
        return new RichText(nuclideMarkup(p.nuclide), {
          font: FONTS.CHART_LABEL,
          fill: NuclideChartColors.textColorProperty,
          centerX: view.x,
          bottom: view.y - MARKER_RADIUS - 3,
        });
      });
    };
    Multilink.multilink(
      [
        model.analysisProperty,
        model.parabolasVisibleProperty,
        model.arrowsVisibleProperty,
        model.shared.stabilityDefinitionProperty,
      ],
      update,
    );

    // ── Strip: choose A ───────────────────────────────────────────────────────
    const aSlider = new HSlider(model.massNumberProperty, model.massNumberProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(230),
      constrainValue: (value: number) => Math.round(value),
      keyboardStep: 1,
      shiftKeyboardStep: 1,
      pageKeyboardStep: 10,
      accessibleName: strings.massNumberStringProperty,
    });
    const aReadout = new Text(new DerivedProperty([model.massNumberProperty], (a) => `A = ${a}`), {
      font: FONTS.READOUT,
      fill: NuclideChartColors.textColorProperty,
    });
    const quickButtons = QUICK_MASS_NUMBERS.map(
      (a) =>
        new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          content: new Text(String(a), { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL }),
          listener: () => {
            model.massNumberProperty.value = a;
          },
          accessibleName: `A = ${a}`,
        }),
    );
    const strip = new HBox({
      spacing: 14,
      children: [
        label(strings.massNumberStringProperty, 120),
        aSlider,
        aReadout,
        new HBox({ spacing: 6, children: [label(strings.quickPicksStringProperty, 50), ...quickButtons] }),
      ],
    });

    // ── Panels ────────────────────────────────────────────────────────────────
    const legendEntry = (shape: MarkerShape, fill: TColor, text: TReadOnlyProperty<string>): HBox => {
      const marker = markerShape(shape, MARKER_RADIUS - 1);
      return new HBox({
        spacing: 6,
        children: [
          new Path(marker, { fill, stroke: NuclideChartColors.axisColorProperty, lineWidth: 0.5 }),
          label(text, 110, FONTS.SMALL),
        ],
      });
    };
    const arrowEntry = (fill: TColor, text: TReadOnlyProperty<string>): HBox =>
      new HBox({
        spacing: 6,
        children: [
          new ArrowNode(0, 0, 22, 0, { fill, stroke: null, headHeight: 7, headWidth: 8, tailWidth: 2 }),
          label(text, 110, FONTS.SMALL),
        ],
      });
    const legend = new VBox({
      spacing: 3,
      align: "left",
      children: [
        new HBox({
          spacing: 14,
          align: "top",
          children: [
            new VBox({
              spacing: 3,
              align: "left",
              children: [
                legendEntry("circle", NuclideChartColors.pointColorProperty, strings.legend.evenEvenStringProperty),
                legendEntry("square", NuclideChartColors.pointColorProperty, strings.legend.oddOddStringProperty),
                legendEntry("diamond", NuclideChartColors.pointColorProperty, strings.legend.oddAStringProperty),
                legendEntry("circle", NuclideChartColors.stablePointColorProperty, strings.legend.stableStringProperty),
              ],
            }),
            new VBox({
              spacing: 3,
              align: "left",
              children: [
                arrowEntry(NuclideChartColors.betaMinusColorProperty, strings.legend.betaMinusStringProperty),
                arrowEntry(NuclideChartColors.betaPlusColorProperty, strings.legend.electronCaptureStringProperty),
                arrowEntry(NuclideChartColors.alphaColorProperty, strings.legend.doubleBetaStringProperty),
              ],
            }),
          ],
        }),
      ],
    });
    const parabolaCheckbox = checkbox(model.parabolasVisibleProperty, strings.showParabolasStringProperty);
    const arrowCheckbox = checkbox(model.arrowsVisibleProperty, strings.showArrowsStringProperty);
    const controlsPanel = new NuclideChartPanel(
      new VBox({ spacing: 6, align: "left", children: [parabolaCheckbox, arrowCheckbox, legend] }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    const list = (nuclides: readonly Nuclide[], none: string): string =>
      nuclides.length === 0 ? none : nuclides.map((x) => nuclideMarkup(x)).join(", ");
    const stableText = new DerivedProperty(
      [strings.stablePatternStringProperty, strings.noneStringProperty, model.analysisProperty],
      (pattern, none, analysis) => StringUtils.fillIn(pattern, { list: list(analysis.betaStable, none) }),
    );
    const doubleBetaText = new DerivedProperty(
      [strings.doubleBetaPatternStringProperty, strings.noneStringProperty, model.analysisProperty],
      (pattern, none, analysis: IsobarAnalysis) => {
        const double = analysis.transitions.filter(
          (t) => t.kind === "doubleBetaMinus" || t.kind === "doubleElectronCapture",
        );
        const text = double.map(
          (t) => `${nuclideMarkup(t.from)} → ${nuclideMarkup(t.to)} (${formatFixed(t.q / 1000, 3)} MeV)`,
        );
        return StringUtils.fillIn(pattern, { list: text.length > 0 ? text.join(", ") : none });
      },
    );
    const hintText = new DerivedProperty(
      [strings.oddAHintStringProperty, strings.evenAHintStringProperty, model.massNumberProperty],
      (odd, even, a) => (a % 2 === 1 ? odd : even),
    );
    const readoutPanel = new NuclideChartPanel(
      new VBox({
        spacing: 5,
        align: "left",
        children: [
          label(stableText, PANEL_CONTENT_WIDTH, FONTS.READOUT),
          new RichText(doubleBetaText, {
            font: FONTS.LABEL,
            fill: NuclideChartColors.textColorProperty,
            lineWrap: PANEL_CONTENT_WIDTH,
          }),
          new RichText(hintText, {
            font: FONTS.SMALL,
            fill: NuclideChartColors.textColorProperty,
            lineWrap: PANEL_CONTENT_WIDTH,
          }),
          new RichText(strings.mattauchStringProperty, {
            font: FONTS.SMALL,
            fill: NuclideChartColors.textColorProperty,
            lineWrap: PANEL_CONTENT_WIDTH,
          }),
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );
    const cardPanel = new NuclideChartPanel(new NuclideCardNode(selected, { contentWidth: PANEL_CONTENT_WIDTH }), {
      minWidth: PANEL_COLUMN_WIDTH,
      maxWidth: PANEL_COLUMN_WIDTH,
    });

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
    });

    this.children = [
      placeInRegion(chart, layout.chart),
      placeInRegion(strip, layout.strip),
      placeInRegion(new VBox({ spacing: 8, children: [controlsPanel, readoutPanel, cardPanel] }), layout.panels, {
        yAlign: "top",
      }),
      placeInRegion(
        new HBox({
          spacing: 10,
          align: "bottom",
          children: [new DataCreditNode(PANEL_COLUMN_WIDTH - 60), resetAllButton],
        }),
        layout.footer,
        { xAlign: "right", yAlign: "bottom" },
      ),
    ];
    this.pdomPlayAreaNode.pdomOrder = [chart, aSlider, ...quickButtons];
    this.pdomControlAreaNode.pdomOrder = [parabolaCheckbox, arrowCheckbox, resetAllButton];
  }

  /** The fitted mass parabolas over a range of Z, measured from the same floor as the points. */
  private parabolaShape(chart: NuclideScatterNode, analysis: IsobarAnalysis, zRange: Range, floor: number): Shape {
    const shape = new Shape();
    for (const parabola of analysis.parabolas) {
      let started = false;
      for (let z = zRange.min; z <= zRange.max; z += 0.1) {
        const view = chart.viewPosition(
          z,
          (parabola.minimum + parabola.curvature * (z - parabola.zMin) ** 2 - floor) / 1000,
        );
        if (view && started) {
          shape.lineToPoint(view);
        } else if (view) {
          shape.moveToPoint(view);
          started = true;
        }
      }
    }
    return shape;
  }

  /** An arrow from one isobar to another, shortened so it does not cover the markers. */
  private arrowFor(chart: NuclideScatterNode, t: IsobarTransition, height: (x: Nuclide) => number): Node {
    const from = chart.viewPosition(t.from.z, height(t.from)) ?? Vector2.ZERO;
    const to = chart.viewPosition(t.to.z, height(t.to)) ?? Vector2.ZERO;
    const direction = to.minus(from);
    const length = direction.magnitude;
    const unit = length > 0 ? direction.dividedScalar(length) : Vector2.X_UNIT;
    const gap = MARKER_RADIUS + 3;
    const start = from.plus(unit.timesScalar(gap));
    const end = to.minus(unit.timesScalar(gap));
    const fill =
      t.kind === "betaMinus"
        ? NuclideChartColors.betaMinusColorProperty
        : t.kind === "electronCapture"
          ? NuclideChartColors.betaPlusColorProperty
          : NuclideChartColors.alphaColorProperty;
    return new ArrowNode(start.x, start.y, end.x, end.y, {
      fill,
      stroke: null,
      headHeight: 8,
      headWidth: 8,
      tailWidth: t.kind.startsWith("double") ? 1.5 : 2,
      opacity: 0.9,
    });
  }
}
