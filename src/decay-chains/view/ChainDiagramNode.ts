/**
 * ChainDiagramNode.ts
 *
 * A decay chain drawn on its patch of the chart of nuclides (N across, Z up): one cell per member, coloured
 * by decay mode, joined by arrows. α steps go two down and two left; β⁻ steps one up and one left, so the
 * chain zig-zags back towards the valley after each α. Branches show their percentages. An isomer and its
 * ground state share a cell, split in two (Pa-234m above Pa-234). Click a cell, or use the arrow keys, to
 * select a member.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { KeyboardListener, Node, type NodeOptions, Rectangle, RichText, type TColor, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { DECAY_CATEGORY_COLORS } from "../../chart/view/mapColors.js";
import { categoryOfMode, DecayCategory } from "../../common/model/DecayCategory.js";
import type { ChainNode, DecayChain } from "../../common/model/decayChains.js";
import { NUCLIDE_TABLE, type Nuclide } from "../../common/model/NuclideTable.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { FONTS } from "../../NuclideChartConstants.js";

const MAX_CELL = 34;

/** The category a chain member is coloured by: its strongest kept branch, or stable. */
const nodeCategory = (node: ChainNode): DecayCategory => {
  if (node.lambda === 0) {
    return DecayCategory.STABLE;
  }
  const strongest = [...node.links].sort((p, q) => q.fraction - p.fraction)[0];
  return strongest ? categoryOfMode(strongest.mode) : DecayCategory.UNKNOWN;
};

/** Text colour that reads on a decay-mode fill. */
const textOn = (category: DecayCategory): string =>
  category === DecayCategory.ALPHA || category === DecayCategory.STABLE ? "#000000" : "#ffffff";

export type ChainDiagramNodeOptions = NodeOptions & {
  readonly accessibleName: TReadOnlyProperty<string>;
  readonly accessibleHelpText: TReadOnlyProperty<string>;
};

export class ChainDiagramNode extends Node {
  private readonly diagramWidth: number;
  private readonly diagramHeight: number;
  private readonly selectedProperty: Property<Nuclide>;
  private chain: DecayChain | null = null;
  private readonly cells = new Node();
  private readonly arrows = new Node();
  private readonly highlight: Rectangle;

