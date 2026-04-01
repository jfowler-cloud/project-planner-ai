# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Project Planner AI, please report it by opening a GitHub issue or contacting the repository owner with the subject line "Security Vulnerability Report".

**Please do NOT create a public GitHub issue for security vulnerabilities.**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response:** Within 24 hours
- **Status Update:** Within 72 hours
- **Fix Timeline:** Critical issues within 7 days, others within 30 days

---

## Security Measures

### Data Privacy

**User Data:**
- Session data only (not stored permanently)
- Cleared after repository generation
- No tracking without consent
- GDPR compliant (data minimization)

**AI Requests:**
- All requests anonymized
- No PII sent to Claude API
- Responses cached with anonymized keys
- Cache cleared after 60 minutes

**GitHub Integration:**
- OAuth with minimal scopes (repo creation only)
- Tokens encrypted at rest
- Tokens never logged
- Automatic token revocation on logout

### Application Security

**Authentication:**
- AWS Cognito for user management
- MFA support
- Session timeout after 1 hour
- Secure cookie flags (HttpOnly, Secure, SameSite)

**Authorization:**
- Least privilege principle
- Role-based access control
- API key rotation every 90 days
- Rate limiting (10 requests/hour per user)

**Input Validation:**
- All inputs validated server-side
- Pydantic models for type safety
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection

**API Security:**
- HTTPS only (TLS 1.3)
- API versioning (/api/v1/)
- Rate limiting per IP and user
- Request size limits (10MB max)
- Timeout after 60 seconds

**Dependencies:**
- Automated security scanning (Dependabot)
- Weekly dependency updates
- Pre-commit hooks (detect secrets)
- SAST scanning in CI/CD

### Infrastructure Security

**Network:**
- VPC isolation
- Security groups (least privilege)
- No public database access
- WAF for DDoS protection

**Data:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Secrets in AWS Secrets Manager
- No secrets in code or logs

**Monitoring:**
- CloudWatch logs (encrypted)
- Audit logging (all API calls)
- Anomaly detection
- Automated alerts

**Backup & Recovery:**
- Daily automated backups
- Point-in-time recovery
- Disaster recovery plan
- RTO: 4 hours, RPO: 1 hour

---

## Compliance

### GDPR
- Data minimization
- Right to access
- Right to deletion
- Right to portability
- Privacy by design

### OWASP Top 10
- ✅ Injection prevention
- ✅ Broken authentication protection
- ✅ Sensitive data exposure prevention
- ✅ XML external entities (N/A - no XML)
- ✅ Broken access control prevention
- ✅ Security misconfiguration prevention
- ✅ XSS prevention
- ✅ Insecure deserialization prevention
- ✅ Using components with known vulnerabilities (scanning)
- ✅ Insufficient logging & monitoring prevention

---

## Security Best Practices for Users

### Protect Your GitHub Token
- Never share your GitHub token
- Use tokens with minimal scopes
- Revoke tokens when not needed
- Enable MFA on GitHub account

### Protect Your Account
- Use strong, unique password
- Enable MFA
- Don't share credentials
- Log out when done

### Review Generated Code
- Always review generated code before deploying
- Check for hardcoded secrets
- Verify security configurations
- Run security scans

---

## Security Updates

We release security updates as soon as possible after discovering vulnerabilities:

- **Critical:** Within 24 hours
- **High:** Within 7 days
- **Medium:** Within 30 days
- **Low:** Next regular release

Users will be notified via:
- GitHub Security Advisories
- Email (if registered)
- In-app notifications

---

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged (with permission) in our security hall of fame.

---

**Last Updated:** 2026-02-21  
**Version:** 1.0
