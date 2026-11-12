/**
 * DecayChainsScreenSummaryContent.ts
 *
 * The accessible screen summary of the Decay Chains screen: what the play area and controls hold, a hint to get
 * started, and a live paragraph describing the current state.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatDuration } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { DecayChainsModel } from "../model/DecayChainsModel.js";

export class DecayChainsScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: DecayChainsModel) {
    const a11y = StringManager.getInstance().getDecayChainsA11yStrings();
    const details = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.logTimeProperty, model.chainProperty],
      (pattern, logTime, chain) =>
        StringUtils.fillIn(pattern, { time: formatDuration(10 ** logTime), parent: chain.parent.label }),
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: details,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
