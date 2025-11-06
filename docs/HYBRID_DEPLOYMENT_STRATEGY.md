# 🏗️ Hex AI - Hybrid Architecture Deployment Strategy

## 📊 Architecture Evolution Analysis

### Initial State: Pure Serverless (Jamstack)
```
Frontend (Static)     →     Supabase
   Netlify                (DB + Auth + Edge Functions)
```
**Pros:**
- ✅ Zero server management
- ✅ Infinite scalability
- ✅ Low cost (mostly free tier)
- ✅ Simple deployment (git push)

**Cons:**
- ❌ 10-second timeout on edge functions
- ❌ Cannot run long-running processes
- ❌ No WebSocket support
- ❌ Limited to simple API calls

---

### Current State: Hybrid Architecture
```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                        │
│                     (Serverless ✅)                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React App (Static Build)                          │  │
│  │  - Deployed to Netlify/Vercel                      │  │
│  │  - CDN distributed globally                        │  │
│  │  - No server required                              │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────┬───────────────────┘
                 │                     │
       ┌─────────┴─────────┐   ┌──────┴────────┐
       │  HTTP/SSE         │   │   WebSocket   │
       │  (Chat API)       │   │  (Tool Exec)  │
       │                   │   │               │
┌──────▼──────────────┐    │   │  ┌────────────▼──────┐
│  Supabase (BaaS)    │    │   │  │  BACKEND LAYER    │
│  (Serverless ✅)    │    │   │  │  (Stateful ❌)    │
│  - PostgreSQL       │    │   │  └───────────────────┘
│  - Authentication   │    │   │         │
│  - Row Level Sec    │    │   │    ┌────┴────────────────┐
│  - Edge Functions   │    │   │    │                     │
└─────────────────────┘    │   │    │  3 Backend Services │
                           │   │    │  (MUST BE RUNNING)  │
┌──────────────────────────▼───▼────▼─────────────────────┐
│                                                          │
│  1. MCP Adapter (Port 8083)                             │
│     - DeepSeek API bridge                                │
│     - SSE streaming                                      │
│     - LLM response handling                              │
│                                                          │
│  2. Tool Execution Server (Port 8081)                   │
│     - WebSocket server                                   │
│     - Command validation                                 │
│     - Real-time output streaming                         │
│                                                          │
│  3. MCP Tool Server (Port 8082)                         │
│     - MCP protocol implementation                        │
│     - Tool definitions                                   │
│     - Execution orchestration                            │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
            ┌────────────▼──────────────┐
            │  Docker Container         │
            │  (Infrastructure Layer)   │
            │  - Kali Linux             │
            │  - Pentesting tools       │
            │  - Isolated execution     │
            └───────────────────────────┘
```

---

## 🎯 Deployment Strategy Options

### Option 1: Full Cloud VPS (Recommended for Production)

**Architecture:**
```
Static Frontend (Netlify)  →  Backend + Docker (VPS)  →  Supabase
```

**Hosting Options:**

#### A. DigitalOcean Droplet ($12-24/month)
```bash
# Ubuntu 22.04 LTS
# 2 vCPUs, 4GB RAM, 80GB SSD

# What runs here:
- All 3 backend services (Node.js)
- Docker container (Kali tools)
- Nginx (reverse proxy + SSL)
- PM2 (process manager)
```

**Deployment:**
```bash
# 1. Set up VPS
ssh root@your-vps-ip

# 2. Install dependencies
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx

# 3. Clone and build
git clone <your-repo>
cd Hex-/server
npm install
cd mcp-adapter && npm install && cd ..
cd mcp-server && npm install && cd ..

# 4. Start with PM2
npm install -g pm2
pm2 start index.js --name hex-tool-server
pm2 start mcp-adapter/index.js --name hex-mcp-adapter
pm2 start mcp-server/index.js --name hex-mcp-server
pm2 startup
pm2 save

# 5. Start Docker
cd docker
docker-compose up -d

# 6. Configure Nginx (see below)
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/hex-backend

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # MCP Adapter (SSE streaming)
    location /chat {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE specific headers
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }

    # WebSocket for tool execution
    location /ws {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Health checks
    location /health {
        proxy_pass http://localhost:8081;
    }
}
```

