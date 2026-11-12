import { enableAssert } from "scenerystack/assert";
import { describe, expect, it } from "vitest";
import { NUCLIDE_TABLE } from "../../src/common/model/NuclideTable.js";
import { SharedModel } from "../../src/common/model/SharedModel.js";
import { IsobarsModel, MASS_NUMBER_RANGE } from "../../src/isobars/model/IsobarsModel.js";

enableAssert();

describe("Isobars shared selection", () => {
  it("accepts every snapshot nuclide and preserves the selected isotope", () => {
    const shared = new SharedModel();
    const model = new IsobarsModel(shared);
    for (const nuclide of NUCLIDE_TABLE.nuclides) {
      expect(MASS_NUMBER_RANGE.contains(nuclide.a)).toBe(true);
      shared.selectedNuclideProperty.value = nuclide;
      expect(model.massNumberProperty.value).toBe(nuclide.a);
      expect(shared.selectedNuclideProperty.value).toBe(nuclide);
    }
    model.reset();
    expect(shared.selectedNuclideProperty.value.label).toBe("Fe-56");
    expect(model.massNumberProperty.value).toBe(56);
  });

  it("selects a matching isobar when A changes across the whole slider range", () => {
    const shared = new SharedModel();
    const model = new IsobarsModel(shared);
    for (let a = MASS_NUMBER_RANGE.min; a <= MASS_NUMBER_RANGE.max; a++) {
      model.massNumberProperty.value = a;
      expect(shared.selectedNuclideProperty.value.a).toBe(a);
      expect(model.analysisProperty.value.a).toBe(a);
    }
  });
});
