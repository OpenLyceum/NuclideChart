/**
 * NuclideTable.ts
 *
 * The bundled IAEA ground-state snapshot (written by scripts/data/fetch-nuclides.ts), decoded once into Nuclide
 * records and indexed by (Z, N). Everything else in the model reads nuclides from here.
 *
 * Units follow the snapshot: energies in keV, half-lives in seconds.
 */

import isomersJson from "./data/isomers.json";
import nuclidesJson from "./data/nuclides.json";
import { EFFECTIVELY_STABLE_HALF_LIFE_S } from "./NuclearConstants.js";

/** One decay branch as ENSDF lists it. */
export type DecayBranch = {
  /** ENSDF mode code: A, B-, B+, EC, EC+B+, B-N, IT, SF, P, N, 2B-, … */
  readonly mode: string;
  /** Branching ratio (%), or null when ENSDF gives none ("?" or blank). */
  readonly percent: number | null;
};

/** How "stable" is defined for counting and colouring. */
export type StabilityDefinition = "ensdf" | "effective";

export type Nuclide = {
  readonly index: number;
  readonly z: number;
  readonly n: number;
  readonly a: number;
  readonly symbol: string;
  /** Mass-number label, e.g. "Fe-56". */
  readonly label: string;
  /** Binding energy per nucleon (keV), or null. */
  readonly bindingPerNucleon: number | null;
  /** Total binding energy (keV), or null. */
  readonly binding: number | null;
  /** Atomic mass excess (keV), or null. */
  readonly massExcess: number | null;
  readonly massExcessUncertainty: number | null;
  /** True when the mass is estimated from systematics (AME "#"), not measured. */
  readonly isSystematic: boolean;
  /** ENSDF "STABLE": no decay has ever been observed. */
  readonly isStable: boolean;
  /** Half-life (s); null when stable or unknown. */
  readonly halfLife: number | null;
  /** ENSDF half-life operator: "" for a value, otherwise GT, LT, GE, LE, AP or "?". */
  readonly halfLifeOperator: string;
  /** Half-life as ENSDF states it, for display ("30.08 y", "Γ 5.57 eV", "stable"). */
  readonly halfLifeText: string;
  readonly branches: readonly DecayBranch[];
  /** Spin and parity, verbatim (parentheses mark tentative assignments). */
  readonly spinParity: string;
  /** Natural isotopic abundance (%), or null. */
  readonly abundance: number | null;
  /** RMS charge radius (fm), or null. */
  readonly radius: number | null;
  /** Spectroscopic electric quadrupole moment (b), or null. */
  readonly quadrupole: number | null;
  /** Magnetic dipole moment (μN), or null. */
  readonly magneticDipole: number | null;
  /** One-neutron and one-proton separation energies (keV), or null. */
  readonly sn: number | null;
  readonly sp: number | null;
  /** Q values the API tabulates (keV), kept to check the model's own Q values against. */
  readonly tabulatedQAlpha: number | null;
  readonly tabulatedQBetaMinus: number | null;
  readonly tabulatedQEC: number | null;
  /** Year of discovery, or null. */
  readonly discoveryYear: number | null;
};

export type Isomer = {
  readonly label: string;
  readonly z: number;
  readonly n: number;
  /** Excitation energy (keV). */
  readonly energy: number;
  readonly spinParity: string;
  readonly halfLife: number | null;
  readonly halfLifeOperator: string;
  readonly halfLifeText: string;
  readonly branches: readonly DecayBranch[];
};

type NuclidesJson = {
  readonly retrieved: string;
  readonly extractionDate: string;
  readonly source: string;
  readonly count: number;
  readonly symbols: readonly (string | null)[];
  readonly [column: string]: unknown;
};

function parseBranches(text: string): DecayBranch[] {
  if (text === "") {
    return [];
  }
  return text.split(";").map((part) => {
    const colon = part.lastIndexOf(":");
    const mode = part.slice(0, colon);
    const value = Number(part.slice(colon + 1));
    return { mode, percent: part.slice(colon + 1) !== "" && Number.isFinite(value) ? value : null };
  });
}

export class NuclideTable {
  public readonly nuclides: readonly Nuclide[];
  public readonly retrieved: string;
  public readonly extractionDate: string;
  public readonly source: string;
  public readonly maxZ: number;
  public readonly maxN: number;
  public readonly maxA: number;

  private readonly symbols: readonly string[];
  private readonly byKey = new Map<number, Nuclide>();
  private readonly byMassNumber = new Map<number, Nuclide[]>();
  private readonly byProtonNumber = new Map<number, Nuclide[]>();

