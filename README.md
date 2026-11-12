# Nuclide Chart

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Trends across the whole chart of nuclides, built on real data from the IAEA Live Chart of Nuclides
(ENSDF, NUBASE2020, AME2020). Most of nuclear physics only shows up when many nuclides are compared, so
students find it themselves:
- Ni-62, not Fe-56, is the most tightly bound nuclide.
- The magic numbers appear as bumps in the mass-formula residuals and as cliffs in the separation
  energies.
- Isobars lie on mass parabolas.
- Half-lives span more than 50 orders of magnitude, and α half-lives fall on Geiger–Nuttall lines.
- Every decay series reaches secular equilibrium.

It is written for introductory modern physics (the nuclear chapter of the QuadriviumPress *Modern
Physics* textbook). Built with [SceneryStack](https://scenerystack.org/); runs offline as a Progressive
Web App.

## Features

- **Chart.**
  - Every known ground state (3,386) on an N–Z map that pans, zooms and selects.
  - Colour by decay mode, half-life, B/A, mass-formula residual, natural abundance, measured or
    estimated mass, quadrupole moment, or spin.
  - Overlays: magic numbers, N = Z, the valley of stability and the drip lines.
  - A half-life filter starting at the age of the Earth answers "why do some radioactive nuclides
    still exist?".
  - A Q-value predictor: students work each Q out from the mass excesses, then reveal the answers.
    Each decay is shown as allowed and observed, allowed but not observed, or forbidden.
  - A census of stable nuclides by the parity of Z and N, with two definitions of "stable".
- **Binding Energy.**
  - The B/A curve with a zoom on its peak, where Ni-62 beats Fe-58 and Fe-56.
  - The semi-empirical mass formula: switch terms off, move the coefficients, fit them to the measured
    masses, or go back to the textbook values.
  - Residuals (measured − formula) against N or Z show the shell closures.
  - Energy released by U-235 fission, from the curve (≈ 0.9 MeV × 235) and from the masses
    (≈ 200 MeV).
  - Nine fusion reactions, from D–T to Fe-56 + α.
- **Shells.**
  - S₂ₙ, Sₙ, S₂ₚ or Sₚ, one line per element or per isotone.
  - The line of the selected nuclide is highlighted, with its drop to the next nuclide.
  - The unbound region is shaded.
- **Isobars.**
  - The mass excess of one A's isobars against Z.
  - Fitted mass parabolas: one for odd A, two for even A.
  - Arrows for every allowed β⁻, β⁺/EC and double-β step.
  - The β-stable isobars and Mattauch's rule. Ge-76, Te-130 and Xe-136 decay only by double β.
- **Half-Lives.**
  - Every measured half-life against A or against distance from the valley, on log or linear scales.
  - Guides at one second, one year, the age of the Earth and the age of the Universe.
  - The Geiger–Nuttall lines of even–even α emitters (Po-212 against Th-232: 24 orders of magnitude).
  - Sargent's rule for β⁻ emitters.
- **Decay Chains.**
  - The four natural series (4n, 4n+1, 4n+2, 4n+3) traced from the data on their patch of the chart.
  - Each member's activity over time from the exact Bateman solution, rising to secular equilibrium.
  - The Pb/U ratio as a dating clock.
  - Fission products: the two-humped yield curve for U-235, Pu-239 and U-238, and the β⁻ chain
    along any A, with delayed-neutron emitters flagged.
- **Real data, offline.**
  - The IAEA API cannot be queried from a web page, so the sim bundles a snapshot (about 600 KB).
    `npm run fetch-data` refreshes it.
  - Q values, separation energies, chains and fits are computed in the sim from the masses and decay
    branches, and tested against the IAEA's own values.
- **Accessible.**
  - Every chart can be used from the keyboard.
  - Each screen has a live screen summary and a keyboard-help dialog.
  - Default and projector colour profiles.
  - English, French and Spanish.
  - Installable PWA.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run fetch-data` | Take a new snapshot of the IAEA Live Chart of Nuclides (needs network) |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

The snapshot is frozen on purpose so that class answers stay put during a term. To refresh it:

1. Run `npm run fetch-data`.
2. Check the summary it prints (about 3,400 ground states, and fission yields summing to 2 per
   fission).
3. Run the tests.
4. Commit `src/common/model/data/`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.6 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).
The bundled nuclear data come from the IAEA Nuclear Data Section, under its own terms. See
[CREDITS.md](CREDITS.md) for the acknowledgements.

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
