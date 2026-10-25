/**
 * Medicine dataset. EMPTY by design: no entry may be added without a source URL and review date for each
 * statement. Candidate authoritative sources to evaluate: CDSCO, India's National Formulary, WHO Model
 * Formulary, MedlinePlus. Do not copy text without checking each source's reuse terms.
 */
export type Medicine = {
  generic: string;
  brands?: string[];
  purpose: string;
  commonUses: string[];
  warnings: string[];
  commonSideEffects: string[];
  interactions: string[];
  storage?: string;
  sources: { label: string; url: string }[];
  reviewed: string;
};

export const MEDICINES: Medicine[] = [];
