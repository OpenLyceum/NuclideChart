# Nuclide Chart — model

What the sim computes and from which data. All data come from the IAEA Live Chart of Nuclides snapshot in
`src/common/model/data/` (see `CREDITS.md`). Energies are in keV in the data and in MeV on screen.

## Data

| Quantity | Column | Notes |
|---|---|---|
| Binding energy per nucleon B/A | `binding` | keV; total B = A · B/A |
| Atomic mass excess Δ | `massexcess` | keV, AME2020; `me_systematics = Y` marks an estimate (808 nuclides) |
| Half-life | `half_life_sec` | s; null when stable or unknown; `operator_hl` marks limits, which are not plotted as values |
| Decay branches | `decay_1..3`, `%` | ENSDF codes (A, B-, EC+B+, B-N, IT, SF, …); delayed-particle modes are part of their parent β branch |
| Sₙ, Sₚ | `sn`, `sp` | keV |
| Spin and parity, abundance, radius, moments | `jp`, `abundance`, `radius`, `electric_quadrupole`, `magnetic_dipole` | as given |
| Isomers | `levels` | Pa-234m, Tc-99m, Ta-180m, Am-242m only |
| Fission yields | `independent_fy`, `cumulative_fy` | per fission; U-235 and Pu-239 thermal, U-238 fast; sum of independent yields ≈ 2 |

**Stability.** ENSDF "STABLE" gives 244 nuclides (140 even–even, 52 even-Z/odd-N, 48 odd-Z/even-N, 4 odd–odd).
Adding everything with t½ > 10¹⁵ y gives 271 (161, 55, 50, 5). Ta-180m, the only odd–odd isomer found in nature,
is an excited state and not counted.

## Mass formula (Binding Energy, Chart residual colouring, valley line)

    B(Z, A) = a_V A − a_S A^(2/3) − a_C Z(Z−1)/A^(1/3) − a_A (A−2Z)²/A + δ,
    δ = +a_P A^(−3/4) (even–even), 0 (odd A), −a_P A^(−3/4) (odd–odd)

