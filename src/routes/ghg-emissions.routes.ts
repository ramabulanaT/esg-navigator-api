/**
 * IntelliMat — GHG Emissions Agent Endpoint
 * POST /v1/ghg-emissions
 *
 * BOB-BRIEF-021: ported from demo-sandbox and made honest.
 *   - Reads the assess.* schema. No static corpus in the client path.
 *   - Entity status is the WEAKEST across all rows, never rows[0].
 *   - Returns capture/assurance summaries plus per-row status.
 */

import { Router } from 'express';
import { pool } from '../lib/db';
import { buildStatus } from '../lib/status';
import { summariseEmissions } from '../lib/emissions';
import { FEED_DATA_TYPES, isIntensityRow } from '../lib/feed';

const router = Router();

router.post('/', async (req: any, res: any) => {
  const { ticker, scope_filter, include_confidence = true } = req.body || {};

  if (!ticker) {
    return res.status(400).json({ success: false, error: 'ticker is required', code: 'INPUT_001' });
  }
  const company_ticker = String(ticker).toUpperCase();

  try {
    // ── The governed PMC path is tried FIRST ────────────────────────────────
    // Previously the scored path won whenever assess.jse_top40_scores held
    // criteria 1/2, and only fell back to the feed otherwise. That bypassed
    // the whole status layer for the entities that have scores — and for EXX
    // the scored path returns NO emissions at all, because
    // assess.emissions_evidence holds zero EXX rows. Approved 25 Sep 2026:
    // prefer the governed feed wherever it has data for the entity.
    //
    // Blast radius: EXX, BVT and SSW move to the PMC path (they have both
    // scores and feed rows). INL and KMH have scores but no feed rows, so
    // they still use the scored path.
    const ghgFeed = await pool.query(
      `SELECT metric_name, metric_value, unit, scope, category, data_type,
              data_quality_score, confidence_level, source, notes, report_date,
              capture_verification, capture_verified_by, capture_verified_at,
              capture_source_ref, source_assurance, source_trust_level
         FROM assess.envizi_pmc_feed
        WHERE ticker = $1
              AND data_type = ANY($2::text[])
              -- Pin to ONE reporting period. SHP holds both FY2024-06-30 and
              -- FY2025-06-30; without this the response blends two fiscal
              -- years into a single set of totals.
              AND report_date = (
                SELECT MAX(report_date) FROM assess.envizi_pmc_feed
                 WHERE ticker = $1 AND data_type = ANY($2::text[])
              )
              ${scope_filter ? 'AND scope = $3' : ''}
        ORDER BY scope, metric_name`,
      scope_filter ? [company_ticker, FEED_DATA_TYPES, scope_filter] : [company_ticker, FEED_DATA_TYPES]
    );

    if (ghgFeed.rows.length > 0) {
      // Intensities are reported as their OWN block, never folded into the
      // emission totals. summariseEmissions already ignores non-tCO2e rows;
      // this split makes the separation visible in the response too.
      const rows = ghgFeed.rows.filter((r: any) => !isIntensityRow(r));
      const intensityRows = ghgFeed.rows.filter((r: any) => isIntensityRow(r));

      if (rows.length === 0 && intensityRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No GHG assessment found for ticker: ${company_ticker}`,
          code: 'DATA_001',
        });
      }

      // Unit-aware, total-preferring aggregation. Never sums a disclosed total
      // into its own components, never treats an intensity as an emission.
      const emissions = summariseEmissions(rows);
      const qualityRows = rows.length > 0 ? rows : intensityRows;
      const avgQuality =
        qualityRows.reduce((s: number, r: any) => s + Number(r.data_quality_score || 0), 0) / qualityRows.length;

      // ── The honest status block: every row counts, weakest wins ───────────
      // Intensities are included here: they are part of what the entity is
      // serving, so they must not escape the capture/assurance summary.
      const status = buildStatus(ghgFeed.rows);

      return res.json({
        success: true,
        agent: 'IntelliMat-GHG-Agent-v1.0',
        partner: (req as any).partner,
        version_stamps: {
          rubric_version: 'envizi-pmc-v1',
          api_version: 'v1.1.0',
          scoring_cycle: 'JSE40-2025-ANNUAL',
        },
        company: { ticker: company_ticker, assessed_at: new Date().toISOString() },
        data_source: 'envizi-pmc-feed',
        // Carries the capture/assurance status layer. BOB-BRIEF-023 may grant
        // entitlements to this path.
        governed: true,
        // Single reporting period, pinned in the query above.
        report_date: ghgFeed.rows[0]?.report_date,
        reporting_period_note: 'Latest reporting period held for this entity. Periods are never blended.',
        source: ghgFeed.rows[0]?.source,

        // Entity-level status — derived from all rows, never one of them.
        capture_verification_summary: status.capture_verification_summary,
        source_assurance_summary: status.source_assurance_summary,
        entity_capture_status: status.entity_capture_status,
        entity_source_assurance: status.entity_source_assurance,
        entity_source_trust_level: status.entity_source_trust_level,
        // Deprecated legacy field, mirrors entity_capture_status.
        verification_status: status.verification_status,

        emissions_summary: emissions,

        emissions_detail: rows.map((r: any) => ({
          metric_name: r.metric_name,
          metric_value: Number(r.metric_value),
          unit: r.unit,
          scope: r.scope,
          category: r.category,
          data_quality_score: Number(r.data_quality_score),
          confidence_level: r.confidence_level,
          notes: r.notes,
          // Per-row status, so a caller can see exactly which figures are weak.
          capture_verification: r.capture_verification,
          capture_verified_by: r.capture_verified_by,
          capture_verified_at: r.capture_verified_at,
          capture_source_ref: r.capture_source_ref,
          source_assurance: r.source_assurance,
          source_trust_level: r.source_trust_level,
        })),

        // ── Intensities: a separate block, never summed into the totals ─────
        // These are ratios against different denominators (per tonne of coal,
        // per m2, per MWh). They are not additive and are not comparable
        // across entities without the denominator.
        intensities: intensityRows.map((r: any) => ({
          metric_name: r.metric_name,
          metric_value: Number(r.metric_value),
          unit: r.unit,
          scope: r.scope,
          data_type: r.data_type,
          denominator_note: 'Ratio metric. Not additive; not comparable across entities unless the denominator matches.',
          capture_verification: r.capture_verification,
          capture_source_ref: r.capture_source_ref,
          source_assurance: r.source_assurance,
          source_trust_level: r.source_trust_level,
        })),

        confidence: include_confidence
          ? {
              overall: +avgQuality.toFixed(3),
              data_source: 'envizi-pmc-feed',
              // Assurance is the entity's weakest source assurance, not a row's.
              assurance: status.entity_source_assurance,
              capture_status: status.entity_capture_status,
            }
          : undefined,
      });
    }

    // ── Scored path — FALLBACK ONLY, for entities with no feed rows ─────────
    // NOT governed: it never reads capture_verification and carries no status
    // layer. BOB-BRIEF-023 must not grant entitlements to data served this
    // way; see `governed: false` in the response envelope below.
    const scores = await pool.query(
      `SELECT s.criterion_id, r.criterion_name, r.weight_pct, r.framework_alignment,
              s.score, s.evidence_excerpt, s.source_url, s.assessor, s.scored_at
         FROM assess.jse_top40_scores     s
         JOIN assess.rubric_dm_hybrid_v1  r ON r.criterion_id = s.criterion_id
        WHERE s.ticker = $1 AND s.criterion_id IN (1, 2)
        ORDER BY r.weight_pct DESC`,
      [company_ticker]
    );

    if (scores.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No GHG assessment found for ticker: ${company_ticker}`,
        code: 'DATA_001',
      });
    }

    const emissions = await pool.query(
      `SELECT ghg_scope, ghg_category, activity_description, activity_value, activity_unit,
              calculated_tco2e, source_system, source_certified, certification_body,
              emission_factor_source, framework_satisfied, confidence_uplift, fiscal_year
         FROM assess.emissions_evidence
        WHERE ticker = $1 ${scope_filter ? 'AND ghg_scope = $2' : ''}
        ORDER BY ghg_scope, calculated_tco2e DESC`,
      scope_filter ? [company_ticker, scope_filter] : [company_ticker]
    );

    const assurance = await pool.query(
      `SELECT assurance_level, weight_multiplier, assurance_provider,
              assurance_standard, assurance_scope, framework_covered
         FROM assess.assurance_registry WHERE ticker = $1`,
      [company_ticker]
    );

    const gaps = await pool.query(
      `SELECT required_disclosure, actual_disclosure, gap_severity
         FROM assess.disclosure_gaps
        WHERE ticker = $1 AND criterion_id IN (1, 2)
        ORDER BY CASE gap_severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'moderate' THEN 3 ELSE 4 END`,
      [company_ticker]
    );

    const controversy = await pool.query(
      `SELECT incident_type, incident_date, description, financial_impact, score_adjustment
         FROM assess.controversy_log
        WHERE ticker = $1 AND criterion_affected IN (1, 2)
        ORDER BY incident_date DESC`,
      [company_ticker]
    );

    const confidence = await pool.query(
      `SELECT confidence_rating, completeness_pct, corroboration_pct, assurance_coverage,
              controversy_flags, confidence_note, reproducible, rule_version
         FROM assess.reporting_confidence WHERE ticker = $1`,
      [company_ticker]
    );

    const assuranceData = assurance.rows[0] || {};
    const confidenceData = confidence.rows[0] || {};

    const rawGhgScore = scores.rows.find((r: any) => r.criterion_id === 2)?.score || 0;
    const multiplier = parseFloat(assuranceData.weight_multiplier ?? 0.75);
    const controversyAdj = controversy.rows.reduce(
      (sum: number, c: any) => sum + parseFloat(c.score_adjustment || 0), 0);
    const adjustedScore = Math.max(0, parseFloat(rawGhgScore) * multiplier + controversyAdj).toFixed(2);

    return res.json({
      success: true,
      agent: 'IntelliMat-GHG-Agent-v1.0',
      partner: (req as any).partner,
      version_stamps: {
        rubric_version: 'dm_hybrid_v1',
        api_version: 'v1.1.0',
        agent_stack_version: '1.0.0',
        scoring_cycle: 'JSE40-2025-ANNUAL',
      },
      company: { ticker: company_ticker, assessed_at: new Date().toISOString() },
      data_source: 'assess-scored',
      // NOT governed: no capture_verification, no status layer, no partition
      // guard. BOB-BRIEF-023 entitlements must refuse this path.
      governed: false,
      governance_note:
        'Served from the scored path (assess.jse_top40_scores). This entity has no rows in the governed ' +
        'Envizi PMC feed, so no capture verification or source-assurance status applies. Not for client release.',
      ghg_intelligence: {
        criteria_scored: scores.rows.map((s: any) => ({
          criterion_id: s.criterion_id,
          criterion_name: s.criterion_name,
          framework_alignment: s.framework_alignment,
          raw_score: parseFloat(s.score),
          weight_pct: s.weight_pct,
          evidence_excerpt: s.evidence_excerpt,
          source_url: s.source_url,
          scored_at: s.scored_at,
        })),
        raw_ghg_score: parseFloat(rawGhgScore),
        assurance_multiplier: multiplier,
        controversy_adjustment: controversyAdj,
        adjusted_ghg_score: parseFloat(adjustedScore),
      },
      emissions_evidence: {
        total_records: emissions.rows.length,
        certified_records: emissions.rows.filter((e: any) => e.source_certified).length,
        confidence_uplift: emissions.rows.some((e: any) => e.confidence_uplift),
        records: emissions.rows,
      },
      assurance: {
        level: assuranceData.assurance_level || 'none',
        multiplier,
        provider: assuranceData.assurance_provider,
        standard: assuranceData.assurance_standard,
        scope: assuranceData.assurance_scope,
        framework_covered: assuranceData.framework_covered,
      },
      disclosure_gaps: {
        total: gaps.rows.length,
        critical: gaps.rows.filter((g: any) => g.gap_severity === 'critical').length,
        items: gaps.rows,
      },
      controversy: {
        total_incidents: controversy.rows.length,
        total_adjustment: controversyAdj,
        items: controversy.rows,
      },
      confidence: include_confidence ? confidenceData : undefined,
    });
  } catch (err: any) {
    console.error('[ghg-emissions] query failed:', err.message);
    return res.status(503).json({ success: false, error: 'Database unavailable', code: 'DB_001' });
  }
});

export default router;
