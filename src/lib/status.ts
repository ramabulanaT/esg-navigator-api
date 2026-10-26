/**
 * Honest status layer — BOB-BRIEF-021, Step 2.
 *
 * Replaces the `rows[0]?.verification_status` pattern, which reported one
 * arbitrary row's status as the whole entity's. For any entity with mixed
 * rows that misstated assurance — and in the EXX case it could overstate it.
 *
 * Two orthogonal axes (ADR-005):
 *   capture_verification — did we check the figure against its source?
 *   source_assurance     — what assurance did the source itself carry?
 *
 * The entity-level value is always the WEAKEST present, never the first row.
 */

export type CaptureVerification = 'Inferred' | 'Pending' | 'Verified';
export type SourceAssurance =
  | 'Unknown'
  | 'Disclosed (Unassured)'
  | 'Limited Assurance'
  | 'Reasonable Assurance';

/** Weakest → strongest. Index order is the comparison order. */
const CAPTURE_ORDER: CaptureVerification[] = ['Inferred', 'Pending', 'Verified'];
const ASSURANCE_ORDER: SourceAssurance[] = [
  'Unknown',
  'Disclosed (Unassured)',
  'Limited Assurance',
  'Reasonable Assurance',
];

/**
 * ADR-005 trust level, derived from source assurance.
 * Confirmed by Dr. Terry, 25 Sep 2026: Reasonable = A (all reasonable
 * assurance, regardless of provider), Limited = C. B is unused by this map.
 * Must stay in step with migration 007 and the capture-check generator.
 */
const TRUST_LEVEL: Record<SourceAssurance, string> = {
  'Reasonable Assurance': 'A',
  'Limited Assurance': 'C',
  'Disclosed (Unassured)': 'D',
  Unknown: 'E',
};

function weakest<T extends string>(order: T[], values: (string | null | undefined)[], fallback: T): T {
  let idx = order.length; // nothing seen yet
  for (const v of values) {
    // An unrecognised or missing value is treated as the weakest possible
    // reading, never silently ignored.
    const i = v == null ? 0 : order.indexOf(v as T);
    const rank = i === -1 ? 0 : i;
    if (rank < idx) idx = rank;
  }
  return idx === order.length ? fallback : order[idx];
}

/** Counts of each distinct value, e.g. {"Verified":32,"Pending":6}. */
export function summarise(values: (string | null | undefined)[], nullLabel = 'Unknown'): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) {
    const key = v == null || v === '' ? nullLabel : v;
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

export interface StatusBlock {
  capture_verification_summary: Record<string, number>;
  source_assurance_summary: Record<string, number>;
  entity_capture_status: CaptureVerification;
  entity_source_assurance: SourceAssurance;
  entity_source_trust_level: string;
  /** @deprecated legacy field, mirrors entity_capture_status */
  verification_status: CaptureVerification;
}

/**
 * Build the entity-level status block from the rows backing a response.
 * Never reads a single row: every row contributes.
 */
export function buildStatus(
  rows: Array<{ capture_verification?: string | null; source_assurance?: string | null }>
): StatusBlock {
  const captures = rows.map((r) => r.capture_verification);
  const assurances = rows.map((r) => r.source_assurance);

  const entity_capture_status = weakest<CaptureVerification>(CAPTURE_ORDER, captures, 'Pending');
  const entity_source_assurance = weakest<SourceAssurance>(ASSURANCE_ORDER, assurances, 'Unknown');

  return {
    // NULL/absent is surfaced as 'Unknown' in the summary rather than folded
    // into 'Pending', so it stays visible. It is still ranked weakest above.
    capture_verification_summary: summarise(captures, 'Unknown'),
    source_assurance_summary: summarise(assurances, 'Unknown'),
    entity_capture_status,
    entity_source_assurance,
    entity_source_trust_level: TRUST_LEVEL[entity_source_assurance],
    verification_status: entity_capture_status,
  };
}
