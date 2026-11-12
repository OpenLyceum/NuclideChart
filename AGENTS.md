# AGENTS.md — Nuclide Chart

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Trends across the whole chart of nuclides, for introductory modern physics. It is original work, forked from
`SceneryStackTemplate` on 11 Nov 2026, and built on a snapshot of the IAEA Live Chart of Nuclides. There
are six screens:

| Screen | Folder | Content |
|---|---|---|
| Chart | `src/chart/` | N–Z map of all ground states: eight colourings, overlays (magic numbers, N = Z, valley, drip lines), half-life filter, nuclide card, Q-value predictor dialog, stable census dialog |
| Binding Energy | `src/binding-energy/` | B/A curve with peak zoom, mass formula (switchable terms, sliders, least-squares fit), residuals against N or Z, fission and fusion energy release |
| Shells | `src/shells/` | S₂ₙ, Sₙ, S₂ₚ, Sₚ lines with the selected line highlighted and its drop |
| Isobars | `src/isobars/` | Mass excess of one A's isobars against Z, fitted parabolas, allowed β and double-β arrows, Mattauch's rule |
| Half-Lives | `src/half-lives/` | All half-lives (log or linear, against A or distance from the valley), Geiger–Nuttall lines, Sargent's rule |
| Decay Chains | `src/decay-chains/` | The four natural series on the chart, Bateman activities over time and the dating clock; fission-product yields and β⁻ chains |

Formulas, data and their sources are in [`doc/model.md`](doc/model.md). Architecture and decisions are in
[`doc/implementation-notes.md`](doc/implementation-notes.md). Data acknowledgements are in
[`CREDITS.md`](CREDITS.md).

### Things to know first

- **The data are a frozen snapshot.** The IAEA API (`nds.iaea.org/relnsd/v1/data`) sends no CORS headers.
  - `scripts/data/fetch-nuclides.ts` (`npm run fetch-data`) writes `src/common/model/data/*.json`. The
    output is committed, excluded from Biome, and refreshed only by hand. `FETCH_CACHE_DIR=<dir>` caches
    responses between reruns.
  - The API refuses requests without a browser-like User-Agent.
  - It returns ISO-8859-1 CSV.
- **Units are the snapshot's.** Energies (B/A, Δ, S, Q) are in keV, half-lives in seconds, abundances in
  %. The mass formula alone works in MeV. Always use `half_life_sec`: the API's `unit_hl` mixes in
  widths (eV, keV, MeV).
- **"Stable" has two definitions** (`StabilityDefinition`):
  - `ensdf`: never seen to decay. 244 nuclides, 4 of them odd–odd.
  - `effective`: also t½ > 10¹⁵ y. 271 nuclides, and V-50 becomes a 5th odd–odd.
  - The choice is shared state that the census, the map colours and the isobar markers follow.
- **808 masses are estimated from systematics** (AME "#"). They are flagged (`isSystematic`), drawn
  faint, and left out of fits by default.
- **The IAEA table includes U-241…U-255** with no half-life or discovery year. They show as a detached
  row of β⁻ cells at Z = 92 on the map. That row is the data, not a bug.
- **Chains are traced, not hand-listed.** `decayChains.ts` follows every branch ≥ 0.01 %. It subtracts
  delayed-particle sub-branches (β⁻n inside β⁻) and routes Th-234 β⁻ through the Pa-234m isomer. The
  Bateman solution (`bateman.ts`) is exact (sums of exponentials), so any time from 1 s to 30 Gy is
  evaluated directly.
- **Shared state** (`SharedModel`): the selected nuclide, the magic-number toggle and the stability
  definition. It is created once in `main.ts` and passed to every screen model. Each screen's Reset All
  also resets it.
- **Scenery hit-testing gotchas:**
  - A stroke-only `Rectangle` (a chart frame) still catches clicks over its whole interior, so frames
    get `pickable: false`.
  - Hit rectangles need a transparent fill.
  - `Multilink.multilinkAny` asserts on duplicate dependencies, so dedupe colour Properties.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/NuclideTable.ts` | Decodes `nuclides.json` and `isomers.json`; `NUCLIDE_TABLE.get(z, n)`, `require("Fe-56")`, `isobars(a)`, `isotopes(z)` |
| `src/common/model/massFormula.ts` | SEMF terms (Krane's form, as in the textbook), `valleyZ`, least-squares `fitMassFormula` |
| `src/common/model/qValues.ts` | Q values from mass excesses and the allowed / observed verdicts |
| `src/common/model/separationEnergies.ts` | Sₙ, S₂ₙ, Sₚ, S₂ₚ, separation lines, particle-bound check |
| `src/common/model/isobars.ts` | Parabola fit, allowed β and double-β transitions, Mattauch check |
| `src/common/model/halfLifeTrends.ts` | Geiger–Nuttall points and per-element fits, Sargent points |
| `src/common/model/decayChains.ts`, `bateman.ts` | Chain tracing and the exact branching Bateman solution |
| `src/common/model/energyRelease.ts` | Fission (U-235 + n) and fusion Q values and curve estimates |
| `src/common/model/FissionYields.ts` | Independent and cumulative fission yields, mass-chain yields |
| `src/common/view/NuclideScatterNode.ts` | Shared scatter chart with click and arrow-key selection |
| `src/chart/view/NuclideMapNode.ts` | The canvas N–Z map: pan, zoom, minimap, overlays, keyboard |
| `scripts/data/fetch-nuclides.ts` | Takes the snapshot |

## Accessibility

- **Every chart is a focusable node with an accessible name and help text.**
  - Map: the arrow keys move one neutron or proton at a time, and + and − zoom.
  - Scatter charts: the arrow keys step to the nearest point in that direction.
  - Chain diagram: the arrow keys step along the chain.
- **Each screen has a live `currentDetails` paragraph** in its screen summary.
- **Keyboard help** is one shared class, `NuclideChartKeyboardHelpContent`. Each screen's
  `*KeyboardHelpContent` subclasses it and is wired through the Screen.
- **Colour is never the only cue:**
  - Isobar markers differ by shape for each parity class.
  - The map has text labels when zoomed.

## Compliance carve-outs

- **Hardcoded colours.**
  - The viridis and blue–white–red scale stops in `src/chart/view/mapColors.ts`. They are
    data-visualization palettes that are the same in both profiles.
  - The black/white text-contrast picks in `NuclideMapNode.ts` and `ChainDiagramNode.ts`.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
npx playwright test tests/browser     # layout in every screen and locale (SCREENSHOT_DIR=… saves PNGs)
```

For screenshots, run the dev server with `npx vite --port <free port>`. Screen models are reachable
from the console as `phet.joist.sim.screens[i].model` (with `?screens=n`, at index 0).
