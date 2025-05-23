#!/bin/bash

# PropFlow Compliance Check Script
# Automated compliance validation and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPLIANCE_DIR="$PROJECT_ROOT/compliance"
REPORTS_DIR="$COMPLIANCE_DIR/reports"
EVIDENCE_DIR="$COMPLIANCE_DIR/evidence"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories if they don't exist
mkdir -p "$REPORTS_DIR" "$EVIDENCE_DIR"

echo -e "${BLUE}🔍 PropFlow Compliance Check Started${NC}"
echo "========================================"
echo "Timestamp: $(date)"
echo "Project: $PROJECT_ROOT"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Initialize compliance report
COMPLIANCE_REPORT="$REPORTS_DIR/compliance_report_$TIMESTAMP.json"
cat > "$COMPLIANCE_REPORT" << EOF
{
  "report_id": "compliance_$TIMESTAMP",
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platform": "PropFlow Property Management",
  "version": "1.0.0",
  "compliance_frameworks": {
    "soc2": {},
    "gdpr": {},
    "ccpa": {},
    "security": {}
  },
  "overall_score": 0,
  "findings": [],
  "recommendations": []
}
EOF

# SOC 2 Compliance Check
print_section "SOC 2 Compliance Validation"

soc2_score=0
soc2_total=20

# Check for SOC 2 compliance service
if [ -f "$PROJECT_ROOT/backend/shared/utils/soc2-compliance.ts" ]; then
    print_success "SOC 2 compliance framework implemented"
    ((soc2_score++))
else
    print_error "SOC 2 compliance framework missing"
fi

# Check for audit logging
if [ -f "$PROJECT_ROOT/backend/shared/utils/audit.ts" ]; then
    print_success "Audit logging implementation found"
    ((soc2_score++))
else
    print_error "Audit logging implementation missing"
fi

# Check for encryption utilities
if [ -f "$PROJECT_ROOT/backend/shared/utils/encryption.ts" ]; then
    print_success "Encryption utilities implemented"
    ((soc2_score++))
else
    print_error "Encryption utilities missing"
fi

# Check for backup and recovery
if [ -f "$PROJECT_ROOT/backend/shared/utils/backup-recovery.ts" ]; then
    print_success "Backup and recovery system implemented"
    ((soc2_score++))
else
    print_error "Backup and recovery system missing"
fi

# Check for security middleware
if [ -f "$PROJECT_ROOT/backend/shared/middleware/security.ts" ]; then
    print_success "Security middleware implemented"
    ((soc2_score++))
else
    print_warning "Security middleware not found"
fi

# Check for monitoring middleware
if [ -f "$PROJECT_ROOT/backend/shared/middleware/monitoring.ts" ]; then
    print_success "Monitoring middleware implemented"
    ((soc2_score++))
else
    print_warning "Monitoring middleware not found"
fi

# Check for authentication implementation
auth_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l "jwt\|passport\|authentication" 2>/dev/null | wc -l)
if [ "$auth_files" -gt 0 ]; then
    print_success "Authentication implementation found ($auth_files files)"
    ((soc2_score++))
else
    print_error "Authentication implementation missing"
fi

# Check for authorization/RBAC
rbac_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l "role\|permission\|rbac\|authorization" 2>/dev/null | wc -l)
if [ "$rbac_files" -gt 0 ]; then
    print_success "Authorization/RBAC implementation found ($rbac_files files)"
    ((soc2_score++))
else
    print_error "Authorization/RBAC implementation missing"
fi

# Check for input validation
validation_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l "validator\|sanitize\|validation" 2>/dev/null | wc -l)
if [ "$validation_files" -gt 0 ]; then
    print_success "Input validation found ($validation_files files)"
    ((soc2_score++))
else
    print_warning "Input validation implementation limited"
fi

# Check for error handling
error_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l "errorHandler\|try.*catch\|Error" 2>/dev/null | wc -l)
if [ "$error_files" -gt 5 ]; then
    print_success "Error handling implementation found ($error_files files)"
    ((soc2_score++))
