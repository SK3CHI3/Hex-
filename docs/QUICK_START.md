# ⚡ Hex AI - Quick Start (Agentic Mode)

## 🎯 What's Ready

✅ **ALL CODE COMPLETE** - Professional red teaming architecture fully integrated!

---

## 🚀 3-Step Setup

### Step 1: Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### Step 2: Build Docker Container

```bash
cd server/docker
docker-compose build
docker-compose up -d
cd ../..
```

### Step 3: Create Environment Files

**`.env` (project root):**
```env
VITE_DEEPSEEK_API_KEY=your_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_WS_URL=ws://localhost:8081
```

**`server/.env`:**
```env
PORT=8081
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

---

## 🏃 Run Everything

**Terminal 1** - Backend:
```bash
cd server
npm run dev
```

**Terminal 2** - Frontend:
```bash
npm run dev
```

---

## ✅ Test It

1. Go to http://localhost:8080
2. Sign in with GitHub
3. Upgrade to Premium ($3/month)
4. Try: **"Scan 127.0.0.1 with nmap quick scan"**
5. Watch the terminal appear with real output! 🔥

---

## 🛠️ What You Can Do Now

Try these commands:

- **"Scan my local network"** → Nmap
- **"Check example.com for SQL injection"** → SQLMap
- **"Find hidden directories on my test site"** → Gobuster
- **"Scan testsite.local for vulnerabilities"** → Nikto
- **"Test SSH password on 192.168.1.100"** → Hydra
- **"Search Metasploit for Apache exploits"** → Metasploit

---

## 📦 Files Created

✅ `src/components/TerminalWindow.tsx` - Terminal UI  
✅ `src/hooks/use-tool-execution.ts` - WebSocket + tool execution  
✅ `src/lib/tools-schema.ts` - 15+ tool definitions  
✅ `server/index.js` - WebSocket server  
✅ `server/docker/Dockerfile.kali` - Kali Linux + 30+ tools  
✅ `server/docker/docker-compose.yml` - Container config  
✅ **Updated** `src/pages/Index.tsx` - Full integration

---

## 🔥 What's Integrated

✅ Real-time terminal output  
✅ 30+ pentesting tools (Nmap, SQLMap, Metasploit, etc.)  
✅ Docker sandboxing  
✅ Premium-only access  
✅ WebSocket streaming  
✅ Command validation  
✅ DeepSeek tool calling  

---

## 🐛 Troubleshooting

**"Premium Required" error?**
```sql
-- In Supabase SQL editor:
UPDATE user_profiles
SET subscription_status = 'premium',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '30 days'
WHERE email = 'your-email@example.com';
```

**Container not starting?**
```bash
docker ps  # Check if running
docker-compose logs -f  # Check logs
```

**WebSocket won't connect?**
```bash
curl http://localhost:8081/health  # Should return OK
```

---

## 📚 Full Docs

- `SETUP_GUIDE.md` - Complete setup guide
- `IMPLEMENTATION_COMPLETE.md` - What was built
- `docs/PROFESSIONAL_AGENTIC_ARCHITECTURE.md` - Architecture

---

**READY TO HACK! 🎉**



