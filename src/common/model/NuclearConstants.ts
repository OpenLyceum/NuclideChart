/**
 * NuclearConstants.ts
 *
 * Physical constants and reference values the nuclear model uses. Energies are in keV (the unit of the IAEA
 * snapshot) unless a name says MeV; times are in seconds.
 */

/** Electron rest energy (keV), CODATA 2018. */
export const ELECTRON_REST_ENERGY_KEV = 510.99895;

/** Seconds per year (Julian year), the unit ENSDF uses for "Y". */
export const SECONDS_PER_YEAR = 365.25 * 86400;

/** Age of the Earth (s): 4.54 ± 0.05 Gy (Dalrymple 2001). */
export const AGE_OF_EARTH_S = 4.54e9 * SECONDS_PER_YEAR;

/** Half-life above which a nuclide counts as "effectively stable" in the second stability definition (s). */
export const EFFECTIVELY_STABLE_HALF_LIFE_S = 1e15 * SECONDS_PER_YEAR;

/** The nuclear magic numbers, for protons and neutrons alike. */
export const MAGIC_NUMBERS: readonly number[] = [2, 8, 20, 28, 50, 82, 126];

/**
 * Branches weaker than this fraction of decays (0.01 %) are ignored when decay chains are traced. It keeps
 * Bi-214's 0.021 % α branch to Tl-210 and drops the parts-per-million branches (Bi-210 α, Pb-210 α).
 */
export const CHAIN_BRANCH_THRESHOLD = 1e-4;

/** ln 2, for λ = ln 2 / t½. */
export const LN2 = Math.LN2;
