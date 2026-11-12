/**
 * MapLegendNode.ts
 *
 * The key to the nuclide map's current colouring: colour swatches for decay modes and for measured versus
 * estimated masses, or a gradient bar with end labels for a continuous quantity.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import {
  GridBox,
  HBox,
  LinearGradient,
  Node,
  Rectangle,
  RichText,
  type TColor,
  Text,
  VBox,
} from "scenerystack/scenery";
import { DecayCategory } from "../../common/model/DecayCategory.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";
import { MapColoring } from "../model/MapColoring.js";
import { DECAY_CATEGORY_COLORS, MEASUREMENT_COLORS, scaleStops } from "./mapColors.js";

const SWATCH = 11;
const BAR_HEIGHT = 12;

/** Decay categories in the order the legend lists them. */
const LEGEND_CATEGORIES = [
  DecayCategory.STABLE,
  DecayCategory.BETA_MINUS,
  DecayCategory.BETA_PLUS,
  DecayCategory.ALPHA,
  DecayCategory.FISSION,
  DecayCategory.PROTON,
  DecayCategory.NEUTRON,
  DecayCategory.UNKNOWN,
];

export class MapLegendNode extends Node {
  public constructor(coloringProperty: TReadOnlyProperty<MapColoring>, width: number) {
    super();
    const common = StringManager.getInstance().getCommonStrings();
    const chart = StringManager.getInstance().getChartStrings();
    const modes = common.decayModes as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const small = (text: TReadOnlyProperty<string> | string, maxWidth: number): RichText =>
      new RichText(text, { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty, maxWidth });
    const swatch = (fill: TColor): Rectangle =>
      new Rectangle(0, 0, SWATCH, SWATCH, {
        fill,
        stroke: NuclideChartColors.axisColorProperty,
        lineWidth: 0.5,
      });
    const entry = (fill: TColor, text: TReadOnlyProperty<string>, maxWidth: number): HBox =>
      new HBox({ spacing: 5, children: [swatch(fill), small(text, maxWidth)] });

    const decayLegend = new GridBox({
      autoColumns: 2,
      xSpacing: 10,
      ySpacing: 3,
      xAlign: "left",
      children: LEGEND_CATEGORIES.map((category) =>
        entry(
          DECAY_CATEGORY_COLORS.get(category) ?? "#888",
          modes[`${category.key}StringProperty`] as TReadOnlyProperty<string>,
          width / 2 - 24,
        ),
      ),
    });
    const measurementLegend = new VBox({
      spacing: 3,
      align: "left",
      children: [
        entry(MEASUREMENT_COLORS[0] ?? "#888", chart.legend.measuredStringProperty, width - 20),
        entry(MEASUREMENT_COLORS[1] ?? "#888", chart.legend.estimatedStringProperty, width - 20),
        entry(NuclideChartColors.noDataColorProperty, chart.legend.noDataStringProperty, width - 20),
      ],
    });

    const barWidth = width;
    const bar = new Rectangle(0, 0, barWidth, BAR_HEIGHT, {
      stroke: NuclideChartColors.axisColorProperty,
      lineWidth: 0.5,
    });
    const minLabel = new Text("", { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty });
    const maxLabel = new Text("", { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty });
    const noteLow = small("", barWidth / 2 - 4);
    const noteHigh = small("", barWidth / 2 - 4);
    const extra = new HBox({
      spacing: 12,
      children: [entry(NuclideChartColors.noDataColorProperty, chart.legend.noDataStringProperty, barWidth / 2 - 20)],
    });
    const scaleLegend = new Node({ children: [bar, minLabel, maxLabel, noteLow, noteHigh, extra] });

    const layoutScale = (coloring: MapColoring): void => {
      const gradient = new LinearGradient(0, 0, barWidth, 0);
      for (const stop of scaleStops(coloring)) {
        gradient.addColorStop(stop.offset, stop.color);
      }
      bar.fill = gradient;
      const labels = scaleLabels(coloring);
      minLabel.string = labels.min;
      maxLabel.string = labels.max;
      minLabel.left = 0;
      minLabel.top = bar.bottom + 2;
      maxLabel.right = barWidth;
      maxLabel.top = bar.bottom + 2;
      noteLow.stringProperty = labels.noteLow ?? null;
      noteHigh.stringProperty = labels.noteHigh ?? null;
      noteLow.visible = labels.noteLow !== undefined;
      noteHigh.visible = labels.noteHigh !== undefined;
      noteLow.left = 0;
      noteLow.top = minLabel.bottom + 1;
      noteHigh.right = barWidth;
      noteHigh.top = maxLabel.bottom + 1;
      extra.left = 0;
      extra.top =
        Math.max(noteLow.visible ? noteLow.bottom : minLabel.bottom, noteHigh.visible ? noteHigh.bottom : 0) + 4;
    };

    coloringProperty.link((coloring) => {
      if (coloring === MapColoring.DECAY_MODE) {
        this.children = [decayLegend];
      } else if (coloring === MapColoring.MEASUREMENT) {
        this.children = [measurementLegend];
      } else {
        layoutScale(coloring);
        this.children = [scaleLegend];
      }
    });
  }
}

/** End labels and optional notes of each continuous colour scale. */
function scaleLabels(coloring: MapColoring): {
  min: string;
  max: string;
  noteLow?: TReadOnlyProperty<string>;
  noteHigh?: TReadOnlyProperty<string>;
} {
  const legend = StringManager.getInstance().getChartStrings().legend;
  switch (coloring) {
    case MapColoring.HALF_LIFE:
      return { min: "10⁻²⁰ s", max: "10²⁵ s" };
    case MapColoring.BINDING_PER_NUCLEON:
      return { min: "≤ 6 MeV", max: "8.8 MeV" };
    case MapColoring.RESIDUAL:
      return {
        min: "−10 MeV",
        max: "+10 MeV",
        noteLow: legend.lessBoundStringProperty,
        noteHigh: legend.moreBoundStringProperty,
      };
    case MapColoring.ABUNDANCE:
      return { min: "0 %", max: "100 %" };
    case MapColoring.QUADRUPOLE:
      return {
        min: "−3 b",
        max: "+3 b",
        noteLow: legend.oblateStringProperty,
        noteHigh: legend.prolateStringProperty,
      };
    default:
      return { min: "J = 0", max: "J ≥ 10" };
  }
}
