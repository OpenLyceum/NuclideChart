/**
 * ChartScreenSummaryContent.ts
 *
 * The accessible screen summary of the Chart screen: what the play area and controls hold, a hint to get
 * started, and a live paragraph describing the current state.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";

import { StringManager } from "../../i18n/StringManager.js";
import type { ChartModel } from "../model/ChartModel.js";

export class ChartScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ChartModel) {
    const a11y = StringManager.getInstance().getChartA11yStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const colorings = StringManager.getInstance().getChartStrings().colorings as unknown as Readonly<
      Record<string, { value: string }>
    >;
    const details = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.coloringProperty, model.shared.selectedNuclideProperty],
      (pattern, coloring, nuclide) =>
        StringUtils.fillIn(pattern, {
          coloring: colorings[`${coloring.key}StringProperty`]?.value ?? coloring.key,
          label: nuclide.label,
          z: nuclide.z,
          n: nuclide.n,
          decay: nuclide.isStable ? common.card.stableStringProperty.value : nuclide.halfLifeText,
        }),
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: details,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
