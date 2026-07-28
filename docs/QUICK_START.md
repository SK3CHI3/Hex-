# ⚡ Hex AI - Quick Start

## 🎯 What You Get

- **AI-powered pentesting assistant** with 42+ security tools
- **Real-time tool execution** in isolated Docker containers
- **Local-first** — runs on your machine, no cloud costs
- **ModelScope Qwen3.7-Plus** — free tier available

---

## 🚀 Quick Setup (5 minutes + 15 min Docker build)

### Prerequisites

- **Node.js 18+** and npm
- **Docker Desktop** (running)
- **Git**

### Installation

**Windows:**
```powershell
# 1. Clone the repo
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-

# 2. Run automated setup (installs deps, builds Docker, creates .env files)
.\setup.ps1

# 3. Edit .env files with your API keys
#    - .env → VITE_MODELSCOPE_API_KEY
#    - server\mcp-adapter\.env → MODELSCOPE_API_KEY
#    - server\.env → SUPABASE_URL, SUPABASE_SERVICE_KEY

# 4. Start all services
.\start.ps1
```

**Linux/Mac:**
```bash
# 1. Clone the repo
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-

# 2. Run automated setup
chmod +x setup.sh
./setup.sh

# 3. Edit .env files with your API keys

# 4. Start all services
./start-dev.sh
```

---

## ✅ Test It

1. Open http://localhost:8080
2. Sign in with GitHub
3. Try: **"Scan 127.0.0.1 with nmap quick scan"**
4. Watch the terminal appear with real output! 🔥

---

## 🛠️ What You Can Do

Try these commands:

- **"Scan my local network"** → Nmap
- **"Find subdomains of example.com"** → Subfinder
- **"Check example.com for vulnerabilities"** → Nuclei
- **"Brute force SSH on 192.168.1.1"** → Hydra
- **"Analyze this APK for malware"** → APK analysis

---

## 📚 Full Documentation

- **[Setup Guide](SETUP_GUIDE.md)** — Detailed installation instructions
- **[Architecture](ARCHITECTURE.md)** — System design and components
- **[Tool Arsenal](TOOL_ARSENAL.md)** — All 42+ available tools
- **[API Documentation](API.md)** — ModelScope integration details

---

## 🔧 Daily Usage

```powershell
# Start everything
.\start.ps1

# Stop everything
.\stop.ps1
```

---

## 🆘 Troubleshooting

**Docker not running?**
- Start Docker Desktop first
- Check with: `docker ps`

**Port already in use?**
- Stop other services on ports 8080, 8081, 8083
- Or edit the port in the respective `.env` files

**API key errors?**
- Verify your ModelScope API key at https://modelscope.ai
- Check `server/mcp-adapter/.env` has the key

**Full troubleshooting guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/SK3CHI3/Hex-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SK3CHI3/Hex-/discussions)

---

**🔒 Hack Ethically • Learn Continuously • Share Knowledge**