**Frontend Environment:**
```env
# Netlify environment variables
VITE_MCP_ADAPTER_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

**Costs:**
- VPS: $12-24/month (DigitalOcean/Linode/Vultr)
- Domain: $12/year
- Supabase: Free tier (or $25/month for Pro)
- **Total: ~$15-30/month**

**Pros:**
- ✅ Full control over backend
- ✅ No timeouts on tool execution
- ✅ Can run Docker containers
- ✅ Persistent storage
- ✅ Real WebSocket support

**Cons:**
- ❌ Need to manage server security
- ❌ Need to handle backups
- ❌ Need to monitor uptime
- ❌ Manual scaling

---

#### B. AWS EC2 ($15-40/month)
Similar to DigitalOcean but with AWS ecosystem:
- t3.medium instance ($30/month)
- Elastic IP (free if running)
- EBS storage ($8/month for 80GB)
- ALB for load balancing (optional)

**Pros:**
- ✅ Mature ecosystem
- ✅ Easy auto-scaling
- ✅ Integration with other AWS services

**Cons:**
- ❌ More complex pricing
- ❌ Steeper learning curve

---

### Option 2: Railway.app (Easiest, Modern PaaS)

**What is Railway?**
- Modern Platform-as-a-Service
- Deploy from GitHub directly
- Automatic SSL, domains, and scaling
- Docker support built-in

**Deployment:**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Deploy each service
railway up --service mcp-adapter
railway up --service tool-server
railway up --service mcp-server

# 5. Deploy Docker
railway up --service kali-tools --dockerfile server/docker/Dockerfile.kali
```

**Railway Config Files:**

`railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Create separate `railway.toml` for each service:

```toml
# server/mcp-adapter/railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
```

**Costs:**
- Hobby: $5/month (500 hours)
- Developer: $20/month (unlimited)
- **Recommendation: $20/month for all services**

**Pros:**
- ✅ Zero DevOps required
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Built-in monitoring
- ✅ Docker support
- ✅ Easy rollbacks

**Cons:**
- ❌ More expensive than VPS
- ❌ Less control
- ❌ Vendor lock-in

---

### Option 3: Render.com (Good Middle Ground)

**Services Setup:**

1. **Web Service** (MCP Adapter)
   - Build Command: `cd server/mcp-adapter && npm install`
   - Start Command: `npm start`
   - Plan: Starter ($7/month)

2. **Web Service** (Tool Server)
   - Build Command: `cd server && npm install`
   - Start Command: `npm start`
   - Plan: Starter ($7/month)

3. **Background Worker** (MCP Server)
   - Build Command: `cd server/mcp-server && npm install`
   - Start Command: `npm start`
   - Plan: Starter ($7/month)

4. **Docker Service** (Kali Tools)
   - Dockerfile: `server/docker/Dockerfile.kali`
   - Plan: Starter ($7/month)

**render.yaml** (Infrastructure as Code):
```yaml
services:
  - type: web
    name: hex-mcp-adapter
    env: node
    buildCommand: cd server/mcp-adapter && npm install
    startCommand: npm start
    envVars:
      - key: DEEPSEEK_API_KEY
        sync: false
      - key: MCP_TOOL_SERVER_URL
        value: stdio://mcp-server
      - key: PORT
        value: 8083
    
  - type: web
    name: hex-tool-server
    env: node
    buildCommand: cd server && npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 8081
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
    
  - type: pserv
    name: hex-kali-tools
    env: docker
    dockerfilePath: server/docker/Dockerfile.kali
    disk:
      name: kali-data
      mountPath: /home/hexagent/workspace
      sizeGB: 10
```

**Costs:**
- 4 services × $7 = $28/month
- Better pricing than Railway for multiple services

**Pros:**
- ✅ Easy deployment
- ✅ Automatic SSL
- ✅ Good pricing
- ✅ Docker support
- ✅ Free SSL

**Cons:**
- ❌ Limited customization
- ❌ US/Europe regions only

---

### Option 4: Oracle Cloud (Best Free Tier!) 🎁

**What is Oracle Cloud?**
- Enterprise cloud provider with **INSANELY generous free tier**
- Free resources are **FOREVER** (not trial)
- Perfect for Hex AI deployment

**Always Free Resources:**
```
✅ 4 ARM-based VMs (Ampere A1)
   - 24GB RAM total
   - 4 OCPUs total
   - Can create: 4 VMs with 1 OCPU + 6GB RAM each

OR

✅ 2 AMD-based VMs (VM.Standard.E2.1.Micro)
   - 1GB RAM each
   - 1/8 OCPU each
   - Good for lightweight services

PLUS:
✅ 200GB Block Storage
✅ 10TB outbound transfer/month
✅ Load Balancer
✅ Virtual Cloud Network
```

**Recommended Setup for Hex AI (100% FREE!):**

```
VM 1 (ARM - 2 OCPU, 12GB RAM):
  - MCP Adapter
  - Tool Execution Server
  - MCP Server (optional)
  - Docker Container (Kali)
  - Nginx reverse proxy

