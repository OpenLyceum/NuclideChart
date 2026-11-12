/**
 * NuclideMapNode.ts
 *
 * The chart of nuclides: one square per known ground state, N across and Z up, painted on a canvas so all
 * ~3,400 cells redraw quickly. It pans (drag, or the arrow keys moving the selection off screen), zooms
 * (slider, buttons, mouse wheel, + and −), and selects a nuclide on click or with the arrow keys. When
 * zoomed in, each cell shows its element symbol and mass number, and a minimap in the empty upper-left
 * corner shows where the view is.
 *
 * Overlays: magic-number lines, the N = Z line, the valley of stability from the fitted mass formula,
 * and the drip lines (the edge of the particle-bound nuclei).
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { CanvasNode, DragListener, KeyboardListener, Node, type NodeOptions, Rectangle } from "scenerystack/scenery";
import { decayCategoryOf } from "../../common/model/DecayCategory.js";
import { FITTED_MASS_FORMULA } from "../../common/model/fittedMassFormula.js";
import { valleyZ } from "../../common/model/massFormula.js";
import { MAGIC_NUMBERS } from "../../common/model/NuclearConstants.js";
import { isStableUnder, NUCLIDE_TABLE, type Nuclide } from "../../common/model/NuclideTable.js";
import { boundRange } from "../../common/model/separationEnergies.js";
import NuclideChartColors from "../../NuclideChartColors.js";
import { MAP_LABEL_CELL_SIZE, MAP_ZOOM_RANGE } from "../../NuclideChartConstants.js";
import type { ChartModel } from "../model/ChartModel.js";
import { MapColoring } from "../model/MapColoring.js";
import { DECAY_CATEGORY_COLORS, MEASUREMENT_COLORS, scaleColor } from "./mapColors.js";

/** Zoom factor per step of the buttons, the keyboard and one wheel notch. */
export const ZOOM_STEP = 1.5;

/** Pointer travel (view px) below which a press-and-release counts as a click, not a drag. */
const CLICK_TOLERANCE = 4;

/** Selected cells closer than this fraction of the view to an edge pull the view along. */
const KEEP_IN_VIEW_MARGIN = 0.08;

/** Size of the minimap (view px). */
const MINIMAP_WIDTH = 120;
const MINIMAP_MARGIN = 8;

/** Spacing of the N and Z tick labels along the edges, by cell size. */
const tickSpacing = (cellSize: number): number => (cellSize > 20 ? 2 : cellSize > 8 ? 5 : cellSize > 4 ? 10 : 20);

/** The drip-line staircases, computed once: for each Z, the first unbound N on either side. */
const DRIP_LINES = (() => {
  const neutron: Vector2[] = [];
  const proton: Vector2[] = [];
  for (let z = 1; z <= NUCLIDE_TABLE.maxZ; z++) {
    const range = boundRange(z);
    if (range) {
      neutron.push(new Vector2(range.maxN + 0.5, z - 0.5), new Vector2(range.maxN + 0.5, z + 0.5));
      proton.push(new Vector2(range.minN - 0.5, z - 0.5), new Vector2(range.minN - 0.5, z + 0.5));
    }
  }
  return { neutron, proton };
})();

/** Valley of stability: (N, Z) at the fitted mass formula's Z_valley(A). */
const VALLEY_LINE: readonly Vector2[] = Array.from({ length: 300 }, (_, i) => {
  const a = i + 1;
  const z = valleyZ(a, FITTED_MASS_FORMULA.coefficients);
  return new Vector2(a - z, z);
});

/** Range of Z for each N (and of N for each Z), for drawing magic lines only where nuclides exist. */
const extentOf = (key: "n" | "z", value: number): { min: number; max: number } => {
  const other = key === "n" ? "z" : "n";
  const members = NUCLIDE_TABLE.nuclides.filter((x) => x[key] === value).map((x) => x[other]);
  return { min: Math.min(...members), max: Math.max(...members) };
};

const MAGIC_EXTENTS = MAGIC_NUMBERS.map((m) => ({ magic: m, ofN: extentOf("n", m), ofZ: extentOf("z", m) }));

