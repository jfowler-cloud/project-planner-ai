# AI-Assisted Development SOP

**Standard Operating Procedure for Rapid, Production-Quality Software Development**

---

## Overview

This SOP outlines a systematic approach to building production-ready applications using AI-assisted development, emphasizing security, cost optimization, and quality from the start.

## Model Selection Strategy

### Planning & Architecture Phase
- **Model:** Claude Opus 4.6 (most capable)
- **Purpose:** Critical thinking, architecture decisions, security analysis
- **Cost:** High, but worth it for foundational decisions

### Implementation Phase
- **Model:** Claude Sonnet 4.5/4.6 (balanced)
- **Purpose:** Core development, feature implementation, testing
- **Cost:** Moderate, optimal for bulk work

### Utility Tasks
- **Model:** Claude Haiku 4.5/4.6 (fast & cheap)
- **Purpose:** Git operations, file reading, directory listing, simple refactoring
- **Cost:** Low, ideal for repetitive tasks

---

## Phase 1: Planning & Architecture (Opus 4.6)

**Duration:** 30-60 minutes  
**Model:** Claude Opus 4.6 in Planning Mode  
**Goal:** Bulletproof architecture with security-first design

### Step 1: Initial Requirements Gathering

Ask the AI agent to:
1. **Clarify the problem space**
   - What problem are we solving?
   - Who are the users?
   - What are the core features?
   - What are the non-functional requirements?

2. **Identify constraints**
   - Budget limitations
   - Timeline expectations
   - Compliance requirements (GDPR, HIPAA, SOC2, etc.)
   - Scalability needs
   - Team size and expertise

### Step 2: Architecture Options Analysis

Generate 3-5 architecture options considering:

#### Infrastructure Decisions
- **Serverless vs. Servers**
  - Serverless: Lower ops overhead, auto-scaling, pay-per-use
  - Servers: More control, potentially lower cost at scale, easier debugging
  - Hybrid: Best of both worlds for specific use cases

- **Cloud Provider Selection**
  - AWS: Broadest service catalog, mature ecosystem
  - Azure: Best for Microsoft stack integration
  - GCP: Strong in ML/AI, competitive pricing
  - Multi-cloud: Avoid vendor lock-in, increased complexity

#### Security Considerations
- **Authentication & Authorization**
  - OAuth 2.0 / OIDC
  - JWT tokens vs. session-based
  - MFA requirements
  - Role-based access control (RBAC)

- **Data Protection**
  - Encryption at rest (AES-256)
  - Encryption in transit (TLS 1.3)
  - Key management (KMS, HSM)
  - Data residency requirements

- **Network Security**
  - VPC isolation
  - Security groups / NACLs
  - WAF for web applications
  - DDoS protection

- **Secrets Management**
  - Never hardcode credentials
  - Use AWS Secrets Manager / Azure Key Vault / GCP Secret Manager
  - Rotate secrets regularly
  - Least privilege access

#### Cost Optimization
- **Compute Costs**
  - Right-sizing instances
  - Spot instances for non-critical workloads
  - Reserved instances for predictable loads
  - Auto-scaling policies

- **Storage Costs**
  - Lifecycle policies (S3 Intelligent-Tiering)
  - Data compression
  - CDN for static assets
  - Database optimization (indexes, query tuning)

- **Data Transfer Costs**
  - Minimize cross-region transfers
  - Use CloudFront / CDN
  - Compress responses
  - Batch operations

#### Maintainability
- **Code Quality**
  - Linting and formatting (Ruff, ESLint, Prettier)
  - Type safety (TypeScript, Python type hints)
  - Documentation standards
  - Code review process

- **Testing Strategy**
  - Unit tests (>90% coverage target)
  - Integration tests
  - E2E tests for critical paths
  - Load testing for performance
  - Security testing (SAST, DAST)

- **Monitoring & Observability**
  - Centralized logging (CloudWatch, ELK, Datadog)
  - Metrics and dashboards
  - Distributed tracing (X-Ray, Jaeger)
  - Alerting and on-call rotation

