/**
 * watsonx Orchestrate Integration Service
 * Handles skill registration and workflow automation with IBM watsonx Orchestrate
 */

interface WatsonxConfig {
  apiKey: string;
  orchestrateUrl: string;
  instanceId: string;
}

interface WatsonxSkill {
  id: string;
  name: string;
  description: string;
  version: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  endpoint: string;
}

interface WatsonxSkillInvocation {
  skill_id: string;
  inputs: Record<string, any>;
  context?: Record<string, any>;
}

interface WatsonxSkillResult {
  success: boolean;
  outputs: Record<string, any>;
  execution_time_ms: number;
  errors?: string[];
}

export class WatsonxService {
  private config: WatsonxConfig;
  private iamToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<WatsonxConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.WATSONX_API_KEY || '',
      orchestrateUrl: config?.orchestrateUrl || process.env.WATSONX_ORCHESTRATE_URL || 'https://orchestrate.watsonx.ibm.com',
      instanceId: config?.instanceId || process.env.WATSONX_INSTANCE_ID || '',
    };
  }

  /**
   * Get IBM Cloud IAM token
   */
  private async getIAMToken(): Promise<string> {
    // Check if we have a valid token
    if (this.iamToken && this.tokenExpiry > Date.now()) {
      return this.iamToken;
    }

    // Get new token
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: this.config.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get IAM token: ${response.statusText}`);
    }

    const data = await response.json();
    this.iamToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Subtract 60s buffer

    return this.iamToken!;
  }

  /**
   * Register a skill with watsonx Orchestrate
   */
  async registerSkill(skill: WatsonxSkill): Promise<{ success: boolean; skill_id: string }> {
    const token = await this.getIAMToken();

    const response = await fetch(`${this.config.orchestrateUrl}/v1/skills`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance_id: this.config.instanceId,
        skill,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register skill: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Invoke a skill
   */
  async invokeSkill(invocation: WatsonxSkillInvocation): Promise<WatsonxSkillResult> {
    const token = await this.getIAMToken();
    const startTime = Date.now();

    const response = await fetch(`${this.config.orchestrateUrl}/v1/skills/${invocation.skill_id}/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance_id: this.config.instanceId,
        inputs: invocation.inputs,
        context: invocation.context,
      }),
    });

    const executionTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        outputs: {},
        execution_time_ms: executionTime,
        errors: [`Skill invocation failed: ${response.statusText}`],
      };
    }

    const data = await response.json();
    return {
      success: true,
      outputs: data.outputs,
      execution_time_ms: executionTime,
    };
  }

  /**
   * Create a workflow
   */
  async createWorkflow(workflow: {
    name: string;
    description: string;
    steps: Array<{
      skill_id: string;
      inputs: Record<string, any>;
      condition?: string;
    }>;
  }): Promise<{ success: boolean; workflow_id: string }> {
    const token = await this.getIAMToken();

    const response = await fetch(`${this.config.orchestrateUrl}/v1/workflows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance_id: this.config.instanceId,
        workflow,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any>
  ): Promise<{ success: boolean; results: any[] }> {
    const token = await this.getIAMToken();

    const response = await fetch(`${this.config.orchestrateUrl}/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance_id: this.config.instanceId,
        inputs,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute workflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const token = await this.getIAMToken();

    const response = await fetch(`${this.config.orchestrateUrl}/v1/health`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
let watsonxServiceInstance: WatsonxService | null = null;

export function getWatsonxService(): WatsonxService {
  if (!watsonxServiceInstance) {
    watsonxServiceInstance = new WatsonxService();
  }
  return watsonxServiceInstance;
}

export default WatsonxService;

// Made with Bob
