import { CHART_SCREEN_VIEW_SETTINGS } from "../../NuclideChartConstants.js";
/**
 * ChartScreenView.ts
 *
 * The Chart screen: the N–Z map of every known nuclide with a choice of colouring, overlays (magic numbers,
 * N = Z, valley of stability, drip lines), a half-life filter ("which nuclides survive since the Earth
 * formed?"), the selected nuclide's card, a Q-value predictor and a census of stable nuclides by parity.
 */

import { DerivedProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { MinusNode, PlusNode, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { Checkbox, ComboBox, HSlider, RectangularPushButton } from "scenerystack/sun";
import { MapColoring } from "../../common/model/MapColoring.js";
import { AGE_OF_EARTH_S } from "../../common/model/NuclearConstants.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  NUCLIDE_CHART_COMBO_BOX_OPTIONS,
} from "../../common/NuclideChartButtonOptions.js";
import {
  NUCLIDE_CHART_CHECKBOX_OPTIONS,
  NUCLIDE_CHART_SLIDER_OPTIONS,
} from "../../common/NuclideChartControlOptions.js";
import { NuclideChartPanel } from "../../common/NuclideChartPanel.js";
import { DataCreditNode } from "../../common/view/DataCreditNode.js";
import { formatDuration } from "../../common/view/format.js";
import { NuclideCardNode } from "../../common/view/NuclideCardNode.js";
import { chartStripAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import {
  CHART,
  FONTS,
  LAYOUT,
  MAP,
  PANEL_COLUMN_WIDTH,
  PANEL_CONTENT_WIDTH,
  PANEL_CREDIT_WIDTH,
} from "../../NuclideChartConstants.js";
import type { ChartModel } from "../model/ChartModel.js";
import { CensusDialog } from "./CensusDialog.js";
import { ChartScreenSummaryContent } from "./ChartScreenSummaryContent.js";
import { MapLegendNode } from "./MapLegendNode.js";
import { NuclideMapNode } from "./NuclideMapNode.js";
import { QValueDialog } from "./QValueDialog.js";

export type ChartScreenViewOptions = ScreenViewOptions;

export class ChartScreenView extends ScreenView {
  public constructor(model: ChartModel, providedOptions?: ChartScreenViewOptions) {
    const options = optionize<ChartScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new ChartScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getChartStrings();
    const a11y = StringManager.getInstance().getChartA11yStrings();
    const layout = chartStripAndPanelsLayout(this.layoutBounds, PANEL_COLUMN_WIDTH, CHART.STRIP_HEIGHT);
    const listParent = new Node();
    const shared = model.shared;

    const label = (text: TReadOnlyProperty<string>, maxWidth = PANEL_CONTENT_WIDTH): RichText =>
      new RichText(text, { font: FONTS.LABEL, fill: NuclideChartColors.textColorProperty, maxWidth });
    const checkbox = (
      property: Property<boolean>,
      text: TReadOnlyProperty<string>,
      maxWidth: number = CHART_SCREEN_VIEW_SETTINGS.DEFAULT_MAX_WIDTH,
    ): Checkbox =>
      new Checkbox(property, label(text, maxWidth), { ...NUCLIDE_CHART_CHECKBOX_OPTIONS, accessibleName: text });
    const button = (text: TReadOnlyProperty<string>, listener: () => void): RectangularPushButton =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        content: new Text(text, {
          font: FONTS.LABEL,
          fill: LIGHT_SURFACE_TEXT_FILL,
          maxWidth: CHART_SCREEN_VIEW_SETTINGS.BUTTON_MAX_WIDTH,
        }),
        listener,
        accessibleName: text,
      });

    // ── The map, with its axis titles ─────────────────────────────────────────
    const map = new NuclideMapNode(model, CHART.MAP_WIDTH, CHART.MAP_HEIGHT, {
      accessibleName: a11y.controls.mapStringProperty,
      accessibleHelpText: a11y.controls.mapHelpStringProperty,
    });
    const xTitle = new RichText(common.axes.neutronNumberStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: CHART.MAP_WIDTH,
      centerX: CHART.MAP_WIDTH / 2,
      top: CHART.MAP_HEIGHT + CHART_SCREEN_VIEW_SETTINGS.X_TITLE_TOP_OFFSET,
    });
    const yTitle = new RichText(common.axes.protonNumberStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: CHART.MAP_HEIGHT,
      rotation: -Math.PI / 2,
      right: CHART_SCREEN_VIEW_SETTINGS.Y_TITLE_RIGHT,
      centerY: CHART.MAP_HEIGHT / 2,
    });
    xTitle.localBoundsProperty.lazyLink(() => {
      xTitle.centerX = CHART.MAP_WIDTH / 2;
    });
    yTitle.localBoundsProperty.lazyLink(() => {
      yTitle.centerY = CHART.MAP_HEIGHT / 2;
    });
    const mapWithTitles = new Node({ children: [map, xTitle, yTitle] });

    // ── Strip under the map: zoom and overlays ────────────────────────────────
    const zoomOut = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      content: new MinusNode({
        size: new Dimension2(CHART_SCREEN_VIEW_SETTINGS.ZOOM_OUT_WIDTH, CHART_SCREEN_VIEW_SETTINGS.ZOOM_OUT_HEIGHT),
        fill: LIGHT_SURFACE_TEXT_FILL,
      }),
      listener: () => map.zoomBy(1 / MAP.ZOOM_STEP),
      accessibleName: strings.zoom.zoomOutStringProperty,
    });
    const zoomIn = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      content: new PlusNode({
        size: new Dimension2(CHART_SCREEN_VIEW_SETTINGS.ZOOM_IN_WIDTH, CHART_SCREEN_VIEW_SETTINGS.ZOOM_IN_HEIGHT),
        fill: LIGHT_SURFACE_TEXT_FILL,
      }),
      listener: () => map.zoomBy(MAP.ZOOM_STEP),
      accessibleName: strings.zoom.zoomInStringProperty,
    });
    const zoomSlider = new HSlider(model.zoomProperty, model.zoomProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(CHART_SCREEN_VIEW_SETTINGS.ZOOM_SLIDER_WIDTH),
      accessibleName: a11y.controls.zoomStringProperty,
      keyboardStep: CHART_SCREEN_VIEW_SETTINGS.ZOOM_SLIDER_KEYBOARD_STEP,
      pageKeyboardStep: CHART_SCREEN_VIEW_SETTINGS.ZOOM_SLIDER_PAGE_KEYBOARD_STEP,
    });
    model.zoomProperty.lazyLink(() => map.reclamp());
    const showAll = button(strings.zoom.showAllStringProperty, () => model.showWholeChart());
    const zoomControls = new HBox({
      spacing: CHART_SCREEN_VIEW_SETTINGS.ZOOM_CONTROLS_SPACING,
      children: [zoomOut, zoomSlider, zoomIn, showAll],
    });

    const overlayChecks = [
      checkbox(
        shared.magicNumbersVisibleProperty,
        common.magicNumbersStringProperty,
        CHART_SCREEN_VIEW_SETTINGS.MAGIC_NUMBERS_VISIBLE_CHECKBOX_MAX_WIDTH,
      ),
      checkbox(
        model.nEqualsZVisibleProperty,
        strings.overlays.nEqualsZStringProperty,
        CHART_SCREEN_VIEW_SETTINGS.N_EQUALS_Z_VISIBLE_CHECKBOX_MAX_WIDTH,
      ),
      checkbox(
        model.valleyVisibleProperty,
        strings.overlays.valleyStringProperty,
        CHART_SCREEN_VIEW_SETTINGS.VALLEY_VISIBLE_CHECKBOX_MAX_WIDTH,
      ),
      checkbox(
        model.dripLinesVisibleProperty,
        strings.overlays.dripLinesStringProperty,
        CHART_SCREEN_VIEW_SETTINGS.DRIP_LINES_VISIBLE_CHECKBOX_MAX_WIDTH,
      ),
      checkbox(
        model.estimatedMassesMarkedProperty,
        strings.overlays.markEstimatedStringProperty,
        CHART_SCREEN_VIEW_SETTINGS.ESTIMATED_MASSES_MARKED_CHECKBOX_MAX_WIDTH,
      ),
    ];
    const overlays = new GridBox({
      autoColumns: 3,
      xSpacing: CHART_SCREEN_VIEW_SETTINGS.OVERLAYS_X_SPACING,
      ySpacing: CHART_SCREEN_VIEW_SETTINGS.OVERLAYS_Y_SPACING,
      xAlign: "left",
      children: overlayChecks,
    });
    const strip = new HBox({
      spacing: CHART_SCREEN_VIEW_SETTINGS.STRIP_SPACING,
      align: "center",
      children: [zoomControls, overlays],
    });

    // ── Colouring and legend ──────────────────────────────────────────────────
    const colorings = strings.colorings as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const coloringName = (coloring: MapColoring): TReadOnlyProperty<string> =>
      colorings[`${coloring.key}StringProperty`] as TReadOnlyProperty<string>;
    const coloringBox = new ComboBox(
      model.coloringProperty,
      MapColoring.enumeration.values.map((coloring) => ({
        value: coloring,
        createNode: () =>
          new Text(coloringName(coloring), {
            font: FONTS.LABEL,
            fill: LIGHT_SURFACE_TEXT_FILL,
            maxWidth: CHART_SCREEN_VIEW_SETTINGS.COLORING_BOX_MAX_WIDTH,
          }),
        accessibleName: coloringName(coloring),
      })),
      listParent,
      { ...NUCLIDE_CHART_COMBO_BOX_OPTIONS, accessibleName: a11y.controls.coloringStringProperty },
    );
    const coloringPanel = new NuclideChartPanel(
      new VBox({
        spacing: CHART_SCREEN_VIEW_SETTINGS.COLORING_PANEL_SPACING,
        align: "left",
        children: [
          new HBox({
            spacing: CHART_SCREEN_VIEW_SETTINGS.COLORING_PANEL_SPACING,
            children: [
              label(strings.colorByStringProperty, CHART_SCREEN_VIEW_SETTINGS.COLOR_BY_LABEL_MAX_WIDTH),
              coloringBox,
            ],
          }),
          new MapLegendNode(model.coloringProperty, PANEL_CONTENT_WIDTH),
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    // ── Selected nuclide ──────────────────────────────────────────────────────
    const qValueDialog = new QValueDialog(shared.selectedNuclideProperty);
    const censusDialog = new CensusDialog(shared.stabilityDefinitionProperty);
    const qButton = button(strings.buttons.qValuesStringProperty, () => qValueDialog.show());
    const censusButton = button(strings.buttons.censusStringProperty, () => censusDialog.show());
    const cardPanel = new NuclideChartPanel(
      new VBox({
        spacing: CHART_SCREEN_VIEW_SETTINGS.CARD_PANEL_SPACING,
        align: "left",
        children: [
          new NuclideCardNode(shared.selectedNuclideProperty, { contentWidth: PANEL_CONTENT_WIDTH }),
          new HBox({ spacing: CHART_SCREEN_VIEW_SETTINGS.CARD_PANEL_SPACING, children: [qButton, censusButton] }),
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    // ── Half-life filter ──────────────────────────────────────────────────────
    const filterCheckbox = checkbox(
      model.halfLifeFilterEnabledProperty,
      strings.filter.enabledStringProperty,
      CHART_SCREEN_VIEW_SETTINGS.HALF_LIFE_FILTER_ENABLED_CHECKBOX_MAX_WIDTH,
    );
    const thresholdText = new DerivedProperty([model.halfLifeThresholdProperty], (log) => formatDuration(10 ** log));
    const thresholdSlider = new HSlider(model.halfLifeThresholdProperty, model.halfLifeThresholdProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize
        .copy()
        .setWidth(CHART_SCREEN_VIEW_SETTINGS.THRESHOLD_SLIDER_WIDTH),
      enabledProperty: model.halfLifeFilterEnabledProperty,
      keyboardStep: CHART_SCREEN_VIEW_SETTINGS.THRESHOLD_SLIDER_KEYBOARD_STEP,
      shiftKeyboardStep: CHART_SCREEN_VIEW_SETTINGS.THRESHOLD_SLIDER_SHIFT_KEYBOARD_STEP,
      pageKeyboardStep: CHART_SCREEN_VIEW_SETTINGS.THRESHOLD_SLIDER_PAGE_KEYBOARD_STEP,
      accessibleName: a11y.controls.halfLifeThresholdStringProperty,
      pdomCreateAriaValueText: (value: number | null) => (value === null ? "" : formatDuration(10 ** value)),
    });
    thresholdSlider.addMajorTick(
      Math.log10(AGE_OF_EARTH_S),
      new Text(strings.filter.ageOfEarthStringProperty, {
        font: FONTS.SMALL,
        fill: NuclideChartColors.textColorProperty,
        maxWidth: CHART_SCREEN_VIEW_SETTINGS.MAX_WIDTH,
      }),
    );
    const filterPanel = new NuclideChartPanel(
      new VBox({
        spacing: CHART_SCREEN_VIEW_SETTINGS.FILTER_PANEL_SPACING,
        align: "left",
        children: [
          filterCheckbox,
          new HBox({
            spacing: CHART_SCREEN_VIEW_SETTINGS.FILTER_SECTION_SPACING,
            children: [
              thresholdSlider,
              new Text(thresholdText, {
                font: FONTS.READOUT,
                fill: NuclideChartColors.textColorProperty,
                maxWidth: CHART_SCREEN_VIEW_SETTINGS.FILTER_PANEL_MAX_WIDTH,
              }),
            ],
          }),
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
    });
    const credit = new DataCreditNode(PANEL_CREDIT_WIDTH);

    this.children = [
      placeInRegion(mapWithTitles, layout.chart),
      placeInRegion(strip, layout.strip),
      placeInRegion(
        new VBox({ spacing: LAYOUT.PANEL_STACK_SPACING, children: [coloringPanel, cardPanel, filterPanel] }),
        layout.panels,
        {
          yAlign: "top",
        },
      ),
      placeInRegion(
        new HBox({ spacing: LAYOUT.FOOTER_SPACING, align: "bottom", children: [credit, resetAllButton] }),
        layout.footer,
        {
          xAlign: "right",
          yAlign: "bottom",
        },
      ),
      listParent,
    ];

    // Short description of the selection, for screen readers.
    const selectionDescription = new DerivedProperty(
      [a11y.controls.selectionPatternStringProperty, shared.selectedNuclideProperty],
      (pattern, nuclide) =>
        StringUtils.fillIn(pattern, {
          label: nuclide.label,
          z: nuclide.z,
          n: nuclide.n,
          decay: nuclide.isStable ? common.card.stableStringProperty.value : nuclide.halfLifeText,
        }),
    );
    shared.selectedNuclideProperty.lazyLink(() => map.addAccessibleResponse(selectionDescription.value));

    this.pdomPlayAreaNode.pdomOrder = [map, zoomOut, zoomSlider, zoomIn, showAll, ...overlayChecks];
    this.pdomControlAreaNode.pdomOrder = [
      coloringBox,
      qButton,
      censusButton,
      filterCheckbox,
      thresholdSlider,
      resetAllButton,
    ];
  }
}
