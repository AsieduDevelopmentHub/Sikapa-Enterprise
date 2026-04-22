# Production Deployment Guide for Sikapa Enterprise

This guide covers everything needed to deploy Sikapa to production securely and reliably.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Security Configuration](#security-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Disaster Recovery](#disaster-recovery)

---

## Pre-Deployment Checklist

### Security
- [ ] Generate and securely store `SECRET_KEY` (use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] Set `ENVIRONMENT=production` in backend
- [ ] Set `DEBUG=false` in backend
- [ ] Verify all API secrets are environment variables (never hardcoded)
- [ ] Enable HTTPS (check `HTTPS_ENABLED` appropriately for your infrastructure)
- [ ] Configure CORS_ORIGINS to EXACT frontend domain (e.g., `https://app.example.com`, not `*`)
- [ ] Set up rate limiting (`API_RATE_LIMIT_ENABLED=true`)
- [ ] Enable security headers (already configured in `main.py`)

### Database
- [ ] PostgreSQL/Supabase production instance provisioned
- [ ] Database backups configured (automated daily backups)
- [ ] Alembic migrations tested against production schema
- [ ] Connection pooling configured
- [ ] Database user has minimal required permissions (not superuser)

### API & Services
- [ ] Resend API key configured for transactional emails
- [ ] Paystack production keys configured (not test keys)
- [ ] Google OAuth credentials set up (if using)
- [ ] All external service credentials stored in secrets manager
- [ ] Rate limiting keys per user/account (not just IP)
- [ ] Audit logging enabled

### Frontend
- [ ] `NEXT_PUBLIC_API_BASE_URL` points to production backend (with `/api` prefix)
- [ ] Build optimized (`npm run build`)
- [ ] ESLint passing with zero warnings
- [ ] No sensitive data in NEXT_PUBLIC_* variables
- [ ] All environment variables documented

### Testing
- [ ] Load testing completed (simulate expected traffic)
- [ ] End-to-end tests passing (auth, orders, payments)
- [ ] Error scenarios tested (500 errors, network failures)
- [ ] Performance baseline established

---

## Security Configuration

### Environment Variables (.env)

**CRITICAL - Must Be Set:**
```bash
ENVIRONMENT=production
SECRET_KEY=<strong-random-key-32-bytes>
DATABASE_URL=postgresql://user:password@host/dbname
RESEND_API_KEY=<api-key>
PAYSTACK_SECRET_KEY=<secret-key>
GOOGLE_OAUTH_CLIENT_SECRET=<secret>
```

**CORS Configuration:**
```bash
# Exact domain only - NO wildcard (*)
CORS_ORIGINS=https://app.example.com,https://www.example.com
CORS_ORIGIN_REGEX=  # Leave empty unless using preview URLs
```

**Disable Sensitive Endpoints:**
```bash
DISABLE_OPENAPI=true  # Disable Swagger/OpenAPI in production
```

### Network Security

1. **Reverse Proxy** (Nginx/Render)
   - Terminate TLS here (API doesn't need `HTTPS_ENABLED=true`)
   - Set `HTTPS_ENABLED=false` when behind proxy
   - Add security headers at proxy level or in app

2. **Rate Limiting**
   - Configure per-user/account limits (not just IP)
   - Enable exponential backoff for failed auth attempts
   - Monitor for abuse patterns

3. **WAF Rules** (if available)
   - Block SQL injection patterns
   - Block obvious XSS attempts
   - Rate limit per IP + API key

### Secrets Management

**DO NOT:**
- Commit `.env` to version control
- Copy/paste secrets into configs
- Use default/example secrets

**DO:**
- Use managed secrets service:
  - Render: Environment Variables in dashboard
  - AWS: Secrets Manager or Parameter Store
  - Digital Ocean: App Platform Secrets
  - Vercel: Environment Variables
- Rotate secrets quarterly
- Audit secret access logs monthly

---

## Database Setup

### PostgreSQL (Recommended for Production)

```bash
# 1. Create database
createdb sikapa_prod

# 2. Create application user (least privilege)
createuser sikapa_app --password
# Don't grant superuser, createdb, or createrole

# 3. Grant permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE sikapa_prod TO sikapa_app"
psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sikapa_app"

# 4. Database URL for .env
postgresql://sikapa_app:password@host:5432/sikapa_prod
```

### Supabase (Managed PostgreSQL)

1. Create project at https://supabase.com
2. Copy connection URL to `DATABASE_URL`
3. Enable point-in-time recovery (PITR)
4. Set up automated backups
5. Configure firewall rules

### Backups

```bash
# Automated backup script (cron daily)
#!/bin/bash
BACKUP_FILE="/backups/sikapa_$(date +%Y%m%d).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
# Upload to cloud storage
aws s3 cp "$BACKUP_FILE" s3://backups-bucket/
```

### Migrations

```bash
# Test migration against production DB first
ALEMBIC_DATABASE_URL=postgresql://... alembic upgrade head

# Then deploy API with migrations
# (ensure migration is backward-compatible)
```

---

## Backend Deployment

### Docker Deployment (Recommended)

```dockerfile
# See Dockerfile in backend/ directory
# Build: docker build -t sikapa-api:latest .
# Run: docker run -e DATABASE_URL=... -e SECRET_KEY=... -p 8000:8000 sikapa-api
```

### Render Deployment

1. **Connect Repository**
   - Go to https://render.com/dashboard
   - New → Web Service
   - Connect GitHub repo

2. **Configuration**
   ```
   Build Command: pip install -r requirements.txt && alembic upgrade head
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port 8000
   Environment: Python 3.11
   ```

3. **Environment Variables**
   - Add all `.env` variables in Render dashboard
   - DO NOT paste `.env` file content

4. **Health Check**
   - Render should auto-detect `/health` endpoint
   - Verify in Render dashboard

### Gunicorn + Nginx (VPS)

```bash
# Install
pip install gunicorn

# Run API
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000

# Nginx config (reverse proxy, TLS termination)
upstream api {
    server 127.0.0.1:8000;
}
server {
    listen 443 ssl http2;
    server_name api.example.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## Frontend Deployment

### Vercel (Recommended for Next.js)

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Import GitHub repo

2. **Build Settings**
   - Framework: Next.js
   - Output Directory: .next
   - Build Command: `npm run build`

3. **Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Frontend can access these at runtime

4. **Deployment**
   - Auto-deploys on push to main
   - Preview deployments for PRs

### Render Static Site

```bash
# Build locally
npm run build
# Output is in .next/ (not a static site, requires Node.js)
# Use Render Web Service instead, not Static Site
```

---

## Monitoring & Logging

### Structured Logging

All logs are JSON-formatted for easy parsing:

```json
{
  "timestamp": "2026-04-21T10:30:00.000Z",
  "level": "INFO",
  "name": "app.auth",
  "message": "User login successful",
  "user_id": 123,
  "ip_address": "192.168.1.1"
}
```

### Log Aggregation

**Option 1: Render Built-in**
```bash
# View logs in Render dashboard
# Automatically stores last 30 days
```

**Option 2: Datadog/New Relic**
```bash
# Configure in .env
SENTRY_DSN=https://...@sentry.io/...
NEWRELIC_LICENSE_KEY=...
```

### Alerting

Set up alerts for:
- [ ] 5xx error rate > 1%
- [ ] Response time > 2s (p95)
- [ ] Database connection pool exhausted
- [ ] Rate limiting activated
- [ ] Auth failures > 10/minute

### Performance Monitoring

Monitor key metrics:
- API response time (target: <200ms p95)
- Database query time (target: <100ms p95)
- Error rate (target: <0.1%)
- Token refresh success rate (target: >99%)

---

## Disaster Recovery

### Backup & Recovery

**Backup Strategy:**
- Database: daily automated backups (30-day retention)
- Code: version control (GitHub)
- Secrets: encrypted backups of rotation history
- Configuration: version controlled

**Recovery Time Objectives (RTO):**
- Database restore: < 1 hour
- API redeployment: < 15 minutes
- Full system recovery: < 2 hours

### Disaster Recovery Plan

1. **Database corruption:**
   ```bash
   # Restore from backup
   pg_restore -d sikapa_prod backup-file.sql
   ```

2. **API crash:**
   ```bash
   # Redeploy from version control
   git push origin main  # Triggers auto-deploy on Render
   ```

3. **Secrets compromise:**
   - Rotate `SECRET_KEY` immediately
   - Users must log in again
   - Revoke old API keys
   - Investigate cause

### Testing Recovery

- [ ] Monthly: Test database backup restoration
- [ ] Monthly: Verify secrets can be recovered
- [ ] Quarterly: Full disaster recovery drill

---

## Post-Deployment

1. **Verify Health**
   - Check `/health` endpoint
   - Run smoke tests
   - Monitor error logs (first 30 minutes)

2. **Performance Baseline**
   - Record response times
   - Monitor resource usage
   - Document for future comparison

3. **Security Audit**
   - Run automated security scan
   - Review access logs
   - Verify no default credentials

4. **Communication**
   - Notify stakeholders of deployment
   - Document deployment date/time/version
   - Update status page

---

## Contact & Support

- **Email:** devops@sikapa.example
- **Slack:** #sikapa-production
- **On-Call:** See runbook for escalation
