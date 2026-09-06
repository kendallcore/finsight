# Security Policy

## Supported Versions

FinSight actively maintains and applies security updates to the latest major release branch.

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| 2.0.x   | :white_check_mark: | Current active release (FY 2025-26 Tax Regime engine) |
| < 2.0   | :x:                | Legacy / unmaintained |

---

## Reporting a Vulnerability

We take the security of FinSight and the privacy of customer financial data seriously.

> [!IMPORTANT]
> **Do NOT report security vulnerabilities through public GitHub issues or public discussions.**

### Reporting Mechanism

If you discover a security vulnerability, credential leak, or flaw in FinSight:

1. **GitHub Private Security Advisory**: Please report the issue privately through the **Security** tab of the [`sanjeevafk/finsight`](https://github.com/sanjeevafk/finsight/security/advisories/new) GitHub repository by submitting a draft security advisory.
2. Maintainers will acknowledge receipt of your vulnerability report within **48 hours** and provide periodic updates on remediation progress.

### What to Include in Your Report

To help us triage and resolve the issue quickly, please include:
- A description of the vulnerability and its potential impact.
- Step-by-step instructions or proof-of-concept (PoC) to reproduce the behavior.
- Affected components (e.g., FastAPI backend endpoints, CSV/PDF parser, database storage, dependencies).
- Any proposed remediation or patch, if available.

---

## Secret & Data Protection Best Practices

When contributing to FinSight:

1. **No API Keys or Secrets**: Never commit private keys, API credentials, secret tokens, or `.env` files to git. Use environment variables defined via `.env.example`.
2. **Data Anonymization**: Never commit real user bank statements, PAN numbers, Aadhaar details, or personally identifiable financial records (PII). All test bank statements must use synthetic or scrubbed transaction narrations.
3. **Dependency Auditing**: Regularly run `pip audit` and `npm audit` to detect vulnerable third-party dependencies before submitting PRs.
