# 🏗️ Hex AI - Architecture Overview

## 📊 System Architecture

Hex AI uses a **hybrid architecture** combining serverless components with stateful backend services for real-time tool execution.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│                      (Serverless)                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React + TypeScript + Vite                         │     │
│  │  - Modern UI with shadcn/ui                        │     │
│  │  - Real-time terminal output                       │     │
│  │  - Conversation management                         │     │
│  │                                                     │     │
│  │  Deployment: Netlify/Vercel (Static)               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────┬─────────────────────┬─────────────────────────┘
              │                     │
    ┌─────────┴─────────┐   ┌──────┴────────┐
    │   HTTP/SSE        │   │   WebSocket   │
    │   (Chat)          │   │   (Tools)     │
    │                   │   │               │
┌───▼──────────────┐    │   │    ┌──────────▼────────────┐
│  Supabase        │    │   │    │  BACKEND LAYER         │
│  (BaaS)          │    │   │    │  (Stateful Services)   │
│  ┌────────────┐  │    │   │    └────────────────────────┘
│  │ PostgreSQL │  │    │   │             │
│  │ Auth       │  │    │   │    ┌────────┴────────────────┐
│  │ RLS        │  │    │   │    │                         │
│  │ Functions  │  │    │   │    │  Node.js Services       │
│  └────────────┘  │    │   │    │  (Must be running)      │
└──────────────────┘    │   │    │                         │
                        │   │    │  1. MCP Adapter         │
┌───────────────────────▼───▼────▼────────────┐            │
│  2. Tool Execution Server                    │            │
│     - WebSocket server (port 8081)           │            │
│     - Command validation                     │            │
│     - Real-time streaming                    │            │
│     - User authentication                    │            │
│                                              │            │
│  1. MCP Adapter                              │            │
│     - ModelScope API integration (port 8083) │            │
│     - MCP protocol bridge                    │            │
│     - SSE streaming                          │            │
│     - Tool call routing                      │            │
│                                              │            │
│  3. MCP Tool Server (Optional)               │            │
│     - MCP protocol implementation            │            │
│     - Tool definitions                       │            │
│     - Execution orchestration                │            │
└────────────────────┬─────────────────────────┘            │
                     │                                      │
        ┌────────────▼──────────────┐                      │
        │  Docker Container         │                      │
        │  (Infrastructure Layer)   │                      │
        │  ┌──────────────────────┐ │                      │
        │  │  Kali Linux          │ │                      │
        │  │  - nmap              │ │                      │
        │  │  - sqlmap            │ │                      │
        │  │  - metasploit        │ │                      │
        │  │  - gobuster          │ │                      │
        │  │  - nikto             │ │                      │
        │  │  - hydra             │ │                      │
        │  │  - john              │ │                      │
        │  │  - + 100s more tools │ │                      │
        │  └──────────────────────┘ │                      │
        └───────────────────────────┘                      │
```

---

## 🔄 Request Flow

### Chat Request Flow
```
1. User sends message in browser
   ↓
2. Frontend → MCP Client (src/lib/mcp-client.ts)
   ↓
3. HTTP POST → MCP Adapter (port 8083)
   ↓
4. MCP Adapter → ModelScope API (Qwen3.7-Plus)
   ↓
5. ModelScope decides to use a tool
   ↓
6. Tool call → WebSocket (port 8081)
   ↓
7. Tool Server validates & executes in Docker
   ↓
8. Output streams back via WebSocket
   ↓
9. Frontend displays in terminal window
   ↓
10. ModelScope analyzes results
    ↓
11. Response streams back to user
```

### Tool Execution Flow
```
User: "Scan 192.168.1.1 with nmap"
   ↓
AI (Qwen3.7-Plus): "I'll run an nmap scan"
   ↓
executeTool('nmap_scan', {
  target: '192.168.1.1',
  scan_type: 'quick'
})
   ↓
WebSocket → Tool Server (validates auth & premium status)
   ↓
Docker exec: nmap -sV -sC 192.168.1.1
   ↓
Real-time output → WebSocket → Frontend Terminal
   ↓
