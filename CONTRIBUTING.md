
# Contributing to Hex

Thank you for your interest in contributing to Hex! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and inclusive
- Use ethical practices in all security-related contributions
- Follow responsible disclosure for security issues
- Maintain professional communication

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git for version control
- Basic understanding of React, TypeScript, and cybersecurity concepts

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/hex.git
   cd hex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

## 📋 How to Contribute

### Types of Contributions

1. **Bug Reports**
   - Use the issue template
   - Include steps to reproduce
   - Provide environment details
   - Include screenshots if applicable

2. **Feature Requests**
   - Describe the feature clearly
   - Explain the use case
   - Consider security implications
   - Propose implementation approach

3. **Code Contributions**
   - Bug fixes
   - New security testing presets
   - UI/UX improvements
   - Performance optimizations
   - Documentation updates

4. **Security Enhancements**
   - Follow responsible disclosure
   - Security-focused features
   - Vulnerability fixes
   - Security testing improvements

### Contribution Process

1. **Create an Issue**
   - For bugs: Use bug report template
   - For features: Use feature request template
   - For security: Follow security policy

2. **Fork and Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Follow coding standards
   - Write tests if applicable
   - Update documentation
   - Test thoroughly

4. **Commit Changes**
   ```bash
   git commit -m "feat: add new security testing preset"
   # or
   git commit -m "fix: resolve API key validation issue"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Open a Pull Request
   - Fill out the PR template
   - Link related issues

## 🎯 Development Guidelines

### Code Style

1. **TypeScript**
   - Use strict TypeScript configuration
   - Define proper interfaces and types
   - Avoid `any` types
   - Use meaningful variable names

2. **React Components**
   - Use functional components with hooks
   - Follow React best practices
   - Keep components focused and small
   - Use proper prop typing

3. **Styling**
   - Use Tailwind CSS classes
   - Follow responsive design principles
   - Maintain consistent spacing
   - Use CSS variables for themes

### File Organization

```
src/
├── components/
│   ├── ui/          # Reusable UI components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── types/           # TypeScript type definitions
└── pages/           # Page components
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `SecurityPreset.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useApiKey.ts`)
- **Types**: PascalCase (e.g., `MessageType`)

## 🔒 Security Guidelines

### Security-First Development

1. **Input Validation**
   - Validate all user inputs
   - Sanitize data before processing
   - Use proper TypeScript typing

2. **API Security**
   - Secure API key handling
   - Validate API responses
   - Handle errors gracefully

3. **Client-Side Security**
   - Prevent XSS vulnerabilities
   - Secure localStorage usage
   - Implement CSP headers

### Security Testing Contributions

1. **New Presets**
   - Ensure ethical use cases only
   - Include proper disclaimers
   - Test thoroughly
   - Document usage examples

2. **Payload Examples**
   - Educational purposes only
   - Include context and warnings
   - Provide mitigation strategies
   - Follow responsible disclosure

## 🧪 Testing

### Manual Testing
- Test on different screen sizes
- Verify API integration
- Check accessibility features
- Test security preset functionality

### Automated Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build the project
npm run build
```

## 📝 Documentation

### Code Documentation
- Use JSDoc comments for functions
- Document complex logic
- Include usage examples
- Explain security implications

### README Updates
- Keep feature list current
- Update installation instructions
- Add new usage examples
- Maintain accurate screenshots

## 🚀 Release Process

### Version Numbering
- Follow semantic versioning (semver)
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Release Checklist
- [ ] Update version number
- [ ] Update CHANGELOG.md
- [ ] Test all features
- [ ] Update documentation
- [ ] Create release notes

## 💬 Communication

### Where to Ask Questions
- GitHub Issues for bug reports
- GitHub Discussions for general questions
- Security issues through private channels

### Response Times
- Issues: 48-72 hours
- Pull Requests: 3-7 days
- Security reports: 24-48 hours

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributor statistics

## 📜 Legal Considerations

### License Agreement
By contributing, you agree that your contributions will be licensed under the same license as the project.

### Ethical Use
All contributions must:
- Support ethical hacking practices
- Include appropriate warnings
- Follow responsible disclosure
- Comply with applicable laws

### Copyright
- Only contribute original work
- Respect third-party licenses
- Include proper attribution
- Document any external resources

## 🔄 Continuous Improvement

This contributing guide is a living document. We welcome suggestions for improvement through:
- Pull requests to this document
- Issues with suggestions
- Community discussions

Thank you for contributing to Hex and supporting ethical cybersecurity practices! 🔒
