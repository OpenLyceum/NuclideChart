/**
 * BindingEnergyModel.ts
 *
 * The Binding Energy screen: the B/A curve of every nuclide, the semi-empirical mass formula laid over it
 * (each term switchable, each coefficient adjustable or fitted to the measured masses), the residuals
 * measured − formula against N or Z, and an energy-release calculator for fission and fusion.
 */

import {
  BooleanProperty,
  DerivedProperty,
  EnumerationProperty,
  NumberProperty,
  StringProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import {
  type FissionRelease,
  FUSION_REACTIONS,
  type FusionRelease,
  fissionRelease,
  fusionRelease,
  LIGHT_FRAGMENT_RANGE,
} from "../../common/model/energyRelease.js";
import { FITTED_MASS_FORMULA } from "../../common/model/fittedMassFormula.js";
import {
  DEFAULT_FIT_SELECTION,
  fitMassFormula,
  KRANE_COEFFICIENTS,
  MASS_FORMULA_TERMS,
  type MassFormulaCoefficients,
  type MassFormulaTerm,
  type MassFormulaTermSet,
  semfResidual,
} from "../../common/model/massFormula.js";
import { NUCLIDE_TABLE } from "../../common/model/NuclideTable.js";
import type { SharedModel } from "../../common/model/SharedModel.js";

/** Which plot the screen shows. */
export class BindingView extends EnumerationValue {
  public static readonly CURVE = new BindingView("curve");
  public static readonly RESIDUAL_N = new BindingView("residualN");
  public static readonly RESIDUAL_Z = new BindingView("residualZ");
  public static readonly enumeration = new Enumeration(BindingView);

  public readonly key: string;

  public constructor(key: string) {
    super();
    this.key = key;
  }
}

/** Slider range of each coefficient (MeV). */
export const COEFFICIENT_RANGES: Readonly<Record<MassFormulaTerm, Range>> = {
  volume: new Range(10, 20),
  surface: new Range(10, 25),
  coulomb: new Range(0.4, 1),
  asymmetry: new Range(10, 35),
  pairing: new Range(0, 60),
};

/** The mass formula as the plots use it. */
export type MassFormula = { readonly coefficients: MassFormulaCoefficients; readonly terms: MassFormulaTermSet };

export type EnergyMode = "fission" | "fusion";

export class BindingEnergyModel implements TModel {
  public readonly shared: SharedModel;
  public readonly viewProperty = new EnumerationProperty(BindingView.CURVE);
  public readonly zoomOnPeakProperty = new BooleanProperty(false);
  public readonly formulaVisibleProperty = new BooleanProperty(true);

  /** Coefficient of each term (MeV), starting from the least-squares fit. */
  public readonly coefficientProperties: Readonly<Record<MassFormulaTerm, NumberProperty>>;
  /** Whether each term is switched on. */
  public readonly termEnabledProperties: Readonly<Record<MassFormulaTerm, BooleanProperty>>;

  /** The current coefficients and terms, as one value the plots and readouts derive from. */
  public readonly formulaProperty: TReadOnlyProperty<MassFormula>;
  /** RMS of measured − formula over the measured masses with A ≥ 16 (MeV), and how many there are. */
  public readonly rmsProperty: TReadOnlyProperty<{ rms: number; count: number }>;

  public readonly energyModeProperty = new StringProperty("fission", { validValues: ["fission", "fusion"] });
  public readonly lightFragmentAProperty = new NumberProperty(95, {
    range: new Range(LIGHT_FRAGMENT_RANGE.min, LIGHT_FRAGMENT_RANGE.max),
    numberType: "Integer",
  });
  public readonly fusionReactionIndexProperty = new NumberProperty(0, {
    range: new Range(0, FUSION_REACTIONS.length - 1),
    numberType: "Integer",
  });
  public readonly fissionProperty: TReadOnlyProperty<FissionRelease | null>;
  public readonly fusionProperty: TReadOnlyProperty<FusionRelease>;

  public constructor(shared: SharedModel) {
    this.shared = shared;
    const coefficients = {} as Record<MassFormulaTerm, NumberProperty>;
    const enabled = {} as Record<MassFormulaTerm, BooleanProperty>;
    for (const term of MASS_FORMULA_TERMS) {
      coefficients[term] = new NumberProperty(FITTED_MASS_FORMULA.coefficients[term], {
        range: COEFFICIENT_RANGES[term],
      });
      enabled[term] = new BooleanProperty(true);
    }
    this.coefficientProperties = coefficients;
    this.termEnabledProperties = enabled;

    this.formulaProperty = new DerivedProperty(
      [
        coefficients.volume,
        coefficients.surface,
        coefficients.coulomb,
        coefficients.asymmetry,
        coefficients.pairing,
        enabled.volume,
        enabled.surface,
        enabled.coulomb,
        enabled.asymmetry,
        enabled.pairing,
      ],
      (aV, aS, aC, aA, aP, v, s, c, a, p) => ({
        coefficients: { volume: aV, surface: aS, coulomb: aC, asymmetry: aA, pairing: aP },
        terms: { volume: v, surface: s, coulomb: c, asymmetry: a, pairing: p },
      }),
    );
    const fitted = NUCLIDE_TABLE.nuclides.filter(
      (x) => x.binding !== null && !x.isSystematic && x.a >= DEFAULT_FIT_SELECTION.minA,
    );
    this.rmsProperty = new DerivedProperty([this.formulaProperty], (formula) => {
      let sum = 0;
      for (const x of fitted) {
        const r = semfResidual(x, formula.coefficients, formula.terms) ?? 0;
        sum += r * r;
      }
      return { rms: Math.sqrt(sum / fitted.length), count: fitted.length };
    });

    this.fissionProperty = new DerivedProperty([this.lightFragmentAProperty], (a) => fissionRelease(a));
    this.fusionProperty = new DerivedProperty([this.fusionReactionIndexProperty], (i) =>
      fusionRelease(FUSION_REACTIONS[i] ?? (FUSION_REACTIONS[0] as (typeof FUSION_REACTIONS)[number])),
    );
  }

  /** Least-squares fit of the enabled terms to the measured masses. */
  public fit(): void {
    const formula = this.formulaProperty.value;
    const result = fitMassFormula(NUCLIDE_TABLE.nuclides, formula.terms, formula.coefficients);
    for (const term of MASS_FORMULA_TERMS) {
      if (formula.terms[term]) {
        const property = this.coefficientProperties[term];
        property.value = property.range.constrainValue(result.coefficients[term]);
      }
    }
  }

  /** The textbook (Krane) coefficients. */
  public useTextbookValues(): void {
    for (const term of MASS_FORMULA_TERMS) {
      this.coefficientProperties[term].value = KRANE_COEFFICIENTS[term];
    }
  }

  public reset(): void {
    this.shared.reset();
    this.viewProperty.reset();
    this.zoomOnPeakProperty.reset();
    this.formulaVisibleProperty.reset();
    for (const term of MASS_FORMULA_TERMS) {
      this.coefficientProperties[term].reset();
      this.termEnabledProperties[term].reset();
    }
    this.energyModeProperty.reset();
    this.lightFragmentAProperty.reset();
    this.fusionReactionIndexProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing animates on this screen.
  }
}