AI analyzes output & responds to user
```

---

## 🗂️ Project Structure

```
Hex-/
├── Frontend (Static - Deployable to Netlify/Vercel)
│   ├── src/
│   │   ├── pages/
│   │   │   └── Index.tsx           # Main chat interface
│   │   ├── components/
│   │   │   ├── TerminalWindow.tsx  # Real-time command output
│   │   │   ├── AuthButton.tsx      # GitHub OAuth
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── use-auth.ts         # Supabase authentication
│   │   │   ├── use-mcp.ts          # MCP client integration
│   │   │   └── use-tool-execution.ts # WebSocket tool execution
│   │   └── lib/
│   │       ├── mcp-client.ts       # MCP protocol client
│   │       ├── supabase.ts         # Supabase client
│   │       └── utils.ts            # Utilities
│   ├── public/                     # Static assets
│   └── package.json
│
├── Backend Services (Stateful - Requires Server/VPS)
│   └── server/
│       ├── index.js                # Main tool execution server
│       │                           # Port: 8081 (WebSocket)
│       │
│       ├── mcp-adapter/            # ModelScope ↔ MCP Bridge
│       │   ├── index.js            # Express + SSE server
│       │   ├── modelscope-adapter.js # ModelScope API integration
│       │   └── package.json        # Port: 8083
│       │
│       ├── mcp-server/             # MCP Tool Server (Optional)
│       │   ├── index.js            # MCP protocol server
│       │   ├── tools.js            # Tool definitions
│       │   ├── executor.js         # Execution handler
│       │   └── package.json        # Port: 8082
│       │
│       └── docker/                 # Container Infrastructure
│           ├── docker-compose.yml  # Container orchestration
│           └── Dockerfile.kali     # Kali Linux image
│
├── Configuration
│   ├── .env                        # Frontend env vars
│   ├── server/.env                 # Tool server env vars
│   ├── server/mcp-adapter/.env     # MCP adapter env vars
│   └── netlify.toml                # Netlify config
│
├── Documentation
│   ├── README.md                   # Quick start
│   ├── ARCHITECTURE.md             # This file
│   ├── SETUP_GUIDE.md              # Detailed setup
│   ├── HYBRID_DEPLOYMENT_STRATEGY.md # Deployment options
│   └── docs/
│       ├── API.md
│       ├── AUTHENTICATION.md
│       └── MCP_MIGRATION_COMPLETE.md
│
└── Scripts
    ├── start-dev.ps1               # Windows startup script
    ├── start-dev.sh                # Linux/Mac startup script
    └── start-all-services.ps1      # Legacy startup (deprecated)
```

---

## 🔌 Services & Ports

| Service | Port | Protocol | Purpose | Required |
|---------|------|----------|---------|----------|
| **Frontend** | 8080 | HTTP | React development server | Development only |
| **Tool Execution Server** | 8081 | WebSocket | Real-time tool execution | ✅ Yes |
| **MCP Adapter** | 8083 | HTTP/SSE | ModelScope API bridge | ✅ Yes |
| **MCP Tool Server** | 8082 | stdio | MCP protocol tools | Optional |
| **Supabase** | 443 | HTTPS | Database & Auth | ✅ Yes |
| **Docker Container** | N/A | N/A | Isolated tool execution | ✅ Yes |

---

## 🔐 Authentication Flow

```
1. User clicks "Sign in with GitHub"
   ↓
2. Supabase OAuth → GitHub
   ↓
3. GitHub authorizes & redirects back
   ↓
4. Supabase creates user session
   ↓
5. Frontend stores session token
   ↓
6. WebSocket authenticates with token
   ↓
7. Tool server validates with Supabase
   ↓
8. Check premium status
   ↓
