/**
 * DecayChainsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createDecayChainsIcon() in src/common/NuclideChartScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createDecayChainsIcon } from "../common/NuclideChartScreenIcons.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { DecayChainsModel } from "./model/DecayChainsModel.js";
import { DecayChainsKeyboardHelpContent } from "./view/DecayChainsKeyboardHelpContent.js";
import { DecayChainsScreenView } from "./view/DecayChainsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type DecayChainsScreenOptions = ScreenOptions & { tandem: Tandem };

export class DecayChainsScreen extends Screen<DecayChainsModel, DecayChainsScreenView> {
  public constructor(options: DecayChainsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new DecayChainsModel(),
      // View factory — receives the model instance
      (model) =>
        new DecayChainsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<DecayChainsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new DecayChainsKeyboardHelpContent(),
          homeScreenIcon: createDecayChainsIcon(),
          navigationBarIcon: createDecayChainsIcon(),
        },
        options,
      ),
    );
  }
}
