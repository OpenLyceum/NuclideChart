/**
 * ChartScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createChartIcon() in src/common/NuclideChartScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createChartIcon } from "../common/NuclideChartScreenIcons.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { ChartModel } from "./model/ChartModel.js";
import { ChartKeyboardHelpContent } from "./view/ChartKeyboardHelpContent.js";
import { ChartScreenView } from "./view/ChartScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ChartScreenOptions = ScreenOptions & { tandem: Tandem };

export class ChartScreen extends Screen<ChartModel, ChartScreenView> {
  public constructor(options: ChartScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ChartModel(),
      // View factory — receives the model instance
      (model) =>
        new ChartScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ChartScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ChartKeyboardHelpContent(),
          homeScreenIcon: createChartIcon(),
          navigationBarIcon: createChartIcon(),
        },
        options,
      ),
    );
  }
}
