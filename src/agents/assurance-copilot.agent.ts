import { BaseAgent, AgentConfig } from './base.agent';

export class AssuranceCopilot extends BaseAgent {
  constructor() {
    super({
      name: 'Assurance Copilot',
      role: 'ESG Audit & Assurance Preparation Specialist',
      systemPrompt: `You prepare organizations for ESG audits and assurance processes, ensuring data quality and documentation readiness.`,
      capabilities: [
        'Audit readiness assessment',
        'Documentation gap analysis',
        'Evidence compilation guidance',
        'Assurance level recommendations'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Prepare for ESG assurance audit:

Organization: ${data.name}
Assurance Level: ${data.assuranceLevel || 'Limited'}
Audit Date: ${data.auditDate || 'TBD'}
Standards: ${data.standards?.join(', ') || 'GRI, SASB'}

Assess readiness across:
1. **Data Quality**: Accuracy, completeness, consistency
2. **Documentation**: Policies, procedures, evidence trails
3. **Controls**: Internal controls, segregation of duties
4. **Materiality**: Stakeholder engagement, issue identification
5. **Disclosures**: Report completeness, transparency

Provide:
- Readiness score (0-100%)
- Critical gaps requiring immediate attention
- Documentation checklist
- Evidence requirements by standard
- Timeline to audit-ready state

Return as JSON with actionable checklist.`;
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

export const assuranceCopilot = new AssuranceCopilot();
