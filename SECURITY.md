
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take the security of Hex seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT open a public issue

Security vulnerabilities should not be disclosed publicly until they have been addressed.

### 2. Report privately

Send your security report to the repository maintainers through:
- GitHub Security Advisories (preferred)
- Direct message to maintainers
- Encrypted email if available

### 3. Include details

When reporting a vulnerability, please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)
- Your contact information

### 4. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Varies based on severity

## Security Best Practices

### For Users

1. **API Key Security**
   - Never share your OpenRouter API key
   - Store API keys securely
   - Rotate keys regularly

2. **Environment Security**
   - Only use in authorized testing environments
   - Follow responsible disclosure practices
   - Comply with all applicable laws

3. **Data Privacy**
   - Be cautious about sensitive data in prompts
   - Review AI responses before acting
   - Understand data flows to external APIs

### For Developers

1. **Code Security**
   - Validate all user inputs
   - Sanitize data before processing
   - Use secure coding practices

2. **Dependencies**
   - Keep dependencies updated
   - Monitor for security advisories
   - Use tools like `npm audit`

3. **Build Security**
   - Secure build pipelines
   - Code review for security issues
   - Regular security testing

## Known Security Considerations

### API Integration
- All AI requests go through OpenRouter API
- API keys are stored in browser localStorage
- No server-side data persistence

### Client-Side Security
- XSS protection through React's built-in safeguards
- Input sanitization for user prompts
- Secure handling of markdown rendering

### Network Security
- HTTPS enforcement in production
- Secure headers implementation
- Content Security Policy (CSP) ready

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Initial triage and acknowledgment
3. **Day 3-7**: Investigation and impact assessment
4. **Day 8-30**: Development of fix
5. **Day 31-60**: Testing and validation
6. **Day 61+**: Public disclosure (coordinated)

## Security Contact

For security-related inquiries, please contact the repository maintainers through the appropriate channels mentioned above.

## Legal Notice

This security policy applies to the Hex application codebase. Users are responsible for compliance with all applicable laws and regulations when using this tool for security testing purposes.
