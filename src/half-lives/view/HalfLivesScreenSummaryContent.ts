/**
 * HalfLivesScreenSummaryContent.ts
 *
 * The accessible screen summary of the Half-Lives screen: what the play area and controls hold, a hint to get
 * started, and a live paragraph describing the current state.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";

import { StringManager } from "../../i18n/StringManager.js";
import type { HalfLivesModel } from "../model/HalfLivesModel.js";

export class HalfLivesScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: HalfLivesModel) {
    const a11y = StringManager.getInstance().getHalfLivesA11yStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const details = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.shared.selectedNuclideProperty],
      (pattern, nuclide) =>
        StringUtils.fillIn(pattern, {
          label: nuclide.label,
          halfLife: nuclide.isStable ? common.card.stableStringProperty.value : nuclide.halfLifeText || "—",
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
