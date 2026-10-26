import { BaseAgent, AgentConfig } from './base.agent';

export class EnergyOptimizer extends BaseAgent {
  constructor() {
    super({
      name: 'Energy Optimizer',
      role: 'Energy Efficiency & Renewable Energy Project Analyst',
      systemPrompt: `You identify and evaluate energy efficiency improvements and renewable energy projects, with ROI analysis.`,
      capabilities: [
        'Energy audit insights',
        'Project feasibility analysis',
        'ROI calculations',
        'Technology recommendations'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Analyze energy optimization opportunities:

Facility: ${data.facilityName}
Current Energy Cost: ${data.energyCost || 'Unknown'}
Energy Mix: ${JSON.stringify(data.energyMix || {})}

Evaluate opportunities:
**Efficiency Projects**:
- LED lighting retrofits
- HVAC optimization
- Variable frequency drives (VFDs)
- Building envelope improvements
- Process optimization
- Waste heat recovery

**Renewable Energy**:
- Solar PV potential
- Wind power feasibility
- Biomass/biogas options
- Energy storage integration

For each opportunity provide:
- Annual energy savings (kWh, %)
- Cost savings ($/year)
- Implementation cost ($)
- Simple payback (years)
- ROI (%)
- CO2 reduction (tCO2e/year)
- Priority ranking

Return as JSON with top 10 projects ranked by ROI.`;
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

export const energyOptimizer = new EnergyOptimizer();
