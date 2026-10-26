/**
 * Emission aggregation — BOB-BRIEF-021.
 *
 * The demo-sandbox logic this replaces had two defects, both proven against
 * the real EXX and SHP rows in assess.envizi_pmc_feed:
 *
 *   1. Scope 3 summed EVERY row with scope='Scope 3'. Where the feed holds
 *      both category rows AND a disclosed "Total Scope 3" row, the total was
 *      added to its own components:
 *        EXX  103,650,000 reported vs  52,400,000 disclosed  (+98%)
 *        SHP   26,712,552 reported vs  14,236,968 disclosed  (+88%)
 *
 *   2. total_tco2e took the FIRST row with scope='All Scopes', ordered by
 *      metric_name. For EXX that is "GHG Intensity Scope 1+2 (tCO2e/t coal)",
 *      so the entity's total emissions were reported as **0.146 tCO2e**
 *      instead of 5,910,000.
 *
 * Two rules prevent both, and the class of bug behind them:
 *   - Only rows measured in tCO2e ever enter an emissions total. The feed mixes
 *     intensities, energy, currency, headcount and target years into the same
 *     scope buckets.
 *   - A disclosed total is preferred over a computed sum, and a total row is
 *     never added to its own components.
 */

export interface FeedRow {
  metric_name: string;
  metric_value: number | string | null;
  unit?: string | null;
  scope?: string | null;
  /** ADR-003 capture status. Only 'Verified' licenses a 'disclosed' claim. */
  capture_verification?: string | null;
}

/**
 * `disclosed-total`   — a total row whose capture has been VERIFIED against the
 *                       source document. Only this asserts the company disclosed it.
 * `computed`          — a row labelled as a total, but capture not yet verified.
 *                       It may be a TIS calculation stored as if it were a
 *                       company disclosure. Reported, but never called disclosed.
 * `sum-of-components` — we added the component rows ourselves.
 * `not-disclosed`     — nothing usable.
 */
export type Basis = 'disclosed-total' | 'computed' | 'sum-of-components' | 'not-disclosed';

export interface ScopeResult {
  value: number | null;
  basis: Basis;
  /** Metrics that produced the value — so a reader can audit it. */
  from: string[];
  /** Capture status of the backing row, so the basis claim is auditable. */
  capture_verification?: string | null;
  note?: string;
}

const UNVERIFIED_TOTAL_NOTE =
  'Row is labelled a total, but its capture is not verified against the source document. ' +
  'It may be an IntelliMat calculation rather than a figure the company disclosed. ' +
  'Reported as computed until the capture check signs it off.';

/**
 * A total row may only be called "disclosed" once someone has checked it
 * against the source. Until then the basis comes from capture_verification.
 */
function totalResult(row: FeedRow): ScopeResult {
  const verified = row.capture_verification === 'Verified';
  return {
    value: num(row.metric_value),
    basis: verified ? 'disclosed-total' : 'computed',
    from: [row.metric_name],
    capture_verification: row.capture_verification ?? null,
    ...(verified ? {} : { note: UNVERIFIED_TOTAL_NOTE }),
  };
}

const EMISSION_UNIT = 'tco2e';

const num = (v: unknown) => (v == null || v === '' ? NaN : Number(v));

/** Only absolute emissions in tCO2e. Excludes intensities like tCO2e/t coal. */
function emissionRows(rows: FeedRow[], scope: string): FeedRow[] {
  return rows.filter(
    (r) =>
      r.scope === scope &&
      String(r.unit ?? '').trim().toLowerCase() === EMISSION_UNIT &&
      Number.isFinite(num(r.metric_value))
  );
}

const isTotal = (name: string) => /^total\b/i.test(name.trim());

function pick(rows: FeedRow[], pattern: RegExp): FeedRow | undefined {
  return rows.find((r) => pattern.test(r.metric_name));
}

/**
 * Resolve one scope: prefer the disclosed total; otherwise sum the
 * non-total component rows. Never both.
 */
function resolveScope(rows: FeedRow[], scope: string, totalPattern: RegExp): ScopeResult {
  const candidates = emissionRows(rows, scope);
  if (candidates.length === 0) return { value: null, basis: 'not-disclosed', from: [] };

  const total = pick(candidates, totalPattern);
  if (total) return totalResult(total);

  const components = candidates.filter((r) => !isTotal(r.metric_name));
  if (components.length === 0) return { value: null, basis: 'not-disclosed', from: [] };

  return {
    value: components.reduce((a, r) => a + num(r.metric_value), 0),
    basis: 'sum-of-components',
    from: components.map((r) => r.metric_name),
    note: `Sum of ${components.length} disclosed component(s) — may not equal the entity's total ${scope}.`,
  };
}

