/**
 * fetch-nuclides.ts
 *
 * Takes the nuclide snapshot the simulation plots. Run it by hand (`npm run fetch-data`) when you want fresher
 * data; the sim never queries the API at runtime because the IAEA LiveChart API sends no CORS headers.
 *
 * Source: IAEA Nuclear Data Section, Live Chart of Nuclides API (https://www-nds.iaea.org/relnsd/vcharthtml/api_v0_guide.html),
 * which serves ENSDF/NUBASE half-lives and decay branches together with AME2020 masses.
 *
 * Outputs (src/common/model/data/)
 *   - nuclides.json: every ground state, column-oriented (one array per quantity, indexed together).
 *   - isomers.json: the few long-lived isomers the sim mentions by name (Pa-234m, Tc-99m, Ta-180m, Am-242m).
 *   - fissionYields.json: independent and cumulative fission-product yields for U-235 (thermal), Pu-239 (thermal)
 *     and U-238 (fast).
 *
 * Units are kept as the API gives them: energies (binding per nucleon, separation energies, Q values, mass
 * excess) in keV, half-lives in seconds, radii in fm, quadrupole moments in barn, dipole moments in nuclear
 * magnetons, abundances and branching ratios in percent, fission yields as fractions per fission.
 *
 * Optional response cache for development: set FETCH_CACHE_DIR to a directory and repeated runs reuse the
 * downloaded responses.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://nds.iaea.org/relnsd/v1/data";
const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/common/model/data");
const CACHE_DIR = process.env["FETCH_CACHE_DIR"];
const MAX_ATTEMPTS = 4;

/** The API refuses requests that carry no browser-like User-Agent. */
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; OpenLyceum NuclideChart data fetch)" };

/** Isomers the sim names explicitly, as [API nuclide id, label]. The longest-lived excited level is kept. */
const ISOMERS: readonly (readonly [string, string])[] = [
  ["234pa", "Pa-234m"],
  ["99tc", "Tc-99m"],
  ["180ta", "Ta-180m"],
  ["242am", "Am-242m"],
];

/** Fissioning systems, as [API parent id, label, neutron energy column prefix]. */
const FISSION_SYSTEMS: readonly (readonly [string, string, "thermal" | "fast"])[] = [
  ["235u", "U-235", "thermal"],
  ["239pu", "Pu-239", "thermal"],
  ["238u", "U-238", "fast"],
];

type Row = Record<string, string>;

async function fetchText(url: string): Promise<string> {
  const cacheFile = CACHE_DIR ? resolve(CACHE_DIR, `${createHash("sha256").update(url).digest("hex")}.csv`) : null;
  if (cacheFile && existsSync(cacheFile)) {
    return readFileSync(cacheFile, "latin1");
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(300_000) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      // The API declares ISO-8859-1.
      const text = new TextDecoder("latin1").decode(await response.arrayBuffer());
      if (text.trim().length === 0 || text.startsWith("<")) {
        throw new Error(`unexpected response for ${url}`);
      }
      if (cacheFile) {
        mkdirSync(dirname(cacheFile), { recursive: true });
        writeFileSync(cacheFile, text, "latin1");
      }
      return text;
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw error;
      }
      const waitSeconds = 15 * attempt;
      console.warn(`  retrying in ${waitSeconds} s (${String(error)})`);
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
    }
  }
}

/** RFC 4180 CSV parser (quoted fields may contain commas, quotes and newlines). */
function parseCsv(text: string): Row[] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") {
        i++;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [header, ...body] = records.filter((r) => r.length > 1 || (r[0] ?? "").length > 0);
  if (!header) {
    throw new Error("empty CSV");
  }
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

async function query(params: string): Promise<Row[]> {
  return parseCsv(await fetchText(`${API}?${params}`));
}

/** A number, or null when the field is blank or not numeric. */
function num(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
}

function roundSig(value: number | null, digits: number): number | null {
  return value === null || value === 0 ? value : Number(value.toPrecision(digits));
}

function roundDec(value: number | null, decimals: number): number | null {
  return value === null ? null : Number(value.toFixed(decimals));
}

/** API half-life units → display units; widths (eV, keV, MeV) stay as widths. */
const UNIT_LABELS: Record<string, string> = {
  Y: "y",
  d: "d",
  h: "h",
  m: "min",
  s: "s",
  ms: "ms",
  us: "µs",
  ns: "ns",
  ps: "ps",
  fs: "fs",
  as: "as",
  eV: "eV",
  keV: "keV",
  MeV: "MeV",
};

/** Half-life operators in the API (GT, LT, GE, LE, AP, ?) → display symbols. */
const OPERATOR_LABELS: Record<string, string> = { GT: ">", GE: "≥", LT: "<", LE: "≤", AP: "≈", "?": "?" };

