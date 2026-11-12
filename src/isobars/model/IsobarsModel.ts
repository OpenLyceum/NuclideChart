/**
 * IsobarsModel.ts
 *
 * The Isobars screen: a slice of the chart at fixed mass number A. The mass excess of the isobars against Z
 * traces a parabola (two for even A, split by pairing). β⁻ decay steps right and down it, β⁺/EC left and
 * down, and the bottom is the β-stable isobar, or two for even A when double-β decay is the only way down.
 *
 * The mass number follows the shared selection, and changing it selects that A's most bound isobar.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { mostBoundIsobar } from "../../common/model/energyRelease.js";
import { FITTED_MASS_FORMULA } from "../../common/model/fittedMassFormula.js";
import { analyzeIsobars, type IsobarAnalysis } from "../../common/model/isobars.js";
import { NUCLIDE_TABLE } from "../../common/model/NuclideTable.js";
import type { SharedModel } from "../../common/model/SharedModel.js";

/** Quick picks: the classic double-β pairs, an odd A, and A = 40 (K-40 decays both ways). */
export const QUICK_MASS_NUMBERS: readonly number[] = [40, 76, 125, 130, 136];

export const MASS_NUMBER_RANGE = new Range(
  Math.min(...NUCLIDE_TABLE.nuclides.map((nuclide) => nuclide.a)),
  Math.max(...NUCLIDE_TABLE.nuclides.map((nuclide) => nuclide.a)),
);

export class IsobarsModel implements TModel {
  public readonly shared: SharedModel;
  public readonly massNumberProperty: NumberProperty;
  public readonly parabolasVisibleProperty = new BooleanProperty(true);
  public readonly arrowsVisibleProperty = new BooleanProperty(true);
  public readonly analysisProperty: TReadOnlyProperty<IsobarAnalysis>;

  public constructor(shared: SharedModel) {
    this.shared = shared;
    this.massNumberProperty = new NumberProperty(shared.selectedNuclideProperty.value.a, {
      range: MASS_NUMBER_RANGE,
      numberType: "Integer",
    });
    // A follows the selection; a new A selects its most bound isobar.
    shared.selectedNuclideProperty.link((nuclide) => {
      this.massNumberProperty.value = nuclide.a;
    });
    this.massNumberProperty.lazyLink((a) => {
      if (shared.selectedNuclideProperty.value.a !== a) {
        const nuclide = mostBoundIsobar(a) ?? NUCLIDE_TABLE.isobars(a)[0];
        if (nuclide) {
          shared.selectedNuclideProperty.value = nuclide;
        }
      }
    });
    this.analysisProperty = new DerivedProperty([this.massNumberProperty], (a) =>
      analyzeIsobars(a, FITTED_MASS_FORMULA.coefficients),
    );
  }

  public reset(): void {
    this.shared.reset();
    this.parabolasVisibleProperty.reset();
    this.arrowsVisibleProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing animates on this screen.
  }
}
