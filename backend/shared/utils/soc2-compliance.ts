import { createHash, randomBytes } from 'crypto';
import { AuditLogger } from './audit';

export interface SOC2Control {
  id: string;
  category: 'CC' | 'A' | 'PI' | 'P' | 'C'; // Common Criteria, Availability, Processing Integrity, Privacy, Confidentiality
  name: string;
  description: string;
  implementation: string;
  testProcedure: string;
  frequency: 'Continuous' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  owner: string;
  status: 'Implemented' | 'In Progress' | 'Not Implemented';
  lastTested?: Date;
  evidence: string[];
}

export interface SecurityIncident {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  description: string;
  detectedAt: Date;
  reportedAt: Date;
  resolvedAt?: Date;
  impact: string;
  rootCause?: string;
  remediation: string;
  preventiveMeasures: string[];
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface ComplianceEvidence {
  id: string;
  controlId: string;
  type: 'Document' | 'Screenshot' | 'Log' | 'Certificate' | 'Report';
  title: string;
  description: string;
  filePath?: string;
  content?: string;
  collectedAt: Date;
  validUntil?: Date;
  tags: string[];
}

export interface RiskAssessment {
  id: string;
  asset: string;
  threat: string;
  vulnerability: string;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  riskScore: number;
  currentControls: string[];
  residualRisk: number;
  mitigationPlan: string;
  owner: string;
  reviewDate: Date;
  status: 'Open' | 'Mitigated' | 'Accepted' | 'Transferred';
}

export class SOC2ComplianceService {
  private auditLogger: AuditLogger;
  
  constructor() {
    this.auditLogger = new AuditLogger();
  }

