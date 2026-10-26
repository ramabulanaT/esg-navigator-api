export interface Supplier {
  id: string;
  name: string;
  contractValue: string;
  contractValueNumeric: number;
  esgScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  carbonIntensity: 'low' | 'medium' | 'high';
  complianceIssues: number;
  certifications: string[];
  lastAudit: string;
  nextAuditDue: string;
  
  // Contact Information
  contact: {
    primaryContact: string;
    email: string;
    phone: string;
    address: string;
    country: string;
  };
  
  // ESG Breakdown
  esgBreakdown: {
    environmental: number;
    social: number;
    governance: number;
  };
  
  // Compliance Details
  compliance: {
    standards: string[];
    violations: ComplianceViolation[];
    auditHistory: AuditRecord[];
  };
  
  // Financial
  financial: {
    annualRevenue: string;
    employeeCount: number;
    yearsInBusiness: number;
    paymentTerms: string;
    creditRating: string;
  };
  
  // Risk Factors
  risks: {
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigationPlan: string;
  }[];
  
  // Performance Metrics
  performance: {
    onTimeDelivery: number;
    qualityScore: number;
    responsiveness: number;
    innovation: number;
  };
}

export interface ComplianceViolation {
  date: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  status: 'open' | 'resolved' | 'in-progress';
  remediation: string;
}

export interface AuditRecord {
  date: string;
  auditor: string;
  type: string;
  findings: string[];
  score: number;
  recommendations: string[];
}

export interface Portfolio {
  totalValue: string;
  totalValueNumeric: number;
  overallCompliance: string;
  activeSuppliers: number;
  assessmentDate: string;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byIndustry: {
    [key: string]: number;
  };
  topRisks: string[];
}
