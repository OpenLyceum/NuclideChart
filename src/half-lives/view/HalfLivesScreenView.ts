/**
 * HalfLivesScreenView.ts
 *
 * The Half-Lives screen: every measured half-life against A or distance from the valley (log or linear), the
 * Geiger–Nuttall lines of even–even α emitters, and Sargent's β⁻ systematics. Guides mark one second, one
 * year, the age of the Earth and the age of the Universe; call-outs mark the nuclides students meet
 * (K-40, U-238, C-14, Tc-99m …).
 */

import { DerivedProperty, Multilink, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Line, Node, Path, Rectangle, RichText, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import { DECAY_CATEGORY_COLORS } from "../../chart/view/mapColors.js";
import { DecayCategory, decayCategoryOf } from "../../common/model/DecayCategory.js";
import { FITTED_MASS_FORMULA } from "../../common/model/fittedMassFormula.js";
import {
  distanceFromValley,
  fitLine,
  type GeigerNuttallPoint,
  geigerNuttallFits,
  geigerNuttallPoints,
  sargentPoints,
} from "../../common/model/halfLifeTrends.js";
import { AGE_OF_EARTH_S, SECONDS_PER_YEAR } from "../../common/model/NuclearConstants.js";
import { NUCLIDE_TABLE, type Nuclide, requireIsomer } from "../../common/model/NuclideTable.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/NuclideChartButtonOptions.js";
import { NUCLIDE_CHART_CHECKBOX_OPTIONS } from "../../common/NuclideChartControlOptions.js";
import { NuclideChartPanel } from "../../common/NuclideChartPanel.js";
import { DataCreditNode } from "../../common/view/DataCreditNode.js";
import { formatFixed } from "../../common/view/format.js";
import { NuclideCardNode, nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { NuclideScatterNode, type ScatterPoint } from "../../common/view/NuclideScatterNode.js";
import type { PointStyle } from "../../common/view/PointCloudNode.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS, PANEL_COLUMN_WIDTH } from "../../NuclideChartConstants.js";
import { HalfLifeView, type HalfLivesModel } from "../model/HalfLivesModel.js";
import { HalfLivesScreenSummaryContent } from "./HalfLivesScreenSummaryContent.js";

export type HalfLivesScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 590;
const CHART_HEIGHT = 500;
const PANEL_CONTENT_WIDTH = PANEL_COLUMN_WIDTH - 24;
const AGE_OF_UNIVERSE_S = 13.8e9 * SECONDS_PER_YEAR;

/** Nuclides called out on the explorer, chosen for what students meet in class. */
const NOTABLE = ["K-40", "U-238", "U-235", "Th-232", "Pu-244", "Np-237", "C-14", "I-131", "Cs-137", "Te-128"];

/** Decay categories of radioactive nuclides, in style order. */
const CATEGORIES = [
  DecayCategory.BETA_MINUS,
  DecayCategory.BETA_PLUS,
  DecayCategory.ALPHA,
  DecayCategory.FISSION,
  DecayCategory.PROTON,
  DecayCategory.NEUTRON,
  DecayCategory.ISOMERIC,
  DecayCategory.UNKNOWN,
];

const css =
  (property: { value: { toCSS(): string } }): (() => string) =>
  () =>
    property.value.toCSS();

const CATEGORY_STYLES: readonly PointStyle[] = CATEGORIES.map((category) => ({
  css: css(DECAY_CATEGORY_COLORS.get(category) ?? NuclideChartColors.pointColorProperty),
  radius: 1.8,
  alpha: 0.85,
}));

const TWO_STYLES: readonly PointStyle[] = [
  { css: css(NuclideChartColors.pointColorProperty), radius: 2.2, alpha: 0.8 },
  { css: css(NuclideChartColors.highlightColorProperty), radius: 3.2, alpha: 1 },
];

/** Measured half-lives (no limits) of radioactive ground states. */
const MEASURED = NUCLIDE_TABLE.nuclides.filter(
  (x) => !x.isStable && x.halfLife !== null && x.halfLife > 0 && x.halfLifeOperator === "",
);
const GEIGER_NUTTALL = geigerNuttallPoints();
const GEIGER_NUTTALL_FITS = geigerNuttallFits(GEIGER_NUTTALL);
const SARGENT = sargentPoints();
const SARGENT_FIT = fitLine(
  SARGENT.map((p) => Math.log10(p.qBeta)),
  SARGENT.map((p) => p.logHalfLife),
);

export class HalfLivesScreenView extends ScreenView {
  public constructor(model: HalfLivesModel, providedOptions?: HalfLivesScreenViewOptions) {
    const options = optionize<HalfLivesScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new HalfLivesScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getHalfLivesStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getHalfLivesA11yStrings();
    const layout = chartAndPanelsLayout(this.layoutBounds);
    const selected = model.shared.selectedNuclideProperty;

    const label = (
      text: TReadOnlyProperty<string> | string,
      maxWidth = PANEL_CONTENT_WIDTH,
      font = FONTS.LABEL,
    ): RichText => new RichText(text, { font, fill: NuclideChartColors.textColorProperty, maxWidth });
    const checkbox = (property: Property<boolean>, text: TReadOnlyProperty<string>): Checkbox =>
      new Checkbox(property, label(text, 230), { ...NUCLIDE_CHART_CHECKBOX_OPTIONS, accessibleName: text });

    const chart = new NuclideScatterNode(selected, CHART_WIDTH, CHART_HEIGHT, {
      accessibleName: a11y.controls.chartStringProperty,
      accessibleHelpText: a11y.controls.chartHelpStringProperty,
    });
    const guidePath = new Path(null, { stroke: NuclideChartColors.axisColorProperty, lineWidth: 1, lineDash: [4, 4] });
    const earthPath = new Path(null, { stroke: NuclideChartColors.valleyLineColorProperty, lineWidth: 2 });
    const fitsPath = new Path(null, { stroke: NuclideChartColors.pointColorProperty, lineWidth: 0.8, opacity: 0.6 });
    const highlightFitPath = new Path(null, { stroke: NuclideChartColors.highlightColorProperty, lineWidth: 2.2 });
    const guideLabels = new Node();
    const callouts = new Node();
    chart.underLayer.children = [guidePath, fitsPath, highlightFitPath, earthPath];
    chart.overLayer.children = [guideLabels, callouts];

    const disposeChildren = (node: Node): void => {
      for (const child of node.children) {
        child.dispose();
      }
    };
    const smallLabel = (
      text: string | TReadOnlyProperty<string>,
      fill = NuclideChartColors.axisColorProperty,
    ): RichText => new RichText(text, { font: FONTS.CHART_LABEL, fill, maxWidth: CHART_WIDTH / 2 });

    /** A horizontal guide at a half-life, with its label at the right. */
    const horizontalGuide = (
      shape: Shape,
      seconds: number,
      text: TReadOnlyProperty<string>,
      logScale: boolean,
      labels: Node[],
      alignLeft = false,
      below = false,
    ): void => {
      const y = logScale ? seconds : seconds / SECONDS_PER_YEAR / 1e9;
      const view = chart.viewPosition(chart.frame.axes.x.range.min, y);
      if (!view || view.y < 0 || view.y > CHART_HEIGHT) {
        return;
      }
      shape.moveTo(0, view.y).lineTo(CHART_WIDTH, view.y);
      const guideLabel = smallLabel(text);
      if (alignLeft) {
        guideLabel.left = 4;
      } else {
        guideLabel.right = CHART_WIDTH - 4;
      }
      if (below) {
        guideLabel.top = view.y + 2;
      } else {
        guideLabel.bottom = view.y - 2;
      }
      labels.push(guideLabel);
    };

    const explorerX = (x: Nuclide): number =>
      model.explorerAxisProperty.value === "massNumber" ? x.a : distanceFromValley(x, FITTED_MASS_FORMULA.coefficients);

    const updateExplorer = (): void => {
      const logScale = model.logScaleProperty.value;
      const byA = model.explorerAxisProperty.value === "massNumber";
      chart.setAxes(
        { range: byA ? new Range(0, 300) : new Range(-16, 12), log: false },
        logScale ? { range: new Range(1e-24, 1e34), log: true } : { range: new Range(0, 16), log: false },
      );
      chart.frame.setAxisLabels(
        byA ? common.axes.massNumberStringProperty : strings.axes.valleyDistanceStringProperty,
        logScale ? strings.axes.halfLifeLogStringProperty : strings.axes.halfLifeLinearStringProperty,
      );
      const definition = model.shared.stabilityDefinition;
      const points: ScatterPoint[] = MEASURED.map((x) => ({
        nuclide: x,
        x: explorerX(x),
        y: logScale ? (x.halfLife as number) : (x.halfLife as number) / SECONDS_PER_YEAR / 1e9,
        group: Math.max(0, CATEGORIES.indexOf(decayCategoryOf(x, definition))),
      }));
      chart.setPoints(points, CATEGORY_STYLES);

      const guides = new Shape();
      const labels: Node[] = [];
      if (logScale) {
        horizontalGuide(guides, 1, strings.guides.secondStringProperty, true, labels);
        horizontalGuide(guides, SECONDS_PER_YEAR, strings.guides.yearStringProperty, true, labels);
        horizontalGuide(guides, AGE_OF_UNIVERSE_S, strings.guides.universeStringProperty, true, labels, true);
      } else {
        labels.push(
          Object.assign(
            new RichText(strings.linearNoteStringProperty, {
              font: FONTS.LABEL,
              fill: NuclideChartColors.textColorProperty,
              lineWrap: CHART_WIDTH - 40,
            }),
            { left: 20, top: 30 },
          ),
        );
      }
      const earth = new Shape();
      if (model.earthAgeVisibleProperty.value) {
        horizontalGuide(earth, AGE_OF_EARTH_S, strings.guides.earthStringProperty, logScale, labels, true, true);
      }
      guidePath.shape = guides;
      earthPath.shape = earth;
      fitsPath.shape = null;
      highlightFitPath.shape = null;
      disposeChildren(guideLabels);
      guideLabels.children = labels;

      disposeChildren(callouts);
      const calloutNodes: Node[] = [];
      if (model.notableVisibleProperty.value) {
        const placed: Node[] = [];
        const candidates = NOTABLE.map((labelText) => {
          const x = NUCLIDE_TABLE.require(labelText);
          const p = chart.pointOf(x);
          return { x, view: p ? chart.viewPosition(p.x, p.y) : null };
        })
          .filter((c) => c.view !== null && c.view.y > 8 && c.view.y < CHART_HEIGHT - 4)
          .sort((p, q) => (p.view?.y ?? 0) - (q.view?.y ?? 0));
        for (const { x, view } of candidates) {
          if (!view) {
            continue;
          }
          const text = smallLabel(nuclideMarkup(x), NuclideChartColors.highlightColorProperty);
          text.left = view.x + 4;
          text.bottom = view.y - 1;
          // Stack a label below any label it would overlap, then join it to its point with a leader.
          for (let pass = 0; pass <= placed.length; pass++) {
            const clash = placed.find((other) => other.bounds.intersectsBounds(text.bounds));
            if (!clash) {
              break;
            }
            text.top = clash.bottom + 1;
            text.left = Math.max(text.left, clash.left);
          }
          placed.push(text);
          if (text.bottom > view.y + 2 || text.left > view.x + 6) {
            calloutNodes.push(
              new Line(view.x, view.y, text.left - 1, text.centerY, {
                stroke: NuclideChartColors.highlightColorProperty,
                lineWidth: 0.5,
              }),
            );
          }
          calloutNodes.push(text);
        }
        // Tc-99m is an isomer: it is not among the ground states, so it is marked by hand.
        const tc = requireIsomer("Tc-99m");
        const tcGround = NUCLIDE_TABLE.get(tc.z, tc.n);
        if (tcGround && tc.halfLife !== null) {
          const view = chart.viewPosition(
            explorerX(tcGround),
            logScale ? tc.halfLife : tc.halfLife / SECONDS_PER_YEAR / 1e9,
          );
          if (view && view.y > 8 && view.y < CHART_HEIGHT - 4) {
            calloutNodes.push(
              new Rectangle(view.x - 3, view.y - 3, 6, 6, { stroke: NuclideChartColors.highlightColorProperty }),
              Object.assign(smallLabel("<sup>99m</sup>Tc", NuclideChartColors.highlightColorProperty), {
                left: view.x + 5,
                top: view.y + 1,
              }),
            );
          }
        }
      }
      callouts.children = calloutNodes;
    };

    const fitLineShape = (slope: number, intercept: number, xRange: Range, log: boolean): Shape => {
      const shape = new Shape();
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const x = xRange.min + (xRange.getLength() * i) / steps;
        const yLog = slope * (log ? Math.log10(x) : x) + intercept;
        const view = chart.viewPosition(x, 10 ** yLog);
        if (view) {
          if (i === 0) {
            shape.moveToPoint(view);
          } else {
            shape.lineToPoint(view);
          }
        }
      }
      return shape;
    };

    const updateGeigerNuttall = (): void => {
      const xRange = new Range(0.3, 0.56);
      chart.setAxes({ range: xRange, log: false }, { range: new Range(1e-8, 1e24), log: true });
      chart.frame.setAxisLabels(strings.axes.qAlphaInverseRootStringProperty, strings.axes.alphaHalfLifeStringProperty);
      const z = selected.value.z;
      const points = GEIGER_NUTTALL.map((p: GeigerNuttallPoint) => ({
        nuclide: p.nuclide,
        x: p.x,
        y: 10 ** p.logHalfLife,
        group: p.nuclide.z === z ? 1 : 0,
      }));
      points.sort((p, q) => p.group - q.group);
      chart.setPoints(points, TWO_STYLES);
      const all = new Shape();
      if (model.fitsVisibleProperty.value) {
        for (const [fz, fit] of GEIGER_NUTTALL_FITS) {
          if (fit.count >= 5 && fz !== z) {
            const xs = GEIGER_NUTTALL.filter((p) => p.nuclide.z === fz).map((p) => p.x);
            all.subpaths.push(
              ...fitLineShape(fit.slope, fit.intercept, new Range(Math.min(...xs), Math.max(...xs)), false).subpaths,
            );
          }
        }
      }
      fitsPath.shape = new Shape(all.subpaths);
      const own = GEIGER_NUTTALL_FITS.get(z);
      const ownXs = GEIGER_NUTTALL.filter((p) => p.nuclide.z === z).map((p) => p.x);
      highlightFitPath.shape =
        own && ownXs.length >= 3
          ? fitLineShape(
              own.slope,
              own.intercept,
              new Range(Math.min(...ownXs) - 0.01, Math.max(...ownXs) + 0.01),
              false,
            )
          : null;
      guidePath.shape = null;
      earthPath.shape = null;
      disposeChildren(guideLabels);
      guideLabels.children = [];
      disposeChildren(callouts);
      callouts.children = model.comparisonVisibleProperty.value
        ? ["Po-212", "Th-232"].flatMap((labelText) => {
            const p = chart.pointOf(NUCLIDE_TABLE.require(labelText));
            const view = p ? chart.viewPosition(p.x, p.y) : null;
            return view
              ? [
                  new Rectangle(view.x - 5, view.y - 5, 10, 10, {
                    stroke: NuclideChartColors.alphaColorProperty,
                    lineWidth: 2,
                  }),
                  Object.assign(
                    smallLabel(nuclideMarkup(NUCLIDE_TABLE.require(labelText)), NuclideChartColors.alphaColorProperty),
                    {
                      left: view.x + 7,
                      centerY: view.y,
                    },
                  ),
                ]
              : [];
          })
        : [];
    };

    const updateSargent = (): void => {
      const xRange = new Range(0.01, 30);
      chart.setAxes({ range: xRange, log: true }, { range: new Range(1e-4, 1e20), log: true });
      chart.frame.setAxisLabels(strings.axes.qBetaStringProperty, strings.axes.betaHalfLifeStringProperty);
      chart.setPoints(
        SARGENT.map((p) => ({ nuclide: p.nuclide, x: p.qBeta, y: 10 ** p.logHalfLife, group: 0 })),
        TWO_STYLES,
      );
      highlightFitPath.shape = SARGENT_FIT
        ? fitLineShape(SARGENT_FIT.slope, SARGENT_FIT.intercept, xRange, true)
        : null;
      fitsPath.shape = null;
      guidePath.shape = null;
      earthPath.shape = null;
      disposeChildren(guideLabels);
      guideLabels.children = [];
      disposeChildren(callouts);
      callouts.children = [];
    };

    const update = (): void => {
      const view = model.viewProperty.value;
      if (view === HalfLifeView.EXPLORER) {
        updateExplorer();
      } else if (view === HalfLifeView.GEIGER_NUTTALL) {
        updateGeigerNuttall();
      } else {
        updateSargent();
      }
    };
    Multilink.multilink(
      [
        model.viewProperty,
        model.explorerAxisProperty,
        model.logScaleProperty,
        model.earthAgeVisibleProperty,
        model.notableVisibleProperty,
        model.fitsVisibleProperty,
        model.comparisonVisibleProperty,
        model.shared.stabilityDefinitionProperty,
      ],
      update,
    );
    // The Geiger–Nuttall view needs an α emitter selected to highlight a line; start from Po-212.
    model.viewProperty.lazyLink((view) => {
      if (view === HalfLifeView.GEIGER_NUTTALL && !GEIGER_NUTTALL.some((p) => p.nuclide === selected.value)) {
        selected.value = NUCLIDE_TABLE.require("Po-212");
      }
    });
    let lastZ = selected.value.z;
    selected.lazyLink((nuclide) => {
      if (model.viewProperty.value === HalfLifeView.GEIGER_NUTTALL && nuclide.z !== lastZ) {
        update();
      }
      lastZ = nuclide.z;
    });

    // ── Controls ──────────────────────────────────────────────────────────────
    const views = strings.views as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const viewGroup = new AquaRadioButtonGroup(
      model.viewProperty,
      HalfLifeView.enumeration.values.map((view) => ({
        value: view,
        createNode: () => label(views[`${view.key}StringProperty`] as TReadOnlyProperty<string>, 240),
      })),
      {
        orientation: "vertical",
        spacing: 5,
        radioButtonOptions: { radius: 7 },
        accessibleName: strings.viewTitleStringProperty,
      },
    );
    const axisGroup = new AquaRadioButtonGroup<string>(
      model.explorerAxisProperty,
      [
        { value: "massNumber", createNode: () => label(strings.xAxes.massNumberStringProperty, 200) },
        { value: "valleyDistance", createNode: () => label(strings.xAxes.valleyDistanceStringProperty, 200) },
      ],
      {
        orientation: "vertical",
        spacing: 4,
        radioButtonOptions: { radius: 6 },
        accessibleName: strings.xAxisTitleStringProperty,
      },
    );
    const logCheckbox = checkbox(model.logScaleProperty, strings.logScaleStringProperty);
    const earthCheckbox = checkbox(model.earthAgeVisibleProperty, strings.earthAgeStringProperty);
    const notableCheckbox = checkbox(model.notableVisibleProperty, strings.notableStringProperty);
    const survivorsCount = MEASURED.filter((x) => (x.halfLife ?? 0) > AGE_OF_EARTH_S).length;
    const survivors = new RichText(
      new DerivedProperty([strings.survivorsPatternStringProperty], (pattern) =>
        StringUtils.fillIn(pattern, { count: survivorsCount }),
      ),
      { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty, lineWrap: PANEL_CONTENT_WIDTH },
    );
    const explorerControls = new VBox({
      spacing: 5,
      align: "left",
      children: [
        label(strings.xAxisTitleStringProperty, 200, FONTS.SMALL),
        axisGroup,
        logCheckbox,
        earthCheckbox,
        notableCheckbox,
        survivors,
      ],
    });

    const fitsCheckbox = checkbox(model.fitsVisibleProperty, strings.fitsStringProperty);
    const comparisonCheckbox = checkbox(model.comparisonVisibleProperty, strings.comparisonStringProperty);
    const fitText = new DerivedProperty(
      [strings.fitPatternStringProperty, strings.noFitStringProperty, selected],
      (pattern, none, nuclide) => {
        const fit = GEIGER_NUTTALL_FITS.get(nuclide.z);
        return fit
          ? StringUtils.fillIn(pattern, {
              element: nuclide.symbol,
              slope: formatFixed(fit.slope, 0),
              r2: formatFixed(fit.rSquared, 3),
              count: fit.count,
            })
          : none;
      },
    );
    const po = GEIGER_NUTTALL.find((p) => p.nuclide.label === "Po-212");
    const th = GEIGER_NUTTALL.find((p) => p.nuclide.label === "Th-232");
    const comparisonText = new DerivedProperty([strings.comparisonPatternStringProperty], (pattern) =>
      po && th
        ? StringUtils.fillIn(pattern, {
            qRatio: formatFixed(po.qAlpha / th.qAlpha, 2),
            qLow: formatFixed(th.qAlpha, 2),
            qHigh: formatFixed(po.qAlpha, 2),
            orders: formatFixed(th.logHalfLife - po.logHalfLife, 1),
          })
        : "",
    );
    const geigerControls = new VBox({
      spacing: 5,
      align: "left",
      children: [
        fitsCheckbox,
        new RichText(fitText, {
          font: FONTS.SMALL,
          fill: NuclideChartColors.textColorProperty,
          lineWrap: PANEL_CONTENT_WIDTH,
        }),
        comparisonCheckbox,
        new RichText(comparisonText, {
          font: FONTS.SMALL,
          fill: NuclideChartColors.textColorProperty,
          lineWrap: PANEL_CONTENT_WIDTH,
          visibleProperty: model.comparisonVisibleProperty,
        }),
      ],
    });
    const sargentText = new RichText(
      new DerivedProperty([strings.sargentPatternStringProperty], (pattern) =>
        StringUtils.fillIn(pattern, { slope: formatFixed(SARGENT_FIT?.slope ?? 0, 2), count: SARGENT.length }),
      ),
      { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty, lineWrap: PANEL_CONTENT_WIDTH },
    );
    model.viewProperty.link((view) => {
      explorerControls.visible = view === HalfLifeView.EXPLORER;
      geigerControls.visible = view === HalfLifeView.GEIGER_NUTTALL;
      sargentText.visible = view === HalfLifeView.SARGENT;
    });
    const controlsPanel = new NuclideChartPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [viewGroup, new Node({ children: [explorerControls, geigerControls, sargentText] })],
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
      placeInRegion(new VBox({ spacing: 8, children: [controlsPanel, cardPanel] }), layout.panels, { yAlign: "top" }),
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
    this.pdomPlayAreaNode.pdomOrder = [chart, viewGroup];
    this.pdomControlAreaNode.pdomOrder = [
      axisGroup,
      logCheckbox,
      earthCheckbox,
      notableCheckbox,
      fitsCheckbox,
      comparisonCheckbox,
      resetAllButton,
    ];
  }
}
