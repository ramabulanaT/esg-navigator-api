/**
 * Cross-entity comparability guard — BOB-BRIEF-021.
 *
 * Rate metrics are only comparable between entities when the denominator is
 * known. LTIFR is currently stored on at least three incompatible bases under
 * one metric name:
 *
 *   EXX FY2024-12-31 : 0.06  unit 'rate'
 *   SHP FY2024-06-30 : 0.41  unit 'per 200,000 hours'
 *   SHP FY2025-06-30 : 5.56  unit 'rate'
 *
 * A 93x spread between two rows whose unit string is identical. Presenting
 * those side by side would be meaningless at best and misleading at worst.
 *
 * The base must be read off the source document — it is NOT inferred from the
 * magnitude here, and must not be. Until `normalisation_base` is populated the
 * row is flagged not comparable and excluded from any cross-entity view.
 */

export interface ComparabilityInput {
  metric_name: string;
  unit?: string | null;
  normalisation_base?: string | null;
}

export interface Comparability {
  cross_entity_comparable: boolean;
  reason?: string;
}

/** Metrics expressed as a ratio against an unstated denominator. */
const RATE_UNIT = /^(rate|ratio|index)$/i;
const RATE_NAME = /\b(frequency rate|ltifr|trifr|incident rate|injury rate)\b/i;

export function isRateMetric(row: ComparabilityInput): boolean {
  return RATE_UNIT.test(String(row.unit ?? '').trim()) || RATE_NAME.test(row.metric_name);
}

export function assessComparability(row: ComparabilityInput): Comparability {
  if (!isRateMetric(row)) return { cross_entity_comparable: true };

  const base = String(row.normalisation_base ?? '').trim();
  if (base) return { cross_entity_comparable: true };

  return {
    cross_entity_comparable: false,
    reason:
      `"${row.metric_name}" is a rate with no normalisation_base recorded. The denominator ` +
      `(e.g. per 200,000 vs per 1,000,000 hours) is unknown, so this figure cannot be compared ` +
      `against other entities or other periods. Read the base from the source document.`,
  };
}

/** Rows that must be withheld from any cross-entity comparison or chart. */
export function notComparable<T extends ComparabilityInput>(rows: T[]): T[] {
  return rows.filter((r) => !assessComparability(r).cross_entity_comparable);
}
