# Hex - AI-Powered Penetration Testing Assistant. 

[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Deploy to Netlify](https://img.shields.io/badge/Deploy_to-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)

> 🤖 Your intelligent companion for ethical hacking and security testing, powered by Deepseek R1.
Hex is an advanced AI assistant designed specifically for cybersecurity professionals, ethical hackers, and penetration testers. It provides intelligent guidance for security testing activities while emphasizing responsible and legal practices.

## ✨ Features.

- **🔍 Vulnerability Assessment**: Get detailed analysis of security vulnerabilities 
- **⚡ Payload Generation**: Generate XSS, SQLi, RCE, and other security payloads
- **🛠️ Tool Analysis**: Analyze output from Nmap, Burp Suite, Metasploit, and more
- **🌐 Web Security**: Specialized guidance for web application security testing
- **📊 Network Testing**: Network penetration testing methodologies
- **🔐 Privilege Escalation**: Techniques for privilege escalation scenarios
- **📝 Code Review**: Security-focused code analysis and recommendations

## 🚀 Quick Start

### 🎯 Production Deployment (Recommended - 100% FREE!)

**Deploy to Oracle Cloud in 30 minutes - $0/month forever!**

👉 **[Oracle Cloud Quickstart Guide](docs/ORACLE_CLOUD_QUICKSTART.md)** 👈

Pre-configured for **https://hexai.website/** - just copy & paste!

---

### 💻 Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Hex-
   ```

2. **Start all services** (Windows)
   ```powershell
   .\start-dev.ps1
   ```
   
   **Or** (Mac/Linux)
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

3. **Open your browser**
   Visit `http://localhost:8080`

**Full setup guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 🏗️ Architecture.

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **AI Provider**: OpenRouter API with DeepSeek V3 0324 (free)
- **Database**: Supabase (PostgreSQL) for conversation persistence
- **Styling**: Custom cybersecurity-themed design

## 🔧 Configuration.

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_DEEPSEEK_API_KEY` | Your DeepSeek API Key | Yes | - |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |

### API Configuration.

The app is configured to use:
- **Model**: `deepseek-chat` (DeepSeek V3.1-Terminus)
- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **Max Tokens**: 8192 (configurable)
- **Streaming**: Enabled for real-time responses
- **Provider**: DeepSeek (direct API integration)

## 🚀 Deployment

### Backend Options

| Platform | Cost | Setup Time | Guide |
|----------|------|------------|-------|
| **Oracle Cloud** 🎁 | **$0/month** | 30 min | **[Quickstart](docs/ORACLE_CLOUD_QUICKSTART.md)** ⭐ |
| Railway | $20/month | 10 min | [Guide](docs/HYBRID_DEPLOYMENT_STRATEGY.md#option-2-railway-easiest) |
| DigitalOcean | $24/month | 60 min | [Guide](docs/HYBRID_DEPLOYMENT_STRATEGY.md#option-1-full-cloud-vps) |

**Recommended:** Oracle Cloud - Free forever with 12GB RAM!

### Frontend

**Netlify** (FREE):
1. Connect GitHub repository
2. Build: `npm run build`, Publish: `dist`
3. Set environment variables ([Guide](docs/FRONTEND_ENV_CONFIG.md))
4. Auto-deploys on `git push`

**Complete deployment guides:**
- 📋 [Oracle Cloud Quickstart](docs/ORACLE_CLOUD_QUICKSTART.md) - Copy & paste ready!
- 🏗️ [Hybrid Deployment Strategy](docs/HYBRID_DEPLOYMENT_STRATEGY.md) - All options
- 🎨 [Frontend Configuration](docs/FRONTEND_ENV_CONFIG.md) - Environment setup

## 🤝 Contributing.

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Disclaimer.

This tool is designed **EXCLUSIVELY** for authorized security testing activities. Users must:

- Only test systems they own or have explicit written permission to test
- Comply with all applicable laws and regulations
- Follow responsible disclosure practices
- Use the tool ethically and legally

**Unauthorized access to systems is illegal and punishable by law.**

## 🔒 Security.

- OpenRouter API keys are stored locally and never sent to our servers
- All communication is encrypted via HTTPS
- No sensitive data is logged or stored 
- Environment variables are properly protected

## 📞 Support.

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**🔒 Hack Ethically • Learn Continuously • Share Knowledge**

[Report Bug](issues) · [Request Feature](issues) · [Security](SECURITY.md)
