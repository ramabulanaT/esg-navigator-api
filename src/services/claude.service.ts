import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

// Lazy client — only instantiated on first use so missing key doesn't crash startup
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' });
  }
  return _anthropic;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeService {
  async chat(message: string, conversationHistory: ClaudeMessage[] = []): Promise<string> {
    try {
      const systemPrompt = `You are an ESG analyst for TIS-IntelliMat ESG Navigator.

CURRENT PORTFOLIO DATA:
- Total Supply Chain Value: R331M
- Overall ESG Compliance: 87.2%
- Active Suppliers: 5 major companies

SUPPLIER DETAILS:
1. Eskom Holdings - R120M (36%) - ESG Score: 65/100 - HIGH RISK
   Issues: 3 compliance violations, high carbon intensity
2. Multotec Processing - R89M (27%) - ESG Score: 76/100 - MEDIUM RISK
   Issues: 1 compliance issue
3. Anglo American Platinum - R67M (20%) - ESG Score: 82/100 - LOW RISK
   Issues: 0 violations - Best performer
4. Sasol Chemical Industries - R55M (17%) - ESG Score: 71/100 - MEDIUM RISK
   Issues: 2 compliance violations, high carbon intensity

Provide professional, actionable ESG analysis with specific recommendations.`;

      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: message }
      ];

      const response = await getAnthropic().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system: systemPrompt,
        messages: messages
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
      console.error('Claude API error:', error);
      throw new Error(`Claude AI Error: ${error.message}`);
    }
  }

  async analyzeSupplier(supplierData: any): Promise<any> {
    const prompt = `Analyze this supplier's ESG performance:

Supplier: ${supplierData.name}
Contract Value: ${supplierData.contractValue}
ESG Score: ${supplierData.esgScore}/100
Risk Level: ${supplierData.riskLevel}
Compliance Issues: ${supplierData.complianceIssues}

Provide detailed analysis in JSON format with:
{
  "riskScore": 0-100,
  "riskFactors": ["factor1", "factor2", "factor3"],
  "recommendations": [
    {
      "action": "specific action",
      "timeline": "timeframe",
      "priority": "high/medium/low"
    }
  ],
  "financialImpact": "estimated cost/savings"
}`;

    const response = await this.chat(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { analysis: response };
    } catch {
      return { analysis: response };
    }
  }

  async generateReport(reportType: string = 'executive'): Promise<string> {
    const prompt = `Generate a ${reportType} ESG report for TIS-IntelliMat portfolio.

Portfolio Summary:
- Total Value: R331M
- Overall Compliance: 87.2%
- Suppliers: 5
- High Risk Exposure: R120M (36%)

Key Issues:
- Eskom Holdings requires immediate attention
- 6 total compliance violations across portfolio
- 2 suppliers with high carbon intensity

Create a professional report with:
1. Executive Summary (2 paragraphs)
2. Portfolio Overview
3. Risk Analysis
4. Key Recommendations (top 3 priorities)
5. 90-Day Action Plan

Format for board presentation.`;

    return await this.chat(prompt);
  }
}

export const claudeService = new ClaudeService();
