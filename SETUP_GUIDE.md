# 🚀 Hex AI - Agentic Mode Setup Guide

Complete guide to set up professional red teaming features with real tool execution.

---

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18+)
   ```bash
   node --version  # Should be 18 or higher
   ```

2. **Docker Desktop**
   - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

3. **Git**
   ```bash
   git --version
   ```

### Verify Docker is Running
```bash
docker --version
docker ps  # Should show no errors
```

---

## 🔧 Installation Steps

### Step 1: Install Frontend Dependencies

```bash
# Navigate to project root
cd Hex-

# Install dependencies
npm install
```

### Step 2: Install Backend Dependencies

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Go back to root
cd ..
```

### Step 3: Build Docker Container

```bash
# Navigate to server/docker directory
cd server/docker

# Build the Kali Linux container (this takes 10-15 minutes)
docker-compose build

# Start the container
docker-compose up -d

# Verify container is running
docker ps
```

You should see output like:
```
CONTAINER ID   IMAGE          COMMAND       CREATED        STATUS        PORTS     NAMES
abc123def456   hex-kali...   "/bin/bash"   2 minutes ago  Up 2 minutes            hex-kali-tools
```

### Step 4: Configure Environment Variables

Create `.env` file in the project root:

```bash
# From project root
cat > .env << 'EOF'
# DeepSeek API
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WebSocket Server URL
VITE_WS_URL=ws://localhost:8081
EOF
```

Create `.env` file in the server directory:

```bash
# From server directory
cd server
cat > .env << 'EOF'
# Server Configuration
PORT=8081

# Supabase (for authentication)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
EOF
cd ..
```

---

## 🏃 Running the Application

### Option A: Run Everything (Recommended)

Open **3 terminal windows**:

#### Terminal 1: Docker Container
```bash
cd server/docker
docker-compose up
```

#### Terminal 2: Backend WebSocket Server
```bash
cd server
npm run dev
```

#### Terminal 3: Frontend React App
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:8081
- **WebSocket**: ws://localhost:8081

### Option B: Using npm scripts

From project root:

```bash
# Terminal 1: Start Docker
npm run docker:up

# Terminal 2: Start Backend
cd server && npm run dev

# Terminal 3: Start Frontend  
npm run dev
```

---

## 🧪 Testing the Setup

### 1. Verify Docker Container

```bash
# Check container is running
docker ps

