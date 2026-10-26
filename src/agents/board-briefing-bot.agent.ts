import { BaseAgent, AgentConfig } from './base.agent';

export class BoardBriefingBot extends BaseAgent {
  constructor() {
    super({
      name: 'Board Briefing Bot',
      role: 'Executive ESG Summary Generator',
      systemPrompt: `You create concise, executive-level ESG briefings for board meetings and C-suite decision making.`,
      capabilities: [
        'Executive summaries',
        'KPI dashboards',
        'Risk highlights',
        'Strategic recommendations'
      ]
    });
  }

  protected buildPrompt(data: any): string {
    return `Generate executive board briefing:

Period: ${data.period || 'Q4 2024'}
Audience: ${data.audience || 'Board of Directors'}
Focus Areas: ${data.focusAreas?.join(', ') || 'ESG Overview'}

Create executive briefing with:

**1. Executive Summary** (2 paragraphs)
- Overall ESG performance vs. targets
- Key achievements and challenges
- Strategic implications

**2. Performance Snapshot**
- ESG score: Current vs. prior period
- Portfolio risk exposure
- Compliance status
- Stakeholder sentiment

**3. Critical Issues** (Top 3)
- Issue description
- Business impact
- Recommended action
- Timeline

**4. Opportunities** (Top 3)
- Value creation potential
- Implementation approach
- Expected ROI

**5. Strategic Recommendations**
- Board decisions needed
- Resource requirements
- Next steps

Format: Professional, data-driven, action-oriented
Length: 2-3 pages maximum
Tone: Executive-level, strategic focus

Return as formatted text ready for presentation.`;
  }

  protected parseResponse(response: string): any {
    return { briefing: response };
  }
}

export const boardBriefingBot = new BoardBriefingBot();
