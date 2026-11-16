/**
 * HalfLivesModel.ts
 *
 * The Half-Lives screen, three views of the same half-lives:
 *   - Explorer: t½ against A or against distance from the valley of stability, on a log scale (or a linear
 *     one, to show how much a linear scale hides), with the age of the Earth marked;
 *   - Geiger–Nuttall: log t½(α) against Q_α^(−1/2) for even–even α emitters, one straight line per element;
 *   - Sargent: log t½(β⁻) against log Q_β, with slope near −5.
 *
 * Owns the plot-ready series and fits; the view only turns them into Scenery.
 */

import {
  BooleanProperty,
  DerivedProperty,
  EnumerationProperty,
  StringProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { FITTED_MASS_FORMULA } from "../../common/model/fittedMassFormula.js";
import {
  type ExplorerAxis,
  type ExplorerTrendPoint,
  explorerTrendPoints,
  explorerX,
  type GeigerNuttallFitSegment,
  type GeigerNuttallPoint,
  geigerNuttallFitSegments,
  geigerNuttallFits,
  geigerNuttallPlotPoints,
  geigerNuttallPoints,
  type HighlightedTrendPoint,
  type LineFit,
  measuredRadioactiveNuclides,
  type SargentPoint,
  sargentLineFit,
  sargentPlotPoints,
  sargentPoints,
  visibleGeigerNuttallFits,
} from "../../common/model/halfLifeTrends.js";
import { AGE_OF_EARTH_S } from "../../common/model/NuclearConstants.js";
import type { Nuclide, StabilityDefinition } from "../../common/model/NuclideTable.js";
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

  /** Measured half-lives (no limits) of radioactive ground states. */
  public readonly measuredNuclides: readonly Nuclide[];
  /** Even–even α emitters for the Geiger–Nuttall plot. */
  public readonly geigerNuttallPoints: readonly GeigerNuttallPoint[];
  /** One Geiger–Nuttall line per element with ≥ 3 emitters. */
  public readonly geigerNuttallFits: ReadonlyMap<number, LineFit>;
  /** Fit segments with the x-span of each element's emitters. */
  public readonly geigerNuttallFitSegments: readonly GeigerNuttallFitSegment[];
  /** β⁻ emitters for Sargent's rule. */
  public readonly sargentPoints: readonly SargentPoint[];
  /** Sargent fit of log₁₀ t½ against log₁₀ Q_β. */
  public readonly sargentFit: LineFit | null;
  /** How many measured radioactive nuclides outlive the Earth. */
  public readonly earthAgeSurvivorsCount: number;
  /** Po-212 and Th-232 on the Geiger–Nuttall plot, for the comparison readout. */
  public readonly geigerComparisonPo: GeigerNuttallPoint | undefined;
  public readonly geigerComparisonTh: GeigerNuttallPoint | undefined;

  /** Explorer series for the current axis, scale and stability definition. */
  public readonly explorerPointsProperty: TReadOnlyProperty<ExplorerTrendPoint[]>;
  /** Geiger–Nuttall series with the selected Z highlighted. */
  public readonly geigerPointsProperty: TReadOnlyProperty<HighlightedTrendPoint[]>;
  /** Sargent series in plot coordinates. */
  public readonly sargentPlotPoints: readonly HighlightedTrendPoint[];
  /** Background and highlighted Geiger–Nuttall fit segments for the current selection. */
  public readonly geigerFitsProperty: TReadOnlyProperty<{
    readonly background: readonly GeigerNuttallFitSegment[];
    readonly highlight: GeigerNuttallFitSegment | null;
  }>;

  public constructor(shared: SharedModel) {
    this.shared = shared;

    this.measuredNuclides = measuredRadioactiveNuclides();
    this.geigerNuttallPoints = geigerNuttallPoints();
    this.geigerNuttallFits = geigerNuttallFits(this.geigerNuttallPoints);
    this.geigerNuttallFitSegments = geigerNuttallFitSegments(this.geigerNuttallPoints, this.geigerNuttallFits);
    this.sargentPoints = sargentPoints();
    this.sargentFit = sargentLineFit(this.sargentPoints);
    this.sargentPlotPoints = sargentPlotPoints(this.sargentPoints);
    this.earthAgeSurvivorsCount = this.measuredNuclides.filter((x) => (x.halfLife ?? 0) > AGE_OF_EARTH_S).length;
    this.geigerComparisonPo = this.geigerNuttallPoints.find((p) => p.nuclide.label === "Po-212");
    this.geigerComparisonTh = this.geigerNuttallPoints.find((p) => p.nuclide.label === "Th-232");

    this.explorerPointsProperty = new DerivedProperty(
      [this.explorerAxisProperty, this.logScaleProperty, this.shared.stabilityDefinitionProperty],
      (axis, logScale, definition) =>
        explorerTrendPoints(
          this.measuredNuclides,
          axis as ExplorerAxis,
          logScale,
          definition as StabilityDefinition,
          FITTED_MASS_FORMULA.coefficients,
        ),
    );

    this.geigerPointsProperty = new DerivedProperty([this.shared.selectedNuclideProperty], (nuclide) =>
      geigerNuttallPlotPoints(this.geigerNuttallPoints, nuclide.z),
    );

    this.geigerFitsProperty = new DerivedProperty(
      [this.shared.selectedNuclideProperty, this.fitsVisibleProperty],
      (nuclide, fitsVisible) => visibleGeigerNuttallFits(this.geigerNuttallFitSegments, nuclide.z, fitsVisible),
    );
  }

  public get explorerAxis(): ExplorerAxis {
    return this.explorerAxisProperty.value as ExplorerAxis;
  }

  /** Explorer x for a nuclide under the current axis choice. */
  public explorerXOf(nuclide: Nuclide): number {
    return explorerX(nuclide, this.explorerAxis, FITTED_MASS_FORMULA.coefficients);
  }

  /** True when the nuclide is among the Geiger–Nuttall points. */
  public isGeigerNuttallEmitter(nuclide: Nuclide): boolean {
    return this.geigerNuttallPoints.some((p) => p.nuclide === nuclide);
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