/** Black or white, whichever reads better on a CSS rgb()/hex fill. */
const contrastingText = (css: string): string => {
  let r = 0;
  let g = 0;
  let b = 0;
  const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css);
  if (rgb) {
    [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  } else if (css.startsWith("#") && css.length >= 7) {
    [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(css.slice(i, i + 2), 16)) as [number, number, number];
  }
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? "#000000" : "#ffffff";
};

/** Maps (N, Z) to view coordinates and back for the current centre and zoom. */
class MapGeometry {
  public readonly width: number;
  public readonly height: number;
  public readonly center: Vector2;
  public readonly scale: number;

  public constructor(width: number, height: number, center: Vector2, zoom: number) {
    this.width = width;
    this.height = height;
    this.center = center;
    this.scale = MapGeometry.baseScale(width, height) * zoom;
  }

  /** Cell size (px) at zoom 1, fitting the whole chart. */
  public static baseScale(width: number, height: number): number {
    return Math.min(width / (NUCLIDE_TABLE.maxN + 3), height / (NUCLIDE_TABLE.maxZ + 3));
  }

  public x(n: number): number {
    return this.width / 2 + (n - this.center.x) * this.scale;
  }

  public y(z: number): number {
    return this.height / 2 - (z - this.center.y) * this.scale;
  }

  public toModel(point: Vector2): Vector2 {
    return new Vector2(
      this.center.x + (point.x - this.width / 2) / this.scale,
      this.center.y - (point.y - this.height / 2) / this.scale,
    );
  }

  /** The visible (N, Z) rectangle. */
  public visible(): Bounds2 {
    const halfW = this.width / 2 / this.scale;
    const halfH = this.height / 2 / this.scale;
    return new Bounds2(this.center.x - halfW, this.center.y - halfH, this.center.x + halfW, this.center.y + halfH);
  }
}

class MapCanvas extends CanvasNode {
  public geometry: MapGeometry;
  public colors: string[] = [];
  public selected: Nuclide;
  public magicVisible = true;
  public nEqualsZVisible = false;
  public valleyVisible = false;
  public dripVisible = false;
  public estimatedMarked = false;
  /** Theme colours read at paint time. */
  public theme = {
    background: NuclideChartColors.chartBackgroundColorProperty.value.toCSS(),
    text: NuclideChartColors.textColorProperty.value.toCSS(),
    magic: NuclideChartColors.magicLineColorProperty.value.toCSS(),
    reference: NuclideChartColors.referenceLineColorProperty.value.toCSS(),
    valley: NuclideChartColors.valleyLineColorProperty.value.toCSS(),
    drip: NuclideChartColors.dripLineColorProperty.value.toCSS(),
    selection: NuclideChartColors.selectionColorProperty.value.toCSS(),
    axis: NuclideChartColors.axisColorProperty.value.toCSS(),
  };

  public constructor(geometry: MapGeometry, selected: Nuclide) {
    super({ canvasBounds: new Bounds2(0, 0, geometry.width, geometry.height), pickable: false });
    this.geometry = geometry;
    this.selected = selected;
  }

  public repaint(): void {
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const g = this.geometry;
    context.fillStyle = this.theme.background;
    context.fillRect(0, 0, g.width, g.height);
    this.paintCells(context, g);
    this.paintOverlays(context, g);
    this.paintSelection(context, g);
    this.paintTicks(context, g);
    this.paintMinimap(context, g);
  }

  private paintCells(context: CanvasRenderingContext2D, g: MapGeometry): void {
    const visible = g.visible().dilated(1);
    const s = g.scale;
    const gap = s > 5 ? Math.max(0.5, s * 0.06) : 0;
    const labels = s >= MAP_LABEL_CELL_SIZE;
    for (const nuclide of NUCLIDE_TABLE.nuclides) {
      if (!visible.containsCoordinates(nuclide.n, nuclide.z)) {
        continue;
      }
      const color = this.colors[nuclide.index] ?? NuclideChartColors.noDataColorProperty.value.toCSS();
      const x = g.x(nuclide.n) - s / 2;
      const y = g.y(nuclide.z) - s / 2;
      context.fillStyle = color;
      context.fillRect(x + gap / 2, y + gap / 2, s - gap, s - gap);
      if (this.estimatedMarked && nuclide.isSystematic && s > 3) {
        context.strokeStyle = contrastingText(color);
        context.lineWidth = Math.max(0.6, s * 0.06);
        context.beginPath();
        context.moveTo(x + gap, y + s - gap);
        context.lineTo(x + s - gap, y + gap);
        context.stroke();
      }
      if (labels) {
        context.fillStyle = contrastingText(color);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `bold ${Math.round(Math.min(14, s * 0.32))}px sans-serif`;
        context.fillText(nuclide.symbol, x + s / 2, y + s * 0.38);
        context.font = `${Math.round(Math.min(12, s * 0.26))}px sans-serif`;
        context.fillText(String(nuclide.a), x + s / 2, y + s * 0.7);
      }
    }
  }

