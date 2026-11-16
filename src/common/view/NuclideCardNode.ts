import { NUCLIDE_CARD_NODE_SETTINGS } from "../../NuclideChartConstants.js";
/**
 * NuclideCardNode.ts
 *
 * The selected nuclide's data card: symbol and (Z, N, A), half-life, decay branches, binding energy per
 * nucleon, mass excess, spin and parity, natural abundance and separation energies. Masses estimated from
 * systematics are flagged so they are not over-trusted. Shared by every screen.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, RichText, VBox, type VBoxOptions } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";
import type { Nuclide } from "../model/NuclideTable.js";
import { formatFixed } from "./format.js";

/** ENSDF decay-mode codes → display symbols. */
const MODE_SYMBOLS: Readonly<Record<string, string>> = {
  "B-": "β⁻",
  "B+": "β⁺",
  EC: "EC",
  "EC+B+": "EC + β⁺",
  A: "α",
  SF: "SF",
  IT: "IT",
  P: "p",
  "2P": "2p",
  N: "n",
  "2N": "2n",
  "B-N": "β⁻n",
  "B-2N": "β⁻2n",
  "B-A": "β⁻α",
  ECP: "ECp",
  "B+P": "β⁺p",
  "2B-": "2β⁻",
  "2B+": "2β⁺",
  "2EC": "2EC",
  ECSF: "ECSF",
};

/** Display symbol of an ENSDF decay mode. */
const formatMode = (mode: string): string => MODE_SYMBOLS[mode] ?? mode;

/** "⁵⁶Fe" as rich text. */
export const nuclideMarkup = (nuclide: Nuclide): string => `<sup>${nuclide.a}</sup>${nuclide.symbol}`;

/** A branching ratio for display: 100, 64.06, 1.4 × 10⁻⁵ … */
const formatPercent = (percent: number): string => {
  if (percent >= 0.01) {
    return String(Number(percent.toPrecision(NUCLIDE_CARD_NODE_SETTINGS.FORMAT_PERCENT_SIGNIFICANT_FIGURES)));
  }
  const exponent = Math.floor(Math.log10(percent));
  return `${Number((percent / 10 ** exponent).toPrecision(NUCLIDE_CARD_NODE_SETTINGS.FORMAT_PERCENT_SIGNIFICANT_FIGURES_SEGMENT_2))}×10<sup>${exponent}</sup>`;
};

export type NuclideCardNodeOptions = VBoxOptions & { readonly contentWidth?: number };