- **Deployment Strategy**
  - CI/CD pipeline (GitHub Actions, GitLab CI)
  - Blue-green deployments
  - Canary releases
  - Rollback procedures
  - Infrastructure as Code (Terraform, CDK, Pulumi)

#### Patching & Updates
- **Dependency Management**
  - Automated dependency updates (Dependabot, Renovate)
  - Security vulnerability scanning
  - Regular update schedule
  - Breaking change assessment

- **OS & Runtime Patching**
  - Automated patching for managed services
  - Patch management for EC2 (Systems Manager)
  - Container base image updates
  - Zero-downtime deployment strategy

### Step 3: Critical Review Loop (10 Iterations)

For each iteration, ask Opus 4.6 to:

1. **Security Review**
   - OWASP Top 10 vulnerabilities
   - Least privilege principle
   - Defense in depth
   - Secure by default
   - Input validation and sanitization
   - Rate limiting and DDoS protection
   - Audit logging
   - Compliance requirements

2. **Cost Analysis**
   - Estimate monthly costs for each option
   - Identify cost optimization opportunities
   - Consider scaling costs (10x, 100x, 1000x users)
   - Hidden costs (data transfer, API calls, support)

3. **Maintainability Assessment**
   - Code complexity
   - Team expertise required
   - Documentation needs
   - Onboarding time for new developers
   - Technical debt risks

4. **Scalability Review**
   - Horizontal vs. vertical scaling
   - Database scaling strategy
   - Caching strategy (Redis, Memcached, CDN)
   - Queue-based architecture for async work
   - Stateless design

5. **Reliability & Availability**
   - Single points of failure
   - Multi-AZ / multi-region deployment
   - Backup and disaster recovery
   - RTO and RPO targets
   - Health checks and auto-recovery

6. **Performance Considerations**
   - Latency requirements
   - Throughput requirements
   - Database query optimization
   - API response times
   - Frontend performance (Core Web Vitals)

7. **Developer Experience**
   - Local development setup
   - Testing ease
   - Debugging capabilities
   - Hot reload / fast feedback loops
   - Documentation quality

8. **Operational Complexity**
   - Number of services to manage
   - Deployment complexity
   - Monitoring and alerting setup
   - Incident response procedures
   - On-call burden

9. **Vendor Lock-in Risk**
   - Proprietary services vs. open standards
   - Migration path to other providers
   - Data portability
   - API compatibility

10. **Future-Proofing**
    - Technology longevity
    - Community support
    - Upgrade path
    - Feature roadmap alignment

**After each review:**
- Update architecture options
- Eliminate non-viable options
- Refine remaining options
- Document trade-offs

**Final Output:**
- Recommended architecture with detailed justification
- Architecture diagram (C4 model or similar)
- Technology stack with versions
- Security checklist
- Cost estimate with breakdown
- Implementation roadmap

---

## Phase 2: Implementation (Sonnet 4.5/4.6)

**Duration:** 2-8 hours (depending on project size)  
**Model:** Claude Sonnet 4.5/4.6  
**Goal:** Rapid, high-quality implementation with tests

### Step 1: Project Scaffolding

1. **Initialize Repository**
   ```bash
   # Use Haiku for simple commands
   git init
   git add .gitignore README.md
   git commit -m "Initial commit"
   ```

2. **Setup Project Structure**
   - Backend framework (FastAPI, Express, Django)
   - Frontend framework (Next.js, React, Vue)
   - Monorepo structure if needed (Turborepo, Nx)
   - Package managers (uv, npm, pnpm)

3. **Configure Development Tools**
   - Linters and formatters
   - Pre-commit hooks (detect secrets, format code)
   - EditorConfig
   - VS Code settings

4. **Setup CI/CD Pipeline**
   - GitHub Actions / GitLab CI
   - Automated testing
   - Security scanning
   - Deployment automation

### Step 2: Core Implementation

**Development Principles:**

