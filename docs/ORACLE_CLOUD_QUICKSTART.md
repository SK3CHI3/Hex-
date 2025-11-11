# 🚀 Hex AI Oracle Cloud Quickstart - Copy & Paste Guide

**Domain:** https://hexai.website/  
**Setup Time:** 30 minutes  
**Cost:** $0/month (FREE FOREVER)

---

## Prerequisites Checklist

- [ ] Oracle Cloud account created (https://www.oracle.com/cloud/free/)
- [ ] VM instance created (Ubuntu 22.04, ARM Ampere, 12GB RAM)
- [ ] SSH key downloaded
- [ ] VM Public IP noted down: `_____________`

---

## 📋 Step-by-Step Commands (Just Copy & Paste!)

### Step 1: SSH into Your VM

Replace `YOUR_VM_IP` with your actual IP address:

```bash
ssh -i ~/path/to/your-key.key ubuntu@YOUR_VM_IP
```

---

### Step 2: Install Everything (Run as one block)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 & Nginx
sudo npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx git

# Logout and login again
exit
```

**After logout, SSH back in:**

```bash
ssh -i ~/path/to/your-key.key ubuntu@YOUR_VM_IP
```

---

### Step 3: Clone & Setup Hex AI

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Hex-.git
cd Hex-

# Install backend dependencies
cd server && npm install
cd mcp-adapter && npm install && cd ..
cd mcp-server && npm install && cd ../..
```

---

### Step 4: Configure Environment Variables

**⚠️ IMPORTANT: Replace these values with your actual keys!**

#### MCP Adapter Environment:

```bash
cat > server/mcp-adapter/.env << 'EOF'
DEEPSEEK_API_KEY=sk-56b004b8a0cb44f88e1df91b42fd3a0f
MCP_ADAPTER_PORT=8083
MCP_TOOL_SERVER_URL=stdio://mcp-server
EOF
```

#### Tool Server Environment:

```bash
cat > server/.env << 'EOF'
PORT=8081
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key-here
EOF
```

---

### Step 5: Start Docker & Services

```bash
# Start Docker container
cd server/docker
docker-compose up -d
cd ../..

# Start backend services with PM2
cd server
pm2 start index.js --name hex-tool-server
pm2 start mcp-adapter/index.js --name hex-mcp-adapter

# Make PM2 start on boot
pm2 startup
# Copy and run the command it outputs, then:
pm2 save

# Verify services are running
pm2 status
```

**Expected output:**
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ cpu     │ memory   │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ hex-tool-server    │ online  │ 0%      │ 50 MB    │
│ 1   │ hex-mcp-adapter    │ online  │ 0%      │ 45 MB    │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

---

### Step 6: Configure Nginx for hexai.website

```bash
sudo nano /etc/nginx/sites-available/hex-backend
```

**Copy & paste this EXACT configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name hexai.website www.hexai.website;
    return 301 https://hexai.website$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hexai.website www.hexai.website;

    # SSL certificates (certbot will configure these)
    ssl_certificate /etc/letsencrypt/live/hexai.website/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hexai.website/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # MCP Adapter (SSE streaming for AI chat)
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
        proxy_read_timeout 3600s;
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
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
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

### Step 7: Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/hex-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

### Step 8: Configure DNS (Do this BEFORE getting SSL)

**In your domain registrar (Namecheap, Cloudflare, etc.):**

Add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_VM_IP` | 300 |
| A | www | `YOUR_VM_IP` | 300 |

**Wait 5-10 minutes** for DNS to propagate. Test with:

```bash
# On your local machine (not the VM)
ping hexai.website
```

---

### Step 9: Get FREE SSL Certificate

```bash
# Get SSL certificate for hexai.website
sudo certbot --nginx -d hexai.website -d www.hexai.website

# Follow prompts:
# 1. Enter your email: your-email@example.com
# 2. Agree to terms: Y
# 3. Share email with EFF (optional): Y or N
# 4. Choose: 2 (Redirect HTTP to HTTPS)

# Certbot will automatically configure Nginx!
```

**Test auto-renewal:**

```bash
sudo certbot renew --dry-run
```

---

### Step 10: Open Firewall Ports

**In Oracle Cloud Console:**

1. Go to: **☰ Menu → Networking → Virtual Cloud Networks**
2. Click your VCN → **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules**

Add these rules:

| Port | Source CIDR | Description |
|------|-------------|-------------|
| 22 | 0.0.0.0/0 | SSH |
| 80 | 0.0.0.0/0 | HTTP |
| 443 | 0.0.0.0/0 | HTTPS |

**Click "Add Ingress Rules"**

---

### Step 11: Configure Ubuntu Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## 🎉 Your Backend is Ready!

Test your backend:

```bash
# Test health endpoint
curl https://hexai.website/health

# Should return: {"status":"ok","timestamp":"2025-..."}
```

---

## 📱 Update Frontend Environment Variables

**In your Netlify dashboard** (or wherever your frontend is deployed):

Go to: **Site settings → Environment variables → Edit variables**

Add/Update these:

```env
VITE_MCP_ADAPTER_URL=https://hexai.website
VITE_WS_URL=wss://hexai.website/ws
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DEEPSEEK_API_KEY=sk-56b004b8a0cb44f88e1df91b42fd3a0f
```

**Redeploy your frontend:**

```bash
# Commit any changes and push
git add .
git commit -m "Update backend URLs to hexai.website"
git push origin main

# Netlify will auto-deploy
```

---

## ✅ Final Test

1. **Visit:** https://hexai.website/ (your frontend)
2. **Sign in with GitHub**
3. **Send message:** "Hello, test the backend connection"
4. **Should see:** AI response streaming in real-time
5. **Test tools (if premium):** "Scan 127.0.0.1 with nmap"

---

## 🛠️ Maintenance Commands

### Check Service Status

```bash
# Check PM2 services
pm2 status

# View logs
pm2 logs

# Restart a service
pm2 restart hex-tool-server
pm2 restart hex-mcp-adapter

# Restart all
pm2 restart all
```

### Check Docker

```bash
# Check container
docker ps

# View logs
docker logs hex-kali-tools

# Restart container
docker restart hex-kali-tools
```

### Update Application

```bash
cd ~/Hex-

# Pull latest changes
git pull

# Reinstall dependencies (if needed)
cd server && npm install

# Restart services
pm2 restart all
```

### Monitor Resources

```bash
# Check RAM/CPU usage
htop

# Check disk space
df -h

# Check PM2 memory
pm2 monit
```

---

## 🆘 Quick Troubleshooting

### Backend not responding?

```bash
# Check services
pm2 status

# Check logs
pm2 logs --lines 50

# Restart everything
pm2 restart all
sudo systemctl restart nginx
```

### SSL certificate issues?

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

### WebSocket not connecting?

```bash
# Check Nginx config
sudo nginx -t

# Check if port 8081 is listening
sudo netstat -tlnp | grep 8081

# Check PM2 logs
pm2 logs hex-tool-server
```

### Docker container not running?

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Start container
cd ~/Hex-/server/docker
docker-compose up -d
```

---

## 📊 Architecture Overview

```
Frontend (Netlify)
    ↓ HTTPS
https://hexai.website/
    ↓
Nginx (Oracle VM)
    ↓
Backend Services
    ├─ MCP Adapter (localhost:8083)
    ├─ Tool Server (localhost:8081)
    └─ Docker/Kali (container)
    ↓
Supabase (Database & Auth)
```

---

## 🔐 Security Checklist

- [x] SSL/HTTPS enabled (Let's Encrypt)
- [x] Firewall configured (UFW + Oracle)
- [x] Nginx reverse proxy
- [x] SSH key authentication
- [x] Environment variables secured
- [ ] Disable SSH password login (recommended)
- [ ] Set up fail2ban (optional)
- [ ] Regular backups configured (optional)

**Harden SSH (Recommended):**

```bash
sudo nano /etc/ssh/sshd_config

# Change these lines:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Save and restart
sudo systemctl restart sshd
```

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Oracle Cloud VM (12GB RAM, 2 CPU) | **$0/month** |
| Netlify (Frontend) | **$0/month** |
| Supabase (Database) | **$0/month** |
| SSL Certificate (Let's Encrypt) | **$0/month** |
| Domain (hexai.website) | **$12/year** |
| **TOTAL** | **$1/month** 🎉 |

---

## 🎯 What You Have Now

✅ **Production-ready backend** on Oracle Cloud  
✅ **FREE forever** (Always Free tier)  
✅ **SSL/HTTPS** with auto-renewal  
✅ **12GB RAM** - way more than Railway's $20/month plan  
✅ **WebSocket support** for real-time tool execution  
✅ **Docker container** with Kali Linux tools  
✅ **Professional domain** (hexai.website)  
✅ **Auto-start on boot** (PM2 + systemd)  
✅ **Enterprise infrastructure** at $0 cost  

---

## 📚 Need Help?

- **Full docs:** [HYBRID_DEPLOYMENT_STRATEGY.md](HYBRID_DEPLOYMENT_STRATEGY.md)
- **Detailed Oracle guide:** [ORACLE_CLOUD_DEPLOYMENT.md](ORACLE_CLOUD_DEPLOYMENT.md)
- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md)

---

**🎉 Congratulations!** Your Hex AI is now running on production infrastructure - for FREE!