VM 2 (ARM - 2 OCPU, 12GB RAM):
  - Backup/failover
  - OR run monitoring tools
  - OR keep for scaling later
```

**Step-by-Step Deployment:**

#### 1. Create Oracle Cloud Account
```bash
# Go to https://www.oracle.com/cloud/free/
# Sign up for free tier (no credit card required for 30 days)
# After 30 days, only uses free-tier resources
```

#### 2. Create VM Instance
```bash
# In OCI Console:
# 1. Compute → Instances → Create Instance
# 2. Name: hex-ai-backend
# 3. Image: Ubuntu 22.04
# 4. Shape: Ampere (ARM) - VM.Standard.A1.Flex
# 5. OCPUs: 2
# 6. Memory: 12GB
# 7. Add SSH key
# 8. Create
```

#### 3. Configure Firewall
```bash
# In OCI Console:
# Networking → Virtual Cloud Networks → Your VCN → Security Lists
# Add Ingress Rules:
# - Port 22 (SSH)
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
# - Port 8081 (WebSocket) - optional if using nginx proxy
```

#### 4. Setup Server
```bash
# SSH into your instance
ssh ubuntu@your-vm-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 5. Deploy Application
```bash
# Clone repository
git clone https://github.com/your-username/Hex-.git
cd Hex-

# Install dependencies
cd server
npm install

cd mcp-adapter
npm install
cd ..

cd mcp-server
npm install
cd ../..

# Create environment files
cat > server/mcp-adapter/.env << EOF
DEEPSEEK_API_KEY=sk-your-key-here
MCP_ADAPTER_PORT=8083
MCP_TOOL_SERVER_URL=stdio://mcp-server
EOF

cat > server/.env << EOF
PORT=8081
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
EOF

# Start Docker container
cd server/docker
docker-compose up -d
cd ../..

# Start services with PM2
cd server
pm2 start index.js --name hex-tool-server
pm2 start mcp-adapter/index.js --name hex-mcp-adapter
pm2 startup
pm2 save
```

