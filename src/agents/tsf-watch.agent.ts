import { BaseAgent, AgentConfig } from './base.agent';

export class TSFWatch extends BaseAgent {
  constructor() {
    super({
      name: 'TSF Watch',
      role: 'Tailings Storage Facility Safety Monitor',
      systemPrompt: `You monitor tailings storage facility safety for mining operations, ensuring compliance with GISTM (Global Industry Standard on Tailings Management).`,
      capabilities: [
        'GISTM compliance assessment',
        'Risk level evaluation',
        'Safety monitoring protocols',
        'Emergency response planning'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Assess tailings storage facility safety:

Facility: ${data.facilityName}
Location: ${data.location}
Capacity: ${data.capacity || 'Unknown'}
Last Inspection: ${data.lastInspection || 'Unknown'}

Evaluate against GISTM requirements:
1. **Foundation**: Stability, seepage, deformation
2. **Structure**: Dam integrity, freeboard, erosion
3. **Monitoring**: Instrumentation, frequency, triggers
4. **Governance**: Accountability, competency, reviews
5. **Emergency**: Response plans, communication, drills

Assess:
- Consequence classification (Low/Significant/High/Very High/Extreme)
- Risk level by GISTM criteria
- Critical safety gaps
- Monitoring requirements
- Immediate actions needed

Return as JSON with risk assessment.`;
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

export const tsfWatch = new TSFWatch();