else
    print_warning "Error handling implementation limited"
fi

soc2_percentage=$((soc2_score * 100 / soc2_total))
echo "SOC 2 Compliance Score: $soc2_score/$soc2_total ($soc2_percentage%)"

# GDPR Compliance Check
print_section "GDPR Compliance Validation"

gdpr_score=0
gdpr_total=15

# Check for GDPR compliance service
if [ -f "$PROJECT_ROOT/backend/shared/utils/gdpr.ts" ]; then
    print_success "GDPR compliance framework implemented"
    ((gdpr_score+=3))
else
    print_error "GDPR compliance framework missing"
fi

# Check for privacy policy
privacy_files=$(find "$PROJECT_ROOT" -name "*.md" -o -name "*.txt" | xargs grep -l -i "privacy\|gdpr\|data.protection" 2>/dev/null | wc -l)
if [ "$privacy_files" -gt 0 ]; then
    print_success "Privacy documentation found ($privacy_files files)"
    ((gdpr_score++))
else
    print_warning "Privacy documentation missing"
fi

# Check for consent management
consent_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "consent\|cookie\|tracking" 2>/dev/null | wc -l)
if [ "$consent_files" -gt 0 ]; then
    print_success "Consent management found ($consent_files files)"
    ((gdpr_score++))
else
    print_warning "Consent management implementation missing"
fi

# Check for data export functionality
export_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "export.*data\|download.*data\|data.*portability" 2>/dev/null | wc -l)
if [ "$export_files" -gt 0 ]; then
    print_success "Data export functionality found ($export_files files)"
    ((gdpr_score++))
else
    print_warning "Data export functionality missing"
fi

# Check for data deletion
deletion_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "delete.*user\|delete.*data\|anonymize" 2>/dev/null | wc -l)
if [ "$deletion_files" -gt 0 ]; then
    print_success "Data deletion functionality found ($deletion_files files)"
    ((gdpr_score++))
else
    print_warning "Data deletion functionality missing"
fi

# Check for data retention policies
retention_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "retention\|expire\|cleanup" 2>/dev/null | wc -l)
if [ "$retention_files" -gt 0 ]; then
    print_success "Data retention policies found ($retention_files files)"
    ((gdpr_score++))
else
    print_warning "Data retention policies missing"
fi

gdpr_percentage=$((gdpr_score * 100 / gdpr_total))
echo "GDPR Compliance Score: $gdpr_score/$gdpr_total ($gdpr_percentage%)"

# Security Compliance Check
print_section "Security Compliance Validation"

security_score=0
security_total=20

# Check for HTTPS/TLS configuration
if [ -f "$PROJECT_ROOT/nginx.conf" ] || [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    tls_config=$(grep -r -i "ssl\|tls\|https" "$PROJECT_ROOT" 2>/dev/null | wc -l)
    if [ "$tls_config" -gt 0 ]; then
        print_success "TLS/HTTPS configuration found"
        ((security_score++))
    else
        print_warning "TLS/HTTPS configuration not found"
    fi
fi

# Check for environment variable usage
env_files=$(find "$PROJECT_ROOT" -name "*.env*" -o -name ".env*" | wc -l)
if [ "$env_files" -gt 0 ]; then
    print_success "Environment configuration files found ($env_files files)"
    ((security_score++))
else
    print_warning "Environment configuration files missing"
fi

# Check for secrets management
secrets_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l "process\.env\|config\." 2>/dev/null | wc -l)
if [ "$secrets_files" -gt 0 ]; then
    print_success "Secrets management implementation found ($secrets_files files)"
    ((security_score++))
else
    print_warning "Secrets management implementation missing"
fi

# Check for SQL injection prevention
sql_safe_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l "typeorm\|prisma\|sequelize\|prepared" 2>/dev/null | wc -l)
if [ "$sql_safe_files" -gt 0 ]; then
    print_success "SQL injection prevention found (ORM usage: $sql_safe_files files)"
    ((security_score++))
