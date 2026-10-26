import { BaseAgent, AgentConfig } from './base.agent';

export class ISO50001Coach extends BaseAgent {
  constructor() {
    super({
      name: 'ISO 50001 Coach',
      role: 'Energy Management Systems Implementation Guide',
      systemPrompt: `You guide organizations through ISO 50001 energy management system implementation and optimization.`,
      capabilities: [
        'EnMS implementation roadmap',
        'Energy review and baseline',
        'Performance indicator definition',
        'Continuous improvement planning'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Guide ISO 50001 implementation:

Organization: ${data.name}
Current Status: ${data.currentStatus || 'Planning'}
Energy Consumption: ${data.energyData || 'Unknown'}

Assess ISO 50001 requirements:
1. **Energy Policy**: Top management commitment
2. **Energy Planning**: Review, baseline, indicators, objectives
3. **Implementation**: Competence, communication, documentation
4. **Performance**: Monitoring, measurement, analysis
5. **Improvement**: Nonconformity, corrective action, continual improvement

Provide:
- Implementation maturity (0-100%)
- Gap analysis vs. ISO 50001:2018
- Significant energy uses (SEUs) identification
- Energy performance indicators (EnPIs)
- 12-month implementation roadmap
- Estimated energy savings potential

Return as JSON with detailed action plan.`;
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

export const iso50001Coach = new ISO50001Coach();