  private paintOverlays(context: CanvasRenderingContext2D, g: MapGeometry): void {
    const polyline = (points: readonly Vector2[], color: string, width: number, dash: number[] = []): void => {
      context.strokeStyle = color;
      context.lineWidth = width;
      context.setLineDash(dash);
      context.beginPath();
      points.forEach((p, i) => {
        if (i === 0) {
          context.moveTo(g.x(p.x), g.y(p.y));
        } else {
          context.lineTo(g.x(p.x), g.y(p.y));
        }
      });
      context.stroke();
      context.setLineDash([]);
    };
    if (this.magicVisible) {
      context.font = "bold 11px sans-serif";
      context.fillStyle = this.theme.magic;
      for (const { magic, ofN, ofZ } of MAGIC_EXTENTS) {
        for (const edge of [magic - 0.5, magic + 0.5]) {
          polyline([new Vector2(edge, ofN.min - 1.5), new Vector2(edge, ofN.max + 1.5)], this.theme.magic, 1);
          polyline([new Vector2(ofZ.min - 1.5, edge), new Vector2(ofZ.max + 1.5, edge)], this.theme.magic, 1);
        }
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(String(magic), g.x(magic), g.y(ofN.min - 1.5) + 2);
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(String(magic), g.x(ofZ.min - 1.5) - 2, g.y(magic));
      }
    }
    if (this.nEqualsZVisible) {
      const end = NUCLIDE_TABLE.maxZ + 1;
      polyline([new Vector2(-0.5, -0.5), new Vector2(end, end)], this.theme.reference, 1.2, [6, 4]);
    }
    if (this.valleyVisible) {
      polyline(VALLEY_LINE, this.theme.valley, 2);
    }
    if (this.dripVisible) {
      polyline(DRIP_LINES.neutron, this.theme.drip, 1.5);
      polyline(DRIP_LINES.proton, this.theme.drip, 1.5);
    }
  }

  private paintSelection(context: CanvasRenderingContext2D, g: MapGeometry): void {
    const size = Math.max(8, g.scale + 2);
    context.strokeStyle = this.theme.selection;
    context.lineWidth = 2;
    context.strokeRect(g.x(this.selected.n) - size / 2, g.y(this.selected.z) - size / 2, size, size);
  }

  private paintTicks(context: CanvasRenderingContext2D, g: MapGeometry): void {
    const visible = g.visible();
    const step = tickSpacing(g.scale);
    // Back the labels with the chart background so they stay readable over zoomed-in cells.
    context.globalAlpha = 0.8;
    context.fillStyle = this.theme.background;
    context.fillRect(0, g.height - 13, g.width, 13);
    context.fillRect(0, 0, 22, g.height);
    context.globalAlpha = 1;
    context.fillStyle = this.theme.axis;
    context.font = "10px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "bottom";
    for (let n = Math.ceil(Math.max(0, visible.minX) / step) * step; n <= visible.maxX; n += step) {
      context.fillText(String(n), g.x(n), g.height - 2);
    }
    context.textAlign = "left";
    context.textBaseline = "middle";
    for (let z = Math.ceil(Math.max(0, visible.minY) / step) * step; z <= visible.maxY; z += step) {
      context.fillText(String(z), 3, g.y(z));
    }
  }

