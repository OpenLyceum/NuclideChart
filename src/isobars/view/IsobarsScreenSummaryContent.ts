/**
 * IsobarsScreenSummaryContent.ts
 *
 * The accessible screen summary of the Isobars screen: what the play area and controls hold, a hint to get
 * started, and a live paragraph describing the current state.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";

import { StringManager } from "../../i18n/StringManager.js";
import type { IsobarsModel } from "../model/IsobarsModel.js";

export class IsobarsScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: IsobarsModel) {
    const a11y = StringManager.getInstance().getIsobarsA11yStrings();
    const details = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.analysisProperty],
      (pattern, analysis) =>
        StringUtils.fillIn(pattern, {
          a: analysis.a,
          stable: analysis.betaStable.map((x) => x.label).join(", ") || "—",
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
