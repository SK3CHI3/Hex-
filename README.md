
# Hex - AI Penetration Testing Assistant

A sophisticated AI-powered cybersecurity assistant built with React, designed to help ethical hackers, security researchers, and red team professionals with their legitimate security testing activities.

![Hex Interface](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ⚠️ Legal Disclaimer

**This tool is designed EXCLUSIVELY for authorized security testing.**

- Only use in environments you own or have explicit written permission to test
- Unauthorized access to systems is illegal and punishable by law
- Always follow responsible disclosure practices
- Ensure you comply with all applicable laws and regulations

## 🎯 Features

### Core Capabilities
- **AI-Powered Security Assistant**: Leveraging DeepSeek R1 model for advanced cybersecurity insights
- **Payload Generation**: Generate XSS, SQLi, CSRF, and other security payloads
- **Tool Output Analysis**: Analyze results from Nmap, Burp Suite, Nikto, and other security tools
- **Vulnerability Research**: Research CVEs, exploit techniques, and mitigation strategies
- **Code Security Review**: Review code for security vulnerabilities
- **Network Enumeration**: Strategies and techniques for network reconnaissance

### Preset Prompts
- **Payload Generation**: Quick generation of various attack payloads
- **Tool Analysis**: Analyze security tool outputs
- **Vulnerability Research**: Research known vulnerabilities
- **Privilege Escalation**: Escalation techniques for different operating systems
- **Network Enumeration**: Network reconnaissance strategies
- **Security Code Review**: Automated security code analysis

### UI/UX Features
- **Dark Theme**: Cyberpunk-inspired interface with terminal aesthetics
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Chat**: Interactive AI assistant with message history
- **Markdown Support**: Rich text formatting for code blocks and documentation
- **Glass Morphism**: Modern minimal header with glass effects

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenRouter API key with access to DeepSeek R1 model

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   - The application uses OpenRouter API with DeepSeek R1 model
   - You'll be prompted to enter your API key when first using the application
   - API key is stored locally in your browser's localStorage

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: High-quality React components

### AI Integration
- **OpenRouter API**: Access to various AI models
- **DeepSeek R1**: Advanced reasoning model for cybersecurity tasks
- **React Markdown**: Rich text rendering for AI responses

### Styling & UI
- **Lucide React**: Beautiful icons
- **Class Variance Authority**: Component variant management
- **Tailwind Merge**: Efficient CSS class merging

## 📁 Project Structure

```
src/
├── components/
│   └── ui/           # Shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/
│   └── Index.tsx     # Main application component
├── index.css         # Global styles and Tailwind config
└── main.tsx          # Application entry point
```

## 🔧 Configuration

### API Configuration
The application uses OpenRouter API to access the DeepSeek R1 model. Configure your API key through the application interface.

### Environment Variables
No environment variables are required for basic functionality. All configuration is handled through the UI.

## 🎨 Customization

### Themes
The application uses a dark cyberpunk theme with green accents. Colors can be customized in `src/index.css`:

```css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other color variables */
}
```

### Presets
Add custom security testing presets by modifying the `PROMPT_PRESETS` object in `src/pages/Index.tsx`.

## 🔒 Security Considerations

### Data Privacy
- All conversations are processed through OpenRouter API
- API keys are stored locally in browser localStorage
- No conversation data is permanently stored on external servers

### Responsible Use
- Always obtain proper authorization before testing
- Follow responsible disclosure practices
- Comply with local and international laws
- Use only in authorized testing environments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain responsive design principles
- Test on multiple devices and browsers

## 📚 Usage Examples

### Generating SQL Injection Payloads
```
Generate SQL injection payloads for MySQL targeting a login form with username and password parameters. Include time-based and union-based techniques.
```

### Analyzing Nmap Output
```
Analyze this Nmap output and identify potential vulnerabilities and attack vectors: [paste your nmap results]
```

### Code Security Review
```
Review this PHP authentication function for security vulnerabilities: [paste your code]
```

## 🔄 Updates and Versioning

- Version 2.0: Current release with DeepSeek R1 integration
- Regular updates for security enhancements and new features
- Check the repository for latest releases and changelogs

## 📞 Support

For support, questions, or feature requests:
- Open an issue on the GitHub repository
- Follow responsible disclosure for any security issues
- Join cybersecurity communities for discussions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenRouter for API access
- DeepSeek for the advanced AI model
- Shadcn for the beautiful UI components
- The cybersecurity community for inspiration and feedback

---

**Remember**: Always use this tool ethically and legally. Happy ethical hacking! 🔒
