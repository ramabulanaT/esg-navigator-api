import { claudeService } from '../services/claude.service';

export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  capabilities: string[];
}

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async analyze(data: any): Promise<any> {
    const prompt = this.buildPrompt(data);
    const response = await claudeService.chat(prompt);
    return this.parseResponse(response);
  }

  protected abstract buildPrompt(data: any): string;
  protected abstract parseResponse(response: string): any;

  getInfo() {
    return {
      name: this.config.name,
      role: this.config.role,
      capabilities: this.config.capabilities
    };
  }
}