1. **Security First**
   - Input validation on all endpoints
   - Output encoding to prevent XSS
   - Parameterized queries to prevent SQL injection
   - CSRF protection
   - Rate limiting from day one
   - Secure headers (CSP, HSTS, X-Frame-Options)
   - Secrets in environment variables, never in code

2. **Test-Driven Development**
   - Write tests alongside code
   - Aim for 100% coverage (minimum 90%)
   - Test pyramid: many unit tests, some integration tests, few E2E tests
   - Mock external dependencies
   - Test error cases and edge cases

3. **Least Privilege**
   - IAM roles with minimal permissions
   - Database users with specific grants
   - API keys with scoped access
   - Network segmentation

4. **Observability**
   - Structured logging from the start
   - Request tracing
   - Performance metrics
   - Error tracking (Sentry, Rollbar)

5. **Documentation**
   - README with quick start
   - API documentation (OpenAPI/Swagger)
   - Architecture decision records (ADRs)
   - Inline code comments for complex logic

### Step 3: Iterative Development Loop (5 Iterations)

For each iteration:

1. **Implement Feature**
   - Write tests first (TDD)
   - Implement feature
   - Ensure tests pass
   - Code review (AI-assisted)

2. **Deploy to Dev/Staging**
   ```bash
   # Use API credentials for automated deployment
   git push origin feature-branch
   # CI/CD automatically deploys
   ```

3. **Run Tests**
   - Unit tests
   - Integration tests
   - E2E tests
   - Security tests
   - Performance tests

4. **Debug Issues**
   - Check logs
   - Use debugger
   - Add more tests
   - Fix bugs

5. **Update & Iterate**
   - Refactor if needed
   - Update documentation
   - Commit changes
   - Deploy again

**Use Haiku for:**
- Git operations (commit, push, pull)
- File reading and listing
- Simple refactoring (rename variables, extract functions)
- Running tests
- Checking logs

**Use Sonnet for:**
- Feature implementation
- Complex refactoring
- Test writing
- Bug fixing
- Code reviews

---

## Phase 3: Critical Review & Refinement (Opus 4.6)

**Duration:** 30-60 minutes  
**Model:** Claude Opus 4.6  
**Goal:** Comprehensive quality assessment

### Review Checklist

1. **Security Audit**
   - [ ] No hardcoded secrets
   - [ ] Input validation on all endpoints
   - [ ] Authentication and authorization working
   - [ ] Rate limiting implemented
   - [ ] HTTPS enforced
   - [ ] Security headers configured
   - [ ] Dependencies scanned for vulnerabilities
   - [ ] Secrets management in place
   - [ ] Audit logging enabled
   - [ ] OWASP Top 10 addressed

