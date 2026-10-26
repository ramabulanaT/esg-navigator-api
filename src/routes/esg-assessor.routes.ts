/**
 * IntelliMat — ESG Assessor (Orchestration Layer)
 * POST /v1/esg-assessor
 *
 * Accepts: ticker + sector + frameworks[]
 * Orchestrates:
 *   [1] GHG Agent       — assess.envizi_pmc_feed (GHG Emissions rows)
 *   [2] Envizi Feed     — assess.envizi_pmc_feed (all data types)
 *   [3] SAIGE Questions — saige.question_bank contextual query
 *   [4] Completeness    — assess.calculate_envizi_completeness()
 *
 * BOB-BRIEF-021: ported from demo-sandbox with the honest status layer.
 *   - Entity status is the WEAKEST across all rows, never rows[0]
 *     (was `verification: rows[0]?.verification_status`).
 *   - Per-row status reports capture_verification + source_assurance.
 *
 * Does NOT duplicate business logic — queries the same tables the individual
 * agents use, assembled here into a single response envelope.
 */

import { Router } from 'express';
import { pool } from '../lib/db';
import { buildStatus } from '../lib/status';
import { summariseEmissions } from '../lib/emissions';
import { assessComparability } from '../lib/comparability';
import { FEED_DATA_TYPES, isIntensityRow } from '../lib/feed';

const router = Router();