9. Enable/disable tool execution
```

---

## 💎 Premium Features

### Free Tier
- ✅ Unlimited chat with AI
- ✅ Conversation history
- ✅ Code examples & explanations
- ❌ No real tool execution
- ❌ Limited to 50 messages/day

### Premium Tier ($3/month)
- ✅ Everything in Free tier
- ✅ **Real tool execution** (nmap, sqlmap, etc.)
- ✅ Unlimited messages
- ✅ Terminal output streaming
- ✅ Export scan results
- ✅ Priority support

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **State Management:** React Query + Context
- **Routing:** React Router v6
- **Markdown:** react-markdown
- **Icons:** Lucide React

### Backend Services
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **WebSocket:** ws
- **MCP:** @modelcontextprotocol/sdk
- **AI Provider:** ModelScope API (Qwen3.7-Plus)

### Database & Auth
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (GitHub OAuth)
- **Row-Level Security:** Supabase RLS
- **Real-time:** Supabase Realtime (optional)

### Infrastructure
- **Container:** Docker + Docker Compose
- **Base Image:** Kali Linux (official)
- **Process Manager:** PM2 (production)
- **Reverse Proxy:** Nginx (production)
- **SSL:** Let's Encrypt (production)

---

## 🔒 Security Architecture

### Frontend Security
- ✅ No API keys in client code
- ✅ HTTPS only (production)
- ✅ Content Security Policy
- ✅ XSS protection
- ✅ Input sanitization

### Backend Security
- ✅ Command validation & sanitization
- ✅ User authentication required
- ✅ Premium status verification
- ✅ Rate limiting
- ✅ Docker isolation
- ✅ No direct shell access
- ✅ Whitelist-based command execution
- ✅ Resource limits (CPU, RAM, timeout)

### Network Security
- ✅ Private IP scanning only (default)
- ✅ Firewall rules
- ✅ Docker network isolation
- ✅ TLS/SSL encryption
- ✅ CORS configuration

### Database Security
- ✅ Row-Level Security (RLS)
- ✅ Encrypted at rest
- ✅ Encrypted in transit
- ✅ Automatic backups
- ✅ SQL injection protection

---

## 📈 Scalability Considerations

### Current Limitations (v1.0)
- Single backend server
- No horizontal scaling
- Limited to one Docker container
- No load balancing

### Future Improvements (v2.0+)
- [ ] Kubernetes deployment
- [ ] Multiple Docker workers
- [ ] Redis for session management
- [ ] Message queue (RabbitMQ/Redis)
- [ ] Horizontal auto-scaling
- [ ] Multi-region deployment
- [ ] CDN integration
- [ ] Caching layer

---

## 🔄 Development vs Production

### Development Environment
```
Frontend:  localhost:8080 (npm run dev)
Backend:   localhost:8081 (nodemon)
MCP:       localhost:8083 (nodemon)
Docker:    Local Docker Desktop
Database:  Supabase (cloud or local)
```

### Production Environment
```
Frontend:  Static files on Netlify/Vercel
Backend:   VPS/PaaS (Railway/Render/DigitalOcean)
MCP:       Same VPS as backend
Docker:    On VPS with backend
Database:  Supabase (cloud)
CDN:       Cloudflare (optional)
SSL:       Let's Encrypt (automatic)
```

---

## 🚀 Deployment Options

See [HYBRID_DEPLOYMENT_STRATEGY.md](docs/HYBRID_DEPLOYMENT_STRATEGY.md) for detailed deployment guides for:

1. **Railway** - Easiest, $20/month
2. **DigitalOcean VPS** - Most control, $15-30/month
3. **Render** - Good balance, $28/month
4. **Fly.io** - Cost-effective, $10/month
5. **AWS EC2** - Enterprise-grade, $30-50/month

---

## 📊 Data Flow

### Message Storage
```
User sends message
   ↓
Frontend → Supabase (messages table)
   ↓
Frontend → MCP Adapter → ModelScope
   ↓
AI response → Frontend
   ↓
Frontend → Supabase (messages table)
```

### Tool Execution Logging
```
Tool executed
   ↓
Output captured in real-time
   ↓
Streamed to frontend via WebSocket
   ↓
Displayed in terminal window
   ↓
Optionally saved to Supabase
```

---

## 🔍 Monitoring & Logging

### Application Logs
- Frontend: Browser console
- Backend: Server logs (stdout)
- Docker: Container logs (`docker logs hex-kali-tools`)

### Recommended Tools
- **Uptime Monitoring:** UptimeRobot (free)
- **Error Tracking:** Sentry (free tier)
- **Logging:** Better Stack (free tier)
- **Metrics:** Grafana + Prometheus (self-hosted)
- **APM:** New Relic (free tier)

---

## 🧪 Testing Strategy

### Frontend Testing
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright

### Backend Testing
- Unit tests: Jest
- Integration tests: Supertest
- WebSocket tests: ws + jest

### Docker Testing
```bash
# Test container
docker exec -it hex-kali-tools nmap --version

# Test tool execution
docker exec hex-kali-tools nmap -sn 127.0.0.1
```

---

## 📚 Additional Resources

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation
- [API Documentation](docs/API.md) - API reference
- [Authentication Guide](docs/AUTHENTICATION.md) - Auth setup
- [Deployment Guide](docs/HYBRID_DEPLOYMENT_STRATEGY.md) - Production deployment
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

---

## 🆘 Troubleshooting

### Common Issues

**WebSocket not connecting:**
- Check backend server is running on port 8081
- Verify firewall allows WebSocket connections
- Check `.env` has correct WS_URL

**Tool execution fails:**
- Ensure Docker container is running
- Check user has premium status
- Verify command validation rules

**ModelScope API errors:**
- Check `server/mcp-adapter/.env` has valid API key
- Verify API key has credits
- Check rate limits

For more help, see [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section.

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Architecture Type:** Hybrid (Serverless Frontend + Stateful Backend)