else
    print_warning "SQL injection prevention not verified"
fi

# Check for CORS configuration
cors_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "cors" 2>/dev/null | wc -l)
if [ "$cors_files" -gt 0 ]; then
    print_success "CORS configuration found ($cors_files files)"
    ((security_score++))
else
    print_warning "CORS configuration not found"
fi

# Check for rate limiting
rate_limit_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "rate.limit\|throttle" 2>/dev/null | wc -l)
if [ "$rate_limit_files" -gt 0 ]; then
    print_success "Rate limiting implementation found ($rate_limit_files files)"
    ((security_score++))
else
    print_warning "Rate limiting implementation missing"
fi

# Check for helmet or security headers
security_headers=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "helmet\|csp\|x-frame\|x-xss" 2>/dev/null | wc -l)
if [ "$security_headers" -gt 0 ]; then
    print_success "Security headers implementation found ($security_headers files)"
    ((security_score++))
else
    print_warning "Security headers implementation missing"
fi

# Check for password hashing
password_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "bcrypt\|scrypt\|hash.*password" 2>/dev/null | wc -l)
if [ "$password_files" -gt 0 ]; then
    print_success "Password hashing implementation found ($password_files files)"
    ((security_score++))
else
    print_error "Password hashing implementation missing"
fi

security_percentage=$((security_score * 100 / security_total))
echo "Security Compliance Score: $security_score/$security_total ($security_percentage%)"

# Infrastructure Security Check
print_section "Infrastructure Security Validation"

infra_score=0
infra_total=10

# Check for Docker security
if [ -f "$PROJECT_ROOT/Dockerfile" ] || [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    print_success "Docker containerization implemented"
    ((infra_score++))
    
    # Check for non-root user in Dockerfiles
    dockerfiles=$(find "$PROJECT_ROOT" -name "Dockerfile*")
    if [ -n "$dockerfiles" ]; then
        non_root_count=$(grep -l "USER.*[^0]" $dockerfiles 2>/dev/null | wc -l)
        if [ "$non_root_count" -gt 0 ]; then
            print_success "Non-root Docker users configured ($non_root_count files)"
            ((infra_score++))
        else
            print_warning "Docker containers may be running as root"
        fi
    fi
fi

# Check for Kubernetes configurations
k8s_files=$(find "$PROJECT_ROOT" -name "*.yaml" -o -name "*.yml" | xargs grep -l -i "kind.*deployment\|kind.*service" 2>/dev/null | wc -l)
if [ "$k8s_files" -gt 0 ]; then
    print_success "Kubernetes configurations found ($k8s_files files)"
    ((infra_score++))
else
    print_warning "Kubernetes configurations not found"
fi

# Check for health checks
health_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "health\|readiness\|liveness" 2>/dev/null | wc -l)
if [ "$health_files" -gt 0 ]; then
    print_success "Health check implementations found ($health_files files)"
    ((infra_score++))
else
    print_warning "Health check implementations missing"
fi

# Check for monitoring setup
monitoring_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.js" | xargs grep -l -i "prometheus\|grafana\|metrics\|monitoring" 2>/dev/null | wc -l)
if [ "$monitoring_files" -gt 0 ]; then
    print_success "Monitoring implementation found ($monitoring_files files)"
    ((infra_score++))
else
    print_warning "Monitoring implementation missing"
fi

infra_percentage=$((infra_score * 100 / infra_total))
echo "Infrastructure Security Score: $infra_score/$infra_total ($infra_percentage%)"

# Code Quality and Testing
print_section "Code Quality and Testing Validation"

quality_score=0
quality_total=10

# Check for TypeScript usage
ts_files=$(find "$PROJECT_ROOT" -name "*.ts" | wc -l)
js_files=$(find "$PROJECT_ROOT" -name "*.js" | wc -l)
if [ "$ts_files" -gt "$js_files" ]; then
    print_success "TypeScript primarily used ($ts_files TS vs $js_files JS files)"
    ((quality_score++))
else
    print_warning "Limited TypeScript usage ($ts_files TS vs $js_files JS files)"
