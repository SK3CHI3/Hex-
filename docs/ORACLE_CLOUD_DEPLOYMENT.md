# 🎁 Deploy Hex AI on Oracle Cloud - 100% FREE

## Why Oracle Cloud?

Oracle Cloud offers the **MOST GENEROUS free tier** of any cloud provider:

```
✅ 4 ARM VMs (24GB RAM total) - FREE FOREVER
✅ 200GB Block Storage - FREE FOREVER  
✅ 10TB outbound transfer/month - FREE FOREVER
✅ Load Balancer - FREE FOREVER
✅ NO CREDIT CARD needed for 30 days
```

**Perfect for Hex AI** because you get:
- 12GB RAM (way more than Railway's $20/month plan)
- 2 CPU cores (ARM Ampere)
- Enough for all services + Docker
- Enterprise-grade infrastructure
- **$0 cost forever**

---

## Quick Start (Complete Setup in 30 Minutes)

### Step 1: Create Oracle Cloud Account (5 minutes)

1. Go to: https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill in details (no credit card for 30 days)
4. Verify email
5. Choose your region (closest to you)

**Tips:**
- Use a real address (they verify)
- You may get waitlisted - approval can take 1-24 hours
- Once approved, resources are free FOREVER

---

### Step 2: Create VM Instance (5 minutes)

1. **Login to OCI Console**
   - https://cloud.oracle.com/

2. **Create Instance:**
   ```
   Navigation: ☰ Menu → Compute → Instances → Create Instance
   
   Settings:
   ├─ Name: hex-ai-backend
   ├─ Image: Ubuntu 22.04 (Canonical)
   ├─ Shape: 
   │  ├─ Click "Change shape"
   │  ├─ Select "Ampere" (ARM)
   │  ├─ Choose: VM.Standard.A1.Flex
   │  ├─ OCPUs: 2
   │  └─ Memory: 12 GB
   ├─ Network: Use default VCN
   └─ SSH Keys: 
      ├─ Generate new key pair (download both files!)
      └─ OR paste your existing public key
   ```

3. **Click "Create"** (takes 1-2 minutes)

4. **Note your Public IP** (you'll need this)

---

### Step 3: Configure Firewall (3 minutes)

**In OCI Console:**

```
Navigation: ☰ Menu → Networking → Virtual Cloud Networks
           → Click your VCN → Security Lists → Default Security List
```

**Add Ingress Rules:**

| Port | Protocol | Source | Description |
|------|----------|---------|-------------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

**Optional (if not using Nginx proxy):**
| Port | Protocol | Source | Description |
|------|----------|---------|-------------|
| 8081 | TCP | 0.0.0.0/0 | WebSocket |
| 8083 | TCP | 0.0.0.0/0 | MCP Adapter |

---

### Step 4: SSH into Your VM (1 minute)

**Windows (PowerShell):**
```powershell
ssh -i C:\path\to\your-key.key ubuntu@your-vm-ip
```

**Mac/Linux:**
```bash
chmod 600 ~/path/to/your-key.key
ssh -i ~/path/to/your-key.key ubuntu@your-vm-ip
```

---

### Step 5: Install Dependencies (5 minutes)

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

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Logout and login again for Docker permissions
exit
# Then SSH back in
```

---

### Step 6: Deploy Hex AI (5 minutes)

```bash
# Clone your repository
git clone https://github.com/your-username/Hex-.git
cd Hex-

# Install backend dependencies
cd server
npm install

# Install MCP Adapter dependencies
cd mcp-adapter
npm install
cd ..

# Install MCP Server dependencies (optional)
cd mcp-server
npm install
cd ../..

# Create environment file for MCP Adapter
cat > server/mcp-adapter/.env << 'EOF'
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
MCP_ADAPTER_PORT=8083
MCP_TOOL_SERVER_URL=stdio://mcp-server
EOF

# Create environment file for Tool Server
cat > server/.env << 'EOF'
PORT=8081
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
EOF

# Start Docker container
cd server/docker
docker-compose up -d
cd ../..

# Start services with PM2
cd server
pm2 start index.js --name hex-tool-server
pm2 start mcp-adapter/index.js --name hex-mcp-adapter

# Make PM2 start on boot
pm2 startup
# Copy and run the command it outputs
pm2 save

# Check status
pm2 status
```

You should see:
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ cpu     │ memory   │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ hex-tool-server    │ online  │ 0%      │ 50 MB    │
│ 1   │ hex-mcp-adapter    │ online  │ 0%      │ 45 MB    │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

---

### Step 7: Configure Nginx (5 minutes)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hex-backend
```

**Paste this configuration:**

```nginx
# HTTP server (will redirect to HTTPS after SSL setup)
server {
    listen 80;
    server_name your-domain.com;  # Change this to your domain or use IP

    # MCP Adapter (SSE streaming)
    location /chat {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # SSE specific headers
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        proxy_read_timeout 3600s;
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

    # Health check
    location /health {
        proxy_pass http://localhost:8081;
    }
}
```

**Enable the site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/hex-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

### Step 8: Configure Domain (Optional but Recommended)

**Option A: Use Your Own Domain**

1. **In your domain registrar (Namecheap, Cloudflare, etc.):**
   ```
   Type: A
   Name: api (or @)
   Value: your-oracle-vm-ip
   TTL: 300
   ```

2. **Wait 5-10 minutes for DNS propagation**

3. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   
   # Follow prompts:
   # - Enter email
   # - Agree to terms
   # - Choose redirect HTTP to HTTPS (option 2)
   ```

4. **Auto-renewal is set up automatically!**

**Option B: Use IP Address (Quick test)**

You can use your VM's IP address directly:
- MCP Adapter: `http://your-vm-ip/chat`
- WebSocket: `ws://your-vm-ip/ws`

⚠️ **Note:** No SSL with IP address - use domain for production

---

### Step 9: Update Frontend Environment (2 minutes)

**In Netlify Dashboard (or your frontend .env):**

```env
# If using domain with SSL:
VITE_MCP_ADAPTER_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws

# If using IP (testing only):
VITE_MCP_ADAPTER_URL=http://your-vm-ip
VITE_WS_URL=ws://your-vm-ip/ws

# Supabase (unchanged):
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Redeploy your frontend** (Netlify does this automatically on git push)

---

### Step 10: Test Everything! (2 minutes)

1. **Visit your frontend:** https://yoursite.netlify.app

2. **Sign in with GitHub**

3. **Send a test message:**
   ```
   "Hello, can you help me with nmap?"
   ```

4. **You should see:**
   - ✅ Message sent
   - ✅ AI response
   - ✅ No errors in console

5. **Test tool execution (if premium):**
   ```
   "Scan 127.0.0.1 with nmap quick scan"
   ```

6. **You should see:**
   - ✅ Terminal window appears
   - ✅ Real-time output
   - ✅ Scan completes

---

## 🎉 You're Done!

**Your Hex AI is now running on Oracle Cloud - 100% FREE!**

### Architecture:
```
Frontend (Netlify - FREE)
    ↓
Nginx (Oracle VM - FREE)
    ↓
Backend Services (Oracle VM - FREE)
    ├─ MCP Adapter (port 8083)
    ├─ Tool Server (port 8081)
    └─ Docker/Kali (container)
    ↓
Supabase (FREE tier)
```

### Costs:
- Oracle Cloud: **$0/month** ✅
- Netlify: **$0/month** ✅
- Supabase: **$0/month** ✅
- Domain: **$12/year** (optional)
- **Total: $0-1/month**

---

## 🛠️ Maintenance & Tips

### Keep VM Active (Important!)

Oracle may reclaim idle free-tier VMs. Prevent this:

```bash
# Add keepalive cron job
crontab -e

# Add this line:
*/30 * * * * touch /tmp/keepalive-$(date +\%s) && curl -s http://localhost:8081/health > /dev/null
```

### Monitor Services

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Restart a service
pm2 restart hex-tool-server

# Stop all services
pm2 stop all

# Start all services
pm2 start all
```

### Check Docker

```bash
# Check container status
docker ps

# View container logs
docker logs hex-kali-tools

# Restart container
docker restart hex-kali-tools

# Enter container
docker exec -it hex-kali-tools bash
```

### Update Application

```bash
cd ~/Hex-

# Pull latest changes
git pull

# Reinstall dependencies (if package.json changed)
cd server && npm install

# Restart services
pm2 restart all
```

### SSL Certificate Renewal

Certbot auto-renews, but you can test:

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

---

## 🔒 Security Checklist

- [ ] SSH key authentication only (disable password login)
- [ ] UFW firewall enabled
- [ ] Nginx reverse proxy configured
- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured
- [ ] Regular system updates
- [ ] Docker container isolated
- [ ] Supabase RLS policies enabled

**Harden SSH:**
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change these:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

**Enable Firewall:**
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🆘 Troubleshooting

### VM Creation Failed: "Out of capacity"

Oracle free tier VMs are popular and sometimes unavailable. Try:
- Different region (change in top-right)
- Different availability domain
- Try again in a few hours
- Use AMD shape (VM.Standard.E2.1.Micro) instead

### Can't SSH into VM

1. **Check you're using the right key:**
   ```bash
   ssh -i /path/to/correct-key.key ubuntu@vm-ip
   ```

2. **Check firewall rules allow port 22**

3. **Try from OCI Console:**
   - Instance → More Actions → Cloud Shell Connection

### Services Not Starting

```bash
# Check logs
pm2 logs

# Common issues:
# - Missing environment variables
# - Port already in use
# - Node version too old

# Fix: Reinstall dependencies
cd server && npm install
pm2 restart all
```

### Docker Container Not Running

```bash
# Check Docker status
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Start container
cd ~/Hex-/server/docker
docker-compose up -d
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
pm2 status

# Check logs
sudo tail -f /var/log/nginx/error.log

# Common fix: Restart everything
pm2 restart all
sudo systemctl restart nginx
```

---

## 📊 Resource Usage

**Expected usage on 12GB RAM VM:**

```
Service               RAM Usage    CPU Usage
─────────────────────────────────────────────
Ubuntu OS             1-2 GB       5-10%
MCP Adapter           50-100 MB    1-5%
Tool Server           50-100 MB    1-5%
Docker Container      2-4 GB       10-20%
Nginx                 20-50 MB     1-2%
─────────────────────────────────────────────
Total                 ~4-6 GB      ~20-40%
Available for growth  6-8 GB       60-80%
```

You have plenty of room for scaling!

---

## 🚀 Next Steps

1. **Set up monitoring:**
   - https://uptimerobot.com (free)
   - Monitor your domain/IP
   - Get alerts if site goes down

2. **Set up backups:**
   ```bash
   # Backup script
   tar -czf backup-$(date +%Y%m%d).tar.gz \
     ~/Hex-/server/.env \
     ~/Hex-/server/mcp-adapter/.env
   ```

3. **Add more features:**
   - Custom domain
   - CDN (Cloudflare)
   - Database backup script
   - Monitoring dashboard

---

## 💡 Why This Works So Well

**Oracle Cloud Free Tier is INSANE:**
- They WANT you to try their cloud
- Free tier is permanent (not trial)
- Resources are enterprise-grade
- ARM processors are efficient
- Perfect for side projects

**Compared to others:**
```
Service      RAM     CPU    Storage   Transfer    Cost
──────────────────────────────────────────────────────
Oracle       24GB    4      200GB     10TB        $0
AWS          1GB     1      30GB      15GB        $0 (12mo)
GCP          0.6GB   0.25   30GB      1GB         $0
Azure        1GB     1      5GB       15GB        $0 (12mo)
```

**Oracle Cloud is the BEST for learning & side projects!**

---

**Questions?** Check [HYBRID_DEPLOYMENT_STRATEGY.md](HYBRID_DEPLOYMENT_STRATEGY.md) for more deployment options!











