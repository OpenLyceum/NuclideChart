/**
 * HalfLivesScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createHalfLivesIcon() in src/common/NuclideChartScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createHalfLivesIcon } from "../common/NuclideChartScreenIcons.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { HalfLivesModel } from "./model/HalfLivesModel.js";
import { HalfLivesKeyboardHelpContent } from "./view/HalfLivesKeyboardHelpContent.js";
import { HalfLivesScreenView } from "./view/HalfLivesScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type HalfLivesScreenOptions = ScreenOptions & { tandem: Tandem };

export class HalfLivesScreen extends Screen<HalfLivesModel, HalfLivesScreenView> {
  public constructor(options: HalfLivesScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new HalfLivesModel(),
      // View factory — receives the model instance
      (model) =>
        new HalfLivesScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<HalfLivesScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new HalfLivesKeyboardHelpContent(),
          homeScreenIcon: createHalfLivesIcon(),
          navigationBarIcon: createHalfLivesIcon(),
        },
        options,
      ),
    );
  }
}
