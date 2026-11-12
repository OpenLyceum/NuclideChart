# Credits — Nuclide Chart

Trends across the whole chart of nuclides (binding energies, shells, isobars, half-lives and decay chains),
built on the IAEA Live Chart of Nuclides.

## License

GNU Affero General Public License v3.0 or later — see [org LICENSE](https://github.com/OpenLyceum/.github/blob/main/LICENSE).
The bundled nuclear data keep their own terms, listed below.

## Acknowledgments

Built with [SceneryStack](https://scenerystack.org/) as part of the
[OpenLyceum](https://github.com/OpenLyceum) fleet.

# Data credits

The sim bundles a frozen snapshot of the IAEA Live Chart of Nuclides. `npm run fetch-data`
(`scripts/data/fetch-nuclides.ts`) refreshes it. The retrieval date is stored in each JSON file under
`src/common/model/data/` and shown in the sim.

## IAEA Nuclear Data Section

Source: International Atomic Energy Agency, Nuclear Data Section, **Live Chart of Nuclides**,
https://www-nds.iaea.org/livechart/, retrieved through its data API (https://nds.iaea.org/relnsd/v1/data).

The IAEA's terms of use (https://nucleus.iaea.org/Pages/Others/Terms-Of-Use.aspx) allow its data to be
used, reproduced and disseminated, including for teaching, provided the IAEA is acknowledged as the source.
This sim is not endorsed by the IAEA.

The bundled files are:

- `nuclides.json`: every ground state, with binding energies, mass excesses, separation energies, Q values,
  half-lives, decay modes and branching ratios, spins and parities, natural abundances, charge radii, and
  electromagnetic moments.
- `isomers.json`: four named isomers (Pa-234m, Tc-99m, Ta-180m, Am-242m).
- `fissionYields.json`: independent and cumulative fission-product yields for U-235 and Pu-239 (thermal
  neutrons) and U-238 (fast neutrons).

The Live Chart compiles these evaluations, which should be cited when the numbers are used:

- Half-lives, decay modes and levels: the Evaluated Nuclear Structure Data File (ENSDF), maintained by the
  International Network of Nuclear Structure and Decay Data Evaluators, together with NUBASE2020:
  F. G. Kondev, M. Wang, W. J. Huang, S. Naimi and G. Audi, *Chinese Physics C* **45**, 030001 (2021).
- Atomic masses and the derived binding energies, separation energies and Q values: the Atomic Mass
  Evaluation AME2020: W. J. Huang, M. Wang, F. G. Kondev, G. Audi and S. Naimi, *Chinese Physics C* **45**,
  030002 (2021); M. Wang, W. J. Huang, F. G. Kondev, G. Audi and S. Naimi, *Chinese Physics C* **45**, 030003
  (2021).

Masses that AME2020 estimates from systematics, rather than measuring them, are flagged in the data and
marked in the sim.
