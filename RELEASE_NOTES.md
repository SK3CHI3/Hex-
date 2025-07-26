# Release v1.1.0: DeepSeek V3 0324 Integration

## 🚀 What's New

### ⚡ AI Model Upgrade
- **Upgraded to DeepSeek V3 0324** - Latest and most powerful version of DeepSeek
- **Enhanced Performance** - Improved response quality and reasoning capabilities
- **Better Cybersecurity Knowledge** - More accurate and up-to-date security insights

### 🔧 Technical Improvements
- Updated model identifier: `deepseek/deepseek-chat-v3-0324:free`
- Maintained OpenRouter API integration for reliability
- Updated all documentation to reflect new model version

## 📋 Changes

### Modified Files
- `src/pages/Index.tsx` - Updated main application to use DeepSeek V3 0324
- `docs/API.md` - Updated API documentation with new model references
- `README.md` - Updated project documentation and configuration details

### Configuration
- Model: `deepseek/deepseek-chat-v3-0324:free` (previously `deepseek/deepseek-chat:free`)
- API Provider: OpenRouter (unchanged)
- Endpoint: `https://openrouter.ai/api/v1/chat/completions` (unchanged)

## 🎯 Benefits

- **Improved AI Responses** - More accurate and contextual cybersecurity assistance
- **Better Code Generation** - Enhanced payload and script generation capabilities
- **Updated Knowledge Base** - Latest security techniques and methodologies
- **Maintained Free Tier** - Still using the free tier of DeepSeek V3 0324

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
   echo "VITE_OPENROUTER_API_KEY=your_api_key_here" > .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open `http://localhost:8080` in your browser

## 🔒 Security Notes

- API keys are stored locally in `.env` file (not committed to repository)
- All AI interactions go through OpenRouter's secure API
- No server-side data persistence - everything runs client-side

## 🤝 Contributing

This is an open-source cybersecurity assistant. Contributions are welcome!

## 📞 Support

For issues or questions, please open an issue on the GitHub repository.

---

**Full Changelog**: https://github.com/SK3CHI3/Hex-/compare/v1.0.0...v1.1.0
