# Release v1.2.0: Direct DeepSeek API Integration with Streaming

## 🚀 What's New

### ⚡ Direct DeepSeek Integration
- **Switched to Direct DeepSeek API** - No more OpenRouter dependency
- **Latest Model**: DeepSeek V3.1-Terminus (`deepseek-chat`)
- **Real-time Streaming** - Live text display as AI generates responses
- **Enhanced Performance** - Faster response times and better reliability

### 🔧 Technical Improvements
- Updated model identifier: `deepseek-chat` (V3.1-Terminus)
- Direct API integration with `https://api.deepseek.com/chat/completions`
- Implemented Server-Sent Events (SSE) streaming
- Updated environment variable: `VITE_DEEPSEEK_API_KEY`
- Simplified authentication headers

## 📋 Changes

### Modified Files
- `src/pages/Index.tsx` - Implemented streaming and direct DeepSeek API integration
- `docs/API.md` - Updated API documentation with streaming examples
- `README.md` - Updated configuration and deployment instructions
- `RELEASE_NOTES.md` - Updated release notes

### Configuration
- Model: `deepseek-chat` (DeepSeek V3.1-Terminus)
- API Provider: Direct DeepSeek API (previously OpenRouter)
- Endpoint: `https://api.deepseek.com/chat/completions`
- Environment Variable: `VITE_DEEPSEEK_API_KEY` (previously `VITE_OPENROUTER_API_KEY`)
- Streaming: Enabled (`stream: true`)

## 🎯 Benefits

- **Real-time Streaming** - See AI responses as they're generated
- **Direct API Access** - No third-party dependencies, faster and more reliable
- **Latest Model** - DeepSeek V3.1-Terminus with enhanced capabilities
- **Better Performance** - Reduced latency and improved response quality
- **Simplified Setup** - Direct API key from DeepSeek platform

## 🔧 Installation & Usage

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SK3CHI3/Hex-.git
   cd Hex-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   echo "VITE_DEEPSEEK_API_KEY=your_api_key_here" > .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open `http://localhost:8080` in your browser

## 🔒 Security Notes

- API keys are stored locally in `.env` file (not committed to repository)
- All AI interactions go through DeepSeek's secure API
- No server-side data persistence - everything runs client-side
- Streaming responses are processed securely in the browser

## 🤝 Contributing

This is an open-source cybersecurity assistant. Contributions are welcome!

## 📞 Support

For issues or questions, please open an issue on the GitHub repository.

---

**Full Changelog**: https://github.com/SK3CHI3/Hex-/compare/v1.0.0...v1.1.0