  private paintMinimap(context: CanvasRenderingContext2D, g: MapGeometry): void {
    if (g.scale <= MapGeometry.baseScale(g.width, g.height) * 1.05) {
      return;
    }
    const box = MINIMAP_BOUNDS;
    const k = box.width / (NUCLIDE_TABLE.maxN + 3);
    context.globalAlpha = 0.85;
    context.fillStyle = this.theme.background;
    context.fillRect(box.minX, box.minY, box.width, box.height);
    context.globalAlpha = 1;
    context.strokeStyle = this.theme.axis;
    context.lineWidth = 1;
    context.strokeRect(box.minX, box.minY, box.width, box.height);
    const cell = Math.max(1, k);
    for (const nuclide of NUCLIDE_TABLE.nuclides) {
      context.fillStyle = this.colors[nuclide.index] ?? NuclideChartColors.noDataColorProperty.value.toCSS();
      context.fillRect(box.minX + (nuclide.n + 1) * k, box.maxY - (nuclide.z + 2) * k, cell, cell);
    }
    const v = g.visible();
    context.strokeStyle = this.theme.selection;
    context.lineWidth = 1.5;
    context.strokeRect(box.minX + (v.minX + 1) * k, box.maxY - (v.maxY + 2) * k, v.width * k, v.height * k);
  }
}

/** Where the minimap sits: the empty upper-left corner of the chart (few neutrons, many protons). */
const MINIMAP_BOUNDS = new Bounds2(
  MINIMAP_MARGIN + 18,
  MINIMAP_MARGIN,
  MINIMAP_MARGIN + 18 + MINIMAP_WIDTH,
  MINIMAP_MARGIN + (MINIMAP_WIDTH * (NUCLIDE_TABLE.maxZ + 3)) / (NUCLIDE_TABLE.maxN + 3),
);

export type NuclideMapNodeOptions = NodeOptions & {
  readonly accessibleName: TReadOnlyProperty<string>;
  readonly accessibleHelpText: TReadOnlyProperty<string>;
};

export class NuclideMapNode extends Node {
  private readonly model: ChartModel;
  private readonly mapWidth: number;
  private readonly mapHeight: number;
  private readonly canvas: MapCanvas;

  public constructor(model: ChartModel, width: number, height: number, options: NuclideMapNodeOptions) {
    super({ tagName: "div", focusable: true, ...options });
    this.model = model;
    this.mapWidth = width;
    this.mapHeight = height;
    const shared = model.shared;
    this.canvas = new MapCanvas(this.geometry(), shared.selectedNuclideProperty.value);

    // A transparent fill makes the rectangle hit-testable.
    const hitArea = new Rectangle(0, 0, width, height, { fill: "rgba(0,0,0,0)", cursor: "pointer" });
    const frame = new Rectangle(0, 0, width, height, { stroke: NuclideChartColors.axisColorProperty, pickable: false });
    // The canvas paints in view coordinates; clip it to the map so zoomed cells never spill out.
    this.canvas.clipArea = Shape.rect(0, 0, width, height);
    this.children = [this.canvas, hitArea, frame];

    this.addPointerListeners(hitArea);
    this.addKeyboardListener();

    // Recolour when the colouring, the stability definition, the filter or a theme colour changes.
    const themeColors = [
      ...new Set([
        ...DECAY_CATEGORY_COLORS.values(),
        ...MEASUREMENT_COLORS,
        NuclideChartColors.noDataColorProperty,
        NuclideChartColors.dimmedColorProperty,
      ]),
    ];
    Multilink.multilinkAny(
      [
        model.coloringProperty,
        shared.stabilityDefinitionProperty,
        model.halfLifeFilterEnabledProperty,
        model.halfLifeThresholdProperty,
        ...themeColors,
      ],
      () => this.recolor(),
    );
    const chromeColors = [
      NuclideChartColors.chartBackgroundColorProperty,
      NuclideChartColors.textColorProperty,
      NuclideChartColors.magicLineColorProperty,
      NuclideChartColors.referenceLineColorProperty,
      NuclideChartColors.valleyLineColorProperty,
      NuclideChartColors.dripLineColorProperty,
      NuclideChartColors.selectionColorProperty,
      NuclideChartColors.axisColorProperty,
    ];
    Multilink.multilinkAny(chromeColors, () => {
      this.canvas.theme = {
        background: NuclideChartColors.chartBackgroundColorProperty.value.toCSS(),
        text: NuclideChartColors.textColorProperty.value.toCSS(),
        magic: NuclideChartColors.magicLineColorProperty.value.toCSS(),
        reference: NuclideChartColors.referenceLineColorProperty.value.toCSS(),
        valley: NuclideChartColors.valleyLineColorProperty.value.toCSS(),
        drip: NuclideChartColors.dripLineColorProperty.value.toCSS(),
        selection: NuclideChartColors.selectionColorProperty.value.toCSS(),
        axis: NuclideChartColors.axisColorProperty.value.toCSS(),
      };
      this.canvas.repaint();
    });
    Multilink.multilink(
      [
        shared.magicNumbersVisibleProperty,
        model.nEqualsZVisibleProperty,
        model.valleyVisibleProperty,
        model.dripLinesVisibleProperty,
        model.estimatedMassesMarkedProperty,
      ],
      (magic, nEqualsZ, valley, drip, estimated) => {
        this.canvas.magicVisible = magic;
        this.canvas.nEqualsZVisible = nEqualsZ;
        this.canvas.valleyVisible = valley;
        this.canvas.dripVisible = drip;
        this.canvas.estimatedMarked = estimated;
        this.canvas.repaint();
      },
    );
    Multilink.multilink([model.centerProperty, model.zoomProperty], () => {
      this.canvas.geometry = this.geometry();
      this.canvas.repaint();
    });
    shared.selectedNuclideProperty.link((nuclide) => {
      this.canvas.selected = nuclide;
      this.canvas.repaint();
    });
  }