function halfLifeText(row: Row): string {
  const value = row["half_life"] ?? "";
  if (value === "" || value === "STABLE") {
    return value === "STABLE" ? "stable" : "";
  }
  const unit = row["unit_hl"] ?? "";
  const op = OPERATOR_LABELS[row["operator_hl"] ?? ""] ?? "";
  const label = UNIT_LABELS[unit] ?? unit;
  const isWidth = unit.endsWith("eV");
  return `${isWidth ? "Γ " : ""}${op ? `${op} ` : ""}${value} ${label}`.trim();
}

/** Decay branches as "MODE:percent" joined by ";" (percent may be blank or carry an operator, e.g. "B-:?"). */
function decayModes(row: Row): string {
  const parts: string[] = [];
  for (const k of [1, 2, 3]) {
    const mode = row[`decay_${k}`] ?? "";
    if (mode !== "") {
      parts.push(`${mode}:${row[`decay_${k}_%`] ?? ""}`);
    }
  }
  return parts.join(";");
}

async function fetchGroundStates(): Promise<Record<string, unknown>> {
  console.log("Fetching ground states…");
  const rows = (await query("fields=ground_states&nuclides=all"))
    .filter((r) => num(r["z"]) !== null && num(r["n"]) !== null)
    .sort((a, b) => Number(a["z"]) - Number(b["z"]) || Number(a["n"]) - Number(b["n"]));

  const symbols: string[] = [];
  for (const r of rows) {
    symbols[Number(r["z"])] = r["symbol"] ?? "";
  }

  const column = (f: (r: Row) => unknown): unknown[] => rows.map(f);
  const extraction = rows.map((r) => r["Extraction_date"] ?? "").find((d) => d !== "") ?? "";
  console.log(`  ${rows.length} ground states (extraction date ${extraction})`);

  return {
    retrieved: new Date().toISOString().slice(0, 10),
    extractionDate: extraction,
    source:
      "IAEA Nuclear Data Section, Live Chart of Nuclides (ENSDF / NUBASE2020 half-lives and decay modes, AME2020 masses)",
    url: `${API}?fields=ground_states&nuclides=all`,
    units: {
      bindingPerNucleon: "keV",
      massExcess: "keV",
      separationEnergies: "keV",
      qValues: "keV",
      halfLife: "s",
      radius: "fm",
      quadrupole: "b",
      magneticDipole: "nuclear magnetons",
      abundance: "%",
    },
    notes: [
      "sys = 1 marks masses estimated from systematics (AME '#'), not measured.",
      "stable = 1 is the ENSDF 'STABLE' label; hl is null when stable or unknown.",
      "hlOp is the API half-life operator (GT, LT, GE, LE, AP, ?), blank for a measured value.",
      "modes lists up to three branches as MODE:percent separated by ';'.",
    ],
    count: rows.length,
    symbols,
    z: column((r) => Number(r["z"])),
    n: column((r) => Number(r["n"])),
    bA: column((r) => roundDec(num(r["binding"]), 4)),
    bAUnc: column((r) => roundSig(num(r["unc_ba"]), 3)),
    me: column((r) => roundDec(num(r["massexcess"]), 4)),
    meUnc: column((r) => roundSig(num(r["unc_me"]), 3)),
    sys: column((r) => (r["me_systematics"] === "Y" ? 1 : 0)),
    stable: column((r) => (r["half_life"] === "STABLE" ? 1 : 0)),
    hl: column((r) => (r["half_life"] === "STABLE" ? null : roundSig(num(r["half_life_sec"]), 6))),
    hlOp: column((r) => r["operator_hl"] ?? ""),
    hlText: column(halfLifeText),
    modes: column(decayModes),
    jp: column((r) => r["jp"] ?? ""),
    abund: column((r) => num(r["abundance"])),
    radius: column((r) => num(r["radius"])),
    quad: column((r) => num(r["electric_quadrupole"])),
    mu: column((r) => num(r["magnetic_dipole"])),
    sn: column((r) => roundDec(num(r["sn"]), 3)),
    sp: column((r) => roundDec(num(r["sp"]), 3)),
    qa: column((r) => roundDec(num(r["qa"]), 3)),
    qbm: column((r) => roundDec(num(r["qbm"]), 3)),
    qec: column((r) => roundDec(num(r["qec"]), 3)),
    qbmn: column((r) => roundDec(num(r["qbm_n"]), 3)),
    discovery: column((r) => num(r["discovery"])),
  };
}

