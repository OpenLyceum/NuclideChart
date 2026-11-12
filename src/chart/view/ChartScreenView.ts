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
import { FONTS, PANEL_COLUMN_WIDTH } from "../../NuclideChartConstants.js";
import type { ChartModel } from "../model/ChartModel.js";
import { MapColoring } from "../model/MapColoring.js";
import { CensusDialog } from "./CensusDialog.js";
import { ChartScreenSummaryContent } from "./ChartScreenSummaryContent.js";
import { MapLegendNode } from "./MapLegendNode.js";
import { NuclideMapNode, ZOOM_STEP } from "./NuclideMapNode.js";
import { QValueDialog } from "./QValueDialog.js";

export type ChartScreenViewOptions = ScreenViewOptions;

const MAP_WIDTH = 630;
const MAP_HEIGHT = 452;
const STRIP_HEIGHT = 62;
const PANEL_CONTENT_WIDTH = PANEL_COLUMN_WIDTH - 24;

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
    const layout = chartStripAndPanelsLayout(this.layoutBounds, PANEL_COLUMN_WIDTH, STRIP_HEIGHT);
    const listParent = new Node();
    const shared = model.shared;

    const label = (text: TReadOnlyProperty<string>, maxWidth = PANEL_CONTENT_WIDTH): RichText =>
      new RichText(text, { font: FONTS.LABEL, fill: NuclideChartColors.textColorProperty, maxWidth });
    const checkbox = (property: Property<boolean>, text: TReadOnlyProperty<string>, maxWidth = 170): Checkbox =>
      new Checkbox(property, label(text, maxWidth), { ...NUCLIDE_CHART_CHECKBOX_OPTIONS, accessibleName: text });
    const button = (text: TReadOnlyProperty<string>, listener: () => void): RectangularPushButton =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        content: new Text(text, { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 120 }),
        listener,
        accessibleName: text,
      });

    // ── The map, with its axis titles ─────────────────────────────────────────
    const map = new NuclideMapNode(model, MAP_WIDTH, MAP_HEIGHT, {
      accessibleName: a11y.controls.mapStringProperty,
      accessibleHelpText: a11y.controls.mapHelpStringProperty,
    });
    const xTitle = new RichText(common.axes.neutronNumberStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: MAP_WIDTH,
      centerX: MAP_WIDTH / 2,
      top: MAP_HEIGHT + 4,
    });
    const yTitle = new RichText(common.axes.protonNumberStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: MAP_HEIGHT,
      rotation: -Math.PI / 2,
      right: -6,
      centerY: MAP_HEIGHT / 2,
    });
    xTitle.localBoundsProperty.lazyLink(() => {
      xTitle.centerX = MAP_WIDTH / 2;
    });
    yTitle.localBoundsProperty.lazyLink(() => {
      yTitle.centerY = MAP_HEIGHT / 2;
    });
    const mapWithTitles = new Node({ children: [map, xTitle, yTitle] });

    // ── Strip under the map: zoom and overlays ────────────────────────────────
    const zoomOut = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      content: new MinusNode({ size: new Dimension2(10, 2), fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => map.zoomBy(1 / ZOOM_STEP),
      accessibleName: strings.zoom.zoomOutStringProperty,
    });
    const zoomIn = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      content: new PlusNode({ size: new Dimension2(10, 2), fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => map.zoomBy(ZOOM_STEP),
      accessibleName: strings.zoom.zoomInStringProperty,
    });
    const zoomSlider = new HSlider(model.zoomProperty, model.zoomProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(110),
      accessibleName: a11y.controls.zoomStringProperty,
      keyboardStep: 0.5,
      pageKeyboardStep: 2,
    });
    model.zoomProperty.lazyLink(() => map.reclamp());
    const showAll = button(strings.zoom.showAllStringProperty, () => model.showWholeChart());
    const zoomControls = new HBox({ spacing: 6, children: [zoomOut, zoomSlider, zoomIn, showAll] });

    const overlayChecks = [
      checkbox(shared.magicNumbersVisibleProperty, common.magicNumbersStringProperty, 140),
      checkbox(model.nEqualsZVisibleProperty, strings.overlays.nEqualsZStringProperty, 140),
      checkbox(model.valleyVisibleProperty, strings.overlays.valleyStringProperty, 160),
      checkbox(model.dripLinesVisibleProperty, strings.overlays.dripLinesStringProperty, 140),
      checkbox(model.estimatedMassesMarkedProperty, strings.overlays.markEstimatedStringProperty, 160),
    ];
    const overlays = new GridBox({
      autoColumns: 3,
      xSpacing: 12,
      ySpacing: 6,
      xAlign: "left",
      children: overlayChecks,
    });
    const strip = new HBox({ spacing: 20, align: "center", children: [zoomControls, overlays] });

    // ── Colouring and legend ──────────────────────────────────────────────────
    const colorings = strings.colorings as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const coloringName = (coloring: MapColoring): TReadOnlyProperty<string> =>
      colorings[`${coloring.key}StringProperty`] as TReadOnlyProperty<string>;
    const coloringBox = new ComboBox(
      model.coloringProperty,
      MapColoring.enumeration.values.map((coloring) => ({
        value: coloring,
        createNode: () =>
          new Text(coloringName(coloring), { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 190 }),
        accessibleName: coloringName(coloring),
      })),
      listParent,
      { ...NUCLIDE_CHART_COMBO_BOX_OPTIONS, accessibleName: a11y.controls.coloringStringProperty },
    );
    const coloringPanel = new NuclideChartPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          new HBox({ spacing: 8, children: [label(strings.colorByStringProperty, 70), coloringBox] }),
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
        spacing: 8,
        align: "left",
        children: [
          new NuclideCardNode(shared.selectedNuclideProperty, { contentWidth: PANEL_CONTENT_WIDTH }),
          new HBox({ spacing: 8, children: [qButton, censusButton] }),
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    // ── Half-life filter ──────────────────────────────────────────────────────
    const filterCheckbox = checkbox(model.halfLifeFilterEnabledProperty, strings.filter.enabledStringProperty, 230);
    const thresholdText = new DerivedProperty([model.halfLifeThresholdProperty], (log) => formatDuration(10 ** log));
    const thresholdSlider = new HSlider(model.halfLifeThresholdProperty, model.halfLifeThresholdProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(170),
      enabledProperty: model.halfLifeFilterEnabledProperty,
      keyboardStep: 0.5,
      shiftKeyboardStep: 0.1,
      pageKeyboardStep: 2,
      accessibleName: a11y.controls.halfLifeThresholdStringProperty,
      pdomCreateAriaValueText: (value: number | null) => (value === null ? "" : formatDuration(10 ** value)),
    });
    thresholdSlider.addMajorTick(
      Math.log10(AGE_OF_EARTH_S),
      new Text(strings.filter.ageOfEarthStringProperty, {
        font: FONTS.SMALL,
        fill: NuclideChartColors.textColorProperty,
        maxWidth: 110,
      }),
    );
    const filterPanel = new NuclideChartPanel(
      new VBox({
        spacing: 4,
        align: "left",
        children: [
          filterCheckbox,
          new HBox({
            spacing: 10,
            children: [
              thresholdSlider,
              new Text(thresholdText, {
                font: FONTS.READOUT,
                fill: NuclideChartColors.textColorProperty,
                maxWidth: 80,
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
    const credit = new DataCreditNode(PANEL_COLUMN_WIDTH - 60);

    this.children = [
      placeInRegion(mapWithTitles, layout.chart),
      placeInRegion(strip, layout.strip),
      placeInRegion(new VBox({ spacing: 8, children: [coloringPanel, cardPanel, filterPanel] }), layout.panels, {
        yAlign: "top",
      }),
      placeInRegion(new HBox({ spacing: 10, align: "bottom", children: [credit, resetAllButton] }), layout.footer, {
        xAlign: "right",
        yAlign: "bottom",
      }),
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
