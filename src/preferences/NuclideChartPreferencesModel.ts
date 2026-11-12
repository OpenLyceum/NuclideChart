/**
 * NuclideChartPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in nuclideChartQueryParameters.
 *
 * Remove the example preference (and its query parameter / UI control) if the
 * sim has no sim-specific preferences.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import NuclideChartNamespace from "../NuclideChartNamespace.js";
import nuclideChartQueryParameters from "./nuclideChartQueryParameters.js";

export class NuclideChartPreferencesModel {
  /** Whether equations are shown; initial value comes from the `showEquations` query parameter. */
  public readonly showEquationsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showEquationsProperty = new BooleanProperty(
      nuclideChartQueryParameters.showEquations,
      tandem ? { tandem: tandem.createTandem("showEquationsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showEquationsProperty.reset();
  }
}

NuclideChartNamespace.register("NuclideChartPreferencesModel", NuclideChartPreferencesModel);
