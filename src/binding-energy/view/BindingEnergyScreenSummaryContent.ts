/**
 * BindingEnergyScreenSummaryContent.ts
 *
 * The accessible screen summary of the Binding Energy screen: what the play area and controls hold, a hint to get
 * started, and a live paragraph describing the current state.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatFixed } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { BindingEnergyModel } from "../model/BindingEnergyModel.js";

export class BindingEnergyScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: BindingEnergyModel) {
    const a11y = StringManager.getInstance().getBindingEnergyA11yStrings();
    const details = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.shared.selectedNuclideProperty, model.rmsProperty],
      (pattern, nuclide, rms) =>
        StringUtils.fillIn(pattern, {
          label: nuclide.label,
          value: nuclide.bindingPerNucleon === null ? "—" : formatFixed(nuclide.bindingPerNucleon / 1000, 4),
          rms: formatFixed(rms.rms, 2),
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
