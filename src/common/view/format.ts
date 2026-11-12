/**
 * format.ts
 *
 * Number formatting for readouts and tick labels (adapted from ExoplanetsDatabase): significant figures
 * with a true minus sign, grouped integers, powers of ten, and half-lives in the most readable unit.
 */

import { toFixed } from "scenerystack/dot";

/** Narrow no-break space, the SI thousands separator, which reads the same in every locale. */
const GROUP_SEPARATOR = " ";

/** An integer with grouped thousands: 6 464. */
export const formatCount = (value: number): string =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);

/** Superscript digits for plain-text exponents. */
const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
};

export const superscript = (exponent: number): string =>
  String(exponent)
    .split("")
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join("");

/**
 * A value to `digits` significant figures in plain text: decimals between 10⁻³ and 10⁶, otherwise
 * m × 10ⁿ with Unicode superscripts (so it fits in a plain Text node).
 */
export const formatValue = (value: number, digits = 3): string => {
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) {
    return "0";
  }
  const magnitude = Math.abs(value);
  if (magnitude < 1e-3 || magnitude >= 1e6) {
    // Round first, so 9.99… × 10⁸ becomes 1.0 × 10⁹ rather than 10 × 10⁸.
    const rounded = Math.abs(Number(value.toPrecision(Math.max(1, digits - 1))));
    const exponent = Math.floor(Math.log10(rounded));
    const mantissa = Number((value / 10 ** exponent).toPrecision(Math.max(1, digits - 1)));
    return `${String(mantissa).replace("-", "−")} × 10${superscript(exponent)}`;
  }
  // toPrecision keeps the significant figures; Number() drops trailing zeros.
  const rounded = Number(value.toPrecision(digits));
  return (magnitude >= 10 ** digits ? toFixed(rounded, 0) : String(rounded)).replace("-", "−");
};

/** A whole number (year, count) without grouping. */
export const formatInteger = (value: number): string => (Number.isFinite(value) ? String(Math.round(value)) : "—");

/** A decade tick label: 0.01, 0.1, 1, 10, 100, 1000, then 10⁴, 10⁵, … */
export const formatDecade = (exponent: number): string => {
  const n = Math.round(exponent);
  if (n >= -2 && n <= 3) {
    return String(Number((10 ** n).toPrecision(1)));
  }
  return `10${superscript(n)}`;
};

/** A percentage to one decimal place: 74.2. */
export const formatPercent = (fraction: number): string =>
  Number.isFinite(fraction) ? toFixed(100 * fraction, 1) : "—";

/** A value with a fixed number of decimals and a true minus sign. */
export const formatFixed = (value: number, decimals: number): string =>
  Number.isFinite(value) ? toFixed(value, decimals).replace("-", "−") : "—";

/** A signed value with a fixed number of decimals: +1.25, −0.30. */
export const formatSigned = (value: number, decimals: number): string =>
  Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${formatFixed(value, decimals)}` : "—";

/** Time units for half-lives, longest first: [seconds per unit, symbol]. */
const TIME_UNITS: readonly (readonly [number, string])[] = [
  [365.25 * 86400, "y"],
  [86400, "d"],
  [3600, "h"],
  [60, "min"],
  [1, "s"],
  [1e-3, "ms"],
  [1e-6, "µs"],
  [1e-9, "ns"],
  [1e-12, "ps"],
  [1e-15, "fs"],
  [1e-18, "as"],
  [1e-21, "zs"],
];

/** A duration in seconds in the largest unit that keeps the number ≥ 1: "4.47 × 10⁹ y", "6.01 h", "294 ns". */
export const formatDuration = (seconds: number, digits = 3): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "—";
  }
  for (const [unit, symbol] of TIME_UNITS) {
    if (seconds >= unit) {
      return `${formatValue(seconds / unit, digits)} ${symbol}`;
    }
  }
  const [unit, symbol] = TIME_UNITS[TIME_UNITS.length - 1] as readonly [number, string];
  return `${formatValue(seconds / unit, digits)} ${symbol}`;
};