fi

# Check for testing frameworks
test_files=$(find "$PROJECT_ROOT" -name "*.test.*" -o -name "*.spec.*" | wc -l)
if [ "$test_files" -gt 0 ]; then
    print_success "Test files found ($test_files files)"
    ((quality_score++))
else
    print_warning "Test files missing"
fi

# Check for linting configuration
if [ -f "$PROJECT_ROOT/.eslintrc.js" ] || [ -f "$PROJECT_ROOT/.eslintrc.json" ] || [ -f "$PROJECT_ROOT/eslint.config.js" ]; then
    print_success "ESLint configuration found"
    ((quality_score++))
else
    print_warning "ESLint configuration missing"
fi

# Check for package.json security
package_files=$(find "$PROJECT_ROOT" -name "package.json")
if [ -n "$package_files" ]; then
    print_success "Package.json files found"
    ((quality_score++))
    
    # Check for security audit scripts
    audit_scripts=$(grep -r "npm audit\|yarn audit" $package_files 2>/dev/null | wc -l)
    if [ "$audit_scripts" -gt 0 ]; then
        print_success "Security audit scripts configured"
        ((quality_score++))
    else
        print_warning "Security audit scripts missing"
    fi
fi

quality_percentage=$((quality_score * 100 / quality_total))
echo "Code Quality Score: $quality_score/$quality_total ($quality_percentage%)"

# Documentation Check
print_section "Documentation Compliance"

docs_score=0
docs_total=10

# Check for security documentation
if [ -f "$PROJECT_ROOT/docs/SECURITY.md" ]; then
    print_success "Security documentation found"
    ((docs_score+=2))
else
    print_error "Security documentation missing"
fi

# Check for compliance documentation
if [ -f "$PROJECT_ROOT/docs/COMPLIANCE.md" ]; then
    print_success "Compliance documentation found"
    ((docs_score+=2))
else
    print_error "Compliance documentation missing"
fi

# Check for README
if [ -f "$PROJECT_ROOT/README.md" ]; then
    print_success "README documentation found"
    ((docs_score++))
else
    print_warning "README documentation missing"
fi

# Check for API documentation
api_docs=$(find "$PROJECT_ROOT" -name "*api*" -name "*.md" | wc -l)
if [ "$api_docs" -gt 0 ]; then
    print_success "API documentation found ($api_docs files)"
    ((docs_score++))
else
    print_warning "API documentation missing"
fi

docs_percentage=$((docs_score * 100 / docs_total))
echo "Documentation Score: $docs_score/$docs_total ($docs_percentage%)"

# Calculate overall compliance score
total_score=$((soc2_score + gdpr_score + security_score + infra_score + quality_score + docs_score))
total_possible=$((soc2_total + gdpr_total + security_total + infra_total + quality_total + docs_total))
overall_percentage=$((total_score * 100 / total_possible))

# Generate compliance summary
print_section "Compliance Summary"

echo "Framework Scores:"
echo "  SOC 2:           $soc2_percentage%"
echo "  GDPR:            $gdpr_percentage%"
echo "  Security:        $security_percentage%"
echo "  Infrastructure:  $infra_percentage%"
echo "  Code Quality:    $quality_percentage%"
echo "  Documentation:   $docs_percentage%"
echo ""
echo "Overall Compliance Score: $overall_percentage%"

# Determine compliance status
if [ "$overall_percentage" -ge 90 ]; then
    print_success "EXCELLENT - Platform is highly compliant"
    compliance_status="excellent"
elif [ "$overall_percentage" -ge 80 ]; then
    print_success "GOOD - Platform meets most compliance requirements"
    compliance_status="good"
elif [ "$overall_percentage" -ge 70 ]; then
    print_warning "FAIR - Platform needs compliance improvements"
    compliance_status="fair"
else
    print_error "POOR - Platform requires significant compliance work"
    compliance_status="poor"
fi

# Generate recommendations
print_section "Recommendations"

recommendations=()