  private readonly controls: SOC2Control[] = [
    // Common Criteria Controls
    {
      id: 'CC1.1',
      category: 'CC',
      name: 'Control Environment',
      description: 'The entity demonstrates a commitment to integrity and ethical values',
      implementation: 'Code of conduct, ethics training, background checks for all personnel',
      testProcedure: 'Review code of conduct acknowledgments, training records, and background check documentation',
      frequency: 'Annually',
      owner: 'CISO',
      status: 'Implemented',
      evidence: ['code-of-conduct.pdf', 'ethics-training-records.xlsx', 'background-check-policy.pdf']
    },
    {
      id: 'CC2.1',
      category: 'CC',
      name: 'Communication and Information',
      description: 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control',
      implementation: 'Centralized logging, monitoring dashboards, regular security reports',
      testProcedure: 'Review log aggregation systems, dashboard configurations, and report distribution lists',
      frequency: 'Quarterly',
      owner: 'IT Operations',
      status: 'Implemented',
      evidence: ['logging-architecture.pdf', 'monitoring-dashboard-config.json', 'security-reports.pdf']
    },
    {
      id: 'CC3.1',
      category: 'CC',
      name: 'Risk Assessment',
      description: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks',
      implementation: 'Annual risk assessments, threat modeling, vulnerability scanning',
      testProcedure: 'Review risk assessment methodology, threat models, and vulnerability scan reports',
      frequency: 'Annually',
      owner: 'Security Team',
      status: 'Implemented',
      evidence: ['risk-assessment-2024.pdf', 'threat-model-docs/', 'vulnerability-scan-reports/']
    },
    {
      id: 'CC4.1',
      category: 'CC',
      name: 'Monitoring Activities',
      description: 'The entity selects, develops, and performs ongoing and/or separate evaluations',
      implementation: 'Continuous security monitoring, SIEM alerts, automated compliance checks',
      testProcedure: 'Review SIEM configurations, alert responses, and compliance automation',
      frequency: 'Continuous',
      owner: 'SOC Team',
      status: 'Implemented',
      evidence: ['siem-config.json', 'alert-playbooks/', 'compliance-automation-scripts/']
    },
    {
      id: 'CC5.1',
      category: 'CC',
      name: 'Control Activities',
      description: 'The entity selects and develops control activities that contribute to the mitigation of risks',
      implementation: 'Access controls, data encryption, secure development practices',
      testProcedure: 'Review access control matrices, encryption implementations, and development standards',
      frequency: 'Quarterly',
      owner: 'Security Team',
      status: 'Implemented',
      evidence: ['access-control-matrix.xlsx', 'encryption-standards.pdf', 'secure-dev-guidelines.pdf']
    },
    
    // Availability Controls
    {
      id: 'A1.1',
      category: 'A',
      name: 'System Availability',
      description: 'The entity maintains availability commitments and system requirements',
      implementation: 'Load balancing, auto-scaling, redundant infrastructure, 99.9% SLA',
      testProcedure: 'Review uptime metrics, incident reports, and SLA compliance',
      frequency: 'Monthly',
      owner: 'Infrastructure Team',
      status: 'Implemented',
      evidence: ['uptime-reports/', 'sla-compliance.pdf', 'infrastructure-diagrams.pdf']
    },
    {
      id: 'A1.2',
      category: 'A',
      name: 'Backup and Recovery',
      description: 'The entity implements backup and recovery procedures',
      implementation: 'Automated daily backups, cross-region replication, tested recovery procedures',
      testProcedure: 'Review backup logs, test recovery procedures, verify RTO/RPO metrics',
      frequency: 'Monthly',
      owner: 'Infrastructure Team',
      status: 'Implemented',
      evidence: ['backup-logs/', 'recovery-test-results.pdf', 'rto-rpo-metrics.xlsx']
    },

    // Processing Integrity Controls
    {
      id: 'PI1.1',
      category: 'PI',
      name: 'Data Processing Integrity',
      description: 'The entity implements controls to ensure data processing is complete and accurate',
      implementation: 'Data validation, checksums, transaction logging, automated testing',
      testProcedure: 'Review validation rules, checksum implementations, and test coverage',
      frequency: 'Quarterly',
      owner: 'Development Team',
      status: 'Implemented',
      evidence: ['validation-rules.pdf', 'checksum-implementations.pdf', 'test-coverage-reports/']
    },

    // Privacy Controls
    {
      id: 'P1.1',
      category: 'P',
      name: 'Privacy Notice',
      description: 'The entity provides notice to data subjects about privacy practices',
      implementation: 'Privacy policy, consent management, data subject notifications',
      testProcedure: 'Review privacy policy, consent records, and notification procedures',
      frequency: 'Annually',
      owner: 'Legal Team',
      status: 'Implemented',
      evidence: ['privacy-policy.pdf', 'consent-management-system.pdf', 'notification-procedures.pdf']
    },
    {
      id: 'P2.1',
      category: 'P',
      name: 'Choice and Consent',
      description: 'The entity communicates choices available regarding collection, use, retention, and disposal of personal information',
      implementation: 'Granular consent options, opt-out mechanisms, preference management',
      testProcedure: 'Review consent mechanisms, opt-out processes, and preference settings',
      frequency: 'Quarterly',
      owner: 'Privacy Team',
      status: 'Implemented',
      evidence: ['consent-mechanisms.pdf', 'opt-out-processes.pdf', 'preference-management.pdf']
    },

    // Confidentiality Controls
    {
      id: 'C1.1',
      category: 'C',
      name: 'Access Controls',
      description: 'The entity controls logical and physical access to systems and data',
      implementation: 'Multi-factor authentication, role-based access, privileged access management',
      testProcedure: 'Review access logs, role assignments, and PAM configurations',
      frequency: 'Monthly',
      owner: 'Security Team',
      status: 'Implemented',
      evidence: ['access-logs/', 'role-assignments.xlsx', 'pam-config.pdf']
    },
    {
      id: 'C1.2',
      category: 'C',
      name: 'Data Encryption',
      description: 'The entity protects confidential information through encryption',
      implementation: 'AES-256 encryption at rest and in transit, key management system',
      testProcedure: 'Review encryption implementations, key rotation logs, and cipher suites',
      frequency: 'Quarterly',
      owner: 'Security Team',
      status: 'Implemented',
      evidence: ['encryption-implementation.pdf', 'key-rotation-logs/', 'cipher-suite-config.pdf']
    }
  ];

  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const report = {
      reportId: randomBytes(16).toString('hex'),
      generatedAt: new Date(),
      period: { startDate, endDate },
      summary: {
        totalControls: this.controls.length,
        implementedControls: this.controls.filter(c => c.status === 'Implemented').length,
        controlsByCategory: this.getControlsByCategory(),
        overallComplianceScore: this.calculateComplianceScore()
      },
      controlAssessments: await this.assessControls(),
      gaps: this.identifyGaps(),
      recommendations: this.generateRecommendations(),
      evidence: await this.collectEvidence()
    };

    await this.auditLogger.log({
      action: 'generate_compliance_report',
      userId: 'system',
      resource: 'soc2_compliance',
      details: { reportId: report.reportId, period: report.period }
    });

    return report;
  }