#### 6. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/hex-backend
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL will be configured by certbot
    
    # MCP Adapter (SSE streaming)
    location /chat {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }

    # WebSocket for tool execution
    location /ws {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8081;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hex-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (after DNS is configured)
sudo certbot --nginx -d your-domain.com
```

#### 7. Configure DNS
```bash
# In your domain registrar (Namecheap, Cloudflare, etc.)
# Add A record:
# Type: A
# Name: api (or @)
# Value: your-oracle-vm-ip
# TTL: 300
```

#### 8. Update Frontend Environment
```env
# In Netlify dashboard or .env
VITE_MCP_ADAPTER_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com/ws
```

**Costs:**
- Oracle Cloud: **$0/month** (Always Free tier)
- Domain: $12/year (optional - can use IP)
- SSL: $0 (Let's Encrypt)
- **Total: $0-1/month** 🎉

**Pros:**
- ✅ **100% FREE** (no time limit)
- ✅ Generous resources (better than paid VPS)
- ✅ 24GB RAM available
- ✅ ARM processors (very efficient)
- ✅ Global network
- ✅ Enterprise-grade infrastructure
- ✅ Great for learning cloud deployment

**Cons:**
- ❌ More complex than Railway/Render
- ❌ UI is not as user-friendly
- ❌ Account approval can take time
- ❌ Free tier VMs can be terminated if idle (restart them)
- ❌ ARM architecture (most tools work, but check compatibility)

**Important Notes:**

⚠️ **Keep VMs Active:**
Oracle may reclaim idle free-tier VMs. Keep them active:
```bash
# Add to crontab to prevent idle detection
crontab -e

# Add this line (keeps VM busy)
*/30 * * * * touch /tmp/keep-alive-$(date +\%s)
```

⚠️ **Backup Configuration:**
Oracle can delete inactive accounts. Keep backups of:
- Environment variables
- Docker volumes
- PM2 configurations

⚠️ **Resource Limits:**
Stay within free tier limits:
- Max 2 VMs (AMD) or 4 VMs (ARM)
- Max 200GB storage
- Max 10TB outbound transfer/month

---

### Option 5: Split Deployment (Hybrid of Hybrids)

**Best for:** Cost optimization while maintaining flexibility

```
Frontend → Netlify (FREE)
Supabase → Supabase.com (FREE tier)
Backend → Fly.io ($5-10/month)
Docker → Separate VPS ($6/month - Hetzner)
```

**Fly.io for Backend Services:**

`fly.toml`:
```toml
app = "hex-backend"

[build]
  builder = "paketobuildpacks/builder:base"

[[services]]
  internal_port = 8081
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[env]
  PORT = "8081"
```

**Deploy:**
```bash
flyctl launch
flyctl deploy
```

**Costs:**
- Fly.io: $5/month (1 shared CPU, 256MB RAM)
- Hetzner VPS: €4.5/month (~$5) for Docker
- **Total: ~$10/month**

---

## 🛡️ Security Considerations

### 1. Environment Variables

**NEVER commit:**
```
.env
server/.env
server/mcp-adapter/.env
server/mcp-server/.env
```

**Use Secrets Management:**
```bash
# Railway
railway variables set DEEPSEEK_API_KEY=sk-xxx

# Render
# Set in dashboard

# VPS
# Use .env files with proper permissions
chmod 600 .env
```

### 2. Network Security

**Firewall Rules (VPS):**
```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**Docker Network Isolation:**
```yaml
# docker-compose.yml
networks:
  internal:
    internal: true  # No external access
  frontend:
    # Allow external connections
```

### 3. Rate Limiting

**Nginx:**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /chat {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:8083;
}
```

**Express:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/chat', limiter);
```

---

## 📊 Comparison Table

| Solution | Cost/Month | Complexity | Docker Support | Auto-scaling | Recommended For |
|----------|-----------|------------|----------------|--------------|-----------------|
| **Oracle Cloud** | **$0** 🎁 | High | ✅ Yes | Manual | **Best value!** Free forever |
| **Railway** | $20 | Low | ✅ Yes | ✅ Auto | Easiest setup |
| **VPS (DigitalOcean)** | $15-30 | High | ✅ Yes | Manual | Full control |
| **Render** | $28 | Medium | ✅ Yes | ✅ Auto | Balanced approach |
| **Fly.io** | $10 | Medium | ✅ Yes | ✅ Auto | Cost-conscious |
| **AWS EC2** | $30-50 | High | ✅ Yes | Complex | Enterprise |

---

## 🎯 **RECOMMENDATION FOR HEX AI**

### For Development/Testing:
```
Frontend: Local (npm run dev)
Backend: Local (all 3 services)
Docker: Local (docker-compose)
Database: Supabase Free Tier
```

### For Production (100% Free! - Personal/Hobby):
```
Frontend: Netlify (FREE)
Backend: Oracle Cloud Always Free (FREE)
  - ARM VM with 12GB RAM
  - MCP Adapter
  - Tool Server  
  - MCP Server
  - Docker (Kali)
Database: Supabase Free Tier
CDN: Cloudflare (FREE)

TOTAL: $0/month 🎉
```

### For Production (Easiest Setup - Small Scale <1000 users):
```
Frontend: Netlify (FREE)
Backend: Railway ($20/month)
  - MCP Adapter
  - Tool Server  
  - MCP Server
  - Docker (Kali)
Database: Supabase Free Tier
CDN: Cloudflare (FREE)

TOTAL: ~$20/month
```

### For Production (Medium Scale - 1000-10000 users):
```
Frontend: Netlify (FREE)
Backend: DigitalOcean VPS ($24/month)
  - Nginx reverse proxy
  - PM2 process manager
  - All services + Docker
Database: Supabase Pro ($25/month)
CDN: Cloudflare (FREE)
Monitoring: UptimeRobot (FREE)

TOTAL: ~$50/month
```

### For Production (Large Scale - 10000+ users):
```
Frontend: Vercel Pro ($20/month)
Backend: AWS ECS ($100-200/month)
  - Auto-scaling containers
  - Load balancer
  - Multiple regions
Database: Supabase Pro ($25/month)
CDN: CloudFront (AWS)
Monitoring: DataDog ($15/month)

TOTAL: ~$200-300/month
```

---

## 🚀 Immediate Next Steps

1. **Choose deployment platform** based on your scale/budget
2. **Set up environment variables** in chosen platform
3. **Configure domain DNS** to point to backend
4. **Deploy backend services** to production
5. **Update frontend environment** variables
6. **Deploy frontend** to Netlify/Vercel
7. **Test end-to-end** functionality
8. **Set up monitoring** and alerts
9. **Document deployment** process

---

## 📚 Additional Resources

- [Railway Deployment Guide](https://docs.railway.app/)
- [Render Infrastructure as Code](https://render.com/docs/infrastructure-as-code)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Fly.io Documentation](https://fly.io/docs/)
- [Nginx WebSocket Proxy](https://nginx.org/en/docs/http/websocket.html)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**Questions? Issues?**

Check the troubleshooting section in `SETUP_GUIDE.md` or open a GitHub issue.

