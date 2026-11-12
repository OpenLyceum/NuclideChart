import { describe, expect, it } from "vitest";
import { formatDuration, formatValue } from "../../src/common/view/format.js";

describe("format", () => {
  it("never writes a mantissa of 10", () => {
    expect(formatValue(999_999_999.99, 3)).toBe("1 × 10⁹");
    expect(formatValue(4.468e9, 3)).toBe("4.5 × 10⁹");
    expect(formatValue(123.456, 3)).toBe("123");
  });

  it("picks the largest readable time unit", () => {
    expect(formatDuration(3600 * 6.01)).toBe("6.01 h");
    expect(formatDuration(2.943e-7)).toBe("294 ns");
    expect(formatDuration(1e9 * 365.25 * 86400)).toBe("1 × 10⁹ y");
  });
});
