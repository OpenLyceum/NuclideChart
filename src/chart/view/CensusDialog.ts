import { CENSUS_DIALOG_SETTINGS } from "../../NuclideChartConstants.js";
/**
 * CensusDialog.ts
 *
 * Stable nuclides counted by the parity of Z and N, under either definition of "stable". Even–even nuclides
 * dominate and only a handful of odd–odd ones survive, which is pairing made visible in a 2 × 2 table.
 */

import { DerivedProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, RichText, Text, VBox } from "scenerystack/scenery";
import { Dialog } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import type { StabilityDefinition } from "../../common/model/NuclideTable.js";
import { pairingCensus } from "../../common/model/pairingCensus.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { CONTROLS, DIALOG, FONTS } from "../../NuclideChartConstants.js";

export class CensusDialog extends Dialog {
  public constructor(definitionProperty: Property<string>) {
    const strings = StringManager.getInstance().getChartStrings().census;
    const text = (
      content: TReadOnlyProperty<string> | string,
      font = FONTS.LABEL,
      maxWidth: number = DIALOG.CENSUS_WIDTH,
    ): RichText => new RichText(content, { font, fill: NuclideChartColors.textColorProperty, maxWidth });

    const censusProperty = new DerivedProperty([definitionProperty], (definition) =>
      pairingCensus(definition as StabilityDefinition),
    );
    const count = (pick: (c: ReturnType<typeof pairingCensus>) => number): Text =>
      new Text(new DerivedProperty([censusProperty], (c) => String(pick(c))), {
        font: FONTS.BIG_LABEL,
        fill: NuclideChartColors.textColorProperty,
      });

    const table = new GridBox({
      xSpacing: CENSUS_DIALOG_SETTINGS.TABLE_X_SPACING,
      ySpacing: CENSUS_DIALOG_SETTINGS.TABLE_Y_SPACING,
      rows: [
        [
          text(""),
          text(strings.evenNStringProperty, FONTS.HEADER, CENSUS_DIALOG_SETTINGS.EVEN_N_TEXT_MAX_WIDTH),
          text(strings.oddNStringProperty, FONTS.HEADER, CENSUS_DIALOG_SETTINGS.ODD_N_TEXT_MAX_WIDTH),
        ],
        [
          text(strings.evenZStringProperty, FONTS.HEADER, CENSUS_DIALOG_SETTINGS.EVEN_Z_TEXT_MAX_WIDTH),
          count((c) => c.evenEven.length),
          count((c) => c.evenOdd.length),
        ],
        [
          text(strings.oddZStringProperty, FONTS.HEADER, CENSUS_DIALOG_SETTINGS.ODD_Z_TEXT_MAX_WIDTH),
          count((c) => c.oddEven.length),
          count((c) => c.oddOdd.length),
        ],
      ],
    });

    const definitionGroup = new AquaRadioButtonGroup<string>(
      definitionProperty,
      [
        {
          value: "ensdf",
          createNode: () => text(strings.ensdfStringProperty, FONTS.LABEL, CENSUS_DIALOG_SETTINGS.ENSDF_TEXT_MAX_WIDTH),
        },
        {
          value: "effective",
          createNode: () =>
            text(strings.effectiveStringProperty, FONTS.LABEL, CENSUS_DIALOG_SETTINGS.EFFECTIVE_TEXT_MAX_WIDTH),
        },
      ],
      {
        orientation: "vertical",
        spacing: CENSUS_DIALOG_SETTINGS.DEFINITION_GROUP_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
        accessibleName: strings.definitionStringProperty,
      },
    );

    const total = text(
      new DerivedProperty([strings.totalPatternStringProperty, censusProperty], (pattern, c) =>
        StringUtils.fillIn(pattern, { total: c.total }),
      ),
    );
    const oddOdd = text(
      new DerivedProperty([strings.oddOddPatternStringProperty, censusProperty], (pattern, c) =>
        StringUtils.fillIn(pattern, { list: c.oddOdd.map((x) => `<sup>${x.a}</sup>${x.symbol}`).join(", ") }),
      ),
    );
    const note = new RichText(strings.isomerNoteStringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.textColorProperty,
      lineWrap: DIALOG.CENSUS_WIDTH,
    });

    const title = new Text(strings.titleStringProperty, {
      font: FONTS.TITLE,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: DIALOG.CENSUS_WIDTH,
    });
    super(
      new VBox({
        spacing: CENSUS_DIALOG_SETTINGS.SPACING,
        align: "left",
        children: [
          new VBox({
            spacing: CENSUS_DIALOG_SETTINGS.ITEM_1_SPACING,
            align: "left",
            children: [text(strings.definitionStringProperty), definitionGroup],
          }),
          table,
          total,
          oddOdd,
          note,
        ],
      }),
      {
        title,
        fill: NuclideChartColors.panelBackgroundColorProperty,
        stroke: NuclideChartColors.panelBorderColorProperty,
        closeButtonColor: NuclideChartColors.textColorProperty,
        accessibleName: strings.titleStringProperty,
      },
    );
  }
}
