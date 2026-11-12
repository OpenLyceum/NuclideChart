/**
 * ShellsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createShellsIcon() in src/common/NuclideChartScreenIcons.ts
 * (see src/common/NuclideChartScreenIcons.ts).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import type { SharedModel } from "../common/model/SharedModel.js";
import { createShellsIcon } from "../common/NuclideChartScreenIcons.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { ShellsModel } from "./model/ShellsModel.js";
import { ShellsKeyboardHelpContent } from "./view/ShellsKeyboardHelpContent.js";
import { ShellsScreenView } from "./view/ShellsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ShellsScreenOptions = ScreenOptions & { tandem: Tandem };

export class ShellsScreen extends Screen<ShellsModel, ShellsScreenView> {
  public constructor(shared: SharedModel, options: ShellsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ShellsModel(shared),
      // View factory — receives the model instance
      (model) =>
        new ShellsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ShellsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ShellsKeyboardHelpContent(),
          homeScreenIcon: createShellsIcon(),
          navigationBarIcon: createShellsIcon(),
        },
        options,
      ),
    );
  }
}
