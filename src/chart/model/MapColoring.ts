/**
 * MapColoring.ts
 *
 * What the nuclide map's cells are coloured by. Each choice reads one number (or category) per nuclide;
 * the view maps it to a colour scale (see chart/view/mapColors.ts).
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { FITTED_MASS_FORMULA } from "../../common/model/fittedMassFormula.js";
import { semfResidual } from "../../common/model/massFormula.js";
import type { Nuclide } from "../../common/model/NuclideTable.js";

/** How a colouring's values are spread over its colour scale. */
export type ScaleKind = "categorical" | "sequential" | "diverging";

export class MapColoring extends EnumerationValue {
  public static readonly DECAY_MODE = new MapColoring("decayMode", "categorical", 0, 0, () => null);

  /** log₁₀ of the half-life in seconds, from 10⁻²⁰ s to 10²⁵ s. */
  public static readonly HALF_LIFE = new MapColoring("halfLife", "sequential", -20, 25, (x) =>
    x.halfLife !== null && x.halfLife > 0 ? Math.log10(x.halfLife) : null,
  );

  /** Binding energy per nucleon (MeV). */
  public static readonly BINDING_PER_NUCLEON = new MapColoring("bindingPerNucleon", "sequential", 6, 8.8, (x) =>
    x.bindingPerNucleon === null ? null : x.bindingPerNucleon / 1000,
  );

  /** Measured minus fitted mass-formula binding energy (MeV). */
  public static readonly RESIDUAL = new MapColoring("residual", "diverging", -10, 10, (x) =>
    semfResidual(x, FITTED_MASS_FORMULA.coefficients),
  );

  /** Natural isotopic abundance (%). */
  public static readonly ABUNDANCE = new MapColoring("abundance", "sequential", 0, 100, (x) => x.abundance);

  /** 1 for a mass estimated from systematics, 0 for a measured mass. */
  public static readonly MEASUREMENT = new MapColoring("measurement", "categorical", 0, 1, (x) =>
    x.massExcess === null ? null : x.isSystematic ? 1 : 0,
  );

  /** Spectroscopic electric quadrupole moment (b). */
  public static readonly QUADRUPOLE = new MapColoring("quadrupole", "diverging", -3, 3, (x) => x.quadrupole);

  /** Ground-state spin J (parity ignored); tentative assignments count. */
  public static readonly SPIN = new MapColoring("spin", "sequential", 0, 10, (x) => parseSpin(x.spinParity));

  public static readonly enumeration = new Enumeration(MapColoring);

  /** Key into the `colorings` string group. */
  public readonly key: string;
  public readonly scale: ScaleKind;
  /** Value range of the colour scale. */
  public readonly min: number;
  public readonly max: number;
  /** The nuclide's value, or null when it has none. */
  public readonly valueFor: (nuclide: Nuclide) => number | null;

  public constructor(
    key: string,
    scale: ScaleKind,
    min: number,
    max: number,
    valueFor: (nuclide: Nuclide) => number | null,
  ) {
    super();
    this.key = key;
    this.scale = scale;
    this.min = min;
    this.max = max;
    this.valueFor = valueFor;
  }
}

/**
 * The spin J of an ENSDF J^π string ("0+", "(7/2-)", "1/2+,3/2+"), using the first value listed, or null.
 */
export function parseSpin(spinParity: string): number | null {
  const match = /(\d+)(?:\/(\d+))?/.exec(spinParity);
  if (!match) {
    return null;
  }
  const numerator = Number(match[1]);
  return match[2] ? numerator / Number(match[2]) : numerator;
}
