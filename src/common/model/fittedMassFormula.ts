/**
 * fittedMassFormula.ts
 *
 * The mass formula fitted once, at load time, to every measured mass with A ≥ 16. The Chart screen's
 * residual colouring and valley-of-stability curve, and the Half-Lives screen's distance from the valley,
 * use these coefficients; the Binding Energy screen lets students refit or change them.
 */

import { ALL_TERMS, fitMassFormula, KRANE_COEFFICIENTS, type MassFormulaFit } from "./massFormula.js";
import { NUCLIDE_TABLE } from "./NuclideTable.js";

export const FITTED_MASS_FORMULA: MassFormulaFit = fitMassFormula(
  NUCLIDE_TABLE.nuclides,
  ALL_TERMS,
  KRANE_COEFFICIENTS,
);