- **Krane's coefficients (the textbook's):** a_V = 15.5, a_S = 16.8, a_C = 0.72, a_A = 23, a_P = 34 MeV.
- **The least-squares fit** to the 2,484 measured masses with A ≥ 16 gives 15.41, 16.86, 0.695, 22.50 and
  32.2 MeV, with an RMS residual of 3.32 MeV (Krane's set: 9.2 MeV). B is linear in the coefficients, so the
  fit solves the 5 × 5 normal equations exactly.
- **The valley of stability:** Z_valley(A) = (4a_A + a_C A^(−1/3)) / (8a_A/A + 2a_C A^(−1/3)), which gives
  91.6 at A = 238.
- **The residual** B_measured − B_formula peaks at N, Z = 28, 50, 82 and 126. These peaks are the shell
  closures.

## Q values (Chart Q-value dialog)

From atomic mass excesses (the electrons are already included):

    Q_α = Δ(Z, N) − Δ(Z−2, N−2) − Δ(⁴He)       Q_β⁻ = Δ(Z, N) − Δ(Z+1, N−1)
    Q_EC = Δ(Z, N) − Δ(Z−1, N+1)               Q_β⁺ = Q_EC − 2mₑc²
    Q_ββ = Δ(Z, N) − Δ(Z+2, N−2)               Q_p = −S_p,  Q_n = −S_n

The sim's Q values agree with the API's tabulated `qa`, `qbm` and `qec` to within 1.1 keV for every nuclide.
Each channel is labelled with one of three verdicts:
- *allowed, observed*: Q > 0 and ENSDF lists the mode.
- *allowed, not observed*: Q > 0 but the decay is too slow (tunnelling, spin-forbidden β, or a faster
  competing mode). Example: double-β decay of U-238.
- *forbidden*: Q ≤ 0.

## Separation energies (Shells)

    S_n = B(Z, N) − B(Z, N−1)    S₂ₙ = B(Z, N) − B(Z, N−2)    (and the proton analogues)

S₂ₙ cancels the pairing zig-zag. The drops just past the magic numbers are:

| From → to | Drop (MeV) |
|---|---|
| Ca-48 → Ca-50 | 5.7 |
| Sn-132 → Sn-134 | 6.5 |
| Pb-208 → Pb-210 | 5.0 |

A nuclide is particle-bound when S_n, S_p, S₂ₙ and S₂ₚ are all positive. O-26 has S_n > 0 but S₂ₙ < 0, so it
is not bound.

## Isobars

- **Parabolas.** For each A, Δ(Z) of the measured isobars within 5 charge units of Z_valley is fitted with a
  parabola: one for odd A, and separate ones for even–even and odd–odd for even A.
- **Allowed steps.** Single-β steps are allowed when the neighbour is lighter. An isobar with both
  neighbours heavier is β-stable, and gets a double-β arrow when the isobar two steps away is lighter.
- **Results.**
  - Ge-76 → Se-76 has Q = 2.039 MeV.
  - Te-130 and Xe-136 decay only by double β.
  - No A from 1 to 260 has two neighbouring β-stable isobars (Mattauch's rule, mass-based).

## Half-life systematics

- **Geiger–Nuttall.** The partial α half-life is t½ / (α fraction), for even–even emitters with a measured
  half-life and measured masses. log₁₀ t½ is fitted against Q_α^(−1/2) for each element.
  - R² > 0.99 for Po through Cf.
  - Po-212 (Q 8.954 MeV) and Th-232 (Q 4.082 MeV) differ by 24.2 orders of magnitude.
- **Sargent.** Fitting log t½(β⁻) against log Q_β⁻ over 965 emitters gives a slope of −5.6. The guide value
  is about −5 for allowed decays; forbidden decays sit far above the line.
- **Age of the Earth.** 4.54 × 10⁹ y (Dalrymple 2001). 25 radioactive ground states have longer half-lives.

## Decay chains

- **Tracing.** Every branch ≥ 0.01 % is followed. Delayed-particle percentages are subtracted from their
  parent β branch, and the remaining fractions are renormalized.
- **The four series** come out with A mod 4 = 0 (Th-232), 1 (Np-237), 2 (U-238) and 3 (U-235).
  - Th-234 β⁻ feeds Pa-234m (1.16 min). Its 0.16 % IT branch reaches Pa-234.
  - Bi-212 splits 64.06 % β⁻ and 35.94 % α.
  - Bi-214 sends 0.021 % by α to Tl-210.
  - The Np-237 series runs through Bi-209 (α, 2 × 10¹⁹ y) to Tl-205.

**Bateman.** For a branching chain dN_i/dt = −λ_i N_i + Σ_p f_pi λ_p N_p, every N_i(t) = Σ_j c_ij e^(−λ_j t) with

    c_ij = Σ_p f_pi λ_p c_pj / (λ_i − λ_j)  (j ≠ i),     c_ii = N_i(0) − Σ_(j≠i) c_ij.

The coefficients are computed once, so any time is evaluated directly however stiff the chain is (λ spans
about 10²¹ in the U-238 series).
- **Degenerate λ.** A λ equal to an ancestor's is nudged by one part in 10⁶ for the coefficient.
- **Rounding.** The cancellation error is about 10⁻¹⁶ of the parent amount, below the plot's 10⁻⁶ floor.
- **Tests.** The two-member closed form, atom conservation to 10⁻⁹ at all times, and secular equilibrium of
  every U-238 daughter to within 1 % after 10 Myr.

**Dating clock.** age = ln(1 + N_end/N_parent)/λ_parent. This is exact once the intermediates are in
equilibrium; at 1 Gy it reads 1.00 Gy.

## Energy release

- **Fission.** U-235 + n → light + heavy + 2n, with each fragment taken at the end of its β⁻ chain (the
  most bound isobar), so Q includes the fragments' β decays.
  - For A = 95 + 139 (Mo-95 + La-139), Q = 207.8 MeV.
  - The curve estimate is (fragment B/A − U-235 B/A) × 235 = 0.897 MeV × 235 ≈ 211 MeV.
- **Fusion.** Q = Σ Δ(reactants) − Σ Δ(products):

| Reaction | Q (MeV) |
|---|---|
| D–T | 17.59 |
| pp chain, net (including annihilation) | 26.73 |
| Triple α | 7.275 |
| Fe-56 + α → Ni-60 | 6.3 |

  The last shows that fusing past iron can still release energy.

## Things students can find

- **"Iron is the most tightly bound."** Ni-62 (8.7946 MeV) > Fe-58 > Fe-56, on the Binding Energy peak
  zoom.
- **"Heavier means less stable."** Te-128 (7.7 × 10²⁴ y) and Bi-209 sit far above lighter radioactive
  nuclides.
- **"After two half-lives it's all gone."** The Decay Chains activity plot shows that half-lives span
  10⁻²¹ s to 10²⁴ y.
- **"Radioactive means man-made."** The half-life filter at the age of the Earth leaves K-40, Rb-87, U-235,
  U-238, Th-232 and others.
- **"Magic numbers are a theory thing."** The residual colouring and the S₂ₙ cliffs show them in the
  measured masses.