# Test command execution inside container
docker exec -it hex-kali-tools nmap --version
```

Expected output:
```
Nmap version 7.94 ( https://nmap.org )
```

### 2. Test Backend Server

```bash
curl http://localhost:8081/health
```

Expected output:
```json
{"status":"ok","timestamp":"2025-10-28T..."}
```

### 3. Test in Browser

1. Open http://localhost:8080
2. Sign in with GitHub
3. Upgrade to Premium (required for tool execution)
4. Send a message: **"Scan 127.0.0.1 with nmap using quick scan"**
5. You should see:
   - Terminal window appear
   - Command output in real-time
   - AI analyzing results

---

## 🔒 Premium Subscription Setup

Tool execution is **premium-only**. Users must:

1. Sign in with GitHub
2. Click "Upgrade to Premium"
3. Complete payment via IntaSend ($3/month)
4. Tool execution will be enabled

### Test as Premium User

For development/testing, you can manually set a user to premium in Supabase:

```sql
UPDATE user_profiles
SET subscription_status = 'premium',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '30 days'
WHERE email = 'your-email@example.com';
```

---

## 🛠️ Available Tools

Once set up, these tools are available:

### Network Scanning
- `nmap` - Port scanning & service detection
- `masscan` - Fast port scanner
- `zmap` - Internet-wide scanner

### Web Application Testing
- `sqlmap` - SQL injection testing
- `nikto` - Web server scanner
- `gobuster` - Directory/file brute-forcing
- `wpscan` - WordPress vulnerability scanner
- `whatweb` - Web technology identifier

### Password Cracking
- `hydra` - Network login brute-forcer
- `john` - Password hash cracker
- `hashcat` - Advanced hash cracking

### Exploitation
- `metasploit` - Exploitation framework
- `searchsploit` - Exploit database search

### Enumeration
- `enum4linux` - SMB enumeration
- `smbmap` - SMB share enumeration
- `crackmapexec` - Network enumeration

### Network Utilities
- `curl` - HTTP requests
- `wget` - File downloading
- `dig` - DNS queries
- `whois` - Domain information
- `nslookup` - DNS lookup

### SSL/TLS Testing
- `sslscan` - SSL/TLS scanner
- `sslyze` - SSL configuration analyzer

---

## 📝 Example Commands

### Ask Hex AI:

1. **"Scan my local network"**
   - AI will use `nmap -sn 192.168.1.0/24`

2. **"Check if example.com has SQL injection"**
   - AI will use `sqlmap -u http://example.com/page?id=1`

3. **"Find hidden directories on my test website"**
   - AI will use `gobuster dir -u http://testsite.local -w common.txt`

4. **"Test SSH password on my lab server"**
   - AI will use `hydra -l admin -P passwords.txt 192.168.1.100 ssh`

5. **"Search for Apache exploits in Metasploit"**
   - AI will use `msfconsole -q -x "search apache"`

---

## 🔍 Troubleshooting

### Docker Container Won't Start

```bash
# Check Docker is running
docker info

# Remove old container and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### WebSocket Connection Failed

1. Check backend server is running:
   ```bash
   curl http://localhost:8081/health
   ```

2. Check firewall isn't blocking port 8081

3. Verify `.env` has correct `VITE_WS_URL=ws://localhost:8081`

### "Premium Required" Error

1. Check user is signed in
2. Verify subscription status in Supabase:
   ```sql
   SELECT subscription_status, subscription_end_date 
   FROM user_profiles 
   WHERE id = 'user-id-here';
   ```

3. For testing, manually set premium (see above)

### Tools Not Found in Container

```bash
# Enter container
docker exec -it hex-kali-tools /bin/bash

# Check if tool exists
which nmap
which sqlmap

# If missing, install:
apt-get update
apt-get install nmap sqlmap
```

### Command Times Out

Default timeout is 5 minutes. For longer scans:

1. Modify `server/index.js`:
   ```javascript
   // Change from 5 minutes to 15 minutes
   setTimeout(() => {
     proc.kill('SIGTERM');
   }, 15 * 60 * 1000);
   ```

2. Restart backend server

---

## 🔐 Security Best Practices

### ⚠️ Important Security Notes

1. **Only Test Authorized Systems**
   - By default, only private IPs are allowed (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
   - Public IP scanning is disabled for safety
   - Only scan systems you own or have explicit permission to test

2. **Keep Container Updated**
   ```bash
   docker-compose down
   docker-compose build --pull
   docker-compose up -d
   ```

3. **Rotate Supabase Keys**
   - Use separate keys for development and production
   - Never commit `.env` files to git

4. **Monitor Usage**
   - Check logs regularly:
   ```bash
   docker-compose logs -f kali-tools
   ```

5. **Backup Results**
   - Tool outputs are stored in Docker volume
   - Export important findings before destroying container

---

## 📊 Architecture Overview

```
User (Browser)
    ↓
React Frontend (localhost:8080)
    ↓ WebSocket
Backend Server (localhost:8081)
    ↓ Docker Exec
Kali Linux Container
    ↓ Execute
Security Tools (nmap, sqlmap, etc.)
```

### Data Flow

1. User asks: "Scan 192.168.1.1"
2. DeepSeek AI decides to use `nmap_scan` tool
3. Frontend calls `executeTool('nmap_scan', {target: '192.168.1.1', ...})`
4. WebSocket sends to backend server
5. Backend validates command and user permissions
6. Backend executes `docker exec hex-kali-tools nmap ...`
7. Output streams back through WebSocket
8. Frontend displays in terminal window
9. AI analyzes results and responds to user

---

## 🚀 Production Deployment

For production deployment on a VPS:

### 1. Set Up VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone and Build

```bash
git clone <your-repo>
cd Hex-
npm install
cd server && npm install
```

### 3. Configure Environment

Create production `.env` files with real values.

### 4. Use PM2 for Backend

```bash
npm install -g pm2

# Start backend with PM2
cd server
pm2 start index.js --name hex-backend

# View logs
pm2 logs hex-backend

# Make it start on boot
pm2 startup
pm2 save
```

### 5. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/hex
server {
    listen 80;
    server_name your-domain.com;

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 6. SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📚 Additional Resources

- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Kali Linux Tools](https://www.kali.org/tools/)
- [Metasploit Unleashed](https://www.offensive-security.com/metasploit-unleashed/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs:
   ```bash
   # Docker logs
   docker-compose logs -f
   
   # Backend logs
   cd server && npm run dev
   
   # Frontend logs
   npm run dev
   ```

2. Verify all services are running:
   ```bash
   docker ps  # Should show hex-kali-tools
   curl http://localhost:8081/health  # Should return OK
   ```

3. Check GitHub Issues or create a new one

---

## ✅ Quick Start Checklist

- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Server dependencies installed (`cd server && npm install`)
- [ ] Docker container built (`cd server/docker && docker-compose build`)
- [ ] Environment variables configured (`.env` files)
- [ ] Docker container running (`docker ps` shows hex-kali-tools)
- [ ] Backend server running on port 8081
- [ ] Frontend running on port 8080
- [ ] User authenticated and premium status set
- [ ] Test command executed successfully

---

**You're all set!** 🎉

Try asking Hex AI:
> "Scan 127.0.0.1 with nmap quick scan and show me the results"

Watch the terminal window appear with real-time output!

