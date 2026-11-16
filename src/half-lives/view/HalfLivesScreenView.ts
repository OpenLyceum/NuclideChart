import { HALF_LIVES_SCREEN_VIEW_SETTINGS } from "../../NuclideChartConstants.js";
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
import { DecayCategory } from "../../common/model/DecayCategory.js";
import { explorerHalfLifeY, type GeigerNuttallFitSegment } from "../../common/model/halfLifeTrends.js";
import { AGE_OF_EARTH_S, SECONDS_PER_YEAR } from "../../common/model/NuclearConstants.js";
import { NUCLIDE_TABLE, requireIsomer } from "../../common/model/NuclideTable.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/NuclideChartButtonOptions.js";
import { NUCLIDE_CHART_CHECKBOX_OPTIONS } from "../../common/NuclideChartControlOptions.js";
import { NuclideChartPanel } from "../../common/NuclideChartPanel.js";
import { DataCreditNode } from "../../common/view/DataCreditNode.js";
import { formatFixed } from "../../common/view/format.js";
import { DECAY_CATEGORY_COLORS } from "../../common/view/mapColors.js";
import { NuclideCardNode, nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { NuclideScatterNode, type ScatterPoint } from "../../common/view/NuclideScatterNode.js";
import type { PointStyle } from "../../common/view/PointCloudNode.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import {
  CONTROLS,
  FONTS,
  HALF_LIVES,
  LAYOUT,
  PANEL_COLUMN_WIDTH,
  PANEL_CONTENT_WIDTH,
  PANEL_CREDIT_WIDTH,
  SCATTER_CHART,
} from "../../NuclideChartConstants.js";
import { HalfLifeView, type HalfLivesModel } from "../model/HalfLivesModel.js";
import { HalfLivesScreenSummaryContent } from "./HalfLivesScreenSummaryContent.js";

export type HalfLivesScreenViewOptions = ScreenViewOptions;

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
  radius: HALF_LIVES_SCREEN_VIEW_SETTINGS.CATEGORY_STYLES_RADIUS,
  alpha: HALF_LIVES_SCREEN_VIEW_SETTINGS.CATEGORY_STYLES_ALPHA,
}));

