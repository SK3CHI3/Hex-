<div align="center">

# Hex AI

**AI-Powered Autonomous Red Teaming Assistant**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Kali-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/SK3CHI3/Hex-?style=flat-square&logo=github)](https://github.com/SK3CHI3/Hex-/stargazers)

[Live Demo](https://hexai.website) · [Setup Guide](docs/SETUP_GUIDE.md) · [Architecture](docs/ARCHITECTURE.md)

</div>

---

## About

Hex AI is an agentic penetration testing platform that autonomously runs 42+ security tools, analyzes results in real-time, and self-corrects on errors. Powered by Qwen3.7-Plus via ModelScope, it runs entirely on your local machine — no cloud VPS needed.

**What makes Hex different?** It doesn't just suggest commands — it *executes* them inside an isolated Kali Linux Docker container, watches the output, and adapts. Think of it as an AI red teamer that works alongside you.

---

## Screenshots

> Add your screenshots to a `public/` folder and update the paths below

<div align="center">

### AI Chat with Live Tool Execution
![Chat Interface](public/screenshot-chat.png)

### Real-Time Terminal Output
![Terminal](public/screenshot-terminal.png)

### Tool Selection & Results
![Tools](public/screenshot-tools.png)

</div>

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| AI | ModelScope API (Qwen3.7-Plus) |
| Backend | Node.js + Express + WebSocket |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Tools | Docker + Kali Linux (42+ tools) |
| Payments | IntaSend (M-Pesa, cards) |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Setup Guide](docs/SETUP_GUIDE.md) | Installation & configuration |
| [Quick Start](docs/QUICK_START.md) | 5-minute getting started |
| [Architecture](docs/ARCHITECTURE.md) | System design & data flow |
| [Tool Arsenal](docs/TOOL_ARSENAL.md) | All 42+ available tools |
| [API Docs](docs/API.md) | ModelScope integration |
| [Auth](docs/AUTHENTICATION.md) | Authentication system |
| [Frontend Config](docs/FRONTEND_ENV_CONFIG.md) | Environment variables |

---

## Support the Project

<div align="center">

### Star this repo — it helps others discover Hex!

[![GitHub Repo stars](https://img.shields.io/github/stars/SK3CHI3/Hex-?style=for-the-badge&logo=github&color=gold)](https://github.com/SK3CHI3/Hex-/stargazers)

### Buy us a coffee

[![Ko-fi](https://img.shields.io/badge/Buy_us_a_coffee-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi)](https://ko-fi.com/hexai)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-BMC-FFDD00?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/hexai)

</div>

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

**Hack Ethically · Learn Continuously · Share Knowledge**

[Report Bug](https://github.com/SK3CHI3/Hex-/issues) · [Request Feature](https://github.com/SK3CHI3/Hex-/issues) · [Security](SECURITY.md)

Made with love by the Hex AI Team

</div>
