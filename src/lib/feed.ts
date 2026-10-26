/**
 * Shared shape rules for the governed Envizi PMC feed — BOB-BRIEF-021.
 *
 * Both /v1/ghg-emissions and /v1/esg-assessor read the same table and must
 * agree on what they select and on what counts as an intensity. Keeping these
 * in one place stops the two routes drifting apart.
 */

/**
 * data_types the governed feed serves.
 *
 * 'GHG Emissions' carries absolute tCO2e figures; the two intensity types
 * carry ratios, returned in their own block and never summed into a total.
 *
 * Release rows 369 and 370 are 'GHG Intensity'. Under the old
 * `data_type = 'GHG Emissions'` filter they were silently excluded from every
 * response — two of the seven release rows were simply never served.
 * Widened 25 Sep 2026.
 */
export const FEED_DATA_TYPES = ['GHG Emissions', 'GHG Intensity', 'Carbon Intensity'];

/**
 * A ratio metric. Reported in its own block, never added to an emissions
 * total, and not comparable across entities unless the denominator matches.
 *
 * Detected three ways because the feed is not consistent: EXX files these
 * under data_type 'Carbon Intensity', SHP under 'GHG Intensity', and some
 * rows are only identifiable by a composite unit such as 'tCO2e/t coal'.
 */
export const isIntensityRow = (r: {
  data_type?: string | null;
  metric_name?: string | null;
  unit?: string | null;
}): boolean =>
  /intensity/i.test(String(r.data_type ?? '')) ||
  /intensity/i.test(String(r.metric_name ?? '')) ||
  String(r.unit ?? '').includes('/');
