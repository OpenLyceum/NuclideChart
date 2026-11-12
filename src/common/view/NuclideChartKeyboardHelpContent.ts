/**
 * NuclideChartKeyboardHelpContent.ts
 *
 * The keyboard-help dialog ("?" in the navigation bar), shared by every screen: choosing a nuclide with the
 * arrow keys (on the Chart screen also zooming with + and −), then the standard slider, combo box and
 * basic-action sections. Each screen's own *KeyboardHelpContent extends this with its options.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  LetterKeyNode,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export type NuclideChartKeyboardHelpOptions = {
  /** The Chart screen's map: arrow keys step by one neutron or proton, + and − zoom. */
  readonly map?: boolean;
  /** Whether the screen has a combo box. */
  readonly comboBox?: boolean;
};

export class NuclideChartKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(options: NuclideChartKeyboardHelpOptions = {}) {
    const strings = StringManager.getInstance().getCommonStrings().keyboardHelp;
    const rows = options.map
      ? [
          KeyboardHelpSectionRow.labelWithIcon(
            strings.moveOnMapStringProperty,
            KeyboardHelpIconFactory.arrowKeysRowIcon(),
          ),
          KeyboardHelpSectionRow.labelWithIcon(
            strings.zoomStringProperty,
            KeyboardHelpIconFactory.iconOrIcon(new LetterKeyNode("+"), new LetterKeyNode("−")),
          ),
        ]
      : [
          KeyboardHelpSectionRow.labelWithIcon(
            strings.moveSelectionStringProperty,
            KeyboardHelpIconFactory.arrowKeysRowIcon(),
          ),
        ];
    const selection = new KeyboardHelpSection(
      options.map ? strings.mapTitleStringProperty : strings.selectTitleStringProperty,
      rows,
    );
    const right: KeyboardHelpSection[] = options.comboBox ? [new ComboBoxKeyboardHelpSection()] : [];
    right.push(new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }));
    super([selection, new SliderControlsKeyboardHelpSection()], right);
  }
}
