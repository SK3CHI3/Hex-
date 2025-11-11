# 🔷 Hex AI - Autonomous Red Teaming Assistant

[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Deploy to Netlify](https://img.shields.io/badge/Deploy_to-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)

> 🤖 **Autonomous AI agent for professional red teaming and penetration testing**

Hex AI is an **agentic security testing platform** that autonomously executes security tools, analyzes results, and generates comprehensive reports. Unlike traditional security assistants that only provide advice, Hex AI **actually runs tools** and learns from failures to improve.

**🌐 Live Demo:** [https://hexai.website](https://hexai.website)

---

## ✨ Key Features

### 🚀 **Agentic Execution**
- **Autonomous Tool Execution**: AI runs security tools automatically (Nmap, SQLMap, Metasploit, etc.)
- **Self-Correction**: Learns from errors and automatically retries with fixes
- **Real-Time Streaming**: Watch commands execute in real-time via WebSocket
- **Multi-Step Workflows**: AI orchestrates complex multi-tool security assessments

### 🛠️ **42+ Security Tools**
- **Network Scanning**: Nmap, RustScan, Masscan, Naabu
- **Web Testing**: SQLMap, Nuclei, Gobuster, Nikto, WPScan, Feroxbuster
- **Active Directory**: CrackMapExec, BloodHound, Kerbrute, Impacket
- **Password Cracking**: Hydra, Hashcat, John the Ripper
- **Wireless**: Aircrack-ng, Wifite, Bettercap, Reaver
- **Pivoting**: Chisel, Socat, Netcat, Proxychains
- **And 20+ more tools...**

### 🖥️ **Real-Time Terminal**
- Live command output streaming
- Color-coded stdout/stderr/errors
- Copy and download outputs
- Command cancellation
- Execution history

### 🔐 **Authentication & Security**
- GitHub OAuth authentication
- JWT-based session management
- Premium subscription system (IntaSend payments)
- Free tier: 10 messages/day
- Premium tier: Unlimited messages

### 🐳 **Docker-Based Execution**
- Isolated Kali Linux containers
- Non-root user execution (hexagent)
- Resource limits and timeouts
- Pre-configured security tools
- Secure command validation

### 📊 **AI-Powered Analysis**
- Automated vulnerability analysis
- Professional report generation
- Error detection and resolution
- Context-aware tool selection
- DeepSeek V3.1-Terminus integration

---

## 🎯 **Upcoming: Local Execution Mode**

**Coming Soon:** Execute tools locally on your machine while maintaining AI control!

- Download Docker images locally
- Use your own network and resources
- Internal network scanning (192.168.x.x, 10.x.x.x)
- Offline capabilities
- Enhanced privacy and compliance

👉 **[Learn More](docs/LOCAL_EXECUTION_MODE.md)**

---

## 🚀 Quick Start

### 🎯 **Production Deployment (Recommended - 100% FREE!)**

**Deploy to Oracle Cloud in 30 minutes - $0/month forever!**

👉 **[Oracle Cloud Quickstart Guide](docs/ORACLE_CLOUD_QUICKSTART.md)** 👈

Pre-configured for **https://hexai.website/** - just copy & paste!

**Features:**
- 12GB RAM, 4 vCPUs (always free)
- Automated setup scripts
- Docker pre-installed
- SSL certificates (Let's Encrypt)
- Auto-restart on failure

---

### 💻 **Local Development**

#### Prerequisites
- Node.js 18+ and npm
- Docker Desktop
- Git

#### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/SK3CHI3/Hex-.git
   cd Hex-
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure environment variables**
   
   Create `.env` file in root:
   ```env
   VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_WS_URL=ws://localhost:8081
   ```

   Create `server/.env`:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   PORT=8081
   ```

4. **Build Docker container**
   ```bash
   cd server/docker
   ./rebuild.sh  # Linux/Mac
   # or
   .\rebuild.ps1  # Windows
   ```

5. **Start all services**
   
   **Windows:**
   ```powershell
   .\start-dev.ps1
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

6. **Open your browser**
   Visit `http://localhost:8080`

**Full setup guide:** [SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Chat Interface + Terminal Window                     │  │
│  │  - Real-time streaming                                │  │
│  │  - Tool execution UI                                  │  │
│  │  - GitHub OAuth                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP (DeepSeek API)
                         │ WebSocket (Execution Server)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐              ┌──────────────────────┐
│ DeepSeek API  │              │ Backend Server       │
│ (AI Engine)   │              │ (Node.js + Express)  │
│               │              │                      │
│ - Function    │              │ - WebSocket Server   │
│   Calling     │              │ - JWT Auth           │
│ - Tool        │              │ - Docker Exec        │
│   Schemas     │              │ - Stream Output      │
└───────────────┘              └──────────┬───────────┘
                                          │
                                          │ Docker Exec
                                          │
                                 ┌────────▼─────────┐
                                 │ Docker Container │
                                 │ (Kali Linux)     │
                                 │                  │
                                 │ - 42+ Tools      │
                                 │ - Non-root user  │
                                 │ - Isolated       │
                                 └──────────────────┘
```

### **Tech Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **AI Provider**: DeepSeek V3.1-Terminus (direct API)
- **Backend**: Node.js + Express + WebSocket
- **Database**: Supabase (PostgreSQL)
- **Authentication**: GitHub OAuth + JWT
- **Payments**: IntaSend (M-Pesa, cards)
- **Execution**: Docker + Kali Linux
- **Deployment**: Netlify (frontend) + Oracle Cloud (backend)

---

## 🛠️ Available Tools

### **Network Scanning & Reconnaissance**
- `nmap_scan` - Port scanning & service detection
- `rustscan` - Ultra-fast port scanner (65k ports in <10s)
- `masscan` - Internet-scale port scanner
- `subfinder_enum` - Passive subdomain enumeration
- `amass_enum` - Attack surface mapping
- `httpx_probe` - HTTP probing & tech detection
- `dns_lookup` - DNS enumeration

### **Web Application Testing**
- `sqlmap_test` - SQL injection detection & exploitation
- `nuclei_scan` - CVE & vulnerability scanner (5000+ templates)
- `ffuf_fuzz` - Fast web fuzzer
- `feroxbuster_scan` - Recursive content discovery
- `gobuster_scan` - Directory brute-forcing
- `nikto_scan` - Web server vulnerability scanner
- `wpscan` - WordPress vulnerability scanner
- `curl_request` - HTTP requests
- `sslscan` - SSL/TLS testing
- `whatweb` - Technology fingerprinting

### **Active Directory & Windows**
- `crackmapexec` - SMB/WinRM/LDAP exploitation
- `bloodhound_collect` - AD attack path mapping
- `kerbrute` - Kerberos brute-forcing
- `responder` - LLMNR/NBT-NS poisoning
- `impacket_tool` - Network protocol exploitation
- `enum4linux_ng` - SMB/LDAP enumeration
- `ldapsearch_query` - LDAP queries
- `rpcclient_enum` - MS-RPC enumeration

### **Password Cracking**
- `hydra_attack` - Network login brute-forcing
- `hashcat_crack` - Hash cracking (NTLM, MD5, SHA, bcrypt)

### **Wireless Hacking**
- `aircrack_ng` - WEP/WPA cracking
- `wifite` - Automated wireless attacks
- `bettercap` - Network MITM & attacks
- `reaver_wps` - WPS PIN brute-forcing
- `wash_wps` - WPS scanner
- `mdk4_attack` - Wireless DoS
- `hostapd_evil_twin` - Rogue AP creation
- `kismet_scan` - Wireless IDS

### **Pivoting & Tunneling**
- `chisel_tunnel` - TCP/UDP tunneling over HTTP
- `socat_relay` - Bidirectional relay
- `netcat_listener` - Network Swiss army knife
- `proxychains` - Proxy routing

### **Exploitation**
- `metasploit_search` - Exploit framework
- `searchsploit` - Exploit database search

**📋 [Complete Tool Arsenal](docs/TOOL_ARSENAL.md)**

---

## 🔧 Configuration

### **Environment Variables**

#### Frontend (`.env`)
```env
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WS_URL=ws://localhost:8081
```

#### Backend (`server/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=8081
```

### **API Configuration**

- **Model**: `deepseek-chat` (DeepSeek V3.1-Terminus)
- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **Max Tokens**: 8192 (configurable)
- **Streaming**: Enabled for real-time responses
- **Function Calling**: Enabled for tool execution

---

## 🚀 Deployment

### **Backend Options**

| Platform | Cost | Setup Time | Guide |
|----------|------|------------|-------|
| **Oracle Cloud** 🎁 | **$0/month** | 30 min | **[Quickstart](docs/ORACLE_CLOUD_QUICKSTART.md)** ⭐ |
| Railway | $20/month | 10 min | [Guide](docs/HYBRID_DEPLOYMENT_STRATEGY.md#option-2-railway-easiest) |
| DigitalOcean | $24/month | 60 min | [Guide](docs/HYBRID_DEPLOYMENT_STRATEGY.md#option-1-full-cloud-vps) |

**Recommended:** Oracle Cloud - Free forever with 12GB RAM!

### **Frontend**

**Netlify** (FREE):
1. Connect GitHub repository
2. Build: `npm run build`, Publish: `dist`
3. Set environment variables ([Guide](docs/FRONTEND_ENV_CONFIG.md))
4. Auto-deploys on `git push`

### **Complete Deployment Guides**

- 📋 [Oracle Cloud Quickstart](docs/ORACLE_CLOUD_QUICKSTART.md) - Copy & paste ready!
- 🏗️ [Hybrid Deployment Strategy](docs/HYBRID_DEPLOYMENT_STRATEGY.md) - All options
- 🎨 [Frontend Configuration](docs/FRONTEND_ENV_CONFIG.md) - Environment setup
- 🐳 [Docker Setup](docs/DEPLOYMENT.md) - Container configuration

---

## 📚 Documentation

### **Getting Started**
- [Setup Guide](docs/SETUP_GUIDE.md) - Complete setup instructions
- [Quick Start](docs/QUICK_START.md) - Fast setup guide
- [Oracle Cloud Quickstart](docs/ORACLE_CLOUD_QUICKSTART.md) - Free deployment

### **Architecture & Development**
- [Technical Reference](docs/DEMO_TECHNICAL_REFERENCE.md) - Complete architecture
- [Agentic Mode Guide](docs/AGENTIC_MODE_GUIDE.md) - Agentic capabilities
- [Tool Arsenal](docs/TOOL_ARSENAL.md) - All available tools
- [MCP Migration](docs/MCP_MIGRATION_COMPLETE.md) - Model Context Protocol

### **Features**
- [Local Execution Mode](docs/LOCAL_EXECUTION_MODE.md) - Local tool execution (coming soon)
- [Terminal Features](docs/TERMINAL_FEATURES.md) - Terminal capabilities
- [Authentication](docs/AUTHENTICATION.md) - Auth system
- [Payment System](docs/INSTASEND_WEBHOOK.md) - Subscription management

### **Deployment**
- [Oracle Cloud Deployment](docs/ORACLE_CLOUD_DEPLOYMENT.md) - Detailed deployment
- [Hybrid Deployment](docs/HYBRID_DEPLOYMENT_STRATEGY.md) - Multiple platforms
- [Frontend Config](docs/FRONTEND_ENV_CONFIG.md) - Environment setup

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Style**

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits for commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Legal Disclaimer

This tool is designed **EXCLUSIVELY** for authorized security testing activities. Users must:

- Only test systems they own or have explicit written permission to test
- Comply with all applicable laws and regulations
- Follow responsible disclosure practices
- Use the tool ethically and legally

**Unauthorized access to systems is illegal and punishable by law.**

The developers and contributors of Hex AI are not responsible for any misuse of this tool.

---

## 🔒 Security

### **Data Security**
- All API keys stored locally (never sent to our servers)
- HTTPS/WSS encryption for all communication
- JWT tokens for authentication
- No sensitive data logged or stored
- Environment variables properly protected

### **Execution Security**
- Docker container isolation
- Non-root user execution (hexagent)
- Command validation and whitelisting
- Resource limits and timeouts
- Network isolation (optional)
- Read-only filesystem (optional)

### **Privacy**
- User data encrypted in transit and at rest
- GDPR compliant
- Optional local execution mode (data stays on your machine)
- User controls data sharing

---

## 🎯 Roadmap

### **Completed ✅**
- [x] Agentic tool execution
- [x] 42+ security tools integrated
- [x] Real-time terminal output
- [x] GitHub OAuth authentication
- [x] Premium subscription system
- [x] Docker-based execution
- [x] Error auto-correction
- [x] Report generation

### **In Progress 🚧**
- [ ] Local execution mode
- [ ] Desktop application (Electron/Tauri)
- [ ] Mobile app (React Native)
- [ ] Advanced reporting features
- [ ] Team collaboration features

### **Planned 📅**
- [ ] Custom tool integration
- [ ] Plugin system
- [ ] API for third-party integrations
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/SK3CHI3/Hex-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SK3CHI3/Hex-/discussions)
- **Documentation**: [Wiki](https://github.com/SK3CHI3/Hex-/wiki)
- **Security**: [SECURITY.md](SECURITY.md)

---

## 🙏 Acknowledgments

- **DeepSeek** - AI model provider
- **Kali Linux** - Security tools distribution
- **Supabase** - Database and authentication
- **shadcn/ui** - UI components
- **All Contributors** - Thank you for your contributions!

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

**🔒 Hack Ethically • Learn Continuously • Share Knowledge**

[Report Bug](https://github.com/SK3CHI3/Hex-/issues) · [Request Feature](https://github.com/SK3CHI3/Hex-/issues) · [Security](SECURITY.md)

---

**Made with ❤️ by the Hex AI Team**