router.post('/', async (req: any, res: any) => {
  const {
    ticker,
    sector,
    frameworks = [],
    include_saige = true,
    include_envizi = true,
    include_confidence = true,
  } = req.body || {};

  if (!ticker) {
    return res.status(400).json({ success: false, error: 'ticker is required', code: 'INPUT_001' });
  }

  const company_ticker = String(ticker).toUpperCase();
  const assessed_at = new Date().toISOString();

  try {
    // ── [1] GHG Emissions — governed PMC feed FIRST ─────────────────────────
    // The scored path is a fallback only, for entities with no feed rows.
    // See ghg-emissions.routes.ts for the reasoning.
    let ghg_summary: any = null;
    let ghg_detail: any[] = [];
    let ghg_intensities: any[] = [];
    let ghg_source = 'envizi-pmc-feed';
    let ghg_governed = true;
    let ghg_status: any = null;

    const ghgFeed = await pool.query(
      `SELECT metric_name, metric_value, unit, scope, category, data_type,
              data_quality_score, confidence_level, source, notes, report_date,
              capture_verification, capture_verified_by, capture_verified_at,
              capture_source_ref, source_assurance, source_trust_level
         FROM assess.envizi_pmc_feed
        WHERE ticker = $1 AND data_type = ANY($2::text[])
              -- Pin to ONE reporting period (see ghg-emissions.routes.ts).
              AND report_date = (
                SELECT MAX(report_date) FROM assess.envizi_pmc_feed
                 WHERE ticker = $1 AND data_type = ANY($2::text[])
              )
        ORDER BY scope, metric_name`,
      [company_ticker, FEED_DATA_TYPES]
    );

    const rubricRows = ghgFeed.rows.length > 0
      ? { rows: [] as any[] }
      : await pool.query(
          `SELECT s.criterion_id, r.criterion_name, r.weight_pct, r.framework_alignment,
                  s.score, s.evidence_excerpt, s.source_url, s.scored_at
             FROM assess.jse_top40_scores    s
             JOIN assess.rubric_dm_hybrid_v1 r ON r.criterion_id = s.criterion_id
            WHERE s.ticker = $1 AND s.criterion_id IN (1, 2)
            ORDER BY r.weight_pct DESC`,
          [company_ticker]
        );

    if (ghgFeed.rows.length === 0 && rubricRows.rows.length > 0) {
      ghg_source = 'rubric';
      ghg_governed = false;
      ghg_summary = {
        rubric_scores: rubricRows.rows.map((r: any) => ({
          criterion_id: r.criterion_id,
          criterion_name: r.criterion_name,
          framework_alignment: r.framework_alignment,
          raw_score: parseFloat(r.score),
          weight_pct: r.weight_pct,
          evidence_excerpt: r.evidence_excerpt,
          source_url: r.source_url,
        })),
        governance_note:
          'Scored path: no governed feed rows for this entity, so no capture verification applies. Not for client release.',
      };
    } else if (ghgFeed.rows.length > 0) {
      // Intensities go in their own block, never into the emission totals.
      const rows = ghgFeed.rows.filter((r: any) => !isIntensityRow(r));
      const intensityRows = ghgFeed.rows.filter((r: any) => isIntensityRow(r));
      ghg_intensities = intensityRows.map((r: any) => ({
        metric_name: r.metric_name,
        metric_value: Number(r.metric_value),
        unit: r.unit,
        scope: r.scope,
        data_type: r.data_type,
        denominator_note: 'Ratio metric. Not additive; not comparable across entities unless the denominator matches.',
        capture_verification: r.capture_verification,
        source_assurance: r.source_assurance,
        source_trust_level: r.source_trust_level,
      }));

      // Entity status across every row — not rows[0]. Intensities included:
      // they are part of what is served and must not escape the summary.
      ghg_status = buildStatus(ghgFeed.rows);

      ghg_summary = {
        // Unit-aware, total-preferring aggregation (see lib/emissions.ts).
        ...summariseEmissions(rows),
        report_date: ghgFeed.rows[0]?.report_date,
        source: ghgFeed.rows[0]?.source,

        // Was: verification: rows[0]?.verification_status
        capture_verification_summary: ghg_status.capture_verification_summary,
        source_assurance_summary: ghg_status.source_assurance_summary,
        entity_capture_status: ghg_status.entity_capture_status,
        entity_source_assurance: ghg_status.entity_source_assurance,
        entity_source_trust_level: ghg_status.entity_source_trust_level,
        verification_status: ghg_status.verification_status, // deprecated legacy field
      };

      ghg_detail = rows.map((r: any) => ({
        metric_name: r.metric_name,
        metric_value: Number(r.metric_value),
        unit: r.unit,
        scope: r.scope,
        data_quality_score: Number(r.data_quality_score),
        confidence_level: r.confidence_level,
        notes: r.notes,
        capture_verification: r.capture_verification,
        capture_verified_by: r.capture_verified_by,
        capture_verified_at: r.capture_verified_at,
        capture_source_ref: r.capture_source_ref,
        source_assurance: r.source_assurance,
        source_trust_level: r.source_trust_level,
      }));
    }

    // ── [2] Envizi full feed (all data types) ────────────────────────────────
    let envizi_feed: any = null;
    if (include_envizi) {
      const feedRows = await pool.query(
        `SELECT data_type, category, metric_name, metric_value, unit, scope,
                data_quality_score, confidence_level, source, report_date, notes,
                capture_verification, source_assurance, source_trust_level,
                normalisation_base
           FROM assess.envizi_pmc_feed
          WHERE ticker = $1
          ORDER BY data_type, scope, category, metric_name`,
        [company_ticker]
      );
      const byType: Record<string, any[]> = {};
      const blocked: string[] = [];
      for (const r of feedRows.rows) {
        if (!byType[r.data_type]) byType[r.data_type] = [];
        const comparability = assessComparability(r);
        if (!comparability.cross_entity_comparable) blocked.push(r.metric_name);
        byType[r.data_type].push({
          category: r.category,
          metric_name: r.metric_name,
          metric_value: Number(r.metric_value),
          unit: r.unit,
          scope: r.scope,
          data_quality_score: Number(r.data_quality_score),
          confidence_level: r.confidence_level,
          // Was: verification_status: r.verification_status
          capture_verification: r.capture_verification,
          source_assurance: r.source_assurance,
          source_trust_level: r.source_trust_level,
          normalisation_base: r.normalisation_base ?? null,
          ...comparability,
          notes: r.notes,
        });
      }
      const feedStatus = buildStatus(feedRows.rows);
      envizi_feed = {
        total_metrics: feedRows.rows.length,
        data_types: Object.keys(byType),
        // Rate metrics with no recorded denominator. Never chart or rank these
        // against another entity until normalisation_base is filled from source.
        not_cross_entity_comparable: blocked,
        // Feed-wide status, weakest across every data type.
        capture_verification_summary: feedStatus.capture_verification_summary,
        source_assurance_summary: feedStatus.source_assurance_summary,
        entity_capture_status: feedStatus.entity_capture_status,
        entity_source_assurance: feedStatus.entity_source_assurance,
        by_type: byType,
      };
    }

    // ── [3] SAIGE contextual questions ───────────────────────────────────────
    let saige_questions: any = null;
    if (include_saige) {
      const params: any[] = [];
      let q = `
        SELECT q.question_id, q.question_code, q.question_text,
               q.framework_code, q.framework_pillar, q.mandatory,
               q.sdart_pillar, q.sdart_criterion_id,
               q.envizi_module, q.envizi_table, q.envizi_data_field,
               f.framework_name, f.issuing_body,
               CASE WHEN q.mandatory THEN 'mandatory'
                    WHEN q.materiality_threshold = 'high' THEN 'high_materiality'
                    ELSE 'recommended' END AS applicability_level
          FROM saige.question_bank q
          JOIN saige.frameworks    f ON q.framework_code = f.framework_code
         WHERE q.active = TRUE
      `;
      if (sector) {
        params.push(sector);
        q += ` AND ($${params.length} = ANY(q.applicable_sectors) OR 'ALL' = ANY(q.applicable_sectors))`;
      }
      if (frameworks.length > 0) {
        params.push(frameworks);
        q += ` AND q.framework_code = ANY($${params.length})`;
      }
      q += ' ORDER BY q.mandatory DESC, q.framework_code, q.question_code LIMIT 50';

      try {
        const saigeRows = await pool.query(q, params);
        saige_questions = {
          total: saigeRows.rows.length,
          frameworks: [...new Set(saigeRows.rows.map((r: any) => r.framework_code))],
          questions: saigeRows.rows,
        };
      } catch (_) { /* saige schema not present on all environments — non-fatal */ }
    }

    // ── [4] Data completeness score ──────────────────────────────────────────
    // NOTE: measures whether metrics are populated in envizi_pmc_feed. 100% does
    // NOT mean the company is TCFD/GRI compliant or that disclosures are verified.
    let data_completeness: any = null;
    if (include_confidence) {
      try {
        const c = await pool.query(`SELECT * FROM assess.calculate_envizi_completeness($1)`, [company_ticker]);
        if (c.rows[0]) {
          data_completeness = {
            ...c.rows[0],
            _note:
              'Measures populated metrics in IntelliMat feed only. Not a framework compliance or disclosure adequacy score.',
          };
        }
      } catch (_) { /* function not present on all environments — non-fatal */ }
    }

    if (!ghg_summary && !envizi_feed?.total_metrics) {
      return res.status(404).json({
        success: false,
        error: `No assessment data found for ticker: ${company_ticker}`,
        code: 'DATA_001',
      });
    }

    // ── Response ─────────────────────────────────────────────────────────────
    return res.json({
      success: true,
      agent: 'IntelliMat-ESG-Assessor-v1.0',
      partner: (req as any).partner,
      version_stamps: {
        api_version: 'v1.1.0',
        scoring_cycle: 'JSE40-2025-ANNUAL',
        rubric_version: 'dm_hybrid_v1',
      },
      company: { ticker: company_ticker, sector: sector || null, frameworks, assessed_at },
      ghg: {
        source: ghg_source,
        // false = scored path, no capture verification. BOB-BRIEF-023
        // entitlements must refuse data served this way.
        governed: ghg_governed,
        summary: ghg_summary,
        detail: ghg_detail.length > 0 ? ghg_detail : undefined,
        // Ratios, kept out of the emission totals.
        intensities: ghg_intensities.length > 0 ? ghg_intensities : undefined,
      },
      envizi: include_envizi ? envizi_feed : undefined,
      saige: include_saige ? saige_questions : undefined,
      data_completeness: include_confidence ? data_completeness : undefined,
      metadata: {
        orchestration_layers: ['ghg-agent', 'envizi-feed', 'saige-questions', 'completeness'],
        envizi_integration_ready: true,
        framework_alignment: ['GHG Protocol', 'GRI 300', 'IFRS S2', 'ISO 14064-1', 'TCFD'],
      },
    });
  } catch (err: any) {
    console.error('[esg-assessor] query failed:', err.message);
    return res.status(503).json({ success: false, error: 'Database unavailable', code: 'DB_001' });
  }
});

export default router;