export class NuclideCardNode extends VBox {
  public constructor(nuclideProperty: TReadOnlyProperty<Nuclide>, providedOptions?: NuclideCardNodeOptions) {
    const width = providedOptions?.contentWidth ?? 270;
    const common = StringManager.getInstance().getCommonStrings();
    const q = common.quantities;
    const units = common.units;
    const card = common.card;

    const label = (text: TReadOnlyProperty<string>): RichText =>
      new RichText(text, {
        font: FONTS.LABEL,
        fill: NuclideChartColors.textColorProperty,
        maxWidth: width * NUCLIDE_CARD_NODE_SETTINGS.LABEL_MAX_WIDTH_FACTOR,
      });
    const value = (text: TReadOnlyProperty<string>): RichText =>
      new RichText(text, {
        font: FONTS.READOUT,
        fill: NuclideChartColors.textColorProperty,
        maxWidth: width * NUCLIDE_CARD_NODE_SETTINGS.VALUE_MAX_WIDTH_FACTOR,
      });
    const pattern = (
      patternProperty: TReadOnlyProperty<string>,
      read: (nuclide: Nuclide) => number | null,
      decimals: number,
    ): TReadOnlyProperty<string> =>
      new DerivedProperty([patternProperty, card.noDataStringProperty, nuclideProperty], (p, none, nuclide) => {
        const x = read(nuclide);
        return x === null ? none : StringUtils.fillIn(p, { value: formatFixed(x, decimals) });
      });

    const title = new RichText(new DerivedProperty([nuclideProperty], (nuclide) => nuclideMarkup(nuclide)), {
      font: FONTS.BIG_LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: width * NUCLIDE_CARD_NODE_SETTINGS.TITLE_MAX_WIDTH_FACTOR,
    });
    const zna = new RichText(
      new DerivedProperty([card.znaPatternStringProperty, nuclideProperty], (p, nuclide) =>
        StringUtils.fillIn(p, { z: nuclide.z, n: nuclide.n, a: nuclide.a }),
      ),
      {
        font: FONTS.LABEL,
        fill: NuclideChartColors.textColorProperty,
        maxWidth: width * NUCLIDE_CARD_NODE_SETTINGS.ZNA_MAX_WIDTH_FACTOR,
      },
    );
    const halfLife = new DerivedProperty(
      [card.stableStringProperty, card.noDataStringProperty, nuclideProperty],
      (stable, none, nuclide) => (nuclide.isStable ? stable : nuclide.halfLifeText || none),
    );
    const decay = new DerivedProperty(
      [card.noDecayDataStringProperty, card.noDataStringProperty, nuclideProperty],
      (noDecay, none, nuclide) => {
        if (nuclide.branches.length === 0) {
          return nuclide.isStable ? noDecay : none;
        }
        return nuclide.branches
          .map((b) => (b.percent === null ? formatMode(b.mode) : `${formatMode(b.mode)} ${formatPercent(b.percent)} %`))
          .join(", ");
      },
    );
    const spin = new DerivedProperty([card.noDataStringProperty, nuclideProperty], (none, nuclide) =>
      nuclide.spinParity === "" ? none : nuclide.spinParity.replace(/-/g, "−"),
    );

    const rows = new GridBox({
      xSpacing: NUCLIDE_CARD_NODE_SETTINGS.ROWS_X_SPACING,
      ySpacing: NUCLIDE_CARD_NODE_SETTINGS.ROWS_Y_SPACING,
      xAlign: "left",
      rows: [
        [label(q.halfLifeStringProperty), value(halfLife)],
        [label(q.decayStringProperty), value(decay)],
        [
          label(q.bindingPerNucleonStringProperty),
          value(
            pattern(
              units.mevPatternStringProperty,
              (x) => (x.bindingPerNucleon === null ? null : x.bindingPerNucleon / 1000),
              NUCLIDE_CARD_NODE_SETTINGS.MEV_PATTERN_PATTERN_DECIMALS,
            ),
          ),
        ],
        [
          label(q.massExcessStringProperty),
          value(
            pattern(
              units.mevPatternStringProperty,
              (x) => (x.massExcess === null ? null : x.massExcess / 1000),
              NUCLIDE_CARD_NODE_SETTINGS.MEV_PATTERN_PATTERN_DECIMALS_SEGMENT_2,
            ),
          ),
        ],
        [label(q.spinParityStringProperty), value(spin)],
        [
          label(q.abundanceStringProperty),
          value(
            pattern(
              units.percentPatternStringProperty,
              (x) => x.abundance,
              NUCLIDE_CARD_NODE_SETTINGS.PERCENT_PATTERN_PATTERN_DECIMALS,
            ),
          ),
        ],
        [
          label(q.separationNeutronStringProperty),
          value(
            pattern(
              units.mevPatternStringProperty,
              (x) => (x.sn === null ? null : x.sn / 1000),
              NUCLIDE_CARD_NODE_SETTINGS.MEV_PATTERN_PATTERN_DECIMALS_SEGMENT_2,
            ),
          ),
        ],
        [
          label(q.separationProtonStringProperty),
          value(
            pattern(
              units.mevPatternStringProperty,
              (x) => (x.sp === null ? null : x.sp / 1000),
              NUCLIDE_CARD_NODE_SETTINGS.MEV_PATTERN_PATTERN_DECIMALS_SEGMENT_2,
            ),
          ),
        ],
      ],
    });

    const estimated = new RichText(card.estimatedStringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.alphaColorProperty,
      maxWidth: width,
      visibleProperty: new DerivedProperty([nuclideProperty], (nuclide) => nuclide.isSystematic),
    });

    super({
      spacing: NUCLIDE_CARD_NODE_SETTINGS.SPACING,
      align: "left",
      children: [
        new VBox({ spacing: NUCLIDE_CARD_NODE_SETTINGS.ITEM_1_SPACING, align: "left", children: [title, zna] }),
        rows,
        estimated,
      ],
      ...providedOptions,
    });
  }
}
