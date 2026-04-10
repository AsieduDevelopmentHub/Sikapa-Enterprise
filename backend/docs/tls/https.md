# Sikapa Enterprise Backend - HTTPS Setup Guide

## 🔐 HTTPS/TLS Security Configuration

This backend is configured to run with HTTPS/TLS encryption for secure data handling and better security.

### 📋 Prerequisites

- Python 3.10+
- Virtual environment (`venv/`)
- SSL certificates (generated automatically for development)

### 🚀 Quick Start

1. **Generate SSL Certificates** (one-time setup):
   ```bash
   cd backend
   python tools/tls/generate_cert.py
   ```

2. **Start HTTPS Server**:
   ```bash
   cd backend
   python tools/tls/start_secure.py
   ```

   The server will start on `https://localhost:8443`

3. **Alternative: Start HTTP** (development only):
   ```bash
   cd backend
   python tools/tls/start_secure.py --http
   ```

   Server will start on `http://localhost:8000`

### 🔧 Configuration

#### Environment Variables (.env)

```bash
# HTTPS Configuration
HTTPS_ENABLED=true
SSL_CERT_PATH=certs/server.crt
SSL_KEY_PATH=certs/server.key
HTTPS_PORT=8443
HTTP_PORT=8000

# CORS Settings
CORS_ORIGINS=https://localhost:3000,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true
```

#### Security Features

- **TLS 1.2/1.3 Encryption**: All data transmitted over HTTPS
- **HSTS Headers**: Strict Transport Security (when HTTPS enabled)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **CORS Protection**: Configurable cross-origin resource sharing
- **Self-Signed Certificates**: For development (replace with CA certificates for production)

### 🧪 Testing

Test the HTTPS endpoints:

```bash
cd backend
python tools/tls/test_https.py
```

This will verify:
- Root endpoint (`/`)
- Health check (`/health`)
- TLS/SSL encryption

### 📁 File Structure

```
backend/
├── certs/
│   ├── server.crt         # SSL certificate (generated)
│   └── server.key         # Private key (generated)
├── tools/
│   ├── rls/
│   │   └── rls_setup.py    # RLS policy setup script
│   └── tls/
│       ├── generate_cert.py    # Certificate generation script
│       ├── start_secure.py     # Secure server startup script
│       └── test_https.py       # HTTPS testing script
├── docs/
│   ├── migration/
│   └── tls/
│       └── https.md           # This documentation
└── app/
    └── main.py            # FastAPI app with security middleware
```

### ⚠️ Production Deployment

For production deployment:

1. **Replace Self-Signed Certificates**:
   - Obtain certificates from a Certificate Authority (Let's Encrypt, etc.)
   - Update `SSL_CERT_PATH` and `SSL_KEY_PATH` in `.env`

2. **Enable Production Security**:
   - Set `DEBUG=false` in environment
   - Configure proper firewall rules
   - Use a reverse proxy (nginx, Apache) for additional security

3. **Environment Setup**:
   ```bash
   export HTTPS_ENABLED=true
   export DEBUG=false
   ```

### 🔍 API Endpoints

- `GET /` - Server status and protocol information
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (development only)
- `GET /api/v1/*` - API endpoints (secured with TLS)

### 🛡️ Security Best Practices

- Always use HTTPS in production
- Regularly rotate SSL certificates
- Implement proper authentication and authorization
- Use environment variables for sensitive configuration
- Enable security headers and CORS policies
- Monitor for security vulnerabilities

### 🚨 Troubleshooting

**Certificate Errors**: Run `python certs/generate_cert.py` to regenerate certificates

**Port Conflicts**: Change ports in `.env` or use `--port` flag

**Connection Issues**: Ensure firewall allows the configured port

**Import Errors**: Activate virtual environment: `.\venv\Scripts\activate`

---

**Status**: ✅ HTTPS/TLS encryption configured and ready for secure e-commerce operations.