/**
 * ShellsScreenView.ts
 *
 * The Shells screen: separation energies, one line per element (against N) or per neutron number (against Z).
 * The line through the selected nuclide is highlighted, with its value and the drop to the next nuclide, so
 * the shell closures at 8, 20, 28, 50, 82 and 126 show up as cliffs.
 */

import { DerivedProperty, Multilink, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, Path, Rectangle, RichText, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import { MAGIC_NUMBERS } from "../../common/model/NuclearConstants.js";
import { NUCLIDE_TABLE, type Nuclide } from "../../common/model/NuclideTable.js";
import {
  type SeparationKind,
  type SeparationPoint,
  separationEnergy,
  separationLine,
} from "../../common/model/separationEnergies.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/NuclideChartButtonOptions.js";
import { NUCLIDE_CHART_CHECKBOX_OPTIONS } from "../../common/NuclideChartControlOptions.js";
import { NuclideChartPanel } from "../../common/NuclideChartPanel.js";
import { DataCreditNode } from "../../common/view/DataCreditNode.js";
import { formatFixed, formatSigned } from "../../common/view/format.js";
import { NuclideCardNode, nuclideMarkup } from "../../common/view/NuclideCardNode.js";
import { NuclideScatterNode, type ScatterPoint } from "../../common/view/NuclideScatterNode.js";
import type { PointStyle } from "../../common/view/PointCloudNode.js";
import { chartAndPanelsLayout, placeInRegion } from "../../common/view/ScreenLayout.js";
import { StringManager } from "../../i18n/StringManager.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS, PANEL_COLUMN_WIDTH } from "../../NuclideChartConstants.js";
import { isNeutronKind, SEPARATION_KINDS, type ShellsModel } from "../model/ShellsModel.js";
import { ShellsScreenSummaryContent } from "./ShellsScreenSummaryContent.js";

export type ShellsScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 590;
const CHART_HEIGHT = 500;
const PANEL_CONTENT_WIDTH = PANEL_COLUMN_WIDTH - 24;

const css =
  (property: { value: { toCSS(): string } }): (() => string) =>
  () =>
    property.value.toCSS();

const STYLES: readonly PointStyle[] = [
  { css: css(NuclideChartColors.pointColorProperty), radius: 1.6, alpha: 0.7 },
  { css: css(NuclideChartColors.systematicPointColorProperty), radius: 1.4, alpha: 0.6 },
  { css: css(NuclideChartColors.highlightColorProperty), radius: 3, alpha: 1 },
];

/** The fixed coordinate of the line through a nuclide: Z for isotope lines, N for isotone lines. */
const lineKey = (kind: SeparationKind, nuclide: Nuclide): number => (isNeutronKind(kind) ? nuclide.z : nuclide.n);

export class ShellsScreenView extends ScreenView {
  public constructor(model: ShellsModel, providedOptions?: ShellsScreenViewOptions) {
    const options = optionize<ShellsScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new ShellsScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getShellsStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getShellsA11yStrings();
    const layout = chartAndPanelsLayout(this.layoutBounds);
    const selected = model.shared.selectedNuclideProperty;

    const label = (text: TReadOnlyProperty<string>, maxWidth = PANEL_CONTENT_WIDTH, font = FONTS.LABEL): RichText =>
      new RichText(text, { font, fill: NuclideChartColors.textColorProperty, maxWidth });
    const checkbox = (property: Property<boolean>, text: TReadOnlyProperty<string>): Checkbox =>
      new Checkbox(property, label(text, 230), { ...NUCLIDE_CHART_CHECKBOX_OPTIONS, accessibleName: text });

    // ── Chart ─────────────────────────────────────────────────────────────────
    const chart = new NuclideScatterNode(selected, CHART_WIDTH, CHART_HEIGHT, {
      accessibleName: a11y.controls.chartStringProperty,
      accessibleHelpText: a11y.controls.chartHelpStringProperty,
    });
    const unboundBand = new Rectangle(0, 0, 1, 1, { fill: NuclideChartColors.betaPlusColorProperty, opacity: 0.12 });
    const unboundLabel = new RichText(strings.unboundStringProperty, {
      font: FONTS.SMALL,
      fill: NuclideChartColors.betaPlusColorProperty,
      maxWidth: CHART_WIDTH - 20,
    });
    const magicPath = new Path(null, { stroke: NuclideChartColors.magicLineColorProperty, lineDash: [5, 4] });
    const linesPath = new Path(null, { stroke: NuclideChartColors.pointColorProperty, lineWidth: 0.6, opacity: 0.5 });
    const highlightPath = new Path(null, { stroke: NuclideChartColors.highlightColorProperty, lineWidth: 2.5 });
    const magicLabels = new Node();
    chart.underLayer.children = [unboundBand, magicPath, linesPath, highlightPath];
    chart.overLayer.children = [unboundLabel, magicLabels];

    const lineShape = (points: readonly SeparationPoint[]): Shape => {
      const shape = new Shape();
      let previous: SeparationPoint | null = null;
      for (const p of points) {
        const view = chart.viewPosition(p.x, p.energy / 1000);
        if (!view) {
          continue;
        }
        // Break the line across gaps (a missing nuclide in the chain).
        if (previous && p.x - previous.x <= 1) {
          shape.lineToPoint(view);
        } else {
          shape.moveToPoint(view);
        }
        previous = p;
      }
      return shape;
    };

    const update = (): void => {
      const kind = model.kind;
      const neutron = isNeutronKind(kind);
      const two = kind === "twoNeutron" || kind === "twoProton";
      chart.setAxes(
        { range: new Range(0, neutron ? 165 : 120), log: false },
        { range: new Range(-5, two ? 40 : 28), log: false },
      );
      const axes = strings.axes as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
      chart.frame.setAxisLabels(
        neutron ? common.axes.neutronNumberStringProperty : common.axes.protonNumberStringProperty,
        axes[`${kind}StringProperty`] as TReadOnlyProperty<string>,
      );

      const showEstimated = model.estimatedVisibleProperty.value;
      const highlightKey = lineKey(kind, selected.value);
      const keys = neutron
        ? Array.from({ length: NUCLIDE_TABLE.maxZ + 1 }, (_, z) => z)
        : Array.from({ length: NUCLIDE_TABLE.maxN + 1 }, (_, n) => n);
      const allLines = new Shape();
      const points: ScatterPoint[] = [];
      let highlighted: SeparationPoint[] = [];
      for (const key of keys) {
        const line = separationLine(kind, key).filter((p) => showEstimated || !p.systematic);
        if (line.length === 0) {
          continue;
        }
        if (key === highlightKey) {
          highlighted = line;
        } else {
          allLines.subpaths.push(...lineShape(line).subpaths);
        }
        for (const p of line) {
          points.push({
            nuclide: p.nuclide,
            x: p.x,
            y: p.energy / 1000,
            group: key === highlightKey ? 2 : p.systematic ? 1 : 0,
          });
        }
      }
      // Highlighted points go last so they draw on top.
      points.sort((p, q) => (p.group === 2 ? 1 : 0) - (q.group === 2 ? 1 : 0));
      linesPath.shape = new Shape(allLines.subpaths);
      highlightPath.shape = lineShape(highlighted);
      chart.setPoints(points, STYLES);

      // Magic numbers and the unbound region.
      const transform = chart.frame.chartTransform;
      const magicShape = new Shape();
      for (const child of magicLabels.children) {
        child.dispose();
      }
      const labels: Node[] = [];
      if (model.shared.magicNumbersVisibleProperty.value) {
        for (const m of MAGIC_NUMBERS) {
          const x = transform.modelToViewX(m);
          if (x > 0 && x < CHART_WIDTH) {
            magicShape.moveTo(x, 0).lineTo(x, CHART_HEIGHT);
            labels.push(
              new RichText(String(m), {
                font: FONTS.CHART_LABEL,
                fill: NuclideChartColors.magicLineColorProperty,
                centerX: x,
                top: 3,
              }),
            );
          }
        }
      }
      magicPath.shape = magicShape;
      magicLabels.children = labels;
      const zeroY = transform.modelToViewY(0);
      unboundBand.setRect(0, zeroY, CHART_WIDTH, CHART_HEIGHT - zeroY);
      unboundLabel.left = 6;
      unboundLabel.bottom = CHART_HEIGHT - 4;
    };
    Multilink.multilink(
      [model.kindProperty, model.estimatedVisibleProperty, model.shared.magicNumbersVisibleProperty],
      update,
    );
    // Re-highlight only when the selection moves to another line.
    let lastKey = lineKey(model.kind, selected.value);
    selected.lazyLink((nuclide) => {
      const key = lineKey(model.kind, nuclide);
      if (key !== lastKey) {
        lastKey = key;
        update();
      }
    });
    model.kindProperty.lazyLink(() => {
      lastKey = lineKey(model.kind, selected.value);
    });

    // ── Controls and readouts ─────────────────────────────────────────────────
    const kinds = strings.kinds as unknown as Readonly<Record<string, TReadOnlyProperty<string>>>;
    const kindGroup = new AquaRadioButtonGroup<string>(
      model.kindProperty,
      SEPARATION_KINDS.map((kind) => ({
        value: kind,
        createNode: () => label(kinds[`${kind}StringProperty`] as TReadOnlyProperty<string>, 240),
      })),
      {
        orientation: "vertical",
        spacing: 5,
        radioButtonOptions: { radius: 7 },
        accessibleName: strings.kindTitleStringProperty,
      },
    );
    const estimatedCheckbox = checkbox(model.estimatedVisibleProperty, strings.showEstimatedStringProperty);
    const magicCheckbox = checkbox(model.shared.magicNumbersVisibleProperty, common.magicNumbersStringProperty);

    const lineText = new DerivedProperty(
      [
        strings.linePatternIsotopesStringProperty,
        strings.linePatternIsotonesStringProperty,
        model.kindProperty,
        selected,
      ],
      (isotopes, isotones, kind, nuclide) =>
        isNeutronKind(kind as SeparationKind)
          ? StringUtils.fillIn(isotopes, { name: nuclide.symbol, z: nuclide.z })
          : StringUtils.fillIn(isotones, { n: nuclide.n }),
    );
    const valueText = new DerivedProperty(
      [strings.valuePatternStringProperty, common.card.noDataStringProperty, model.kindProperty, selected],
      (pattern, none, kind, nuclide) => {
        const value = separationEnergy(nuclide, kind as SeparationKind);
        return StringUtils.fillIn(pattern, {
          label: nuclideMarkup(nuclide),
          value: value === null ? none : formatFixed(value / 1000, 2),
        });
      },
    );
    const dropText = new DerivedProperty(
      [strings.dropPatternStringProperty, model.kindProperty, selected],
      (pattern, kind, nuclide) => {
        const k = kind as SeparationKind;
        const two = k === "twoNeutron" || k === "twoProton";
        const step = two ? 2 : 1;
        const next = isNeutronKind(k)
          ? NUCLIDE_TABLE.get(nuclide.z, nuclide.n + step)
          : NUCLIDE_TABLE.get(nuclide.z + step, nuclide.n);
        const here = separationEnergy(nuclide, k);
        const there = next ? separationEnergy(next, k) : null;
        if (!next || here === null || there === null) {
          return "";
        }
        return StringUtils.fillIn(pattern, {
          next: nuclideMarkup(next),
          change: formatSigned((there - here) / 1000, 2),
        });
      },
    );
    const controlsPanel = new NuclideChartPanel(
      new VBox({ spacing: 6, align: "left", children: [kindGroup, estimatedCheckbox, magicCheckbox] }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );
    const readoutPanel = new NuclideChartPanel(
      new VBox({
        spacing: 5,
        align: "left",
        children: [
          label(lineText),
          label(valueText, PANEL_CONTENT_WIDTH, FONTS.READOUT),
          label(dropText, PANEL_CONTENT_WIDTH, FONTS.READOUT),
          new RichText(strings.hintStringProperty, {
            font: FONTS.SMALL,
            fill: NuclideChartColors.textColorProperty,
            lineWrap: PANEL_CONTENT_WIDTH,
          }),
        ],
      }),
      { minWidth: PANEL_COLUMN_WIDTH, maxWidth: PANEL_COLUMN_WIDTH },
    );
    const cardPanel = new NuclideChartPanel(new NuclideCardNode(selected, { contentWidth: PANEL_CONTENT_WIDTH }), {
      minWidth: PANEL_COLUMN_WIDTH,
      maxWidth: PANEL_COLUMN_WIDTH,
    });

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
    });

    this.children = [
      placeInRegion(chart, layout.chart),
      placeInRegion(new VBox({ spacing: 8, children: [controlsPanel, readoutPanel, cardPanel] }), layout.panels, {
        yAlign: "top",
      }),
      placeInRegion(
        new HBox({
          spacing: 10,
          align: "bottom",
          children: [new DataCreditNode(PANEL_COLUMN_WIDTH - 60), resetAllButton],
        }),
        layout.footer,
        { xAlign: "right", yAlign: "bottom" },
      ),
    ];
    this.pdomPlayAreaNode.pdomOrder = [chart, kindGroup];
    this.pdomControlAreaNode.pdomOrder = [estimatedCheckbox, magicCheckbox, resetAllButton];
  }
}
