/**
 * BindingEnergyKeyboardHelpContent.ts
 *
 * The keyboard-help dialog of this screen: the shared sections (see NuclideChartKeyboardHelpContent),
 * wired through the Screen's createKeyboardHelpNode.
 */

import { NuclideChartKeyboardHelpContent } from "../../common/view/NuclideChartKeyboardHelpContent.js";

export class BindingEnergyKeyboardHelpContent extends NuclideChartKeyboardHelpContent {
  public constructor() {
    super({ comboBox: true });
  }
}
