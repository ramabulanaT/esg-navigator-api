import express from 'express';
import { claudeService } from '../services/claude.service';

const router = express.Router();

// Chat with Claude
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await claudeService.chat(message, conversationHistory || []);
    
    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze supplier
router.post('/analyze-supplier', async (req, res) => {
  try {
    const { supplierData } = req.body;
    
    if (!supplierData) {
      return res.status(400).json({ error: 'Supplier data is required' });
    }

    const analysis = await claudeService.analyzeSupplier(supplierData);
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate report
router.post('/generate-report', async (req, res) => {
  try {
    const { reportType = 'executive' } = req.body;
    
    const report = await claudeService.generateReport(reportType);
    
    res.json({
      success: true,
      report,
      reportType,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
