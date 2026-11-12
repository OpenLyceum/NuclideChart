/**
 * IsobarsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createIsobarsIcon() in src/common/NuclideChartScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import type { SharedModel } from "../common/model/SharedModel.js";
import { createIsobarsIcon } from "../common/NuclideChartScreenIcons.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { IsobarsModel } from "./model/IsobarsModel.js";
import { IsobarsKeyboardHelpContent } from "./view/IsobarsKeyboardHelpContent.js";
import { IsobarsScreenView } from "./view/IsobarsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type IsobarsScreenOptions = ScreenOptions & { tandem: Tandem };

export class IsobarsScreen extends Screen<IsobarsModel, IsobarsScreenView> {
  public constructor(shared: SharedModel, options: IsobarsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new IsobarsModel(shared),
      // View factory — receives the model instance
      (model) =>
        new IsobarsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<IsobarsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new IsobarsKeyboardHelpContent(),
          homeScreenIcon: createIsobarsIcon(),
          navigationBarIcon: createIsobarsIcon(),
        },
        options,
      ),
    );
  }
}
