/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { BindingEnergyScreen } from "./binding-energy/BindingEnergyScreen.js";
import { ChartScreen } from "./chart/ChartScreen.js";
import { SharedModel } from "./common/model/SharedModel.js";
import { DecayChainsScreen } from "./decay-chains/DecayChainsScreen.js";
import { HalfLivesScreen } from "./half-lives/HalfLivesScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { IsobarsScreen } from "./isobars/IsobarsScreen.js";
import NuclideChartColors from "./NuclideChartColors.js";
import { NuclideChartPreferencesModel } from "./preferences/NuclideChartPreferencesModel.js";
import { NuclideChartPreferencesNode } from "./preferences/NuclideChartPreferencesNode.js";
import { ShellsScreen } from "./shells/ShellsScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from nuclideChartQueryParameters.
  const simPreferences = new NuclideChartPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  // State every screen shares: the selected nuclide, the magic-number guides, the definition of stable.
  const shared = new SharedModel();

  const screens = [
    new ChartScreen(shared, {
      name: stringManager.getScreenNames().chartStringProperty,
      tandem: Tandem.ROOT.createTandem("chartScreen"),
      backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
    }),
    new BindingEnergyScreen(shared, simPreferences, {
      name: stringManager.getScreenNames().bindingEnergyStringProperty,
      tandem: Tandem.ROOT.createTandem("bindingEnergyScreen"),
      backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
    }),
    new ShellsScreen(shared, {
      name: stringManager.getScreenNames().shellsStringProperty,
      tandem: Tandem.ROOT.createTandem("shellsScreen"),
      backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
    }),
    new IsobarsScreen(shared, {
      name: stringManager.getScreenNames().isobarsStringProperty,
      tandem: Tandem.ROOT.createTandem("isobarsScreen"),
      backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
    }),
    new HalfLivesScreen(shared, {
      name: stringManager.getScreenNames().halfLivesStringProperty,
      tandem: Tandem.ROOT.createTandem("halfLivesScreen"),
      backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
    }),
    new DecayChainsScreen(shared, {
      name: stringManager.getScreenNames().decayChainsStringProperty,
      tandem: Tandem.ROOT.createTandem("decayChainsScreen"),
      backgroundColorProperty: NuclideChartColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new NuclideChartPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
