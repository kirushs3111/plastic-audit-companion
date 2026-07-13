/**
 * Shared plastic taxonomy types.
 *
 * These map to the 7 official resin identification codes and are consumed
 * by the Learn module, the Household Audit flow, and the Admin dashboard.
 * Keeping the type in one place avoids each module re-declaring its own
 * shape for "a plastic type".
 */

export type PlasticCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PlasticTypeSummary {
  /** Official resin identification code, 1-7 */
  code: PlasticCode;
  /** Short abbreviation shown in badges and tables, e.g. "PET" */
  abbreviation: string;
  /** Full chemical name, e.g. "Polyethylene Terephthalate" */
  fullName: string;
  /** Tailwind text color utility used for this type's accent */
  colorClass: string;
  /** Tailwind background color utility used for this type's card/badge */
  bgClass: string;
  /** One-line description of where this plastic shows up around the house */
  commonUses: string;
  /** A single kid-friendly fact used on Learn cards */
  funFact: string;
}
