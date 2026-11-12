/**
 * CensusDialog.ts
 *
 * Stable nuclides counted by the parity of Z and N, under either definition of "stable". Even–even nuclides
 * dominate and only a handful of odd–odd ones survive, which is pairing made visible in a 2 × 2 table.
 */

import { DerivedProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Dialog } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import type { StabilityDefinition } from "../../common/model/NuclideTable.js";
import { pairingCensus } from "../../common/model/pairingCensus.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";

const CONTENT_WIDTH = 420;
const COUNT_FONT = new PhetFont({ size: 22, weight: "bold" });
const HEADER_FONT = new PhetFont({ size: 13, weight: "bold" });

export class CensusDialog extends Dialog {
  public constructor(definitionProperty: Property<string>) {
    const strings = StringManager.getInstance().getChartStrings().census;
    const text = (
      content: TReadOnlyProperty<string> | string,
      font = FONTS.LABEL,
      maxWidth = CONTENT_WIDTH,
    ): RichText => new RichText(content, { font, fill: NuclideChartColors.textColorProperty, maxWidth });

    const census = new DerivedProperty([definitionProperty], (definition) =>
      pairingCensus(definition as StabilityDefinition),
    );
    const count = (pick: (c: ReturnType<typeof pairingCensus>) => number): Text =>
      new Text(new DerivedProperty([census], (c) => String(pick(c))), {
        font: COUNT_FONT,
        fill: NuclideChartColors.textColorProperty,
      });

    const table = new GridBox({
      xSpacing: 30,
      ySpacing: 8,
      rows: [
        [
          text(""),
          text(strings.evenNStringProperty, HEADER_FONT, 110),
          text(strings.oddNStringProperty, HEADER_FONT, 110),
        ],
        [
          text(strings.evenZStringProperty, HEADER_FONT, 110),
          count((c) => c.evenEven.length),
          count((c) => c.evenOdd.length),
        ],
        [
          text(strings.oddZStringProperty, HEADER_FONT, 110),
          count((c) => c.oddEven.length),
          count((c) => c.oddOdd.length),
        ],
      ],
    });

    const definitionGroup = new AquaRadioButtonGroup<string>(
      definitionProperty,
      [
        { value: "ensdf", createNode: () => text(strings.ensdfStringProperty, FONTS.LABEL, 300) },
        { value: "effective", createNode: () => text(strings.effectiveStringProperty, FONTS.LABEL, 300) },
      ],
      {
        orientation: "vertical",
        spacing: 4,
        radioButtonOptions: { radius: 7 },
        accessibleName: strings.definitionStringProperty,
      },
    );

    const total = text(
      new DerivedProperty([strings.totalPatternStringProperty, census], (pattern, c) =>
        StringUtils.fillIn(pattern, { total: c.total }),
      ),
    );
    const oddOdd = text(
      new DerivedProperty([strings.oddOddPatternStringProperty, census], (pattern, c) =>
        StringUtils.fillIn(pattern, { list: c.oddOdd.map((x) => `<sup>${x.a}</sup>${x.symbol}`).join(", ") }),
      ),
    );
    const note = new RichText(strings.isomerNoteStringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.textColorProperty,
      lineWrap: CONTENT_WIDTH,
    });

    const title = new Text(strings.titleStringProperty, {
      font: FONTS.TITLE,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: CONTENT_WIDTH,
    });
    super(
      new VBox({
        spacing: 12,
        align: "left",
        children: [
          new VBox({ spacing: 4, align: "left", children: [text(strings.definitionStringProperty), definitionGroup] }),
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
