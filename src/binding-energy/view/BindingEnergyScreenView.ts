import { toFixed } from "scenerystack/dot";
import { BINDING_ENERGY_SCREEN_VIEW_SETTINGS } from "../../NuclideChartConstants.js";
/**
 * BindingEnergyScreenView.ts
 *
 * The Binding Energy screen: the B/A curve (with a zoom on its peak, where Ni-62 beats Fe-58 and Fe-56),
 * the semi-empirical mass formula with switchable terms and adjustable or fitted coefficients, the residuals
 * measured − formula that reveal the magic numbers, and an energy-release calculator for fission and fusion.
 */

import { DerivedProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, ComboBox, HSlider, RectangularPushButton } from "scenerystack/sun";
import { FUSION_REACTIONS } from "../../common/model/energyRelease.js";
import { MASS_FORMULA_TERMS, type MassFormulaTerm } from "../../common/model/massFormula.js";
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
import { formatFixed } from "../../common/view/format.js";
import { nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import {
  BINDING,
  CONTROLS,
  FONTS,
  LAYOUT,
  PANEL_COLUMN_WIDTH,
  PANEL_CONTENT_WIDTH,
  PANEL_CREDIT_WIDTH,
  SCATTER_CHART,
} from "../../NuclideChartConstants.js";
import type { NuclideChartPreferencesModel } from "../../preferences/NuclideChartPreferencesModel.js";
import { type BindingEnergyModel, BindingView } from "../model/BindingEnergyModel.js";
import { BindingChartNode } from "./BindingChartNode.js";
import { BindingEnergyScreenSummaryContent } from "./BindingEnergyScreenSummaryContent.js";

export type BindingEnergyScreenViewOptions = ScreenViewOptions;

export class BindingEnergyScreenView extends ScreenView {
  public constructor(
    model: BindingEnergyModel,
    preferences: NuclideChartPreferencesModel,
    providedOptions?: BindingEnergyScreenViewOptions,
  ) {
    const options = optionize<BindingEnergyScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new BindingEnergyScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getBindingEnergyStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getBindingEnergyA11yStrings();
    const layout = chartAndPanelsLayout(this.layoutBounds);
    const listParent = new Node();

    const label = (
      text: TReadOnlyProperty<string> | string,
      maxWidth = PANEL_CONTENT_WIDTH,
      font = FONTS.LABEL,
    ): RichText => new RichText(text, { font, fill: NuclideChartColors.textColorProperty, maxWidth });
    const checkbox = (
      property: Property<boolean>,
      text: TReadOnlyProperty<string>,
      maxWidth: number = BINDING_ENERGY_SCREEN_VIEW_SETTINGS.DEFAULT_MAX_WIDTH,
    ): Checkbox =>
      new Checkbox(property, label(text, maxWidth), { ...NUCLIDE_CHART_CHECKBOX_OPTIONS, accessibleName: text });
    const button = (text: TReadOnlyProperty<string>, listener: () => void): RectangularPushButton =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        content: new Text(text, {
          font: FONTS.LABEL,
          fill: LIGHT_SURFACE_TEXT_FILL,
          maxWidth: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.BUTTON_MAX_WIDTH,
        }),
        listener,
        accessibleName: text,
      });

    // ── Chart ─────────────────────────────────────────────────────────────────
    const chart = new BindingChartNode(model, SCATTER_CHART.WIDTH, SCATTER_CHART.HEIGHT, {
      accessibleName: a11y.controls.cursorStringProperty,
      accessibleHelpText: a11y.controls.cursorHelpStringProperty,
    });

    // ── View choice ───────────────────────────────────────────────────────────
    const viewGroup = new AquaRadioButtonGroup(
      model.viewProperty,
      [
        {
          value: BindingView.CURVE,
          createNode: () =>
            label(strings.view.curveStringProperty, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.CURVE_LABEL_MAX_WIDTH),
        },
        {
          value: BindingView.RESIDUAL_N,
          createNode: () =>
            label(strings.view.residualNStringProperty, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.RESIDUAL_N_LABEL_MAX_WIDTH),
        },
        {
          value: BindingView.RESIDUAL_Z,
          createNode: () =>
            label(strings.view.residualZStringProperty, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.RESIDUAL_Z_LABEL_MAX_WIDTH),
        },
      ],
      {
        orientation: "vertical",
        spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.VIEW_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
        accessibleName: strings.viewTitleStringProperty,
      },
    );
    const zoomCheckbox = checkbox(model.zoomOnPeakProperty, strings.zoomPeakStringProperty);
    zoomCheckbox.enabledProperty = new DerivedProperty([model.viewProperty], (view) => view === BindingView.CURVE);
    const formulaCheckbox = checkbox(model.formulaVisibleProperty, strings.showFormulaStringProperty);
    const magicCheckbox = checkbox(model.shared.magicNumbersVisibleProperty, common.magicNumbersStringProperty);
    const viewPanel = new NuclideChartPanel(
      new VBox({
        spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.VIEW_PANEL_SPACING,
        align: "left",
        children: [viewGroup, zoomCheckbox, formulaCheckbox, magicCheckbox],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    // ── Mass formula ──────────────────────────────────────────────────────────
    const termNames = strings.formula as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const termRows = MASS_FORMULA_TERMS.map((term: MassFormulaTerm) => {
      const name = termNames[`${term}StringProperty`] as TReadOnlyProperty<string>;
      const enabled = model.termEnabledProperties[term];
      const coefficient = model.coefficientProperties[term];
      const box = new Checkbox(enabled, label(name, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.BOX_MAX_WIDTH), {
        ...NUCLIDE_CHART_CHECKBOX_OPTIONS,
        accessibleName: name,
      });
      const slider = new HSlider(coefficient, coefficient.range, {
        ...NUCLIDE_CHART_SLIDER_OPTIONS,
        trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize.copy().setWidth(BINDING.COEFFICIENT_SLIDER_WIDTH),
        enabledProperty: enabled,
        constrainValue: (value: number) => Number(toFixed(value, term === "coulomb" ? 3 : 2)),
        keyboardStep: coefficient.range.getLength() / 50,
        shiftKeyboardStep: coefficient.range.getLength() / 500,
        pageKeyboardStep: coefficient.range.getLength() / 10,
        accessibleName: name,
        pdomCreateAriaValueText: (value: number | null) =>
          value === null ? "" : formatFixed(value, term === "coulomb" ? 3 : 2),
      });
      const readout = new Text(
        new DerivedProperty([coefficient], (value) => formatFixed(value, term === "coulomb" ? 3 : 2)),
        {
          font: FONTS.READOUT,
          fill: NuclideChartColors.textColorProperty,
          maxWidth: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.READOUT_MAX_WIDTH,
        },
      );
      return { box, slider, readout };
    });
    const formulaGrid = new GridBox({
      xSpacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FORMULA_GRID_X_SPACING,
      ySpacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FORMULA_GRID_Y_SPACING,
      xAlign: "left",
      rows: termRows.map((row) => [row.box, row.slider, row.readout]),
    });
    const fitButton = button(strings.formula.fitStringProperty, () => model.fit());
    const textbookButton = button(strings.formula.textbookStringProperty, () => model.useTextbookValues());
    const rmsText = label(
      new DerivedProperty([strings.formula.rmsPatternStringProperty, model.rmsProperty], (pattern, rms) =>
        StringUtils.fillIn(pattern, {
          value: formatFixed(rms.rms, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.RMS_TEXT_DECIMALS),
          count: rms.count,
        }),
      ),
      PANEL_CONTENT_WIDTH,
      FONTS.SMALL,
    );
    const formulaPanel = new NuclideChartPanel(
      new VBox({
        spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FORMULA_PANEL_SPACING,
        align: "left",
        children: [
          label(strings.formula.titleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE),
          new RichText(strings.formula.equationStringProperty, {
            font: FONTS.SMALL,
            fill: NuclideChartColors.textColorProperty,
            maxWidth: PANEL_CONTENT_WIDTH,
            visibleProperty: preferences.showEquationsProperty,
          }),
          formulaGrid,
          new HBox({
            spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FORMULA_SECTION_SPACING,
            children: [fitButton, textbookButton],
          }),
          rmsText,
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );

    // ── Energy release ────────────────────────────────────────────────────────
    const modeGroup = new AquaRadioButtonGroup<string>(
      model.energyModeProperty,
      [
        {
          value: "fission",
          createNode: () =>
            label(strings.energy.fissionStringProperty, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FISSION_LABEL_MAX_WIDTH),
        },
        {
          value: "fusion",
          createNode: () =>
            label(strings.energy.fusionStringProperty, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FUSION_LABEL_MAX_WIDTH),
        },
      ],
      {
        orientation: "horizontal",
        spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.MODE_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
        accessibleName: strings.energy.titleStringProperty,
      },
    );

    const fission = model.fissionProperty;
    const fragmentSlider = new HSlider(model.lightFragmentAProperty, model.lightFragmentAProperty.range, {
      ...NUCLIDE_CHART_SLIDER_OPTIONS,
      trackSize: NUCLIDE_CHART_SLIDER_OPTIONS.trackSize
        .copy()
        .setWidth(BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FRAGMENT_SLIDER_WIDTH),
      constrainValue: (value: number) => Math.round(value),
      keyboardStep: 1,
      shiftKeyboardStep: 1,
      pageKeyboardStep: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FRAGMENT_SLIDER_PAGE_KEYBOARD_STEP,
      accessibleName: strings.energy.fragmentAStringProperty,
    });
    const fissionReaction = label(
      new DerivedProperty([strings.energy.fissionPatternStringProperty, fission], (pattern, f) =>
        f ? StringUtils.fillIn(pattern, { light: nuclideMarkup(f.light), heavy: nuclideMarkup(f.heavy) }) : "",
      ),
    );
    const fissionEstimate = label(
      new DerivedProperty([strings.energy.estimatePatternStringProperty, fission], (pattern, f) =>
        f
          ? StringUtils.fillIn(pattern, {
              gain: formatFixed(f.gainPerNucleon / 1000, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FISSION_ESTIMATE_DECIMALS),
              count: f.target.a,
              energy: formatFixed(f.estimate / 1000, 0),
            })
          : "",
      ),
      PANEL_CONTENT_WIDTH,
      FONTS.SMALL,
    );
    const fissionQ = label(
      new DerivedProperty([strings.energy.qPatternStringProperty, fission], (pattern, f) =>
        f ? StringUtils.fillIn(pattern, { value: formatFixed(f.q / 1000, 1) }) : "",
      ),
    );
    const fissionContent = new VBox({
      spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FISSION_CONTENT_SPACING,
      align: "left",
      children: [
        new HBox({
          spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FISSION_SECTION_SPACING,
          children: [
            label(
              strings.energy.fragmentAStringProperty,
              BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FRAGMENT_A_LABEL_MAX_WIDTH,
              FONTS.SMALL,
            ),
            fragmentSlider,
            new Text(new DerivedProperty([model.lightFragmentAProperty], (a) => String(a)), {
              font: FONTS.READOUT,
              fill: NuclideChartColors.textColorProperty,
            }),
          ],
        }),
        fissionReaction,
        fissionEstimate,
        fissionQ,
      ],
    });

    const reactionBox = new ComboBox(
      model.fusionReactionIndexProperty,
      FUSION_REACTIONS.map((reaction, i) => ({
        value: i,
        createNode: () =>
          new RichText(reaction.markup, {
            font: FONTS.LABEL,
            fill: LIGHT_SURFACE_TEXT_FILL,
            maxWidth: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.REACTION_BOX_MAX_WIDTH,
          }),
        accessibleName: reaction.markup.replace(/<\/?sup>/g, ""),
      })),
      listParent,
      { ...NUCLIDE_CHART_COMBO_BOX_OPTIONS, accessibleName: strings.energy.reactionStringProperty },
    );
    const fusion = model.fusionProperty;
    const fusionGain = label(
      new DerivedProperty([strings.energy.bindingGainPatternStringProperty, fusion], (pattern, f) =>
        StringUtils.fillIn(pattern, {
          value: formatFixed(f.bindingGain / 1000, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FUSION_GAIN_DECIMALS),
        }),
      ),
    );
    const fusionQ = label(
      new DerivedProperty([strings.energy.qPatternStringProperty, fusion], (pattern, f) =>
        StringUtils.fillIn(pattern, {
          value: formatFixed(f.q / 1000, BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FUSION_Q_DECIMALS),
        }),
      ),
    );
    const fusionContent = new VBox({
      spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.FUSION_CONTENT_SPACING,
      align: "left",
      children: [reactionBox, fusionGain, fusionQ],
    });
    model.energyModeProperty.link((mode) => {
      fissionContent.visible = mode === "fission";
      fusionContent.visible = mode === "fusion";
    });
    const energyPanel = new NuclideChartPanel(
      new VBox({
        spacing: BINDING_ENERGY_SCREEN_VIEW_SETTINGS.ENERGY_PANEL_SPACING,
        align: "left",
        children: [
          label(strings.energy.titleStringProperty, PANEL_CONTENT_WIDTH, FONTS.TITLE),
          modeGroup,
          new Node({ children: [fissionContent, fusionContent] }),
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
      placeInRegion(chart, layout.chart),
      placeInRegion(
        new VBox({ spacing: LAYOUT.PANEL_STACK_SPACING, children: [viewPanel, formulaPanel, energyPanel] }),
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

    this.pdomPlayAreaNode.pdomOrder = [chart, viewGroup, zoomCheckbox, formulaCheckbox, magicCheckbox];
    this.pdomControlAreaNode.pdomOrder = [
      ...termRows.flatMap((row) => [row.box, row.slider]),
      fitButton,
      textbookButton,
      modeGroup,
      fragmentSlider,
      reactionBox,
      resetAllButton,
    ];
  }
}
