/**
 * ShellsModel.ts
 *
 * The Shells screen: nucleon separation energies along chains of isotopes (S₂ₙ or S_n against N, one line per
 * element) or isotones (S₂ₚ or S_p against Z, one line per N). The two-nucleon versions cancel the pairing
 * zig-zag, leaving smooth falling lines that drop suddenly just past each magic number.
 */

import { BooleanProperty, StringProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import type { SharedModel } from "../../common/model/SharedModel.js";
import type { SeparationKind } from "../../common/model/separationEnergies.js";

export const SEPARATION_KINDS: readonly SeparationKind[] = ["twoNeutron", "oneNeutron", "twoProton", "oneProton"];

/** True for the kinds plotted against N with one line per element. */
export const isNeutronKind = (kind: SeparationKind): boolean => kind === "twoNeutron" || kind === "oneNeutron";

export class ShellsModel implements TModel {
  public readonly shared: SharedModel;
  public readonly kindProperty = new StringProperty("twoNeutron", { validValues: SEPARATION_KINDS });
  /** Whether energies that involve a mass from systematics are drawn (faintly). */
  public readonly estimatedVisibleProperty = new BooleanProperty(false);

  public constructor(shared: SharedModel) {
    this.shared = shared;
  }

  public get kind(): SeparationKind {
    return this.kindProperty.value as SeparationKind;
  }

  public reset(): void {
    this.shared.reset();
    this.kindProperty.reset();
    this.estimatedVisibleProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing animates on this screen.
  }
}