  private geometry(): MapGeometry {
    return new MapGeometry(
      this.mapWidth,
      this.mapHeight,
      this.model.centerProperty.value,
      this.model.zoomProperty.value,
    );
  }

  private recolor(): void {
    const model = this.model;
    const coloring = model.coloringProperty.value;
    const definition = model.shared.stabilityDefinition;
    const noData = NuclideChartColors.noDataColorProperty.value.toCSS();
    const dimmed = NuclideChartColors.dimmedColorProperty.value.toCSS();
    const categoryCss = new Map([...DECAY_CATEGORY_COLORS].map(([category, color]) => [category, color.value.toCSS()]));
    const measurementCss = MEASUREMENT_COLORS.map((color) => color.value.toCSS());
    this.canvas.colors = NUCLIDE_TABLE.nuclides.map((nuclide) => {
      const stable = isStableUnder(nuclide, definition);
      if (model.isFilteredOut(nuclide.halfLife, stable)) {
        return dimmed;
      }
      if (coloring === MapColoring.DECAY_MODE) {
        return categoryCss.get(decayCategoryOf(nuclide, definition)) ?? noData;
      }
      const value = coloring.valueFor(nuclide);
      if (coloring === MapColoring.HALF_LIFE && stable) {
        return categoryCss.get(decayCategoryOf(nuclide, definition)) ?? noData;
      }
      if (value === null) {
        return noData;
      }
      if (coloring === MapColoring.MEASUREMENT) {
        return measurementCss[value] ?? noData;
      }
      return scaleColor(coloring, value);
    });
    this.canvas.repaint();
  }

  // ── Pointer: drag pans, click selects, wheel zooms ──────────────────────────
  private addPointerListeners(hitArea: Node): void {
    let start: Vector2 | null = null;
    let startCenter = Vector2.ZERO;
    let moved = false;
    hitArea.addInputListener(
      new DragListener({
        press: (event) => {
          start = this.globalToLocalPoint(event.pointer.point);
          startCenter = this.model.centerProperty.value;
          moved = false;
        },
        drag: (event) => {
          if (!start) {
            return;
          }
          const point = this.globalToLocalPoint(event.pointer.point);
          const delta = point.minus(start);
          moved ||= delta.magnitude > CLICK_TOLERANCE;
          if (moved) {
            const scale = this.canvas.geometry.scale;
            this.centerOn(new Vector2(startCenter.x - delta.x / scale, startCenter.y + delta.y / scale));
          }
        },
        release: (event) => {
          if (start && !moved && event) {
            this.clickAt(this.globalToLocalPoint(event.pointer.point));
          }
          start = null;
        },
      }),
    );
    hitArea.addInputListener({
      wheel: (event) => {
        const domEvent = event.domEvent as WheelEvent | null;
        if (!domEvent) {
          return;
        }
        event.handle();
        const factor = domEvent.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
        this.zoomBy(factor, this.globalToLocalPoint(event.pointer.point));
      },
    });
  }

