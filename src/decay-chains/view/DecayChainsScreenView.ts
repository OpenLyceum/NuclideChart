import { DECAY_CHAINS_SCREEN_VIEW_SETTINGS } from "../../NuclideChartConstants.js";
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
import {
  CONTROLS,
  DECAY_CHAINS,
  FONTS,
  LAYOUT,
  PANEL_COLUMN_WIDTH,
  PANEL_CONTENT_WIDTH,
  PANEL_CREDIT_WIDTH,
} from "../../NuclideChartConstants.js";
import { type DecayChainsModel, datingClock, QUICK_FISSION_A } from "../model/DecayChainsModel.js";
import { ActivityChartNode } from "./ActivityChartNode.js";
import { ChainDiagramNode } from "./ChainDiagramNode.js";
import { DecayChainsScreenSummaryContent } from "./DecayChainsScreenSummaryContent.js";
import { FissionProductsNode } from "./FissionProductsNode.js";

export type DecayChainsScreenViewOptions = ScreenViewOptions;

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
    const diagram = new ChainDiagramNode(
      model.chainProperty,
      selected,
      DECAY_CHAINS.LEFT_WIDTH,
      DECAY_CHAINS.DIAGRAM_HEIGHT,
      {
        accessibleName: a11y.controls.chainChartStringProperty,
        accessibleHelpText: a11y.controls.chainChartHelpStringProperty,
      },
    );
    const diagramTitle = label(strings.chartTitleStringProperty, DECAY_CHAINS.LEFT_WIDTH, FONTS.SMALL);
    const activity = new ActivityChartNode(
      model.solutionProperty,
      model.logTimeProperty,
      selected,
      DECAY_CHAINS.LEFT_WIDTH - 60,
      DECAY_CHAINS.ACTIVITY_HEIGHT,
      {
        time: strings.timeAxisStringProperty,
        activity: strings.activityAxisStringProperty,
      },
    );
    const seriesContent = new VBox({
      spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_CONTENT_SPACING,
      align: "right",
      children: [
        new VBox({
          spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_SECTION_SPACING,
          align: "left",
          children: [diagramTitle, diagram],
        }),
        activity,
      ],
    });

    // ── Fission products ──────────────────────────────────────────────────────
    const fission = new FissionProductsNode(
      model.fissionSystemIndexProperty,
      model.fissionMassNumberProperty,
      selected,
      DECAY_CHAINS.LEFT_WIDTH - 60,
      DECAY_CHAINS.YIELD_HEIGHT,
    );
    const left = new Node({ children: [seriesContent, fission] });

    // ── Panels ────────────────────────────────────────────────────────────────
    const modeGroup = new AquaRadioButtonGroup<string>(
      model.modeProperty,
      [
        {
          value: "series",
          createNode: () =>
            label(strings.modes.seriesStringProperty, DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_LABEL_MAX_WIDTH),
        },
        {
          value: "fission",
          createNode: () =>
            label(strings.modes.fissionStringProperty, DECAY_CHAINS_SCREEN_VIEW_SETTINGS.FISSION_LABEL_MAX_WIDTH),
        },
      ],
      {
        orientation: "vertical",
        spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.MODE_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
        accessibleName: strings.modeTitleStringProperty,
      },
    );

    const seriesGroup = new AquaRadioButtonGroup<number>(
      model.seriesIndexProperty,
      SERIES_PARENTS.map(([parent], i) => ({
        value: i,
        createNode: () =>
          label(
            `<sup>${parent.split("-")[1]}</sup>${parent.split("-")[0]}`,
            DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_GROUP_MAX_WIDTH,
          ),
      })),
      {
        orientation: "horizontal",
        spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS_SMALL },
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
      keyboardStep: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.TIME_SLIDER_KEYBOARD_STEP,
      shiftKeyboardStep: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.TIME_SLIDER_SHIFT_KEYBOARD_STEP,
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
          ratio: formatValue(clock.ratio, DECAY_CHAINS_SCREEN_VIEW_SETTINGS.RATIO_FORMAT_VALUE_DIGITS),
          age: formatDuration(clock.age),
        });
      },
    );
    const seriesControls = new VBox({
      spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_CONTROLS_SPACING,
      align: "left",
      children: [
        label(
          strings.seriesTitleStringProperty,
          DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SERIES_TITLE_LABEL_MAX_WIDTH,
          FONTS.SMALL,
        ),
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
        createNode: () => label(text, DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SYSTEM_GROUP_MAX_WIDTH),
      })),
      {
        orientation: "vertical",
        spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.SYSTEM_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS_SMALL },
        accessibleName: strings.fissionSystemTitleStringProperty,
      },
    );
    const aSlider = new HSlider(model.fissionMassNumberProperty, model.fissionMassNumberProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize
        .copy()
        .setWidth(DECAY_CHAINS_SCREEN_VIEW_SETTINGS.A_SLIDER_WIDTH),
      constrainValue: (value: number) => Math.round(value),
      keyboardStep: 1,
      shiftKeyboardStep: 1,
      pageKeyboardStep: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.A_SLIDER_PAGE_KEYBOARD_STEP,
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
      spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.FISSION_CONTROLS_SPACING,
      align: "left",
      children: [
        label(
          strings.fissionSystemTitleStringProperty,
          DECAY_CHAINS_SCREEN_VIEW_SETTINGS.FISSION_SYSTEM_TITLE_LABEL_MAX_WIDTH,
          FONTS.SMALL,
        ),
        systemGroup,
        label(
          strings.massNumberStringProperty,
          DECAY_CHAINS_SCREEN_VIEW_SETTINGS.MASS_NUMBER_LABEL_MAX_WIDTH,
          FONTS.SMALL,
        ),
        new HBox({
          spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.FISSION_CONTROLS_SECTION_SPACING,
          children: [aSlider, aText],
        }),
        new HBox({
          spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.FISSION_CONTROLS_ITEM_5_SPACING,
          children: [
            label(
              strings.quickPicksStringProperty,
              DECAY_CHAINS_SCREEN_VIEW_SETTINGS.QUICK_PICKS_LABEL_MAX_WIDTH,
              FONTS.SMALL,
            ),
            ...quickButtons,
          ],
        }),
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
        spacing: DECAY_CHAINS_SCREEN_VIEW_SETTINGS.CONTROLS_PANEL_SPACING,
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
