export type ParsedResult = {
  line: string;
  test: string;
  value: number | null;
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  flag: "below-range" | "above-range" | "within-range" | "cannot-interpret";
  reason?: string;
};

const NUM = String.raw`-?\d+(?:\.\d+)?`;
const LINE = new RegExp(
  String.raw`^\s*([A-Za-z][A-Za-z0-9 ()%/.\-]*?)\s*[:\-]?\s+(${NUM})\s*([A-Za-z%µ/^0-9.*]*)?\s*(?:\(|\[|ref(?:erence)?(?:\s*range)?:?\s*)?\s*(?:(${NUM})\s*(?:-|–|to)\s*(${NUM}))?\s*[)\]]?.*$`,
  "i",
);

/**
 * Deterministic comparison of a value against the range PRINTED ON THE SAME LINE of the user's report.
 * It never supplies its own range and never interprets clinical meaning.
 */
export function parseReport(text: string): ParsedResult[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 200)
    .map((line): ParsedResult => {
      const m = LINE.exec(line);
      if (!m) return { line, test: line.slice(0, 60), value: null, unit: "", rangeLow: null, rangeHigh: null, flag: "cannot-interpret", reason: "Could not find a test name and number on this line." };
      const value = Number(m[2]);
      const lo = m[4] !== undefined ? Number(m[4]) : null;
      const hi = m[5] !== undefined ? Number(m[5]) : null;
      const base = { line, test: m[1].trim(), value, unit: m[3] ?? "", rangeLow: lo, rangeHigh: hi };
      if (lo === null || hi === null || lo > hi)
        return { ...base, flag: "cannot-interpret", reason: "No usable reference range was printed on this line, so Swasth Setu cannot say whether the value is in range. Reference ranges differ between laboratories." };
      return { ...base, flag: value < lo ? "below-range" : value > hi ? "above-range" : "within-range" };
    });
}

export const SAMPLE_REPORT = `Haemoglobin 11.2 g/dL (12.0 - 15.5)
Fasting glucose 92 mg/dL (70 - 99)
Total cholesterol 215 mg/dL (0 - 200)
Vitamin D 30 ng/mL`;
