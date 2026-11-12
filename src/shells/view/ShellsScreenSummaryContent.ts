/**
 * ShellsScreenSummaryContent.ts
 *
 * The accessible screen summary of the Shells screen: what the play area and controls hold, a hint to get
 * started, and a live paragraph describing the current state.
 */

import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { type SeparationKind, separationEnergy } from "../../common/model/separationEnergies.js";
import { formatFixed } from "../../common/view/format.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ShellsModel } from "../model/ShellsModel.js";

export class ShellsScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ShellsModel) {
    const a11y = StringManager.getInstance().getShellsA11yStrings();
    const details = new DerivedProperty(
      [a11y.currentDetailsPatternStringProperty, model.kindProperty, model.shared.selectedNuclideProperty],
      (pattern, kind, nuclide) => {
        const value = separationEnergy(nuclide, kind as SeparationKind);
        return StringUtils.fillIn(pattern, {
          label: nuclide.label,
          value: value === null ? "—" : formatFixed(value / 1000, 2),
        });
      },
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: details,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
