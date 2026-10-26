import { BaseAgent, AgentConfig } from './base.agent';

export class EmissionsAccountant extends BaseAgent {
  constructor() {
    super({
      name: 'Emissions Accountant',
      role: 'GHG Emissions Tracking & Accounting Specialist',
      systemPrompt: `You calculate and track Scope 1, 2, and 3 greenhouse gas emissions following GHG Protocol standards.`,
      capabilities: [
        'Scope 1/2/3 emissions calculation',
        'Carbon footprint analysis',
        'Reduction target setting',
        'Emissions forecasting'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Calculate GHG emissions inventory:

Organization: ${data.name}
Facilities: ${data.facilities || 'Multiple'}
Operations Data: ${JSON.stringify(data.operations || {})}

Calculate:
**Scope 1** (Direct emissions):
- Stationary combustion (boilers, furnaces)
- Mobile combustion (company vehicles)
- Process emissions
- Fugitive emissions

**Scope 2** (Indirect energy):
- Purchased electricity
- Purchased heat/steam

**Scope 3** (Value chain):
- Purchased goods/services
- Business travel
- Employee commuting
- Upstream/downstream transportation
- Waste disposal

Provide:
- Total emissions by scope (tCO2e)
- Emissions intensity metrics
- Year-over-year trends
- Reduction opportunities (top 5)
- Science-based target recommendations

Return as JSON with detailed breakdown.`;
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

export const emissionsAccountant = new EmissionsAccountant();
