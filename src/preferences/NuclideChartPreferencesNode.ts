import { NUCLIDE_CHART_PREFERENCES_NODE_SETTINGS } from "../NuclideChartConstants.js";
/**
 * NuclideChartPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to NuclideChartPreferencesModel Properties (whose initial values come from
 * nuclideChartQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import NuclideChartColors from "../NuclideChartColors.js";
import { FONTS } from "../NuclideChartConstants.js";
import NuclideChartNamespace from "../NuclideChartNamespace.js";
import type { NuclideChartPreferencesModel } from "./NuclideChartPreferencesModel.js";

export class NuclideChartPreferencesNode extends VBox {
  public constructor(preferencesModel: NuclideChartPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: FONTS.PREFERENCES_TITLE,
      fill: NuclideChartColors.controlSurfaceTextColorProperty,
    });

    const showEquationsCheckbox = new Checkbox(
      preferencesModel.showEquationsProperty,
      new Text(prefStrings.showEquationsStringProperty, {
        font: FONTS.PREFERENCES_LABEL,
        fill: NuclideChartColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: NuclideChartColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: NuclideChartColors.controlSurfaceColorProperty,
        spacing: NUCLIDE_CHART_PREFERENCES_NODE_SETTINGS.SHOW_EQUATIONS_CHECKBOX_SPACING,
        ...(tandem && { tandem: tandem.createTandem("showEquationsCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: NUCLIDE_CHART_PREFERENCES_NODE_SETTINGS.CONSTRUCTOR_SPACING,
      children: [header, showEquationsCheckbox],
    });
  }
}

NuclideChartNamespace.register("NuclideChartPreferencesNode", NuclideChartPreferencesNode);