  public constructor(json: NuclidesJson) {
    const column = <T>(name: string): readonly T[] => {
      const values = json[name];
      if (!Array.isArray(values) || values.length !== json.count) {
        throw new Error(`nuclides.json: column ${name} is missing or has the wrong length`);
      }
      return values as T[];
    };
    const z = column<number>("z");
    const n = column<number>("n");
    const bA = column<number | null>("bA");
    const me = column<number | null>("me");
    const meUnc = column<number | null>("meUnc");
    const sys = column<number>("sys");
    const stable = column<number>("stable");
    const hl = column<number | null>("hl");
    const hlOp = column<string>("hlOp");
    const hlText = column<string>("hlText");
    const modes = column<string>("modes");
    const jp = column<string>("jp");
    const abund = column<number | null>("abund");
    const radius = column<number | null>("radius");
    const quad = column<number | null>("quad");
    const mu = column<number | null>("mu");
    const sn = column<number | null>("sn");
    const sp = column<number | null>("sp");
    const qa = column<number | null>("qa");
    const qbm = column<number | null>("qbm");
    const qec = column<number | null>("qec");
    const discovery = column<number | null>("discovery");

    this.retrieved = json.retrieved;
    this.extractionDate = json.extractionDate;
    this.source = json.source;
    this.symbols = json.symbols.map((s) => s ?? "");

    const nuclides: Nuclide[] = [];
    for (let i = 0; i < json.count; i++) {
      const zi = z[i] ?? 0;
      const ni = n[i] ?? 0;
      const a = zi + ni;
      const symbol = this.symbols[zi] ?? "";
      const bindingPerNucleon = bA[i] ?? null;
      const nuclide: Nuclide = {
        index: i,
        z: zi,
        n: ni,
        a,
        symbol,
        label: `${symbol}-${a}`,
        bindingPerNucleon,
        binding: bindingPerNucleon === null ? null : bindingPerNucleon * a,
        massExcess: me[i] ?? null,
        massExcessUncertainty: meUnc[i] ?? null,
        isSystematic: sys[i] === 1,
        isStable: stable[i] === 1,
        halfLife: hl[i] ?? null,
        halfLifeOperator: hlOp[i] ?? "",
        halfLifeText: hlText[i] ?? "",
        branches: parseBranches(modes[i] ?? ""),
        spinParity: jp[i] ?? "",
        abundance: abund[i] ?? null,
        radius: radius[i] ?? null,
        quadrupole: quad[i] ?? null,
        magneticDipole: mu[i] ?? null,
        sn: sn[i] ?? null,
        sp: sp[i] ?? null,
        tabulatedQAlpha: qa[i] ?? null,
        tabulatedQBetaMinus: qbm[i] ?? null,
        tabulatedQEC: qec[i] ?? null,
        discoveryYear: discovery[i] ?? null,
      };
      nuclides.push(nuclide);
      this.byKey.set(NuclideTable.key(zi, ni), nuclide);
      pushTo(this.byMassNumber, a, nuclide);
      pushTo(this.byProtonNumber, zi, nuclide);
    }
    this.nuclides = nuclides;
    this.maxZ = Math.max(...nuclides.map((x) => x.z));
    this.maxN = Math.max(...nuclides.map((x) => x.n));
    this.maxA = Math.max(...nuclides.map((x) => x.a));
  }

  private static key(z: number, n: number): number {
    return z * 1000 + n;
  }

  /** The ground state with Z protons and N neutrons, or null when it is not in the table. */
  public get(z: number, n: number): Nuclide | null {
    return this.byKey.get(NuclideTable.key(z, n)) ?? null;
  }

  /** The nuclide with this element symbol and mass number ("Fe", 56), or null. */
  public find(symbol: string, a: number): Nuclide | null {
    const z = this.symbols.indexOf(symbol);
    return z < 0 ? null : this.get(z, a - z);
  }

  /** Looks a nuclide up by its label ("Fe-56"); throws when it does not exist. */
  public require(label: string): Nuclide {
    const dash = label.lastIndexOf("-");
    const nuclide = this.find(label.slice(0, dash), Number(label.slice(dash + 1)));
    if (!nuclide) {
      throw new Error(`no nuclide ${label}`);
    }
    return nuclide;
  }

  /** All nuclides with mass number A, in order of increasing Z. */
  public isobars(a: number): readonly Nuclide[] {
    return this.byMassNumber.get(a) ?? [];
  }

  /** All nuclides of element Z, in order of increasing N. */
  public isotopes(z: number): readonly Nuclide[] {
    return this.byProtonNumber.get(z) ?? [];
  }

  public symbol(z: number): string {
    return this.symbols[z] ?? "";
  }
}

function pushTo<T>(map: Map<number, T[]>, key: number, value: T): void {
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

/** True when the nuclide counts as stable under the chosen definition. */
export function isStableUnder(nuclide: Nuclide, definition: StabilityDefinition): boolean {
  if (nuclide.isStable) {
    return true;
  }
  return (
    definition === "effective" &&
    nuclide.halfLife !== null &&
    nuclide.halfLife > EFFECTIVELY_STABLE_HALF_LIFE_S &&
    nuclide.halfLifeOperator !== "LT" &&
    nuclide.halfLifeOperator !== "LE"
  );
}

/** The branching fraction (0–1) of the first branch with one of these modes, or 0. */
export function branchFraction(nuclide: Nuclide, ...modes: string[]): number {
  for (const branch of nuclide.branches) {
    if (modes.includes(branch.mode)) {
      return (branch.percent ?? 0) / 100;
    }
  }
  return 0;
}

/** True when ENSDF lists any of these modes for the nuclide. */
export function hasMode(nuclide: Nuclide, ...modes: string[]): boolean {
  return nuclide.branches.some((branch) => modes.includes(branch.mode));
}

/** The singleton table every screen shares. */
export const NUCLIDE_TABLE = new NuclideTable(nuclidesJson as unknown as NuclidesJson);

type IsomerRow = {
  label: string;
  z: number;
  n: number;
  energy: number;
  jp: string;
  hl: number | null;
  hlOp: string;
  hlText: string;
  modes: string;
};

/** The named long-lived isomers (Pa-234m, Tc-99m, Ta-180m, Am-242m). */
export const ISOMERS: readonly Isomer[] = (isomersJson.isomers as IsomerRow[]).map((row) => ({
  label: row.label,
  z: row.z,
  n: row.n,
  energy: row.energy,
  spinParity: row.jp,
  halfLife: row.hl,
  halfLifeOperator: row.hlOp,
  halfLifeText: row.hlText,
  branches: parseBranches(row.modes),
}));

export function requireIsomer(label: string): Isomer {
  const isomer = ISOMERS.find((i) => i.label === label);
  if (!isomer) {
    throw new Error(`no isomer ${label}`);
  }
  return isomer;
}
