
# Deployment Guide

This guide covers various deployment options for the Hex AI Penetration Testing Assistant.

## 🚀 Quick Deployment Options

### 1. Lovable Platform (Recommended)

The easiest way to deploy Hex is through the Lovable platform:

1. **Click the Publish button** in the top right of the Lovable editor
2. **Choose your domain** (subdomain.lovable.app or custom domain)
3. **Deploy instantly** with automatic SSL and CDN

**Benefits:**
- Zero configuration required
- Automatic SSL certificates
- Global CDN distribution
- Easy custom domain setup
- Built-in analytics

### 2. Vercel

Deploy to Vercel for fast, global deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts to configure your project
```

**Configuration (vercel.json):**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3. Netlify

Deploy to Netlify with drag-and-drop or Git integration:

```bash
# Build the project
npm run build

# Deploy the dist folder to Netlify
# Or connect your Git repository for automatic deployments
```

**Configuration (_redirects):**
```
/*    /index.html   200
```

### 4. GitHub Pages

Deploy using GitHub Actions:

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 🔧 Build Configuration

### Environment Variables

No environment variables are required for the basic deployment. The application handles API key configuration through the user interface.

### Build Commands

```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Output

The build process creates a `dist/` folder containing:
- `index.html` - Main HTML file
- `assets/` - CSS, JS, and other static assets
- Optimized and minified code for production

## 🌐 Custom Domain Setup

### Lovable Platform

1. Go to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Enter your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate generation

### Other Platforms

1. **Configure DNS** to point to your hosting provider
2. **Add custom domain** in your hosting platform settings
3. **Enable SSL** (usually automatic)
4. **Test the deployment** thoroughly

## 📱 Progressive Web App (PWA)

To make Hex installable as a PWA:

### Add Web App Manifest

**public/manifest.json:**
```json
{
  "name": "Hex - AI Penetration Testing Assistant",
  "short_name": "Hex",
  "description": "AI-powered cybersecurity assistant for ethical hacking",
  "theme_color": "#22c55e",
  "background_color": "#000000",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

**public/sw.js:**
```javascript
const CACHE_NAME = 'hex-v1';
const urlsToCache = [
  '/',
  '/static/css/',
  '/static/js/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## 🔒 Security Configuration

### Content Security Policy (CSP)

Add CSP headers for enhanced security:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://openrouter.ai;
  img-src 'self' data: https:;
  font-src 'self';
">
```

### HTTPS Enforcement

Ensure all deployments use HTTPS:
- Most modern hosting platforms enable HTTPS by default
- Configure redirects from HTTP to HTTPS
- Use secure cookies and localStorage

## 📊 Performance Optimization

### Build Optimization

The Vite build process automatically:
- Minifies JavaScript and CSS
- Optimizes images and assets
- Implements code splitting
- Generates efficient bundles

### Runtime Optimization

```typescript
// Lazy load components
const LazyComponent = React.lazy(() => import('./Component'));

// Implement service worker for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### CDN Configuration

For optimal performance:
- Use a global CDN (included with most hosting platforms)
- Enable gzip compression
- Set appropriate cache headers
- Optimize images and fonts

## 🔍 Monitoring and Analytics

### Error Tracking

Consider integrating error tracking:

```typescript
// Basic error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

### Performance Monitoring

```typescript
// Basic performance tracking
if ('performance' in window) {
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', navigation.loadEventEnd - navigation.fetchStart);
  });
}
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Test all features locally
- [ ] Run type checking (`npm run type-check`)
- [ ] Build successfully (`npm run build`)
- [ ] Test production build (`npm run preview`)
- [ ] Verify responsive design
- [ ] Test API integration

### Post-Deployment
- [ ] Verify HTTPS is working
- [ ] Test on multiple devices
- [ ] Check console for errors
- [ ] Verify API functionality
- [ ] Test performance metrics
- [ ] Set up monitoring

### Security Checklist
- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] API keys secured
- [ ] No sensitive data in client code
- [ ] Error handling implemented
- [ ] Input validation working

## 🔄 Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy Hex

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run type-check
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to production
      run: |
        # Deploy to your chosen platform
        echo "Deploying to production..."
```

## 📞 Support

For deployment issues:
- Check the hosting platform documentation
- Review build logs for errors
- Test locally with production build
- Verify all dependencies are installed
- Check network connectivity for API calls

Happy deploying! 🚀
