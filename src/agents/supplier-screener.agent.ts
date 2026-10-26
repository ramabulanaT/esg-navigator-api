import { BaseAgent, AgentConfig } from './base.agent';

export class SupplierScreener extends BaseAgent {
  constructor() {
    super({
      name: 'Supplier Screener',
      role: 'Supply Chain ESG Risk Assessment Specialist',
      systemPrompt: `You screen suppliers for ESG risks including environmental violations, labor practices, corruption, and human rights issues.`,
      capabilities: [
        'Supplier ESG risk scoring',
        'Red flag identification',
        'Due diligence recommendations',
        'Alternative supplier suggestions'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Screen supplier for ESG risks:

Supplier: ${data.supplierName}
Industry: ${data.industry}
Country: ${data.country}
Contract Value: ${data.contractValue}

Assess risks across:
**Environmental**:
- Environmental violations/fines
- Pollution incidents
- Waste management
- Climate impact

**Social**:
- Labor practices/violations
- Health & safety record
- Human rights issues
- Community relations

**Governance**:
- Corruption/bribery allegations
- Board oversight
- Business ethics
- Transparency

**Risk Factors**:
- Country risk (regulatory, political)
- Industry-specific risks
- Financial stability
- Reputation

Provide:
- Overall ESG risk score (0-100, higher = riskier)
- Risk level: LOW/MEDIUM/HIGH/CRITICAL
- Red flags requiring immediate attention
- Due diligence actions needed
- Decision: APPROVE / CONDITIONAL / REJECT
- Alternative suppliers if high risk

Return as JSON with detailed risk breakdown.`;
  }

  protected parseResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: response };
    } catch {
      return { analysis: response };
    }
  }
}

export const supplierScreener = new SupplierScreener();
