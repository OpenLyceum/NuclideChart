import { Q_VALUE_DIALOG_SETTINGS } from "../../NuclideChartConstants.js";
/**
 * QValueDialog.ts
 *
 * "Which decays can this nuclide undergo?" For the selected nuclide, the dialog lists every decay channel
 * with its daughter and the daughter's mass excess, so students can work out each Q value themselves; then
 * "Show Q values" reveals the Q values and compares them with what is observed: allowed and seen, allowed
 * but not seen (too slow), or energetically forbidden.
 */

import { BooleanProperty, DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, type Node, RichText, type TColor, Text, VBox } from "scenerystack/scenery";
import { Dialog } from "scenerystack/sim";
import { BooleanRectangularToggleButton } from "scenerystack/sun";
import { NUCLIDE_TABLE, type Nuclide } from "../../common/model/NuclideTable.js";
import { analyzeAllChannels, type ChannelVerdict, type DecayChannel, daughterOf } from "../../common/model/qValues.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/NuclideChartButtonOptions.js";
import { formatFixed } from "../../common/view/format.js";
import { nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { DIALOG, FONTS } from "../../NuclideChartConstants.js";

/** Colour of each verdict's text. */
const VERDICT_FILLS: Readonly<Record<ChannelVerdict, TColor>> = {
  allowedSeen: NuclideChartColors.fissionColorProperty,
  allowedUnseen: NuclideChartColors.alphaColorProperty,
  forbidden: NuclideChartColors.betaPlusColorProperty,
  unknown: NuclideChartColors.textColorProperty,
};

export class QValueDialog extends Dialog {
  private readonly table: GridBox;
  private readonly revealedProperty: BooleanProperty;
  private readonly nuclideProperty: TReadOnlyProperty<Nuclide>;

  public constructor(nuclideProperty: TReadOnlyProperty<Nuclide>) {
    const strings = StringManager.getInstance().getChartStrings().qValues;
    const title = new RichText(
      new DerivedProperty([strings.titlePatternStringProperty, nuclideProperty], (pattern, nuclide) =>
        StringUtils.fillIn(pattern, { label: nuclideMarkup(nuclide) }),
      ),
      { font: FONTS.TITLE, fill: NuclideChartColors.textColorProperty, maxWidth: DIALOG.QVALUE_WIDTH },
    );
    const intro = new RichText(strings.introStringProperty, {
      font: FONTS.LABEL,
      fill: NuclideChartColors.textColorProperty,
      lineWrap: DIALOG.QVALUE_WIDTH,
    });
    const table = new GridBox({
      xSpacing: Q_VALUE_DIALOG_SETTINGS.TABLE_X_SPACING,
      ySpacing: Q_VALUE_DIALOG_SETTINGS.TABLE_Y_SPACING,
      xAlign: "left",
    });
    const revealedProperty = new BooleanProperty(false);
    const revealButton = new BooleanRectangularToggleButton(
      revealedProperty,
      new Text(strings.hideStringProperty, {
        font: FONTS.LABEL,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: Q_VALUE_DIALOG_SETTINGS.REVEAL_BUTTON_MAX_WIDTH,
      }),
      new Text(strings.revealStringProperty, {
        font: FONTS.LABEL,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: Q_VALUE_DIALOG_SETTINGS.REVEAL_BUTTON_MAX_WIDTH,
      }),
      { ...FLAT_RECTANGULAR_BUTTON_OPTIONS, accessibleName: strings.revealStringProperty },
    );
    const note = new RichText(strings.unseenNoteStringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.textColorProperty,
      lineWrap: DIALOG.QVALUE_WIDTH,
    });

    super(
      new VBox({
        spacing: Q_VALUE_DIALOG_SETTINGS.SPACING,
        align: "left",
        children: [intro, table, revealButton, note],
      }),
      {
        title,
        fill: NuclideChartColors.panelBackgroundColorProperty,
        stroke: NuclideChartColors.panelBorderColorProperty,
        closeButtonColor: NuclideChartColors.textColorProperty,
        accessibleName: title.stringProperty,
      },
    );
    this.table = table;
    this.nuclideProperty = nuclideProperty;
    this.revealedProperty = revealedProperty;
    revealedProperty.link(() => this.rebuild());
    nuclideProperty.link(() => this.rebuild());
  }

  /** Opens the dialog with the Q values hidden, so students predict first. */
  public override show(): void {
    this.revealedProperty.value = false;
    this.rebuild();
    super.show();
  }

  private rebuild(): void {
    if (!(this.table && this.revealedProperty)) {
      return;
    }
    const strings = StringManager.getInstance().getChartStrings().qValues;
    const { channels, verdicts } = strings;
    const nuclide = this.nuclideProperty.value;
    const revealed = this.revealedProperty.value;
    const text = (
      content: string | TReadOnlyProperty<string>,
      font = FONTS.LABEL,
      fill: TColor = NuclideChartColors.textColorProperty,
    ): Node => new RichText(content, { font, fill, maxWidth: Q_VALUE_DIALOG_SETTINGS.TEXT_MAX_WIDTH });
    const mev = (kev: number | null): string =>
      kev === null ? "—" : formatFixed(kev / 1000, Q_VALUE_DIALOG_SETTINGS.MEV_DECIMALS);

    for (const child of this.table.children) {
      child.dispose();
    }
    const helium = NUCLIDE_TABLE.get(2, 2);
    const rows: Node[][] = [
      [
        text(strings.channelStringProperty, FONTS.HEADER),
        text(strings.daughterStringProperty, FONTS.HEADER),
        text(strings.massExcessStringProperty, FONTS.HEADER),
        text(strings.qStringProperty, FONTS.HEADER),
        text(strings.verdictStringProperty, FONTS.HEADER),
      ],
      [text(nuclideMarkup(nuclide)), text(""), text(mev(nuclide.massExcess)), text(""), text("")],
    ];
    for (const analysis of analyzeAllChannels(nuclide)) {
      const channel: DecayChannel = analysis.channel;
      const daughter = channel === "proton" || channel === "neutron" ? null : daughterOf(nuclide, channel);
      const daughterLabel = (() => {
        switch (channel) {
          case "proton":
            return `${nuclideMarkup(nuclide)} − p`;
          case "neutron":
            return `${nuclideMarkup(nuclide)} − n`;
          case "alpha":
            return daughter ? `${nuclideMarkup(daughter)} + <sup>4</sup>He` : "—";
          default:
            return daughter ? nuclideMarkup(daughter) : "—";
        }
      })();
      const massText = (() => {
        switch (channel) {
          case "alpha":
            return daughter ? `${mev(daughter.massExcess)} + ${mev(helium?.massExcess ?? null)}` : "—";
          case "proton":
            return `S<sub>p</sub> = ${mev(nuclide.sp)}`;
          case "neutron":
            return `S<sub>n</sub> = ${mev(nuclide.sn)}`;
          default:
            return mev(daughter?.massExcess ?? null);
        }
      })();
      rows.push([
        text(channels[`${channel}StringProperty`] ?? channel),
        text(daughterLabel),
        text(massText),
        text(revealed ? mev(analysis.q) : "?"),
        revealed
          ? text(
              verdicts[`${analysis.verdict}StringProperty`] ?? analysis.verdict,
              FONTS.LABEL,
              VERDICT_FILLS[analysis.verdict],
            )
          : text(""),
      ]);
    }
    this.table.rows = rows;
  }
}