const TWO_STYLES: readonly PointStyle[] = [
  {
    css: css(NuclideChartColors.pointColorProperty),
    radius: HALF_LIVES_SCREEN_VIEW_SETTINGS.TWO_STYLES_RADIUS,
    alpha: HALF_LIVES_SCREEN_VIEW_SETTINGS.TWO_STYLES_ITEM_1_ALPHA,
  },
  {
    css: css(NuclideChartColors.highlightColorProperty),
    radius: HALF_LIVES_SCREEN_VIEW_SETTINGS.TWO_STYLES_ITEM_2_RADIUS,
    alpha: 1,
  },
];

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
      new Checkbox(property, label(text, HALF_LIVES_SCREEN_VIEW_SETTINGS.CHECKBOX_MAX_WIDTH), {
        ...NUCLIDE_CHART_CHECKBOX_OPTIONS,
        accessibleName: text,
      });

    const chart = new NuclideScatterNode(selected, SCATTER_CHART.WIDTH, SCATTER_CHART.HEIGHT, {
      accessibleName: a11y.controls.chartStringProperty,
      accessibleHelpText: a11y.controls.chartHelpStringProperty,
    });
    const guidePath = new Path(null, {
      stroke: NuclideChartColors.axisColorProperty,
      lineWidth: 1,
      lineDash: [
        HALF_LIVES_SCREEN_VIEW_SETTINGS.GUIDE_PATH_LINE_DASH_DASH,
        HALF_LIVES_SCREEN_VIEW_SETTINGS.GUIDE_PATH_LINE_DASH_DASH,
      ],
    });
    const earthPath = new Path(null, {
      stroke: NuclideChartColors.valleyLineColorProperty,
      lineWidth: HALF_LIVES_SCREEN_VIEW_SETTINGS.EARTH_PATH_LINE_WIDTH,
    });
    const fitsPath = new Path(null, {
      stroke: NuclideChartColors.pointColorProperty,
      lineWidth: HALF_LIVES_SCREEN_VIEW_SETTINGS.FITS_PATH_LINE_WIDTH,
      opacity: HALF_LIVES_SCREEN_VIEW_SETTINGS.FITS_PATH_OPACITY,
    });
    const highlightFitPath = new Path(null, {
      stroke: NuclideChartColors.highlightColorProperty,
      lineWidth: HALF_LIVES_SCREEN_VIEW_SETTINGS.HIGHLIGHT_FIT_PATH_LINE_WIDTH,
    });
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
    ): RichText => new RichText(text, { font: FONTS.CHART_LABEL, fill, maxWidth: SCATTER_CHART.WIDTH / 2 });

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
      const y = explorerHalfLifeY(seconds, logScale);
      const view = chart.viewPosition(chart.frame.axes.x.range.min, y);
      if (!view || view.y < 0 || view.y > SCATTER_CHART.HEIGHT) {
        return;
      }
      shape.moveTo(0, view.y).lineTo(SCATTER_CHART.WIDTH, view.y);
      const guideLabel = smallLabel(text);
      if (alignLeft) {
        guideLabel.left = HALF_LIVES_SCREEN_VIEW_SETTINGS.GUIDE_LABEL_LEFT;
      } else {
        guideLabel.right = SCATTER_CHART.WIDTH - HALF_LIVES_SCREEN_VIEW_SETTINGS.HORIZONTAL_GUIDE_RIGHT_OFFSET;
      }
      if (below) {
        guideLabel.top = view.y + 2;
      } else {
        guideLabel.bottom = view.y - 2;
      }
      labels.push(guideLabel);
    };

    /** Puts a label at (left, bottom), then stacks it below any already-placed label it would overlap. */
    const placeClear = (text: Node, left: number, bottom: number, placed: readonly Node[]): void => {
      text.left = left;
      text.bottom = bottom;
      for (let pass = 0; pass <= placed.length; pass++) {
        const clash = placed.find((other) => other.bounds.intersectsBounds(text.bounds));
        if (!clash) {
          return;
        }
        text.top = clash.bottom + 1;
        text.left = Math.max(text.left, clash.left);
      }
    };

    /** Tc-99m is an isomer, not among the ground states, so it is marked by hand. */
    const isomerCallout = (logScale: boolean): Node[] => {
      const tc = requireIsomer("Tc-99m");
      const tcGround = NUCLIDE_TABLE.get(tc.z, tc.n);
      if (!tcGround || tc.halfLife === null) {
        return [];
      }
      const view = chart.viewPosition(model.explorerXOf(tcGround), explorerHalfLifeY(tc.halfLife, logScale));
      if (!view || view.y <= 8 || view.y >= SCATTER_CHART.HEIGHT - 4) {
        return [];
      }
      return [
        new Rectangle(
          view.x - 3,
          view.y - 3,
          HALF_LIVES_SCREEN_VIEW_SETTINGS.ISOMER_CALLOUT_WIDTH,
          HALF_LIVES_SCREEN_VIEW_SETTINGS.ISOMER_CALLOUT_HEIGHT,
          { stroke: NuclideChartColors.highlightColorProperty },
        ),
        Object.assign(smallLabel("<sup>99m</sup>Tc", NuclideChartColors.highlightColorProperty), {
          left: view.x + HALF_LIVES_SCREEN_VIEW_SETTINGS.ISOMER_CALLOUT_LEFT_OFFSET,
          top: view.y + 1,
        }),
      ];
    };

    /** Labels for the notable nuclides (stacked so they never overlap) and the Tc-99m isomer. */
    const notableCallouts = (logScale: boolean): Node[] => {
      const calloutNodes: Node[] = [];
      const placed: Node[] = [];
      const candidates = NOTABLE.map((labelText) => {
        const x = NUCLIDE_TABLE.require(labelText);
        const p = chart.pointOf(x);
        return { x, view: p ? chart.viewPosition(p.x, p.y) : null };
      })
        .filter((c) => c.view !== null && c.view.y > 8 && c.view.y < SCATTER_CHART.HEIGHT - 4)
        .sort((p, q) => (p.view?.y ?? 0) - (q.view?.y ?? 0));
      for (const { x, view } of candidates) {
        if (!view) {
          continue;
        }
        const text = smallLabel(nuclideMarkup(x), NuclideChartColors.highlightColorProperty);
        placeClear(text, view.x + 4, view.y - 1, placed);
        placed.push(text);
        if (text.bottom > view.y + 2 || text.left > view.x + 6) {
          calloutNodes.push(
            new Line(view.x, view.y, text.left - 1, text.centerY, {
              stroke: NuclideChartColors.highlightColorProperty,
              lineWidth: HALF_LIVES_SCREEN_VIEW_SETTINGS.NOTABLE_CALLOUTS_LINE_WIDTH,
            }),
          );
        }
        calloutNodes.push(text);
      }
      calloutNodes.push(...isomerCallout(logScale));
      return calloutNodes;
    };

    const updateExplorer = (): void => {
      const logScale = model.logScaleProperty.value;
      const byA = model.explorerAxis === "massNumber";
      chart.setAxes(
        { range: byA ? new Range(0, HALF_LIVES.EXPLORER_A_MAX) : HALF_LIVES.EXPLORER_VALLEY_X, log: false },
        logScale
          ? { range: HALF_LIVES.EXPLORER_LOG_Y, log: true }
          : { range: HALF_LIVES.EXPLORER_LINEAR_Y, log: false },
      );
      chart.frame.setAxisLabels(
        byA ? common.axes.massNumberStringProperty : strings.axes.valleyDistanceStringProperty,
        logScale ? strings.axes.halfLifeLogStringProperty : strings.axes.halfLifeLinearStringProperty,
      );
      const points: ScatterPoint[] = model.explorerPointsProperty.value.map((p) => ({
        nuclide: p.nuclide,
        x: p.x,
        y: p.y,
        group: Math.max(0, CATEGORIES.indexOf(p.category)),
      }));
      chart.setPoints(points, CATEGORY_STYLES);

      const guides = new Shape();
      const labels: Node[] = [];
      if (logScale) {
        horizontalGuide(guides, 1, strings.guides.secondStringProperty, true, labels);
        horizontalGuide(guides, SECONDS_PER_YEAR, strings.guides.yearStringProperty, true, labels);
        horizontalGuide(
          guides,
          HALF_LIVES.AGE_OF_UNIVERSE_S,
          strings.guides.universeStringProperty,
          true,
          labels,
          true,
        );
      } else {
        labels.push(
          Object.assign(
            new RichText(strings.linearNoteStringProperty, {
              font: FONTS.LABEL,
              fill: NuclideChartColors.textColorProperty,
              lineWrap: SCATTER_CHART.WIDTH - HALF_LIVES_SCREEN_VIEW_SETTINGS.UPDATE_EXPLORER_LINE_WRAP_OFFSET,
            }),
            {
              left: HALF_LIVES_SCREEN_VIEW_SETTINGS.UPDATE_EXPLORER_LEFT,
              top: HALF_LIVES_SCREEN_VIEW_SETTINGS.UPDATE_EXPLORER_TOP,
            },
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
      callouts.children = model.notableVisibleProperty.value ? notableCallouts(logScale) : [];
    };

    const fitLineShape = (slope: number, intercept: number, xMin: number, xMax: number, log: boolean): Shape => {
      const shape = new Shape();
      const steps: number = HALF_LIVES_SCREEN_VIEW_SETTINGS.STEPS;
      const xRange = new Range(xMin, xMax);
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

    const segmentShape = (segment: GeigerNuttallFitSegment, log: boolean): Shape =>
      fitLineShape(segment.fit.slope, segment.fit.intercept, segment.xMin, segment.xMax, log);

    const updateGeigerNuttall = (): void => {
      const xRange = HALF_LIVES.GEIGER_X;
      chart.setAxes({ range: xRange, log: false }, { range: HALF_LIVES.GEIGER_Y, log: true });
      chart.frame.setAxisLabels(strings.axes.qAlphaInverseRootStringProperty, strings.axes.alphaHalfLifeStringProperty);
      chart.setPoints(
        model.geigerPointsProperty.value.map((p) => ({
          nuclide: p.nuclide,
          x: p.x,
          y: p.y,
          group: p.highlighted ? 1 : 0,
        })),
        TWO_STYLES,
      );
      const { background, highlight } = model.geigerFitsProperty.value;
      const all = new Shape();
      for (const segment of background) {
        all.subpaths.push(...segmentShape(segment, false).subpaths);
      }
      fitsPath.shape = new Shape(all.subpaths);
      highlightFitPath.shape = highlight ? segmentShape(highlight, false) : null;
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
                  new Rectangle(
                    view.x - 5,
                    view.y - 5,
                    HALF_LIVES_SCREEN_VIEW_SETTINGS.CHILDREN_WIDTH,
                    HALF_LIVES_SCREEN_VIEW_SETTINGS.CHILDREN_HEIGHT,
                    {
                      stroke: NuclideChartColors.alphaColorProperty,
                      lineWidth: HALF_LIVES_SCREEN_VIEW_SETTINGS.CHILDREN_LINE_WIDTH,
                    },
                  ),
                  Object.assign(
                    smallLabel(nuclideMarkup(NUCLIDE_TABLE.require(labelText)), NuclideChartColors.alphaColorProperty),
                    {
                      left: view.x + HALF_LIVES_SCREEN_VIEW_SETTINGS.UPDATE_GEIGER_NUTTALL_LEFT_OFFSET,
                      centerY: view.y,
                    },
                  ),
                ]
              : [];
          })
        : [];
    };

    const updateSargent = (): void => {
      const xRange = HALF_LIVES.SARGENT_X;
      chart.setAxes({ range: xRange, log: true }, { range: HALF_LIVES.SARGENT_Y, log: true });
      chart.frame.setAxisLabels(strings.axes.qBetaStringProperty, strings.axes.betaHalfLifeStringProperty);
      chart.setPoints(
        model.sargentPlotPoints.map((p) => ({
          nuclide: p.nuclide,
          x: p.x,
          y: p.y,
          group: 0,
        })),
        TWO_STYLES,
      );
      const fit = model.sargentFit;
      highlightFitPath.shape = fit ? fitLineShape(fit.slope, fit.intercept, xRange.min, xRange.max, true) : null;
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
      if (view === HalfLifeView.GEIGER_NUTTALL && !model.isGeigerNuttallEmitter(selected.value)) {
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
        createNode: () =>
          label(
            views[`${view.key}StringProperty`] as TReadOnlyProperty<string>,
            HALF_LIVES_SCREEN_VIEW_SETTINGS.VIEW_GROUP_MAX_WIDTH,
          ),
      })),
      {
        orientation: "vertical",
        spacing: HALF_LIVES_SCREEN_VIEW_SETTINGS.VIEW_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
        accessibleName: strings.viewTitleStringProperty,
      },
    );
    const axisGroup = new AquaRadioButtonGroup<string>(
      model.explorerAxisProperty,
      [
        {
          value: "massNumber",
          createNode: () =>
            label(strings.xAxes.massNumberStringProperty, HALF_LIVES_SCREEN_VIEW_SETTINGS.MASS_NUMBER_LABEL_MAX_WIDTH),
        },
        {
          value: "valleyDistance",
          createNode: () =>
            label(
              strings.xAxes.valleyDistanceStringProperty,
              HALF_LIVES_SCREEN_VIEW_SETTINGS.VALLEY_DISTANCE_LABEL_MAX_WIDTH,
            ),
        },
      ],
      {
        orientation: "vertical",
        spacing: HALF_LIVES_SCREEN_VIEW_SETTINGS.AXIS_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS_SMALL },
        accessibleName: strings.xAxisTitleStringProperty,
      },
    );
    const logCheckbox = checkbox(model.logScaleProperty, strings.logScaleStringProperty);
    const earthCheckbox = checkbox(model.earthAgeVisibleProperty, strings.earthAgeStringProperty);
    const notableCheckbox = checkbox(model.notableVisibleProperty, strings.notableStringProperty);
    const survivors = new RichText(
      new DerivedProperty([strings.survivorsPatternStringProperty], (pattern) =>
        StringUtils.fillIn(pattern, { count: model.earthAgeSurvivorsCount }),
      ),
      { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty, lineWrap: PANEL_CONTENT_WIDTH },
    );
    const explorerControls = new VBox({
      spacing: HALF_LIVES_SCREEN_VIEW_SETTINGS.EXPLORER_CONTROLS_SPACING,
      align: "left",
      children: [
        label(
          strings.xAxisTitleStringProperty,
          HALF_LIVES_SCREEN_VIEW_SETTINGS.X_AXIS_TITLE_LABEL_MAX_WIDTH,
          FONTS.SMALL,
        ),
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
        const fit = model.geigerNuttallFits.get(nuclide.z);
        return fit
          ? StringUtils.fillIn(pattern, {
              element: nuclide.symbol,
              slope: formatFixed(fit.slope, 0),
              r2: formatFixed(fit.rSquared, HALF_LIVES_SCREEN_VIEW_SETTINGS.R_SQUARED_FORMAT_FIXED_DECIMALS),
              count: fit.count,
            })
          : none;
      },
    );
    const po = model.geigerComparisonPo;
    const th = model.geigerComparisonTh;
    const comparisonText = new DerivedProperty([strings.comparisonPatternStringProperty], (pattern) =>
      po && th
        ? StringUtils.fillIn(pattern, {
            qRatio: formatFixed(po.qAlpha / th.qAlpha, HALF_LIVES_SCREEN_VIEW_SETTINGS.COMPARISON_TEXT_DECIMALS),
            qLow: formatFixed(th.qAlpha, HALF_LIVES_SCREEN_VIEW_SETTINGS.COMPARISON_TEXT_DECIMALS),
            qHigh: formatFixed(po.qAlpha, HALF_LIVES_SCREEN_VIEW_SETTINGS.COMPARISON_TEXT_DECIMALS),
            orders: formatFixed(th.logHalfLife - po.logHalfLife, 1),
          })
        : "",
    );
    const geigerControls = new VBox({
      spacing: HALF_LIVES_SCREEN_VIEW_SETTINGS.GEIGER_CONTROLS_SPACING,
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
        StringUtils.fillIn(pattern, {
          slope: formatFixed(model.sargentFit?.slope ?? 0, HALF_LIVES_SCREEN_VIEW_SETTINGS.SARGENT_TEXT_DECIMALS),
          count: model.sargentPoints.length,
        }),
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
        spacing: HALF_LIVES_SCREEN_VIEW_SETTINGS.CONTROLS_PANEL_SPACING,
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
      placeInRegion(
        new VBox({ spacing: LAYOUT.PANEL_STACK_SPACING, children: [controlsPanel, cardPanel] }),
        layout.panels,
        { yAlign: "top" },
      ),
      placeInRegion(
        new HBox({
          spacing: LAYOUT.FOOTER_SPACING,
          align: "bottom",
          children: [new DataCreditNode(PANEL_CREDIT_WIDTH), resetAllButton],
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