if [ "$soc2_percentage" -lt 80 ]; then
    recommendations+=("Implement missing SOC 2 controls, particularly security middleware and monitoring")
fi

if [ "$gdpr_percentage" -lt 80 ]; then
    recommendations+=("Enhance GDPR compliance with data subject rights implementation")
fi

if [ "$security_percentage" -lt 80 ]; then
    recommendations+=("Strengthen security controls including rate limiting and security headers")
fi

if [ "$infra_percentage" -lt 80 ]; then
    recommendations+=("Improve infrastructure security with monitoring and health checks")
fi

if [ "$quality_percentage" -lt 80 ]; then
    recommendations+=("Enhance code quality with comprehensive testing and linting")
fi

if [ "$docs_percentage" -lt 80 ]; then
    recommendations+=("Complete documentation for security and compliance requirements")
fi

if [ ${#recommendations[@]} -eq 0 ]; then
    print_success "No critical recommendations - maintain current compliance posture"
else
    for rec in "${recommendations[@]}"; do
        echo "• $rec"
    done
fi

# Update compliance report
cat > "$COMPLIANCE_REPORT" << EOF
{
  "report_id": "compliance_$TIMESTAMP",
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platform": "PropFlow Property Management",
  "version": "1.0.0",
  "compliance_frameworks": {
    "soc2": {
      "score": $soc2_score,
      "total": $soc2_total,
      "percentage": $soc2_percentage,
      "status": "$([ $soc2_percentage -ge 80 ] && echo "compliant" || echo "needs_improvement")"
    },
    "gdpr": {
      "score": $gdpr_score,
      "total": $gdpr_total,
      "percentage": $gdpr_percentage,
      "status": "$([ $gdpr_percentage -ge 80 ] && echo "compliant" || echo "needs_improvement")"
    },
    "security": {
      "score": $security_score,
      "total": $security_total,
      "percentage": $security_percentage,
      "status": "$([ $security_percentage -ge 80 ] && echo "compliant" || echo "needs_improvement")"
    },
    "infrastructure": {
      "score": $infra_score,
      "total": $infra_total,
      "percentage": $infra_percentage,
      "status": "$([ $infra_percentage -ge 80 ] && echo "compliant" || echo "needs_improvement")"
    }
  },
  "overall_score": $overall_percentage,
  "status": "$compliance_status",
  "recommendations": [
$(printf '    "%s"' "${recommendations[@]}" | paste -sd ',' -)
  ]
}
EOF

# Generate evidence collection
print_section "Evidence Collection"

echo "Collecting compliance evidence..."

# Create evidence archive
EVIDENCE_ARCHIVE="$EVIDENCE_DIR/compliance_evidence_$TIMESTAMP.tar.gz"

# Collect configuration files
find "$PROJECT_ROOT" -name "*.env.example" -o -name "docker-compose*.yml" -o -name "Dockerfile*" | \
    tar -czf "$EVIDENCE_ARCHIVE" -T - 2>/dev/null || true

# Collect security-related files
find "$PROJECT_ROOT" -path "*/shared/utils/*" -name "*.ts" | \
    tar -rzf "$EVIDENCE_ARCHIVE" -T - 2>/dev/null || true

# Collect documentation
find "$PROJECT_ROOT/docs" -name "*.md" 2>/dev/null | \
    tar -rzf "$EVIDENCE_ARCHIVE" -T - 2>/dev/null || true

print_success "Evidence collected: $EVIDENCE_ARCHIVE"

# Final output
print_section "Compliance Check Complete"

echo "Report generated: $COMPLIANCE_REPORT"
echo "Evidence archive: $EVIDENCE_ARCHIVE"
echo ""
echo "Next steps:"
echo "1. Review detailed findings in the compliance report"
echo "2. Address high-priority recommendations"
echo "3. Schedule regular compliance checks (recommended: monthly)"
echo "4. Update compliance documentation as needed"

# Set exit code based on compliance status
if [ "$overall_percentage" -ge 70 ]; then
    exit 0
else
    exit 1
fi