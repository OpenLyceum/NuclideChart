/**
 * NuclideChartScreenIcons.ts
 *
 * Home-screen and navigation-bar icons, drawn on the standard 548 × 373 canvas from the real data where
 * that is cheap:
 *   - Chart: the whole chart of nuclides, coloured by decay mode;
 *   - Binding Energy: the B/A curve of the stable nuclides;
 *   - Shells: two-neutron separation energies falling, with the cliff past N = 82;
 *   - Isobars: the A = 76 mass parabolas with β arrows;
 *   - Half-Lives: Geiger–Nuttall lines;
 *   - Decay Chains: an α/β⁻ zig-zag of cells.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import { DECAY_CATEGORY_COLORS } from "../chart/view/mapColors.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { decayCategoryOf } from "./model/DecayCategory.js";
import { NUCLIDE_TABLE } from "./model/NuclideTable.js";
import { separationLine } from "./model/separationEnergies.js";

const W = 548;
const H = 373;

const background = (): Rectangle =>
  new Rectangle(0, 0, W, H, { fill: NuclideChartColors.chartBackgroundColorProperty });

const iconFrom = (...children: Node[]): ScreenIcon =>
  new ScreenIcon(new Node({ children: [background(), ...children] }), {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: NuclideChartColors.chartBackgroundColorProperty,
  });

export function createChartIcon(): ScreenIcon {
  const cell = Math.min((W - 30) / (NUCLIDE_TABLE.maxN + 1), (H - 30) / (NUCLIDE_TABLE.maxZ + 1));
  const shapes = new Map([...DECAY_CATEGORY_COLORS.keys()].map((category) => [category, new Shape()]));
  for (const x of NUCLIDE_TABLE.nuclides) {
    shapes.get(decayCategoryOf(x))?.rect(15 + x.n * cell, H - 15 - (x.z + 1) * cell, cell, cell);
  }
  return iconFrom(
    ...[...shapes].map(([category, shape]) => new Path(shape, { fill: DECAY_CATEGORY_COLORS.get(category) ?? null })),
  );
}

export function createBindingEnergyIcon(): ScreenIcon {
  const shape = new Shape();
  for (const x of NUCLIDE_TABLE.nuclides) {
    if (x.isStable && x.bindingPerNucleon !== null) {
      const px = 30 + (x.a / 215) * (W - 60);
      const py = H - 30 - ((x.bindingPerNucleon / 1000 - 1) / 8) * (H - 60);
      shape.circle(px, py, 7);
    }
  }
  return iconFrom(new Path(shape, { fill: NuclideChartColors.stablePointColorProperty }));
}

export function createShellsIcon(): ScreenIcon {
  const lines = new Shape();
  for (let z = 46; z <= 56; z += 2) {
    const points = separationLine("twoNeutron", z).filter((p) => !p.systematic && p.x >= 60 && p.x <= 92);
    points.forEach((p, i) => {
      const px = 30 + ((p.x - 60) / 32) * (W - 60);
      const py = H - 30 - ((p.energy / 1000 - 4) / 22) * (H - 60);
      if (i === 0) {
        lines.moveTo(px, py);
      } else {
        lines.lineTo(px, py);
      }
    });
  }
  const magicX = 30 + ((82.5 - 60) / 32) * (W - 60);
  return iconFrom(
    new Path(new Shape().moveTo(magicX, 20).lineTo(magicX, H - 20), {
      stroke: NuclideChartColors.magicLineColorProperty,
      lineWidth: 5,
      lineDash: [14, 10],
    }),
    new Path(lines, { stroke: NuclideChartColors.highlightColorProperty, lineWidth: 7, lineJoin: "round" }),
  );
}

export function createIsobarsIcon(): ScreenIcon {
  // Two mass parabolas (even–even below odd–odd), lowest isobar at the bottom of the valley.
  const at = (x: number, lift: number): { x: number; y: number } => ({
    x: 50 + x * (W - 100),
    y: H - 50 - lift - 1150 * (x - 0.5) ** 2,
  });
  const parabola = (lift: number): Shape => {
    const shape = new Shape();
    for (let i = 0; i <= 50; i++) {
      const p = at(i / 50, lift);
      if (i === 0) {
        shape.moveTo(p.x, p.y);
      } else {
        shape.lineTo(p.x, p.y);
      }
    }
    return shape;
  };
  const dot = (x: number, lift: number, fill: typeof NuclideChartColors.pointColorProperty): Path => {
    const p = at(x, lift);
    return new Path(Shape.circle(p.x, p.y, 17), { fill });
  };
  const arrow = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    fill: typeof NuclideChartColors.pointColorProperty,
  ): ArrowNode => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const k = 22 / Math.hypot(dx, dy);
    return new ArrowNode(from.x + dx * k, from.y + dy * k, to.x - dx * k, to.y - dy * k, {
      fill,
      stroke: null,
      tailWidth: 8,
      headWidth: 26,
      headHeight: 20,
    });
  };
  const xs = [0.2, 0.35, 0.5, 0.65, 0.8];
  const lifts = [0, 45, 0, 45, 0];
  return iconFrom(
    new Path(parabola(0), { stroke: NuclideChartColors.referenceLineColorProperty, lineWidth: 4, opacity: 0.7 }),
    new Path(parabola(45), { stroke: NuclideChartColors.referenceLineColorProperty, lineWidth: 4, opacity: 0.7 }),
    arrow(at(0.2, 0), at(0.35, 45), NuclideChartColors.betaMinusColorProperty),
    arrow(at(0.35, 45), at(0.5, 0), NuclideChartColors.betaMinusColorProperty),
    arrow(at(0.8, 0), at(0.65, 45), NuclideChartColors.betaPlusColorProperty),
    arrow(at(0.65, 45), at(0.5, 0), NuclideChartColors.betaPlusColorProperty),
    ...xs.map((x, i) =>
      dot(
        x,
        lifts[i] ?? 0,
        x === 0.5 ? NuclideChartColors.stablePointColorProperty : NuclideChartColors.pointColorProperty,
      ),
    ),
  );
}

export function createHalfLivesIcon(): ScreenIcon {
  const lines = new Shape();
  const dots = new Shape();
  for (let k = 0; k < 5; k++) {
    const x0 = 70 + k * 55;
    lines.moveTo(x0, H - 40).lineTo(x0 + 230, 40);
    for (let j = 0; j < 5; j++) {
      const t = 0.12 + j * 0.18;
      dots.circle(x0 + t * 230, H - 40 - t * (H - 80), 9);
    }
  }
  return iconFrom(
    new Path(lines, { stroke: NuclideChartColors.pointColorProperty, lineWidth: 4, opacity: 0.7 }),
    new Path(dots, { fill: NuclideChartColors.alphaColorProperty }),
  );
}

export function createDecayChainsIcon(): ScreenIcon {
  // A stretch of the U-238 series on an N–Z grid: α moves two left and two down, β⁻ one left and one up.
  const steps: readonly ("alpha" | "beta")[] = ["alpha", "beta", "beta", "alpha", "alpha", "alpha", "beta"];
  const positions: { n: number; z: number; kind: "alpha" | "beta" | "stable" }[] = [];
  let n = 0;
  let z = 0;
  for (const step of [...steps, null]) {
    positions.push({ n, z, kind: step ?? "stable" });
    if (step === "alpha") {
      n -= 2;
      z -= 2;
    } else if (step === "beta") {
      n -= 1;
      z += 1;
    }
  }
  const minN = Math.min(...positions.map((p) => p.n));
  const maxZ = Math.max(...positions.map((p) => p.z));
  const columns = Math.max(...positions.map((p) => p.n)) - minN + 1;
  const rows = maxZ - Math.min(...positions.map((p) => p.z)) + 1;
  const cell = Math.min((W - 40) / columns, (H - 40) / rows);
  const x0 = (W - cell * columns) / 2;
  const y0 = (H - cell * rows) / 2;
  const center = (p: { n: number; z: number }): { x: number; y: number } => ({
    x: x0 + (p.n - minN + 0.5) * cell,
    y: y0 + (maxZ - p.z + 0.5) * cell,
  });
  const fills = {
    alpha: NuclideChartColors.alphaColorProperty,
    beta: NuclideChartColors.betaMinusColorProperty,
    stable: NuclideChartColors.stableColorProperty,
  };
  const nodes: Node[] = [];
  positions.forEach((p, i) => {
    const next = positions[i + 1];
    if (next) {
      const a = center(p);
      const b = center(next);
      nodes.push(
        new ArrowNode(a.x, a.y, b.x, b.y, {
          fill: fills[p.kind === "stable" ? "beta" : p.kind],
          stroke: null,
          tailWidth: 6,
          headWidth: 18,
          headHeight: 14,
        }),
      );
    }
  });
  for (const p of positions) {
    const c = center(p);
    nodes.push(
      new Rectangle(c.x - cell * 0.38, c.y - cell * 0.38, cell * 0.76, cell * 0.76, 5, 5, { fill: fills[p.kind] }),
    );
  }
  return iconFrom(...nodes);
}