  private getControlsByCategory(): Record<string, number> {
    return this.controls.reduce((acc, control) => {
      acc[control.category] = (acc[control.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateComplianceScore(): number {
    const implementedControls = this.controls.filter(c => c.status === 'Implemented').length;
    return Math.round((implementedControls / this.controls.length) * 100);
  }

  private async assessControls(): Promise<any[]> {
    return this.controls.map(control => ({
      ...control,
      lastAssessment: this.performControlAssessment(control),
      effectivenessRating: this.calculateEffectiveness(control),
      testingResults: this.getTestingResults(control)
    }));
  }

  private performControlAssessment(control: SOC2Control): any {
    return {
      assessedAt: new Date(),
      assessor: 'Automated Assessment',
      findings: this.generateFindings(control),
      effectiveness: this.calculateEffectiveness(control),
      status: control.status
    };
  }

  private calculateEffectiveness(control: SOC2Control): 'Effective' | 'Partially Effective' | 'Ineffective' {
    if (control.status === 'Implemented' && control.evidence.length > 0) {
      return 'Effective';
    } else if (control.status === 'In Progress') {
      return 'Partially Effective';
    }
    return 'Ineffective';
  }

  private generateFindings(control: SOC2Control): string[] {
    const findings: string[] = [];
    
    if (!control.lastTested || this.isTestingOverdue(control)) {
      findings.push('Control testing is overdue');
    }
    
    if (control.evidence.length === 0) {
      findings.push('No evidence documented for this control');
    }
    
    if (control.status !== 'Implemented') {
      findings.push('Control is not fully implemented');
    }
    
    return findings;
  }

  private isTestingOverdue(control: SOC2Control): boolean {
    if (!control.lastTested) return true;
    
    const now = new Date();
    const daysSinceTest = (now.getTime() - control.lastTested.getTime()) / (1000 * 60 * 60 * 24);
    
    switch (control.frequency) {
      case 'Daily': return daysSinceTest > 1;
      case 'Weekly': return daysSinceTest > 7;
      case 'Monthly': return daysSinceTest > 30;
      case 'Quarterly': return daysSinceTest > 90;
      case 'Annually': return daysSinceTest > 365;
      case 'Continuous': return false;
      default: return true;
    }
  }

  private getTestingResults(control: SOC2Control): any {
    return {
      lastTested: control.lastTested,
      isOverdue: this.isTestingOverdue(control),
      nextTestDue: this.calculateNextTestDate(control),
      testingFrequency: control.frequency
    };
  }

  private calculateNextTestDate(control: SOC2Control): Date {
    const lastTest = control.lastTested || new Date();
    const nextTest = new Date(lastTest);
    
    switch (control.frequency) {
      case 'Daily': nextTest.setDate(nextTest.getDate() + 1); break;
      case 'Weekly': nextTest.setDate(nextTest.getDate() + 7); break;
      case 'Monthly': nextTest.setMonth(nextTest.getMonth() + 1); break;
      case 'Quarterly': nextTest.setMonth(nextTest.getMonth() + 3); break;
      case 'Annually': nextTest.setFullYear(nextTest.getFullYear() + 1); break;
      case 'Continuous': return lastTest;
    }
    
    return nextTest;
  }

  private identifyGaps(): string[] {
    const gaps: string[] = [];
    
    const notImplemented = this.controls.filter(c => c.status === 'Not Implemented');
    if (notImplemented.length > 0) {
      gaps.push(`${notImplemented.length} controls not implemented`);
    }
    
    const overdueTests = this.controls.filter(c => this.isTestingOverdue(c));
    if (overdueTests.length > 0) {
      gaps.push(`${overdueTests.length} controls have overdue testing`);
    }
    
    const missingEvidence = this.controls.filter(c => c.evidence.length === 0);
    if (missingEvidence.length > 0) {
      gaps.push(`${missingEvidence.length} controls missing evidence documentation`);
    }
    
    return gaps;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.calculateComplianceScore() < 95) {
      recommendations.push('Implement remaining controls to achieve full SOC 2 compliance');
    }
    
    const overdueTests = this.controls.filter(c => this.isTestingOverdue(c));
    if (overdueTests.length > 0) {
      recommendations.push('Update testing schedule and complete overdue control tests');
    }
    
    recommendations.push('Conduct quarterly compliance reviews with stakeholders');
    recommendations.push('Implement automated compliance monitoring where possible');
    recommendations.push('Regular training for control owners on SOC 2 requirements');
    
    return recommendations;
  }

  private async collectEvidence(): Promise<ComplianceEvidence[]> {
    return this.controls.flatMap(control => 
      control.evidence.map(evidenceRef => ({
        id: createHash('sha256').update(control.id + evidenceRef).digest('hex').substring(0, 16),
        controlId: control.id,
        type: this.inferEvidenceType(evidenceRef),
        title: evidenceRef,
        description: `Evidence for control ${control.id}: ${control.name}`,
        filePath: `/evidence/${evidenceRef}`,
        collectedAt: new Date(),
        tags: [control.category, control.name.toLowerCase().replace(/\s+/g, '-')]
      }))
    );
  }

  private inferEvidenceType(evidenceRef: string): ComplianceEvidence['type'] {
    if (evidenceRef.endsWith('.pdf')) return 'Document';
    if (evidenceRef.endsWith('.png') || evidenceRef.endsWith('.jpg')) return 'Screenshot';
    if (evidenceRef.includes('log')) return 'Log';
    if (evidenceRef.includes('cert')) return 'Certificate';
    if (evidenceRef.includes('report')) return 'Report';
    return 'Document';
  }

  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'detectedAt'>): Promise<SecurityIncident> {
    const newIncident: SecurityIncident = {
      ...incident,
      id: randomBytes(16).toString('hex'),
      detectedAt: new Date()
    };

    await this.auditLogger.log({
      action: 'create_security_incident',
      userId: 'system',
      resource: 'security_incident',
      details: { 
        incidentId: newIncident.id, 
        severity: newIncident.severity,
        category: newIncident.category 
      }
    });

    return newIncident;
  }

  async performRiskAssessment(assessment: Omit<RiskAssessment, 'id' | 'riskScore' | 'residualRisk'>): Promise<RiskAssessment> {
    const impactScore = this.getImpactScore(assessment.impact);
    const likelihoodScore = this.getLikelihoodScore(assessment.likelihood);
    const riskScore = impactScore * likelihoodScore;
    
    const controlEffectiveness = 0.7; // Assume 70% effectiveness
    const residualRisk = riskScore * (1 - controlEffectiveness);

    const newAssessment: RiskAssessment = {
      ...assessment,
      id: randomBytes(16).toString('hex'),
      riskScore,
      residualRisk
    };

    await this.auditLogger.log({
      action: 'perform_risk_assessment',
      userId: 'system',
      resource: 'risk_assessment',
      details: { 
        assessmentId: newAssessment.id,
        riskScore,
        residualRisk 
      }
    });

    return newAssessment;
  }

  private getImpactScore(impact: RiskAssessment['impact']): number {
    switch (impact) {
      case 'Critical': return 5;
      case 'High': return 4;
      case 'Medium': return 3;
      case 'Low': return 2;
      default: return 1;
    }
  }

  private getLikelihoodScore(likelihood: RiskAssessment['likelihood']): number {
    switch (likelihood) {
      case 'Very High': return 5;
      case 'High': return 4;
      case 'Medium': return 3;
      case 'Low': return 2;
      case 'Very Low': return 1;
      default: return 1;
    }
  }

  async getControlStatus(): Promise<any> {
    return {
      summary: {
        total: this.controls.length,
        implemented: this.controls.filter(c => c.status === 'Implemented').length,
        inProgress: this.controls.filter(c => c.status === 'In Progress').length,
        notImplemented: this.controls.filter(c => c.status === 'Not Implemented').length,
        complianceScore: this.calculateComplianceScore()
      },
      byCategory: {
        CC: this.controls.filter(c => c.category === 'CC'),
        A: this.controls.filter(c => c.category === 'A'),
        PI: this.controls.filter(c => c.category === 'PI'),
        P: this.controls.filter(c => c.category === 'P'),
        C: this.controls.filter(c => c.category === 'C')
      }
    };
  }

  async scheduleControlTesting(): Promise<any> {
    const testingSchedule = this.controls.map(control => ({
      controlId: control.id,
      name: control.name,
      owner: control.owner,
      frequency: control.frequency,
      lastTested: control.lastTested,
      nextTestDue: this.calculateNextTestDate(control),
      isOverdue: this.isTestingOverdue(control)
    }));

    return {
      schedule: testingSchedule,
      overdueTests: testingSchedule.filter(t => t.isOverdue),
      upcomingTests: testingSchedule.filter(t => !t.isOverdue && 
        t.nextTestDue <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // Next 30 days
    };
  }
}

export const soc2ComplianceService = new SOC2ComplianceService();