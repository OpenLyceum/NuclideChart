/**
 * DataCreditNode.ts
 *
 * The data credit shown on every screen: the IAEA Live Chart of Nuclides, the evaluations it compiles, and
 * the snapshot date.
 */

import { PatternStringProperty } from "scenerystack/axon";
import { RichText, type RichTextOptions } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";
import { NUCLIDE_TABLE } from "../model/NuclideTable.js";

export class DataCreditNode extends RichText {
  private readonly creditStringProperty: PatternStringProperty<{ date: string }>;

  public constructor(lineWrap: number, options?: RichTextOptions) {
    const creditStringProperty = new PatternStringProperty(
      StringManager.getInstance().getCommonStrings().dataCreditPatternStringProperty,
      { date: NUCLIDE_TABLE.retrieved },
    );
    super(creditStringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.axisColorProperty,
      lineWrap,
      ...options,
    });
    this.creditStringProperty = creditStringProperty;
  }

  public override dispose(): void {
    super.dispose();
    this.creditStringProperty.dispose();
  }
}
