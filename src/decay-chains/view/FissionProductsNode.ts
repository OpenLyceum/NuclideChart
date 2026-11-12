/**
 * FissionProductsNode.ts
 *
 * Fission products: the mass-chain yield Y(A) as bars (two humps, near A ≈ 95 and A ≈ 140, with a deep valley
 * at symmetric fission), and below it the β⁻ chain along the chosen A. Each box shows a member's half-life
 * and the fraction of fissions that make it directly; delayed-neutron emitters are flagged.
 */

import { Multilink, type NumberProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Node, Path, Rectangle, RichText, VBox } from "scenerystack/scenery";
import { DECAY_CATEGORY_COLORS } from "../../chart/view/mapColors.js";
import { decayCategoryOf } from "../../common/model/DecayCategory.js";
import { FISSION_SYSTEMS, isobaricChain, massChainYields } from "../../common/model/FissionYields.js";
import { hasMode, NUCLIDE_TABLE, type Nuclide } from "../../common/model/NuclideTable.js";
import { formatValue } from "../../common/view/format.js";
import { nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { PlotFrameNode } from "../../common/view/PlotFrameNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";

const A_RANGE = new Range(66, 172);
const YIELD_MAX = 8;
/** Members made in fewer than this fraction of fissions (and not on the way to the end) are left out. */
const MIN_INDEPENDENT = 1e-6;
const ROW_HEIGHT = 21;
/** Left edge of each table column, as a fraction of the width. */
const COLUMNS = [0, 0.2, 0.42, 0.66, 1];

export class FissionProductsNode extends Node {
  public constructor(
    systemIndexProperty: TReadOnlyProperty<number>,
    massNumberProperty: NumberProperty,
    selectedProperty: Property<Nuclide>,
    width: number,
    plotHeight: number,
  ) {
    super();
    const strings = StringManager.getInstance().getDecayChainsStrings();
    const common = StringManager.getInstance().getCommonStrings();

    // ── Yield bars ────────────────────────────────────────────────────────────
    const frame = new PlotFrameNode(width, plotHeight);
    frame.setAxes({ range: A_RANGE, log: false }, { range: new Range(0, YIELD_MAX), log: false });
    frame.setAxisLabels(common.axes.massNumberStringProperty, strings.yieldAxisStringProperty);
    const bars = new Path(null, { fill: NuclideChartColors.pointColorProperty });
    const selectedBar = new Path(null, { fill: NuclideChartColors.highlightColorProperty });
    const hitArea = new Rectangle(0, 0, width, plotHeight, { fill: "rgba(0,0,0,0)", cursor: "pointer" });
    const transform = frame.chartTransform;
    const pickA = (globalPoint: { x: number; y: number }): void => {
      const local = frame.plotLayer.globalToLocalPoint(globalPoint as never);
      massNumberProperty.value = massNumberProperty.range.constrainValue(Math.round(transform.viewToModelX(local.x)));
    };
    hitArea.addInputListener({ down: (event) => pickA(event.pointer.point) });
    frame.plotLayer.children = [hitArea, bars, selectedBar];
    bars.pickable = false;
    selectedBar.pickable = false;

    // ── β⁻ chain along A ──────────────────────────────────────────────────────
    const chainTitle = new RichText("", {
      font: FONTS.LABEL,
      fill: NuclideChartColors.textColorProperty,
      maxWidth: width,
    });
    const chainRow = new VBox({ spacing: 1, align: "left" });
    const notes = new RichText("", { font: FONTS.SMALL, fill: NuclideChartColors.textColorProperty, lineWrap: width });
    const chainBox = new VBox({ spacing: 8, align: "left", children: [chainTitle, chainRow, notes] });
    chainBox.top = plotHeight + 40;
    this.children = [frame, chainBox];

    const barShape = (yields: readonly number[], only?: number): Shape => {
      const shape = new Shape();
      for (let a = A_RANGE.min; a <= A_RANGE.max; a++) {
        if (only !== undefined && a !== only) {
          continue;
        }
        const percent = Math.min(YIELD_MAX, 100 * (yields[a] ?? 0));
        const x0 = transform.modelToViewX(a - 0.42);
        const x1 = transform.modelToViewX(a + 0.42);
        const y = transform.modelToViewY(percent);
        shape.rect(x0, y, x1 - x0, plotHeight - y);
      }
      return shape;
    };

    const noteKeys: Readonly<Record<string, TReadOnlyProperty<string>>> = {
      "Sr-90": strings.notes.sr90StringProperty,
      "I-131": strings.notes.i131StringProperty,
      "Xe-135": strings.notes.xe135StringProperty,
      "Cs-137": strings.notes.cs137StringProperty,
      "Br-87": strings.notes.br87StringProperty,
    };

    const update = (): void => {
      const system = FISSION_SYSTEMS[systemIndexProperty.value] ?? FISSION_SYSTEMS[0];
      if (!system) {
        return;
      }
      const a = massNumberProperty.value;
      const yields = massChainYields(system);
      bars.shape = barShape(yields);
      selectedBar.shape = barShape(yields, a);

      // Members from the first one fission makes in measurable amounts up to the stable end of the chain.
      const products = isobaricChain(system, a).filter((p) => p.level === 0);
      const firstZ = products.find((p) => (p.independent ?? 0) >= MIN_INDEPENDENT)?.z ?? products[0]?.z ?? 0;
      const members = NUCLIDE_TABLE.isobars(a).filter((x) => x.z >= firstZ);
      const end = members.findIndex((x) => x.isStable || decayCategoryOf(x, "effective").key === "stable");
      const shown = (end >= 0 ? members.slice(0, end + 1) : members).slice(0, 8);

      for (const child of chainRow.children) {
        child.dispose();
      }
      chainRow.children = [
        this.tableRow(
          [
            `<b>${strings.table.nuclideStringProperty.value}</b>`,
            `<b>${common.quantities.halfLifeStringProperty.value}</b>`,
            `<b>${strings.table.independentStringProperty.value}</b>`,
            "",
          ],
          width,
          null,
          selectedProperty,
        ),
        ...shown.map((nuclide, i) => {
          const independent = products.find((p) => p.z === nuclide.z)?.independent ?? null;
          return this.tableRow(
            [
              `${i > 0 ? "↓ " : "  "}${nuclideMarkup(nuclide)}`,
              nuclide.isStable ? common.card.stableStringProperty.value : nuclide.halfLifeText,
              independent !== null && independent > 0 ? formatValue(100 * independent, 2) : "—",
              hasMode(nuclide, "B-N", "B-2N") ? `<i>${strings.delayedNeutronStringProperty.value}</i>` : "",
            ],
            width,
            nuclide,
            selectedProperty,
          );
        }),
      ];
      chainTitle.string = StringUtils.fillIn(strings.chainTitlePatternStringProperty.value, {
        a,
        yield: formatValue(100 * (yields[a] ?? 0), 3),
      });
      notes.string = shown
        .map((x) => noteKeys[x.label]?.value)
        .filter((text): text is string => text !== undefined)
        .join("<br>");
    };
    Multilink.multilink(
      [
        systemIndexProperty,
        massNumberProperty,
        strings.chainTitlePatternStringProperty,
        strings.table.independentStringProperty,
      ],
      update,
    );
    selectedProperty.lazyLink(update);
  }

  /** One row of the chain table; clicking a member's row selects it. */
  private tableRow(
    cells: readonly string[],
    width: number,
    nuclide: Nuclide | null,
    selectedProperty: Property<Nuclide>,
  ): Node {
    const selected = nuclide !== null && selectedProperty.value === nuclide;
    const background = new Rectangle(0, 0, width, ROW_HEIGHT, 3, 3, {
      fill: selected ? NuclideChartColors.panelBackgroundColorProperty : null,
      stroke: selected ? NuclideChartColors.selectionColorProperty : null,
      cursor: nuclide ? "pointer" : null,
    });
    if (nuclide) {
      background.fill = selected ? NuclideChartColors.panelBackgroundColorProperty : "rgba(0,0,0,0)";
      background.addInputListener({
        down: () => {
          selectedProperty.value = nuclide;
        },
      });
    }
    const category = nuclide ? decayCategoryOf(nuclide) : null;
    const texts = cells.map((cell, i) => {
      const fill =
        i === 0 && category
          ? (DECAY_CATEGORY_COLORS.get(category) ?? NuclideChartColors.textColorProperty)
          : NuclideChartColors.textColorProperty;
      return new RichText(cell, {
        font: FONTS.LABEL,
        fill,
        maxWidth: width * (COLUMNS[i + 1] ?? 1) - width * (COLUMNS[i] ?? 0) - 8,
        left: width * (COLUMNS[i] ?? 0) + 6,
        centerY: ROW_HEIGHT / 2,
        pickable: false,
      });
    });
    return new Node({ children: [background, ...texts] });
  }
}
