# Security Policy

## Supported versions

| Component | Supported | Notes |
|-----------|-----------|--------|
| `main` branch | Yes | Production deployments |
| `dev/develop` | Yes | Pre-release integration |
| Tagged mobile releases (`mobile-v*`) | Yes | Store builds |
| Older tags / forks | Best effort | Upgrade to latest release |

## Reporting a vulnerability

**Do not** open public GitHub issues for security vulnerabilities.

Send a private report to the repository maintainers:

- **Email:** [security@sikapa.com](mailto:security@sikapa.com) *(replace with your team inbox if different)*
- **Subject:** `[Sikapa Security]` brief summary

Include:

1. Description of the issue and impact
2. Steps to reproduce (or proof of concept)
3. Affected component (backend API, web storefront, mobile app, CI)
4. Your contact for follow-up (optional)

If you use GitHub and the repo has private security advisories enabled, you may also use **Security → Advisories → Report a vulnerability**.

## What to expect

| Timeline | Action |
|----------|--------|
| **72 hours** | Acknowledgement of your report |
| **14 days** | Initial assessment and severity classification |
| **90 days** | Target fix or mitigation for confirmed issues (may vary by severity) |

We will coordinate disclosure timing with you. Credit can be given in release notes if you wish.

## Scope

In scope:

- Authentication, authorization, and session handling
- Payment flows (Paystack integration, webhooks)
- Data exposure (PII, orders, admin APIs)
- Injection, SSRF, and remote code execution in deployed services
- Dependency vulnerabilities with exploitable paths in this codebase

Out of scope (unless combined with a chain):

- Social engineering, physical access, denial-of-service without a fixable root cause
- Issues in third-party services (Render, Vercel, Supabase, Paystack) — report to those vendors
- Missing security headers on assets you do not control

## Secure development

- Secrets belong in environment variables, never in git
- Run `pip-audit` / `npm audit` via CI before releases
- Production requires strong `SECRET_KEY`, `TOTP_ENCRYPTION_KEY`, and database credentials
- See [docs/audit/security.md](./docs/audit/security.md) and [docs/PRODUCTION_DEPLOYMENT.md](./docs/PRODUCTION_DEPLOYMENT.md)

## License

This is proprietary software. Unauthorized access, copying, or distribution is prohibited. See [LICENSE](./LICENSE).
