import { esgAssessor } from './esg-assessor.agent';
import { standardsMapper } from './standards-mapper.agent';
import { emissionsAccountant } from './emissions-accountant.agent';
import { assuranceCopilot } from './assurance-copilot.agent';
import { tsfWatch } from './tsf-watch.agent';
import { iso50001Coach } from './iso50001-coach.agent';
import { energyOptimizer } from './energy-optimizer.agent';
import { supplierScreener } from './supplier-screener.agent';
import { boardBriefingBot } from './board-briefing-bot.agent';

export class AgentManager {
  private agents = {
    esgAssessor,
    standardsMapper,
    emissionsAccountant,
    assuranceCopilot,
    tsfWatch,
    iso50001Coach,
    energyOptimizer,
    supplierScreener,
    boardBriefingBot
  };

  getAgent(name: string) {
    return this.agents[name as keyof typeof this.agents];
  }

  getAllAgents() {
    return Object.values(this.agents).map(agent => agent.getInfo());
  }

  async runAgent(name: string, data: any) {
    const agent = this.getAgent(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }
    return await agent.analyze(data);
  }
}

export const agentManager = new AgentManager();
