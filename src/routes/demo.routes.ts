import express from 'express';
import { agentManager } from '../agents/agent-manager';

const router = express.Router();

// Public demo endpoint - showcases AI capabilities
router.get('/', async (req, res) => {
  try {
    const agents = agentManager.getAllAgents();
    
    // Demo data for supplier screening
    const demoSupplier = {
      name: "Green Energy Corp",
      industry: "Solar Manufacturing",
      location: "South Africa",
      revenue: "R50M",
      employees: 250
    };
    
    // Run supplier screener agent
    const screeningResult = await agentManager.runAgent('supplierScreener', demoSupplier);
    
    res.json({
      success: true,
      message: "ESG Navigator AI Demo",
      stats: {
        totalAgents: agents.length,
        claudeConfigured: true,
        availableAgents: agents.map(a => ({
          name: a.name,
          role: a.role
        }))
      },
      demoAnalysis: {
        supplier: demoSupplier,
        aiAssessment: screeningResult
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      message: "Demo endpoint is available but agent execution failed"
    });
  }
});

export default router;