/**
 * BindingEnergyScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createBindingEnergyIcon() in src/common/NuclideChartScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createBindingEnergyIcon } from "../common/NuclideChartScreenIcons.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { BindingEnergyModel } from "./model/BindingEnergyModel.js";
import { BindingEnergyKeyboardHelpContent } from "./view/BindingEnergyKeyboardHelpContent.js";
import { BindingEnergyScreenView } from "./view/BindingEnergyScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type BindingEnergyScreenOptions = ScreenOptions & { tandem: Tandem };

export class BindingEnergyScreen extends Screen<BindingEnergyModel, BindingEnergyScreenView> {
  public constructor(options: BindingEnergyScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new BindingEnergyModel(),
      // View factory — receives the model instance
      (model) =>
        new BindingEnergyScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<BindingEnergyScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new BindingEnergyKeyboardHelpContent(),
          homeScreenIcon: createBindingEnergyIcon(),
          navigationBarIcon: createBindingEnergyIcon(),
        },
        options,
      ),
    );
  }
}
