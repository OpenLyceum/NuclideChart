/**
 * ChartModel.ts
 *
 * The Chart screen: an N–Z map of every known nuclide. The model holds the map's colouring, overlays,
 * half-life filter and viewport (centre in (N, Z) and zoom factor); the selected nuclide lives in the
 * SharedModel so it carries across screens.
 */

import { BooleanProperty, EnumerationProperty, NumberProperty } from "scenerystack/axon";
import { Range, Vector2, Vector2Property } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { AGE_OF_EARTH_S } from "../../common/model/NuclearConstants.js";
import { NUCLIDE_TABLE } from "../../common/model/NuclideTable.js";
import type { SharedModel } from "../../common/model/SharedModel.js";
import { MAP_ZOOM_RANGE } from "../../NuclideChartConstants.js";
import { MapColoring } from "./MapColoring.js";

/** Range of the half-life filter, as log₁₀ of seconds (1 s to 10²⁵ s). */
export const HALF_LIFE_FILTER_RANGE = new Range(0, 25);

export class ChartModel implements TModel {
  public readonly shared: SharedModel;
  public readonly coloringProperty = new EnumerationProperty(MapColoring.DECAY_MODE);

  public readonly nEqualsZVisibleProperty = new BooleanProperty(false);
  public readonly valleyVisibleProperty = new BooleanProperty(false);
  public readonly dripLinesVisibleProperty = new BooleanProperty(false);
  public readonly estimatedMassesMarkedProperty = new BooleanProperty(false);

  /** When on, nuclides whose half-life is shorter than the threshold are dimmed. */
  public readonly halfLifeFilterEnabledProperty = new BooleanProperty(false);
  /** log₁₀ of the threshold half-life in seconds; starts at the age of the Earth. */
  public readonly halfLifeThresholdProperty = new NumberProperty(Math.log10(AGE_OF_EARTH_S), {
    range: HALF_LIFE_FILTER_RANGE,
  });

  /** Map centre in (N, Z). */
  public readonly centerProperty = new Vector2Property(ChartModel.fullChartCenter());
  /** Zoom factor: 1 shows the whole chart. */
  public readonly zoomProperty = new NumberProperty(MAP_ZOOM_RANGE.min, {
    range: new Range(MAP_ZOOM_RANGE.min, MAP_ZOOM_RANGE.max),
  });

  public constructor(shared: SharedModel) {
    this.shared = shared;
  }

  /** Centre of the whole chart in (N, Z). */
  public static fullChartCenter(): Vector2 {
    return new Vector2(NUCLIDE_TABLE.maxN / 2, NUCLIDE_TABLE.maxZ / 2);
  }

  /** Whether the half-life filter dims this half-life (s; null = stable). */
  public isFilteredOut(halfLife: number | null, stable: boolean): boolean {
    if (!this.halfLifeFilterEnabledProperty.value || stable) {
      return false;
    }
    return halfLife === null || Math.log10(halfLife) < this.halfLifeThresholdProperty.value;
  }

  public showWholeChart(): void {
    this.zoomProperty.reset();
    this.centerProperty.reset();
  }

  public reset(): void {
    this.shared.reset();
    this.coloringProperty.reset();
    this.nEqualsZVisibleProperty.reset();
    this.valleyVisibleProperty.reset();
    this.dripLinesVisibleProperty.reset();
    this.estimatedMassesMarkedProperty.reset();
    this.halfLifeFilterEnabledProperty.reset();
    this.halfLifeThresholdProperty.reset();
    this.showWholeChart();
  }

  public step(_dt: number): void {
    // The chart does not animate.
  }
}