  public constructor(
    chainProperty: TReadOnlyProperty<DecayChain>,
    selectedProperty: Property<Nuclide>,
    width: number,
    height: number,
    options: ChainDiagramNodeOptions,
  ) {
    super({ tagName: "div", focusable: true, ...options });
    this.diagramWidth = width;
    this.diagramHeight = height;
    this.selectedProperty = selectedProperty;
    this.highlight = new Rectangle(0, 0, 1, 1, {
      stroke: NuclideChartColors.selectionColorProperty,
      lineWidth: 2.5,
      pickable: false,
    });
    const background = new Rectangle(0, 0, width, height, {
      fill: NuclideChartColors.chartBackgroundColorProperty,
      stroke: NuclideChartColors.axisColorProperty,
    });
    this.children = [background, this.arrows, this.cells, this.highlight];

    chainProperty.link((chain) => this.rebuild(chain));
    selectedProperty.link(() => this.updateHighlight());

    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
        fire: (_event, keysPressed) => this.step(keysPressed === "arrowRight" || keysPressed === "arrowDown" ? 1 : -1),
      }),
    );
  }

  /** Steps through the chain's ground-state members in decay order. */
  private step(direction: number): void {
    const members = (this.chain?.nodes ?? []).filter((node) => !node.isomer);
    const current = members.findIndex(
      (node) => node.z === this.selectedProperty.value.z && node.n === this.selectedProperty.value.n,
    );
    const next = members[Math.min(members.length - 1, Math.max(0, current < 0 ? 0 : current + direction))];
    const nuclide = next ? NUCLIDE_TABLE.get(next.z, next.n) : null;
    if (nuclide) {
      this.selectedProperty.value = nuclide;
    }
  }

  private layout(chain: DecayChain): { cell: number; origin: Vector2; minN: number; maxZ: number } {
    const ns = chain.nodes.map((x) => x.n);
    const zs = chain.nodes.map((x) => x.z);
    const minN = Math.min(...ns);
    const maxN = Math.max(...ns);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const columns = maxN - minN + 1;
    const rows = maxZ - minZ + 1;
    const cell = Math.min(MAX_CELL, (this.diagramWidth - 16) / columns, (this.diagramHeight - 16) / rows);
    const origin = new Vector2((this.diagramWidth - cell * columns) / 2, (this.diagramHeight - cell * rows) / 2);
    return { cell, origin, minN, maxZ };
  }

  /** Top-left corner of the cell of (n, z), and the cell size. */
  private cellAt(n: number, z: number): { x: number; y: number; size: number } {
    const chain = this.chain;
    if (!chain) {
      return { x: 0, y: 0, size: 0 };
    }
    const { cell, origin, minN, maxZ } = this.layout(chain);
    return { x: origin.x + (n - minN) * cell, y: origin.y + (maxZ - z) * cell, size: cell };
  }

  /** Rectangle of a member: the whole cell, or its top half (isomer) / bottom half (ground state) when shared. */
  private rectOf(node: ChainNode): { x: number; y: number; w: number; h: number } {
    const { x, y, size } = this.cellAt(node.n, node.z);
    const shared = (this.chain?.nodes ?? []).filter((other) => other.n === node.n && other.z === node.z).length > 1;
    if (!shared) {
      return { x: x + 1, y: y + 1, w: size - 2, h: size - 2 };
    }
    return node.isomer
      ? { x: x + 1, y: y + 1, w: size - 2, h: size / 2 - 1.5 }
      : { x: x + 1, y: y + size / 2 + 0.5, w: size - 2, h: size / 2 - 1.5 };
  }

  private rebuild(chain: DecayChain): void {
    this.chain = chain;
    for (const child of [...this.cells.children, ...this.arrows.children]) {
      child.dispose();
    }
    const cellNodes: Node[] = [];
    const arrowNodes: Node[] = [];
    const byKey = new Map(chain.nodes.map((node) => [node.key, node]));
    for (const node of chain.nodes) {
      const r = this.rectOf(node);
      const category = nodeCategory(node);
      const fill: TColor = DECAY_CATEGORY_COLORS.get(category) ?? NuclideChartColors.noDataColorProperty;
      const rect = new Rectangle(r.x, r.y, r.w, r.h, {
        fill,
        stroke: NuclideChartColors.chartBackgroundColorProperty,
        cursor: "pointer",
      });
      const nuclide = NUCLIDE_TABLE.get(node.z, node.n);
      rect.addInputListener({
        down: () => {
          if (nuclide) {
            this.selectedProperty.value = nuclide;
          }
        },
      });
      const fontSize = Math.max(7, Math.min(11, r.h * 0.38));
      const symbol = node.isomer ? `${node.a}m` : `${node.a}`;
      const label = new RichText(`<sup>${symbol}</sup>${node.label.split("-")[0]}`, {
        font: `bold ${fontSize}px sans-serif`,
        fill: textOn(category),
        maxWidth: r.w - 2,
        maxHeight: r.h - 1,
        pickable: false,
        center: new Vector2(r.x + r.w / 2, r.y + r.h / 2),
      });
      cellNodes.push(rect, label);

      for (const link of node.links) {
        const target = byKey.get(link.to);
        if (!target) {
          continue;
        }
        arrowNodes.push(...this.arrowFor(node, target, link.mode, link.fraction));
      }
    }
    this.cells.children = cellNodes;
    this.arrows.children = arrowNodes;
    this.updateHighlight();
  }

  private arrowFor(from: ChainNode, to: ChainNode, mode: string, fraction: number): Node[] {
    const a = this.rectOf(from);
    const b = this.rectOf(to);
    const start = new Vector2(a.x + a.w / 2, a.y + a.h / 2);
    const end = new Vector2(b.x + b.w / 2, b.y + b.h / 2);
    const unit = end.minus(start).normalized();
    const inset = Math.min(a.w, a.h) * 0.42;
    const p = start.plus(unit.timesScalar(inset));
    const q = end.minus(unit.timesScalar(inset));
    const category = categoryOfMode(mode);
    const fill: TColor =
      category === DecayCategory.ALPHA
        ? NuclideChartColors.alphaColorProperty
        : category === DecayCategory.BETA_MINUS
          ? NuclideChartColors.betaMinusColorProperty
          : NuclideChartColors.isomericColorProperty;
    const nodes: Node[] = [
      new ArrowNode(p.x, p.y, q.x, q.y, {
        fill,
        stroke: null,
        headHeight: 6,
        headWidth: 7,
        tailWidth: 2,
        pickable: false,
      }),
    ];
    if (fraction < 0.995) {
      const percent = fraction * 100;
      const text = percent >= 1 ? `${percent.toFixed(percent >= 10 ? 0 : 1)}%` : `${Number(percent.toPrecision(2))}%`;
      nodes.push(
        new Text(text, {
          font: FONTS.SMALL,
          fill,
          center: p.plus(q).timesScalar(0.5).plus(new Vector2(unit.y, -unit.x).timesScalar(9)),
          pickable: false,
        }),
      );
    }
    return nodes;
  }

  private updateHighlight(): void {
    const selected = this.selectedProperty.value;
    const node = this.chain?.nodes.find((x) => !x.isomer && x.z === selected.z && x.n === selected.n);
    this.highlight.visible = node !== undefined;
    if (node) {
      const r = this.rectOf(node);
      this.highlight.setRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    }
  }
}
