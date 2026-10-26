import express from 'express';
import { supplierService } from '../services/supplier.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All supplier routes require authentication
// router.use(authenticate); // Temporarily disabled for testing

// Get all suppliers
router.get('/', (req, res) => {
  const suppliers = supplierService.getAllSuppliers();
  res.json({
    success: true,
    count: suppliers.length,
    suppliers
  });
});

// Get portfolio summary
router.get('/portfolio', (req, res) => {
  const portfolio = supplierService.getPortfolio();
  const stats = supplierService.getComplianceStats();
  const distribution = supplierService.getESGDistribution();

  res.json({
    success: true,
    portfolio,
    complianceStats: stats,
    esgDistribution: distribution
  });
});

// Get supplier by ID
router.get('/:id', (req, res) => {
  const supplier = supplierService.getSupplierById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }

  res.json({
    success: true,
    supplier
  });
});

// Get suppliers by risk level
router.get('/risk/:level', (req, res) => {
  const suppliers = supplierService.getSuppliersByRiskLevel(req.params.level);
  
  res.json({
    success: true,
    count: suppliers.length,
    riskLevel: req.params.level.toUpperCase(),
    suppliers
  });
});

// Get high-risk suppliers
router.get('/filter/high-risk', (req, res) => {
  const suppliers = supplierService.getHighRiskSuppliers();
  
  res.json({
    success: true,
    count: suppliers.length,
    totalExposure: suppliers.reduce((sum, s) => sum + s.contractValueNumeric, 0),
    suppliers
  });
});

// Get top performers
router.get('/filter/top-performers', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 3;
  const suppliers = supplierService.getTopPerformers(limit);
  
  res.json({
    success: true,
    count: suppliers.length,
    suppliers
  });
});

// Search suppliers
router.get('/search/:term', (req, res) => {
  const supplier = supplierService.getSupplierByName(req.params.term);
  
  if (!supplier) {
    return res.status(404).json({ error: 'No supplier found matching search term' });
  }

  res.json({
    success: true,
    supplier
  });
});

export default router;