  private clickAt(point: Vector2): void {
    const g = this.canvas.geometry;
    const box = MINIMAP_BOUNDS;
    if (g.scale > MapGeometry.baseScale(g.width, g.height) * 1.05 && box.containsPoint(point)) {
      const k = box.width / (NUCLIDE_TABLE.maxN + 3);
      this.centerOn(new Vector2((point.x - box.minX) / k - 1, (box.maxY - point.y) / k - 2));
      return;
    }
    const at = g.toModel(point);
    const nuclide = NUCLIDE_TABLE.get(Math.round(at.y), Math.round(at.x));
    if (nuclide) {
      this.model.shared.selectedNuclideProperty.value = nuclide;
    }
  }

  // ── Keyboard: arrows move the selection, + and − zoom ───────────────────────
  private addKeyboardListener(): void {
    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown", "equals", "plus", "minus"],
        fire: (_event, keysPressed) => {
          switch (keysPressed) {
            case "arrowLeft":
              this.moveSelection(-1, 0);
              break;
            case "arrowRight":
              this.moveSelection(1, 0);
              break;
            case "arrowUp":
              this.moveSelection(0, 1);
              break;
            case "arrowDown":
              this.moveSelection(0, -1);
              break;
            case "minus":
              this.zoomBy(1 / ZOOM_STEP);
              break;
            default:
              this.zoomBy(ZOOM_STEP);
          }
        },
      }),
    );
  }

  /** Moves the selection one step in N or Z, skipping gaps, and keeps it in view. */
  public moveSelection(dn: number, dz: number): void {
    const from = this.model.shared.selectedNuclideProperty.value;
    let target: Nuclide | null = null;
    if (dn !== 0) {
      for (let k = 1; k <= NUCLIDE_TABLE.maxN && !target; k++) {
        target = NUCLIDE_TABLE.get(from.z, from.n + dn * k);
      }
    } else {
      for (let z = from.z + dz; z >= 0 && z <= NUCLIDE_TABLE.maxZ && !target; z += dz) {
        const row = NUCLIDE_TABLE.isotopes(z);
        target = row.reduce<Nuclide | null>(
          (best, x) => (best === null || Math.abs(x.n - from.n) < Math.abs(best.n - from.n) ? x : best),
          null,
        );
      }
    }
    if (target) {
      this.model.shared.selectedNuclideProperty.value = target;
      this.keepInView(target);
    }
  }

  /** Recentres on a nuclide that sits too close to an edge of the view. */
  private keepInView(nuclide: Nuclide): void {
    const g = this.canvas.geometry;
    const x = g.x(nuclide.n);
    const y = g.y(nuclide.z);
    const mx = g.width * KEEP_IN_VIEW_MARGIN;
    const my = g.height * KEEP_IN_VIEW_MARGIN;
    if (x < mx || x > g.width - mx || y < my || y > g.height - my) {
      this.centerOn(new Vector2(nuclide.n, nuclide.z));
    }
  }

  /** Zooms by a factor about a view point (default: the centre of the map). */
  public zoomBy(factor: number, about?: Vector2): void {
    const g = this.canvas.geometry;
    const zoom = Math.min(MAP_ZOOM_RANGE.max, Math.max(MAP_ZOOM_RANGE.min, this.model.zoomProperty.value * factor));
    const pivot = g.toModel(about ?? new Vector2(g.width / 2, g.height / 2));
    const ratio = this.model.zoomProperty.value / zoom;
    const center = g.center;
    this.model.zoomProperty.value = zoom;
    this.centerOn(new Vector2(pivot.x + (center.x - pivot.x) * ratio, pivot.y + (center.y - pivot.y) * ratio));
  }

  /** Sets the centre, clamped so the chart never scrolls out of view. */
  public centerOn(center: Vector2): void {
    const scale = MapGeometry.baseScale(this.mapWidth, this.mapHeight) * this.model.zoomProperty.value;
    const clampAxis = (value: number, half: number, max: number): number => {
      const low = half - 1.5;
      const high = max + 1.5 - half;
      return low >= high ? max / 2 : Math.min(high, Math.max(low, value));
    };
    this.model.centerProperty.value = new Vector2(
      clampAxis(center.x, this.mapWidth / 2 / scale, NUCLIDE_TABLE.maxN),
      clampAxis(center.y, this.mapHeight / 2 / scale, NUCLIDE_TABLE.maxZ),
    );
  }

  /** Re-clamps the centre after a zoom change from outside (slider). */
  public reclamp(): void {
    this.centerOn(this.model.centerProperty.value);
  }
}
