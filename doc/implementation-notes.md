# Implementation Notes — Nuclide Chart

Nuclide Chart is an original six-screen SceneryStack simulation. The nuclear model and data sources
are documented in [model.md](model.md); acknowledgements are in [CREDITS.md](../CREDITS.md).

## Bootstrap and screen ownership

The first import in `src/main.ts` is `./brand.js`. Its dependency chain initializes the framework,
assertions, splash screen and brand before constructing the simulation. Keep this order.

`main.ts` constructs one `SharedModel` and passes it to Chart, Binding Energy, Shells, Isobars,
Half-Lives and Decay Chains, in that order. Each screen owns a model, view, screen summary and
keyboard-help class in its corresponding `src/<screen>/` folder. Screen icons are Scenery nodes
created by `src/common/NuclideChartScreenIcons.ts` for both the home screen and navigation bar.

`SharedModel` holds the selected nuclide (initially Fe-56), magic-number visibility, and the stability
definition. Selecting a nuclide persists across screens. Every screen's Reset All also resets this
shared state. Screen models implement `TModel`; their `step()` methods do not advance physical time.
The Decay Chains time slider evaluates the Bateman solution at the requested time directly.

## Frozen nuclear data

`NuclideTable.ts` decodes the bundled `nuclides.json` and `isomers.json` once. Its exported
`NUCLIDE_TABLE` supports lookup by Z and N, nuclide name, isobar and isotope. Ground states are the
basis of the chart; isomers are used when tracing branches such as Th-234 through Pa-234m.
`FissionYields.ts` decodes the separate independent and cumulative fission-yield tables.

The simulation makes no IAEA requests at runtime. Refresh the snapshot explicitly with
`npm run fetch-data`; `FETCH_CACHE_DIR` can preserve downloaded responses between attempts.
The fetcher uses a browser-like User-Agent and decodes the API's ISO-8859-1 CSV. Commit refreshed
JSON together with any required documentation and expectation changes.

Snapshot energies are keV, half-lives are seconds and abundances are percentages. The mass formula
uses MeV, so callers convert at that boundary. Half-lives come from `half_life_sec`, never `unit_hl`,
which can describe a resonance width. Estimated masses retain their `isSystematic` flag and are
excluded from fits by default. Unknown values remain missing rather than becoming zero.

## Scientific calculations

Pure calculation modules live in `src/common/model/` and are shared by the screen models:

| Module | Responsibility |
|---|---|
| `massFormula.ts` | Individual SEMF terms, valley of stability and least-squares coefficients |
| `qValues.ts` | Q values from atomic mass excesses and allowed/observed decay verdicts |
| `separationEnergies.ts` | One- and two-nucleon separation energies and particle-bound checks |
| `isobars.ts` | Mass-parabola fitting, beta and double-beta transitions, Mattauch checks |
| `halfLifeTrends.ts` | Geiger–Nuttall and Sargent points and fits |
| `energyRelease.ts` | Fission and fusion Q values and binding-curve estimates |
| `decayChains.ts` | Branch-aware graph tracing, including delayed particles and isomers |
| `bateman.ts` | Exact branching activities as sums of exponentials |

The stability definition is shared by the map colours, census and isobar markers. `ensdf` means
no observed decay; `effective` additionally counts half-lives above 10¹⁵ years. Branch tracing
includes branches of at least 0.01 percent and subtracts delayed-particle sub-branches from their
inclusive beta branches. These choices affect scientific answers, so preserve them when changing
presentation code.

## Rendering and reactive state

Views follow model AXON Properties using links and DerivedProperties. Scientific calculations
remain in model modules. `NuclideMapNode` paints the full N–Z map with a CanvasNode; it handles pan,
zoom, selection, minimap, overlays and labels. `NuclideScatterNode` supplies shared scatter axes,
selection and directional keyboard navigation. Specialized chain and activity nodes render the
natural series without embedding an independent list of chain members.

Chart frames are `pickable: false`: a stroke-only Rectangle otherwise intercepts clicks throughout
its interior. Transparent filled hit rectangles provide intentional pointer targets. Dependencies
passed to `Multilink.multilinkAny` must be unique, including shared colour Properties.

`NuclideChartColors.ts` defines default and projector colours. Canvas views read these Properties
when repainting. Data palettes and black/white contrast choices are documented exceptions in
`AGENTS.md`. Use `NuclideChartPanel` and `NuclideChartButtonOptions` for consistent control surfaces.

## Localization, preferences and accessibility

`StringManager.ts` exposes English, French and Spanish string Properties with key-parity checks.
Screen labels, controls, help and live descriptions follow locale changes. Layout uses bounded
content regions and text width limits so longer translations fit.

`NuclideChartPreferencesModel` owns the equation-visibility preference, initialized by the public
`showEquations` query parameter. Its control lives in Preferences → Simulation. The framework
provides locale selection, projector mode and interactive highlights.

Each chart has a focusable accessible name and help text. Map arrow keys change N or Z and +/−
zoom; scatter arrows select nearby points; chain arrows move through members. Each screen summary
contains a live `currentDetails` paragraph derived from model state. Per-screen keyboard-help
classes compose the shared `NuclideChartKeyboardHelpContent`. Isobar parity classes use different
marker shapes as well as colours.

## Validation and distribution

Run `npm run lint && npm run check && npm run build && npm test` before delivery. Unit tests cover
snapshot decoding, mass formulas, Q values, separation energies, isobars, half-life trends, energy
release, decay tracing, Bateman solutions and disposal of runtime-created objects.

`npx playwright test tests/browser` checks all six screens in all three locales, projector mode,
and the six home-screen icons. Set `FUZZ_PORT` to a free port when other simulations are running;
`SCREENSHOT_DIR` saves visual review images. `npm run test:fuzz:quick` exercises pointer and keyboard
input with runtime assertions enabled.

Vite builds a relative-path PWA in `dist/`. Workbox caches the simulation and bundled data for
offline use. `npm run build:single` produces the alternative self-contained HTML build.
`public/screenshots/` supplies the PWA installation previews; `assets/screenshot.png` is the
fleet-standard chart capture consumed by Baton's catalog thumbnail generator. CI and Pages deploy
call the reusable workflows in OpenLyceum/Baton. The catalog, org profile and workspace README are
maintained in their own repositories, following Baton's `doc/add-simulation.md`.