export interface EmissionsSummary {
  scope1_tco2e: number | null;
  scope2_tco2e: number | null;
  scope2_method: 'market-based' | 'location-based' | null;
  scope3_tco2e: number | null;
  total_tco2e: number | null;
  unit: 'tCO2e';
  basis: {
    scope1: ScopeResult;
    scope2: ScopeResult;
    scope3: ScopeResult;
    total: ScopeResult;
  };
  /** Set when the disclosed total disagrees with scope1+2(+3). Never silently reconciled. */
  reconciliation_warning?: string;
}

export function summariseEmissions(rows: FeedRow[]): EmissionsSummary {
  const scope1 = resolveScope(rows, 'Scope 1', /^total scope 1 ghg emissions$/i);

  // Scope 2: market-based is preferred over location-based per GHG Protocol
  // dual reporting; they must never be summed.
  const s2rows = emissionRows(rows, 'Scope 2');
  const s2mkt = pick(s2rows, /market-based/i);
  const s2loc = pick(s2rows, /location-based/i);
  let scope2: ScopeResult;
  let scope2_method: 'market-based' | 'location-based' | null = null;
  if (s2mkt) {
    scope2 = totalResult(s2mkt);
    scope2_method = 'market-based';
  } else if (s2loc) {
    scope2 = totalResult(s2loc);
    scope2_method = 'location-based';
  } else {
    scope2 = resolveScope(rows, 'Scope 2', /^total scope 2 ghg emissions$/i);
    if (scope2.value != null) scope2_method = 'location-based';
  }

  const scope3 = resolveScope(rows, 'Scope 3', /^total scope 3 ghg emissions$/i);

  // Entity total: only an explicit "Total ... GHG Emissions" row in tCO2e.
  // Never an intensity, a target year or a percentage.
  const allScopes = emissionRows(rows, 'All Scopes');
  const totalRow = pick(allScopes, /^total\b.*\bghg emissions\b/i);
  let total: ScopeResult = totalRow
    ? totalResult(totalRow)
    : { value: null, basis: 'not-disclosed', from: [] };

  if (total.value == null) {
    const parts = [scope1.value, scope2.value, scope3.value].filter((v): v is number => v != null);
    if (parts.length > 0) {
      total = {
        value: parts.reduce((a, b) => a + b, 0),
        basis: 'sum-of-components',
        from: ['scope1_tco2e', 'scope2_tco2e', 'scope3_tco2e'].slice(0, parts.length),
        note: 'No disclosed total in the feed — computed from the scopes present.',
      };
    }
  }

  const summary: EmissionsSummary = {
    scope1_tco2e: scope1.value,
    scope2_tco2e: scope2.value,
    scope2_method,
    scope3_tco2e: scope3.value,
    total_tco2e: total.value,
    unit: 'tCO2e',
    basis: { scope1, scope2, scope3, total },
  };

  // Compare a total against the scopes it names. A "Scope 1+2" total
  // legitimately excludes Scope 3, so never fold Scope 3 into that comparison.
  if ((total.basis === 'disclosed-total' || total.basis === 'computed') && total.value != null) {
    const name = total.from[0] ?? '';
    const coversScope3 = /1\+2\+3|scope 1\+2\+3/i.test(name);
    const parts = [scope1.value ?? 0, scope2.value ?? 0, coversScope3 ? scope3.value ?? 0 : 0];
    const expected = parts.reduce((a, b) => a + b, 0);
    const delta = Math.abs(expected - total.value);

    if (expected > 0 && delta > Math.max(1, total.value * 0.005)) {
      summary.reconciliation_warning =
        `Total (${total.value.toLocaleString('en-US')}, basis: ${total.basis}) differs from the sum of ` +
        `its scopes (${expected.toLocaleString('en-US')}) by more than 0.5%. Stored value reported unchanged.`;
    } else if (expected > 0 && delta === 0 && total.basis === 'computed') {
      // Exact agreement is not corroboration. A figure that reconciles to the
      // tonne against its own components is what a calculation looks like —
      // an independently disclosed total almost never lands exactly.
      summary.reconciliation_warning =
        `Total (${total.value.toLocaleString('en-US')}) reconciles EXACTLY to the sum of its scopes and its ` +
        `capture is unverified. Exact agreement is consistent with the figure having been calculated rather ` +
        `than disclosed by the company. Treat as computed and confirm against the source document.`;
    }
  }

  return summary;
}