async function fetchIsomers(): Promise<Record<string, unknown>> {
  console.log("Fetching isomer levels…");
  const isomers: Record<string, unknown>[] = [];
  for (const [id, label] of ISOMERS) {
    const levels = (await query(`fields=levels&nuclides=${id}`)).filter((r) => Number(r["idx"]) > 0);
    const best = levels
      .filter((r) => num(r["half_life_sec"]) !== null)
      .sort((a, b) => (num(b["half_life_sec"]) ?? 0) - (num(a["half_life_sec"]) ?? 0))[0];
    if (!best) {
      throw new Error(`no isomer found for ${id}`);
    }
    isomers.push({
      label,
      z: Number(best["z"]),
      n: Number(best["n"]),
      energy: num(best["energy"]),
      jp: best["jp"] ?? "",
      hl: roundSig(num(best["half_life_sec"]), 6),
      hlOp: best["operator_hl"] ?? "",
      hlText: halfLifeText(best),
      modes: decayModes(best),
    });
    console.log(`  ${label}: ${best["energy"]} keV, ${halfLifeText(best)}, ${decayModes(best) || "no decay observed"}`);
  }
  return {
    retrieved: new Date().toISOString().slice(0, 10),
    source: "IAEA Nuclear Data Section, Live Chart of Nuclides (ENSDF levels)",
    url: `${API}?fields=levels&nuclides=<id>`,
    units: { energy: "keV", halfLife: "s" },
    isomers,
  };
}

async function fetchFissionYields(): Promise<Record<string, unknown>> {
  console.log("Fetching fission yields…");
  const systems: Record<string, unknown>[] = [];
  for (const [id, label, energy] of FISSION_SYSTEMS) {
    const independent = await query(`fields=independent_fy&parents=${id}`);
    const cumulative = await query(`fields=cumulative_fy&parents=${id}`);
    type Entry = { z: number; a: number; lvl: number; ind: number | null; cum: number | null };
    const entries = new Map<string, Entry>();
    const entryFor = (r: Row): Entry => {
      const key = `${r["z_daughter"]}-${r["a_daughter"]}-${r["daughter_level_idx"]}`;
      let e = entries.get(key);
      if (!e) {
        e = {
          z: Number(r["z_daughter"]),
          a: Number(r["a_daughter"]),
          lvl: Number(r["daughter_level_idx"]),
          ind: null,
          cum: null,
        };
        entries.set(key, e);
      }
      return e;
    };
    for (const r of independent) {
      entryFor(r).ind = roundSig(num(r[`independent_${energy}_fy`]), 5);
    }
    for (const r of cumulative) {
      entryFor(r).cum = roundSig(num(r[`cumulative_${energy}_fy`]), 5);
    }
    const list = [...entries.values()]
      .filter((e) => (e.ind ?? 0) > 0 || (e.cum ?? 0) > 0)
      .sort((p, q) => p.a - q.a || p.z - q.z || p.lvl - q.lvl);
    const total = list.reduce((s, e) => s + (e.ind ?? 0), 0);
    console.log(`  ${label} (${energy}): ${list.length} products, Σ independent = ${total.toFixed(3)}`);
    systems.push({
      parent: label,
      neutronEnergy: energy,
      z: list.map((e) => e.z),
      a: list.map((e) => e.a),
      lvl: list.map((e) => e.lvl),
      ind: list.map((e) => e.ind),
      cum: list.map((e) => e.cum),
    });
  }
  return {
    retrieved: new Date().toISOString().slice(0, 10),
    source: "IAEA Nuclear Data Section, Live Chart of Nuclides (evaluated fission-product yields)",
    url: `${API}?fields=independent_fy|cumulative_fy&parents=<id>`,
    notes: [
      "Yields are fractions per fission; light-charged-particle (ternary) yields are included at A ≤ 4.",
      "lvl is the daughter level index (0 = ground state, 1+ = isomer).",
    ],
    systems,
  };
}

/** Writes JSON with each top-level array on one line, so diffs between snapshots stay readable. */
function write(file: string, data: Record<string, unknown>): void {
  const lines = Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value) && value.every((v) => typeof v !== "object" || v === null)) {
      return `${JSON.stringify(key)}:${JSON.stringify(value)}`;
    }
    if (Array.isArray(value)) {
      return `${JSON.stringify(key)}:[\n${value.map((v) => JSON.stringify(v)).join(",\n")}\n]`;
    }
    return `${JSON.stringify(key)}:${JSON.stringify(value)}`;
  });
  writeFileSync(resolve(DATA_DIR, file), `{\n${lines.join(",\n")}\n}\n`);
  console.log(`wrote ${file}`);
}

async function main(): Promise<void> {
  mkdirSync(DATA_DIR, { recursive: true });
  write("nuclides.json", await fetchGroundStates());
  write("isomers.json", await fetchIsomers());
  write("fissionYields.json", await fetchFissionYields());
}

await main();
