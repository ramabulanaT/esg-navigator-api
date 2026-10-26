import { TIS_INTELLIMAT_SUPPLIERS, TIS_INTELLIMAT_PORTFOLIO } from '../data/suppliers.data';
import { Supplier, Portfolio } from '../models/supplier.model';

export class SupplierService {
  getAllSuppliers(): Supplier[] {
    return TIS_INTELLIMAT_SUPPLIERS;
  }

  getSupplierById(id: string): Supplier | null {
    return TIS_INTELLIMAT_SUPPLIERS.find(s => s.id === id) || null;
  }

  getSupplierByName(name: string): Supplier | null {
    return TIS_INTELLIMAT_SUPPLIERS.find(
      s => s.name.toLowerCase().includes(name.toLowerCase())
    ) || null;
  }

  getPortfolio(): Portfolio {
    return TIS_INTELLIMAT_PORTFOLIO;
  }

  getSuppliersByRiskLevel(riskLevel: string): Supplier[] {
    return TIS_INTELLIMAT_SUPPLIERS.filter(
      s => s.riskLevel === riskLevel.toUpperCase()
    );
  }

  getSuppliersByScoreRange(min: number, max: number): Supplier[] {
    return TIS_INTELLIMAT_SUPPLIERS.filter(
      s => s.esgScore >= min && s.esgScore <= max
    );
  }

  getTopPerformers(limit: number = 3): Supplier[] {
    return [...TIS_INTELLIMAT_SUPPLIERS]
      .sort((a, b) => b.esgScore - a.esgScore)
      .slice(0, limit);
  }

  getHighRiskSuppliers(): Supplier[] {
    return TIS_INTELLIMAT_SUPPLIERS.filter(
      s => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL'
    );
  }

  getTotalContractValue(): number {
    return TIS_INTELLIMAT_SUPPLIERS.reduce(
      (sum, s) => sum + s.contractValueNumeric,
      0
    );
  }

  getComplianceStats() {
    const total = TIS_INTELLIMAT_SUPPLIERS.length;
    const withIssues = TIS_INTELLIMAT_SUPPLIERS.filter(s => s.complianceIssues > 0).length;
    const totalIssues = TIS_INTELLIMAT_SUPPLIERS.reduce((sum, s) => sum + s.complianceIssues, 0);

    return {
      totalSuppliers: total,
      suppliersWithIssues: withIssues,
      suppliersCompliant: total - withIssues,
      totalIssues,
      complianceRate: ((total - withIssues) / total * 100).toFixed(1) + '%'
    };
  }

  getESGDistribution() {
    return {
      excellent: TIS_INTELLIMAT_SUPPLIERS.filter(s => s.esgScore >= 80).length,
      good: TIS_INTELLIMAT_SUPPLIERS.filter(s => s.esgScore >= 70 && s.esgScore < 80).length,
      fair: TIS_INTELLIMAT_SUPPLIERS.filter(s => s.esgScore >= 60 && s.esgScore < 70).length,
      poor: TIS_INTELLIMAT_SUPPLIERS.filter(s => s.esgScore < 60).length
    };
  }
}

export const supplierService = new SupplierService();
