import { Supplier, Portfolio } from '../models/supplier.model';

export const TIS_INTELLIMAT_PORTFOLIO: Portfolio = {
  totalValue: 'R331M',
  totalValueNumeric: 331000000,
  overallCompliance: '87.2%',
  activeSuppliers: 5,
  assessmentDate: '2024-10-15',
  riskDistribution: {
    low: 1,
    medium: 3,
    high: 1,
    critical: 0
  },
  byIndustry: {
    'Energy & Utilities': 120000000,
    'Mining Equipment': 89000000,
    'Mining & Resources': 67000000,
    'Chemicals': 55000000
  },
  topRisks: [
    'High carbon emissions from energy suppliers',
    'Supply chain disruption risk in critical sectors',
    'Regulatory compliance in high-risk jurisdictions',
    'ESG performance gaps in legacy suppliers'
  ]
};

export const TIS_INTELLIMAT_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'Eskom Holdings SOC Ltd',
    contractValue: 'R120M',
    contractValueNumeric: 120000000,
    esgScore: 65,
    riskLevel: 'HIGH',
    carbonIntensity: 'high',
    complianceIssues: 3,
    certifications: ['ISO 14001:2015'],
    lastAudit: '2024-08-15',
    nextAuditDue: '2025-02-15',
    
    contact: {
      primaryContact: 'Supply Chain Manager',
      email: 'procurement@eskom.co.za',
      phone: '+27 11 800 8111',
      address: 'Megawatt Park, Maxwell Drive, Sunninghill',
      country: 'South Africa'
    },
    
    esgBreakdown: {
      environmental: 58,
      social: 68,
      governance: 69
    },
    
    compliance: {
      standards: ['ISO 14001', 'OHSAS 18001'],
      violations: [
        {
          date: '2024-06-20',
          type: 'Environmental',
          severity: 'major',
          description: 'Exceeded emission limits at Kendal Power Station',
          status: 'in-progress',
          remediation: 'Installing new scrubber technology, completion Q2 2025'
        },
        {
          date: '2024-03-10',
          type: 'Health & Safety',
          severity: 'moderate',
          description: 'Inadequate safety protocols at Matla station',
          status: 'resolved',
          remediation: 'Updated safety procedures and retraining completed'
        },
        {
          date: '2024-01-05',
          type: 'Governance',
          severity: 'minor',
          description: 'Late submission of sustainability report',
          status: 'resolved',
          remediation: 'Improved reporting processes implemented'
        }
      ],
      auditHistory: [
        {
          date: '2024-08-15',
          auditor: 'TIS ESG Audit Team',
          type: 'Comprehensive ESG Audit',
          findings: [
            'High carbon intensity requires urgent attention',
            'Strong governance framework in place',
            'Community engagement programs effective'
          ],
          score: 65,
          recommendations: [
            'Accelerate renewable energy transition',
            'Improve emissions monitoring systems',
            'Enhance supplier diversity programs'
          ]
        }
      ]
    },
    
    financial: {
      annualRevenue: 'R204B',
      employeeCount: 43000,
      yearsInBusiness: 99,
      paymentTerms: '60 days',
      creditRating: 'BB-'
    },
    
    risks: [
      {
        category: 'Environmental',
        severity: 'high',
        description: 'Coal-dependent operations with high emissions',
        mitigationPlan: 'Transition plan to 20% renewables by 2030'
      },
      {
        category: 'Operational',
        severity: 'high',
        description: 'Load-shedding impacts reliability',
        mitigationPlan: 'Diversification strategy with alternative suppliers'
      },
      {
        category: 'Financial',
        severity: 'medium',
        description: 'High debt levels and liquidity concerns',
        mitigationPlan: 'Monthly financial health monitoring'
      }
    ],
    
    performance: {
      onTimeDelivery: 78,
      qualityScore: 82,
      responsiveness: 75,
      innovation: 65
    }
  },
  
  {
    id: '2',
    name: 'Multotec Processing Equipment (Pty) Ltd',
    contractValue: 'R89M',
    contractValueNumeric: 89000000,
    esgScore: 76,
    riskLevel: 'MEDIUM',
    carbonIntensity: 'medium',
    complianceIssues: 1,
    certifications: ['ISO 14001:2015', 'OHSAS 18001:2007', 'ISO 9001:2015'],
    lastAudit: '2024-09-01',
    nextAuditDue: '2025-03-01',
    
    contact: {
      primaryContact: 'ESG Compliance Officer',
      email: 'sustainability@multotec.com',
      phone: '+27 11 923 7300',
      address: '1 Allandale Road, Midrand',
      country: 'South Africa'
    },
    
    esgBreakdown: {
      environmental: 74,
      social: 79,
      governance: 75
    },
    
    compliance: {
      standards: ['ISO 14001', 'ISO 9001', 'OHSAS 18001', 'B-BBEE Level 2'],
      violations: [
        {
          date: '2024-05-12',
          type: 'Social',
          severity: 'minor',
          description: 'Skills development plan targets not met',
          status: 'in-progress',
          remediation: 'Enhanced training program launched Q3 2024'
        }
      ],
      auditHistory: [
        {
          date: '2024-09-01',
          auditor: 'SGS South Africa',
          type: 'ISO 14001 Surveillance Audit',
          findings: [
            'Strong environmental management system',
            'Effective waste reduction programs',
            'Good stakeholder engagement'
          ],
          score: 76,
          recommendations: [
            'Expand renewable energy usage',
            'Enhance supply chain ESG screening',
            'Improve water conservation measures'
          ]
        }
      ]
    },
    
    financial: {
      annualRevenue: 'R2.5B',
      employeeCount: 1200,
      yearsInBusiness: 45,
      paymentTerms: '45 days',
      creditRating: 'A-'
    },
    
    risks: [
      {
        category: 'Social',
        severity: 'medium',
        description: 'Skills shortage in specialized manufacturing',
        mitigationPlan: 'Partnership with technical colleges for training'
      },
      {
        category: 'Operational',
        severity: 'low',
        description: 'Dependency on mining sector demand',
        mitigationPlan: 'Diversification into water treatment sector'
      }
    ],
    
    performance: {
      onTimeDelivery: 89,
      qualityScore: 91,
      responsiveness: 88,
      innovation: 84
    }
  },
  
  {
    id: '3',
    name: 'Anglo American Platinum Limited',
    contractValue: 'R67M',
    contractValueNumeric: 67000000,
    esgScore: 82,
    riskLevel: 'LOW',
    carbonIntensity: 'low',
    complianceIssues: 0,
    certifications: ['ISO 14001:2015', 'ISO 45001:2018', 'SA 8000:2014', 'ISO 50001:2018'],
    lastAudit: '2024-09-20',
    nextAuditDue: '2025-03-20',
    
    contact: {
      primaryContact: 'Head of Sustainability',
      email: 'sustainability@angloamerican.com',
      phone: '+27 11 638 9111',
      address: '55 Marshall Street, Johannesburg',
      country: 'South Africa'
    },
    
    esgBreakdown: {
      environmental: 85,
      social: 81,
      governance: 80
    },
    
    compliance: {
      standards: ['ISO 14001', 'ISO 45001', 'SA 8000', 'ISO 50001', 'TCFD', 'GRI', 'SASB'],
      violations: [],
      auditHistory: [
        {
          date: '2024-09-20',
          auditor: 'EY Climate Change and Sustainability',
          type: 'Comprehensive ESG Assessment',
          findings: [
            'Industry-leading ESG practices',
            'Strong climate action commitment',
            'Excellent community development programs',
            'Transparent governance and reporting'
          ],
          score: 82,
          recommendations: [
            'Continue Scope 3 emissions reduction focus',
            'Expand biodiversity conservation initiatives',
            'Further enhance circular economy practices'
          ]
        }
      ]
    },
    
    financial: {
      annualRevenue: 'R134B',
      employeeCount: 65000,
      yearsInBusiness: 100,
      paymentTerms: '30 days',
      creditRating: 'A+'
    },
    
    risks: [
      {
        category: 'Environmental',
        severity: 'low',
        description: 'Water usage in water-scarce regions',
        mitigationPlan: 'Water recycling achieving 75% reuse rate'
      },
      {
        category: 'Social',
        severity: 'low',
        description: 'Community relations at mining sites',
        mitigationPlan: 'Active stakeholder engagement and benefit-sharing'
      }
    ],
    
    performance: {
      onTimeDelivery: 94,
      qualityScore: 96,
      responsiveness: 93,
      innovation: 91
    }
  },
  
  {
    id: '4',
    name: 'Sasol Chemical Industries Limited',
    contractValue: 'R55M',
    contractValueNumeric: 55000000,
    esgScore: 71,
    riskLevel: 'MEDIUM',
    carbonIntensity: 'high',
    complianceIssues: 2,
    certifications: ['ISO 14001:2015', 'ISO 9001:2015', 'RC14001'],
    lastAudit: '2024-08-30',
    nextAuditDue: '2025-02-28',
    
    contact: {
      primaryContact: 'Sustainability Manager',
      email: 'sustainability@sasol.com',
      phone: '+27 10 344 5000',
      address: '1 Sturdee Avenue, Rosebank',
      country: 'South Africa'
    },
    
    esgBreakdown: {
      environmental: 66,
      social: 73,
      governance: 74
    },
    
    compliance: {
      standards: ['ISO 14001', 'ISO 9001', 'Responsible Care'],
      violations: [
        {
          date: '2024-07-15',
          type: 'Environmental',
          severity: 'moderate',
          description: 'Air quality exceedance at Secunda operations',
          status: 'in-progress',
          remediation: 'Air quality improvement plan submitted to regulator'
        },
        {
          date: '2024-04-22',
          type: 'Environmental',
          severity: 'minor',
          description: 'Delayed submission of emissions report',
          status: 'resolved',
          remediation: 'Report submitted with updated procedures'
        }
      ],
      auditHistory: [
        {
          date: '2024-08-30',
          auditor: 'Bureau Veritas',
          type: 'ISO 14001 Certification Audit',
          findings: [
            'Comprehensive environmental management system',
            'Active emissions reduction initiatives',
            'Strong safety culture'
          ],
          score: 71,
          recommendations: [
            'Accelerate decarbonization roadmap',
            'Enhance air quality monitoring',
            'Improve biodiversity impact assessments'
          ]
        }
      ]
    },
    
    financial: {
      annualRevenue: 'R192B',
      employeeCount: 30000,
      yearsInBusiness: 72,
      paymentTerms: '45 days',
      creditRating: 'BBB+'
    },
    
    risks: [
      {
        category: 'Environmental',
        severity: 'high',
        description: 'Coal-to-liquids technology with high emissions',
        mitigationPlan: 'Green hydrogen and renewable energy transition plan'
      },
      {
        category: 'Regulatory',
        severity: 'medium',
        description: 'Increasing carbon tax exposure',
        mitigationPlan: 'Carbon offset programs and efficiency improvements'
      },
      {
        category: 'Reputational',
        severity: 'medium',
        description: 'Public pressure on fossil fuel activities',
        mitigationPlan: 'Transparent communication of sustainability strategy'
      }
    ],
    
    performance: {
      onTimeDelivery: 85,
      qualityScore: 88,
      responsiveness: 83,
      innovation: 79
    }
  },
  
  {
    id: '5',
    name: 'Siemens South Africa (Pty) Ltd',
    contractValue: 'R45M',
    contractValueNumeric: 45000000,
    esgScore: 88,
    riskLevel: 'LOW',
    carbonIntensity: 'low',
    complianceIssues: 0,
    certifications: ['ISO 14001:2015', 'ISO 45001:2018', 'ISO 50001:2018', 'ISO 27001:2013'],
    lastAudit: '2024-10-05',
    nextAuditDue: '2025-04-05',
    
    contact: {
      primaryContact: 'Head of ESG',
      email: 'esg.za@siemens.com',
      phone: '+27 11 652 2000',
      address: '108 Leeukop Road, Sunninghill',
      country: 'South Africa'
    },
    
    esgBreakdown: {
      environmental: 91,
      social: 86,
      governance: 87
    },
    
    compliance: {
      standards: ['ISO 14001', 'ISO 45001', 'ISO 50001', 'ISO 27001', 'CDP', 'SBTi', 'UN Global Compact'],
      violations: [],
      auditHistory: [
        {
          date: '2024-10-05',
          auditor: 'TÜV SÜD',
          type: 'Integrated Management System Audit',
          findings: [
            'World-class ESG management',
            'Carbon neutral operations achieved',
            'Industry-leading innovation in sustainability',
            'Exemplary governance and ethics'
          ],
          score: 88,
          recommendations: [
            'Continue supply chain decarbonization',
            'Expand circular economy initiatives',
            'Enhance biodiversity programs'
          ]
        }
      ]
    },
    
    financial: {
      annualRevenue: 'R8.5B',
      employeeCount: 2500,
      yearsInBusiness: 126,
      paymentTerms: '30 days',
      creditRating: 'AA'
    },
    
    risks: [
      {
        category: 'Cyber Security',
        severity: 'low',
        description: 'Digital infrastructure security',
        mitigationPlan: 'ISO 27001 certified with continuous monitoring'
      }
    ],
    
    performance: {
      onTimeDelivery: 97,
      qualityScore: 98,
      responsiveness: 96,
      innovation: 95
    }
  }
];
