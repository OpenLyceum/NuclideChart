/**
 * DecayChainsScreenView.ts
 *
 * The Decay Chains screen. Natural series: the chain on its patch of the chart (the α/β⁻ zig-zag, branch
 * percentages, the A mod 4 family), every member's activity against time (secular equilibrium), and the
 * end-to-parent ratio as a dating clock. Fission products: the two-humped mass-yield curve and the β⁻ chain
 * along a chosen A.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider, RectangularPushButton } from "scenerystack/sun";
import { SERIES_PARENTS } from "../../common/model/decayChains.js";
import { NUCLIDE_TABLE } from "../../common/model/NuclideTable.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/NuclideChartButtonOptions.js";
import { NUCLIDE_CHART_SLIDER_OPTIONS } from "../../common/NuclideChartControlOptions.js";
import { NuclideChartPanel } from "../../common/NuclideChartPanel.js";
import { DataCreditNode } from "../../common/view/DataCreditNode.js";
import { formatDuration, formatValue } from "../../common/view/format.js";
import { NuclideCardNode } from "../../common/view/NuclideCardNode.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS, PANEL_COLUMN_WIDTH } from "../../NuclideChartConstants.js";
import { type DecayChainsModel, datingClock, QUICK_FISSION_A } from "../model/DecayChainsModel.js";
import { ActivityChartNode } from "./ActivityChartNode.js";
import { ChainDiagramNode } from "./ChainDiagramNode.js";
import { DecayChainsScreenSummaryContent } from "./DecayChainsScreenSummaryContent.js";
import { FissionProductsNode } from "./FissionProductsNode.js";

export type DecayChainsScreenViewOptions = ScreenViewOptions;

const LEFT_WIDTH = 600;
const DIAGRAM_HEIGHT = 262;
const ACTIVITY_HEIGHT = 214;
const YIELD_HEIGHT = 300;
const PANEL_CONTENT_WIDTH = PANEL_COLUMN_WIDTH - 24;

export class DecayChainsScreenView extends ScreenView {
  public constructor(model: DecayChainsModel, providedOptions?: DecayChainsScreenViewOptions) {
    const options = optionize<DecayChainsScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new DecayChainsScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getDecayChainsStrings();
    const a11y = StringManager.getInstance().getDecayChainsA11yStrings();
    const layout = chartAndPanelsLayout(this.layoutBounds);
    const selected = model.shared.selectedNuclideProperty;

    const label = (
      text: TReadOnlyProperty<string> | string,
      maxWidth = PANEL_CONTENT_WIDTH,
      font = FONTS.LABEL,
    ): RichText => new RichText(text, { font, fill: NuclideChartColors.textColorProperty, maxWidth });
    const paragraph = (text: TReadOnlyProperty<string>): RichText =>
      new RichText(text, {
        font: FONTS.SMALL,
        fill: NuclideChartColors.textColorProperty,
        lineWrap: PANEL_CONTENT_WIDTH,
      });

    // ── Natural series ────────────────────────────────────────────────────────
    const diagram = new ChainDiagramNode(model.chainProperty, selected, LEFT_WIDTH, DIAGRAM_HEIGHT, {
      accessibleName: a11y.controls.chainChartStringProperty,
      accessibleHelpText: a11y.controls.chainChartHelpStringProperty,
    });
    const diagramTitle = label(strings.chartTitleStringProperty, LEFT_WIDTH, FONTS.SMALL);
    const activity = new ActivityChartNode(
      model.solutionProperty,
      model.logTimeProperty,
      selected,
      LEFT_WIDTH - 60,
      ACTIVITY_HEIGHT,
      {
        time: strings.timeAxisStringProperty,
        activity: strings.activityAxisStringProperty,
      },
    );
    const seriesContent = new VBox({
      spacing: 6,
      align: "right",
      children: [new VBox({ spacing: 3, align: "left", children: [diagramTitle, diagram] }), activity],
    });

    // ── Fission products ──────────────────────────────────────────────────────
    const fission = new FissionProductsNode(
      model.fissionSystemIndexProperty,
      model.fissionMassNumberProperty,
      selected,
      LEFT_WIDTH - 60,
      YIELD_HEIGHT,
    );
    const left = new Node({ children: [seriesContent, fission] });

    // ── Panels ────────────────────────────────────────────────────────────────
    const modeGroup = new AquaRadioButtonGroup<string>(
      model.modeProperty,
      [
        { value: "series", createNode: () => label(strings.modes.seriesStringProperty, 240) },
        { value: "fission", createNode: () => label(strings.modes.fissionStringProperty, 240) },
      ],
      {
        orientation: "vertical",
        spacing: 5,
        radioButtonOptions: { radius: 7 },
        accessibleName: strings.modeTitleStringProperty,
      },
    );

    const seriesGroup = new AquaRadioButtonGroup<number>(
      model.seriesIndexProperty,
      SERIES_PARENTS.map(([parent], i) => ({
        value: i,
        createNode: () => label(`<sup>${parent.split("-")[1]}</sup>${parent.split("-")[0]}`, 80),
      })),
      {
        orientation: "horizontal",
        spacing: 12,
        radioButtonOptions: { radius: 6 },
        accessibleName: strings.seriesTitleStringProperty,
      },
    );
    const families = strings.families;
    const familyText = new DerivedProperty(
      [
        model.chainProperty,
        strings.familyPatternStringProperty,
        families.family0StringProperty,
        families.family1StringProperty,
        families.family2StringProperty,
        families.family3StringProperty,
      ],
      (chain, pattern, f0, f1, f2, f3) => {
        const remainder = chain.parent.a % 4;
        return StringUtils.fillIn(pattern, { remainder, family: [f0, f1, f2, f3][remainder] ?? "" });
      },
    );
    const timeSlider = new HSlider(model.logTimeProperty, model.logTimeProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(PANEL_CONTENT_WIDTH - 20),
      keyboardStep: 0.25,
      shiftKeyboardStep: 0.05,
      pageKeyboardStep: 1,
      accessibleName: a11y.controls.timeSliderStringProperty,
      pdomCreateAriaValueText: (value: number | null) => (value === null ? "" : formatDuration(10 ** value)),
    });
    const timeText = new DerivedProperty(
      [strings.timePatternStringProperty, model.logTimeProperty],
      (pattern, logTime) => StringUtils.fillIn(pattern, { time: formatDuration(10 ** logTime) }),
    );
    const clockText = new DerivedProperty(
      [strings.clockPatternStringProperty, model.solutionProperty, model.logTimeProperty],
      (pattern, solution, logTime) => {
        const chain = solution.chain;
        const end = chain.nodes.filter((x) => x.lambda === 0).map((x) => `<sup>${x.a}</sup>${x.label.split("-")[0]}`);
        const clock = datingClock(chain, solution, 10 ** logTime);
        return StringUtils.fillIn(pattern, {
          end: end.join(" + "),
          parent: `<sup>${chain.parent.a}</sup>${chain.parent.label.split("-")[0]}`,
          ratio: formatValue(clock.ratio, 3),
          age: formatDuration(clock.age),
        });
      },
    );
    const seriesControls = new VBox({
      spacing: 6,
      align: "left",
      children: [
        label(strings.seriesTitleStringProperty, 200, FONTS.SMALL),
        seriesGroup,
        paragraph(familyText),
        label(strings.timeStringProperty, PANEL_CONTENT_WIDTH, FONTS.SMALL),
        timeSlider,
        label(timeText, PANEL_CONTENT_WIDTH, FONTS.READOUT),
        new RichText(clockText, {
          font: FONTS.SMALL,
          fill: NuclideChartColors.textColorProperty,
          lineWrap: PANEL_CONTENT_WIDTH,
        }),
        paragraph(strings.equilibriumStringProperty),
      ],
    });

    const systems = strings.systems;
    const systemGroup = new AquaRadioButtonGroup<number>(
      model.fissionSystemIndexProperty,
      [systems.u235StringProperty, systems.pu239StringProperty, systems.u238StringProperty].map((text, i) => ({
        value: i,
        createNode: () => label(text, 220),
      })),
      {
        orientation: "vertical",
        spacing: 4,
        radioButtonOptions: { radius: 6 },
        accessibleName: strings.fissionSystemTitleStringProperty,
      },
    );
    const aSlider = new HSlider(model.fissionMassNumberProperty, model.fissionMassNumberProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(180),
      constrainValue: (value: number) => Math.round(value),
      keyboardStep: 1,
      shiftKeyboardStep: 1,
      pageKeyboardStep: 5,
      accessibleName: a11y.controls.massNumberSliderStringProperty,
    });
    const aText = new Text(new DerivedProperty([model.fissionMassNumberProperty], (a) => `A = ${a}`), {
      font: FONTS.READOUT,
      fill: NuclideChartColors.textColorProperty,
    });
    const quickButtons = QUICK_FISSION_A.map(
      (a) =>
        new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          content: new Text(String(a), { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL }),
          listener: () => {
            model.fissionMassNumberProperty.value = a;
          },
          accessibleName: `A = ${a}`,
        }),
    );
    const fissionControls = new VBox({
      spacing: 6,
      align: "left",
      children: [
        label(strings.fissionSystemTitleStringProperty, 220, FONTS.SMALL),
        systemGroup,
        label(strings.massNumberStringProperty, 220, FONTS.SMALL),
        new HBox({ spacing: 8, children: [aSlider, aText] }),
        new HBox({ spacing: 4, children: [label(strings.quickPicksStringProperty, 40, FONTS.SMALL), ...quickButtons] }),
      ],
    });

    model.modeProperty.link((mode) => {
      seriesContent.visible = mode === "series";
      seriesControls.visible = mode === "series";
      fission.visible = mode === "fission";
      fissionControls.visible = mode === "fission";
    });
    const controlsPanel = new NuclideChartPanel(
      new VBox({
        spacing: 10,
        align: "left",
        children: [modeGroup, new Node({ children: [seriesControls, fissionControls] })],
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
      placeInRegion(left, layout.chart, { yAlign: "top" }),
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
    this.pdomPlayAreaNode.pdomOrder = [
      diagram,
      modeGroup,
      seriesGroup,
      timeSlider,
      systemGroup,
      aSlider,
      ...quickButtons,
    ];
    this.pdomControlAreaNode.pdomOrder = [resetAllButton];

    // Choosing a series selects its parent, so the card and the highlighted curve follow.
    model.seriesIndexProperty.lazyLink(() => {
      const parent = model.chainProperty.value.parent;
      const nuclide = NUCLIDE_TABLE.get(parent.z, parent.n);
      if (nuclide) {
        selected.value = nuclide;
      }
    });
  }
}
