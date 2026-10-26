import { BaseAgent, AgentConfig } from './base.agent';

export class ESGAssessor extends BaseAgent {
  constructor() {
    super({
      name: 'ESG Assessor',
      role: 'ESG Maturity Assessment Specialist',
      systemPrompt: `You are an ESG maturity assessment expert. Evaluate organizations across Environmental, Social, and Governance dimensions using industry-standard frameworks.`,
      capabilities: [
        'ESG maturity scoring (0-100)',
        'Gap analysis against benchmarks',
        'Improvement roadmap generation',
        'Compliance assessment'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Conduct comprehensive ESG assessment:

Organization: ${data.name}
Industry: ${data.industry || 'General'}
Current ESG Score: ${data.currentScore || 'Unknown'}

Assess across:
1. Environmental (E): Climate action, resource management, pollution
2. Social (S): Labor practices, community impact, diversity
3. Governance (G): Board structure, ethics, transparency

Provide:
- Overall ESG maturity score (0-100)
- Scores for each pillar (E/S/G)
- Top 5 strengths
- Top 5 gaps vs. industry leaders
- 12-month improvement roadmap

Return as JSON with structure:
{
  "overallScore": number,
  "environmental": number,
  "social": number,
  "governance": number,
  "strengths": ["..."],
  "gaps": ["..."],
  "roadmap": [{"quarter": "Q1", "actions": ["..."]}]
}`;
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

export const esgAssessor = new ESGAssessor();
