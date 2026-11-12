/**
 * SharedModel.ts
 *
 * State every screen shares, created once in main.ts and passed to each screen's model: the selected
 * nuclide (so picking U-238 on the Chart screen keeps it selected on Half-Lives and Decay Chains), whether
 * the magic-number guides are drawn, and which definition of "stable" is in force.
 *
 * Each screen's Reset All resets this shared state too, since it is visible on every screen.
 */

import { BooleanProperty, Property, StringProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { NUCLIDE_TABLE, type Nuclide, type StabilityDefinition } from "./NuclideTable.js";

/** The nuclide selected at startup. */
export const DEFAULT_SELECTION = "Fe-56";

export class SharedModel implements TModel {
  public readonly selectedNuclideProperty: Property<Nuclide>;
  public readonly magicNumbersVisibleProperty: BooleanProperty;
  public readonly stabilityDefinitionProperty: StringProperty;

  public constructor() {
    this.selectedNuclideProperty = new Property(NUCLIDE_TABLE.require(DEFAULT_SELECTION));
    this.magicNumbersVisibleProperty = new BooleanProperty(true);
    this.stabilityDefinitionProperty = new StringProperty("ensdf", { validValues: ["ensdf", "effective"] });
  }

  public get stabilityDefinition(): StabilityDefinition {
    return this.stabilityDefinitionProperty.value as StabilityDefinition;
  }

  public reset(): void {
    this.selectedNuclideProperty.reset();
    this.magicNumbersVisibleProperty.reset();
    this.stabilityDefinitionProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing animates in the shared state.
  }
}
