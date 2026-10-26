import express from 'express';
import { agentManager } from '../agents/agent-manager';

const router = express.Router();

// List all agents
router.get('/', (req, res) => {
  const agents = agentManager.getAllAgents();
  res.json({
    success: true,
    count: agents.length,
    agents
  });
});

// Run specific agent
router.post('/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const data = req.body;

    const result = await agentManager.runAgent(agentName, data);

    res.json({
      success: true,
      agent: agentName,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