2. **Code Quality**
   - [ ] Test coverage >90%
   - [ ] No linting errors
   - [ ] Type safety enforced
   - [ ] Code is DRY (Don't Repeat Yourself)
   - [ ] Functions are small and focused
   - [ ] Clear naming conventions
   - [ ] Error handling comprehensive
   - [ ] No TODO comments in production code

3. **Performance**
   - [ ] API response times <200ms (p95)
   - [ ] Database queries optimized
   - [ ] Caching implemented where appropriate
   - [ ] Images optimized
   - [ ] Bundle size minimized
   - [ ] Lazy loading for non-critical resources

4. **Reliability**
   - [ ] Health check endpoints
   - [ ] Graceful degradation
   - [ ] Circuit breakers for external services
   - [ ] Retry logic with exponential backoff
   - [ ] Timeout configurations
   - [ ] Database connection pooling

5. **Observability**
   - [ ] Structured logging
   - [ ] Request tracing
   - [ ] Metrics dashboards
   - [ ] Alerting configured
   - [ ] Error tracking integrated

6. **Documentation**
   - [ ] README is comprehensive
   - [ ] API documentation complete
   - [ ] Architecture diagrams included
   - [ ] Setup instructions clear
   - [ ] Troubleshooting guide

### Recommendations Loop (2 Iterations)

For each iteration, Opus 4.6 should:

1. **Identify Issues**
   - Security vulnerabilities
   - Performance bottlenecks
   - Code smells
   - Missing tests
   - Documentation gaps

2. **Provide Recommendations**
   - Specific, actionable improvements
   - Priority ranking (P0, P1, P2)
   - Estimated effort
   - Expected impact

3. **Update README**
   - Add new features to feature list
   - Update architecture section
   - Add performance benchmarks
   - Document known limitations
   - Add troubleshooting tips

---

## Phase 4: Final Implementation (Sonnet 4.5/4.6)

**Duration:** 1-2 hours  
**Model:** Claude Sonnet 4.5/4.6  
**Goal:** Implement recommendations and polish

### Implementation Loop

1. **Implement P0 Recommendations**
   - Security fixes (highest priority)
   - Critical bugs
   - Blocking issues

2. **Deploy & Test**
   - Deploy to staging
   - Run full test suite
   - Manual testing of critical paths
   - Performance testing

3. **Implement P1 Recommendations**
   - Important improvements
   - Performance optimizations
   - UX enhancements

4. **Debug & Iterate**
   - Fix any new issues
   - Refine implementations
   - Update tests

5. **Final Deployment**
   - Deploy to production
   - Monitor closely
   - Be ready to rollback

---

## Phase 5: Production Readiness (Opus 4.6)

**Duration:** 30 minutes  
**Model:** Claude Opus 4.6  
**Goal:** Final polish and documentation

### Final Review Checklist

1. **Documentation Audit**
   - [ ] README is clear and comprehensive
   - [ ] Quick start guide works
   - [ ] API documentation is accurate
   - [ ] Architecture diagrams are up-to-date
   - [ ] Contributing guidelines included
   - [ ] License file present
   - [ ] Security policy documented
   - [ ] Code of conduct included

2. **Repository Organization**
   - [ ] Files are logically organized
   - [ ] No unnecessary files committed
   - [ ] .gitignore is comprehensive
   - [ ] CI/CD badges in README
   - [ ] Screenshots/demos included
   - [ ] Changelog maintained

3. **Security Final Check**
   - [ ] No secrets in git history
   - [ ] Pre-commit hooks installed
   - [ ] Security scanning in CI/CD
   - [ ] Dependency updates automated
   - [ ] Security contact information

4. **Production Checklist**
   - [ ] Environment variables documented
   - [ ] Deployment guide complete
   - [ ] Rollback procedure documented
   - [ ] Monitoring and alerting configured
   - [ ] Backup and recovery tested
   - [ ] Disaster recovery plan
   - [ ] Incident response plan

5. **Legal & Compliance**
   - [ ] License chosen and documented
   - [ ] Third-party licenses acknowledged
   - [ ] Privacy policy (if applicable)
   - [ ] Terms of service (if applicable)
   - [ ] GDPR compliance (if applicable)

### Final Documentation Updates

1. **README Enhancements**
   - Add badges (build status, coverage, license)
   - Include demo/screenshots
   - Add "Why This Project" section
   - Document development timeline
   - Add related projects
   - Include cost estimates
   - Add troubleshooting section

2. **Additional Documentation**
   - CONTRIBUTING.md
   - SECURITY.md
   - CHANGELOG.md
   - API.md (detailed API docs)
   - ARCHITECTURE.md
   - DEPLOYMENT.md

3. **Code Comments**
   - Add high-level module documentation
   - Document complex algorithms
   - Explain non-obvious decisions
   - Add TODO comments for future work (in separate issue tracker)

---

## Cost Optimization Strategy

### Model Usage Guidelines

| Task Type | Model | Estimated Cost | When to Use |
|-----------|-------|----------------|-------------|
| Architecture decisions | Opus 4.6 | $15/1M tokens | Critical thinking needed |
| Security reviews | Opus 4.6 | $15/1M tokens | High stakes, need thoroughness |
| Feature implementation | Sonnet 4.5/4.6 | $3/1M tokens | Bulk development work |
| Code reviews | Sonnet 4.5/4.6 | $3/1M tokens | Balanced quality/cost |
| Git operations | Haiku 4.5/4.6 | $0.25/1M tokens | Simple, repetitive tasks |
| File reading | Haiku 4.5/4.6 | $0.25/1M tokens | Low complexity |
| Test execution | Haiku 4.5/4.6 | $0.25/1M tokens | Automated tasks |

### Estimated Project Costs

**Small Project (1-2 days):**
- Planning: 100K tokens × $15 = $1.50
- Implementation: 500K tokens × $3 = $1.50
- Utilities: 200K tokens × $0.25 = $0.05
- Reviews: 100K tokens × $15 = $1.50
- **Total: ~$4.55**

**Medium Project (1 week):**
- Planning: 200K tokens × $15 = $3.00
- Implementation: 2M tokens × $3 = $6.00
- Utilities: 1M tokens × $0.25 = $0.25
- Reviews: 200K tokens × $15 = $3.00
- **Total: ~$12.25**

**Large Project (1 month):**
- Planning: 500K tokens × $15 = $7.50
- Implementation: 10M tokens × $3 = $30.00
- Utilities: 5M tokens × $0.25 = $1.25
- Reviews: 500K tokens × $15 = $7.50
- **Total: ~$46.25**

---

## Best Practices Summary

### Security
- ✅ Never commit secrets
- ✅ Use environment variables
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Use least privilege
- ✅ Enable audit logging
- ✅ Scan dependencies
- ✅ Use pre-commit hooks

### Testing
- ✅ Aim for 100% coverage
- ✅ Write tests alongside code
- ✅ Test error cases
- ✅ Mock external dependencies
- ✅ Run tests in CI/CD
- ✅ Include security tests
- ✅ Performance test critical paths

### Documentation
- ✅ README with quick start
- ✅ API documentation
- ✅ Architecture diagrams
- ✅ Inline code comments
- ✅ ADRs for major decisions
- ✅ Troubleshooting guide
- ✅ Contributing guidelines

### Deployment
- ✅ Infrastructure as Code
- ✅ Automated CI/CD
- ✅ Blue-green deployments
- ✅ Rollback procedures
- ✅ Health checks
- ✅ Monitoring and alerting
- ✅ Disaster recovery plan

### Cost Optimization
- ✅ Right-size resources
- ✅ Use auto-scaling
- ✅ Implement caching
- ✅ Optimize database queries
- ✅ Use CDN for static assets
- ✅ Monitor and optimize regularly
- ✅ Use appropriate AI models for tasks

---

## Example Timeline

### Day 1: Planning & Architecture
- **Hour 1:** Requirements gathering (Opus)
- **Hour 2:** Architecture options (Opus)
- **Hours 3-4:** Critical review loop (Opus, 10 iterations)
- **Hour 5:** Final architecture decision (Opus)

### Day 2: Implementation
- **Hour 1:** Project scaffolding (Sonnet + Haiku)
- **Hours 2-6:** Core implementation (Sonnet)
- **Hour 7:** Testing and debugging (Sonnet + Haiku)
- **Hour 8:** First deployment (Haiku)

### Day 3: Refinement
- **Hours 1-2:** Critical review (Opus, 2 iterations)
- **Hours 3-5:** Implement recommendations (Sonnet)
- **Hour 6:** Testing and debugging (Sonnet + Haiku)
- **Hour 7:** Final deployment (Haiku)
- **Hour 8:** Production readiness (Opus)

**Total:** 3 days, ~$10-15 in AI costs, production-ready application

---

## Conclusion

This SOP enables rapid development of production-quality applications by:

1. **Using the right model for the right task** - Optimize cost without sacrificing quality
2. **Security and quality from day one** - Avoid technical debt
3. **Iterative refinement** - Continuous improvement through reviews
4. **Comprehensive documentation** - Easy onboarding and maintenance
5. **Automated testing and deployment** - Fast, reliable releases

**Result:** Production-ready applications in days, not weeks or months, with security, scalability, and maintainability built in from the start.

---

**Last Updated:** 2026-02-21  
**Version:** 1.0  
**Author:** James Fowler
