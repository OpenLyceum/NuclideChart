/**
 * HalfLivesModel.ts
 *
 * The Half-Lives screen, three views of the same half-lives:
 *   - Explorer: t½ against A or against distance from the valley of stability, on a log scale (or a linear
 *     one, to show how much a linear scale hides), with the age of the Earth marked;
 *   - Geiger–Nuttall: log t½(α) against Q_α^(−1/2) for even–even α emitters, one straight line per element;
 *   - Sargent: log t½(β⁻) against log Q_β, with slope near −5.
 */

import { BooleanProperty, EnumerationProperty, StringProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import type { SharedModel } from "../../common/model/SharedModel.js";

export class HalfLifeView extends EnumerationValue {
  public static readonly EXPLORER = new HalfLifeView("explorer");
  public static readonly GEIGER_NUTTALL = new HalfLifeView("geigerNuttall");
  public static readonly SARGENT = new HalfLifeView("sargent");
  public static readonly enumeration = new Enumeration(HalfLifeView);

  public readonly key: string;

  public constructor(key: string) {
    super();
    this.key = key;
  }
}

export type ExplorerAxis = "massNumber" | "valleyDistance";

export class HalfLivesModel implements TModel {
  public readonly shared: SharedModel;
  public readonly viewProperty = new EnumerationProperty(HalfLifeView.EXPLORER);
  public readonly explorerAxisProperty = new StringProperty("massNumber", {
    validValues: ["massNumber", "valleyDistance"],
  });
  public readonly logScaleProperty = new BooleanProperty(true);
  public readonly earthAgeVisibleProperty = new BooleanProperty(true);
  public readonly notableVisibleProperty = new BooleanProperty(true);
  public readonly fitsVisibleProperty = new BooleanProperty(true);
  public readonly comparisonVisibleProperty = new BooleanProperty(false);

  public constructor(shared: SharedModel) {
    this.shared = shared;
  }

  public reset(): void {
    this.shared.reset();
    this.viewProperty.reset();
    this.explorerAxisProperty.reset();
    this.logScaleProperty.reset();
    this.earthAgeVisibleProperty.reset();
    this.notableVisibleProperty.reset();
    this.fitsVisibleProperty.reset();
    this.comparisonVisibleProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing animates on this screen.
  }
}
