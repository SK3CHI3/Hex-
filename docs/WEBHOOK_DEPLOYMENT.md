# Webhook Deployment Guide

## 🚨 Current Problem

The webhook is failing because the endpoint `https://hexai.website/api/webhooks/instasend` doesn't exist. Instasend is receiving a "Page not found" HTML response instead of a proper webhook handler.

## 🔧 Solution: Deploy Webhook Endpoint

### Option 1: Vercel (Recommended for React apps)

1. **Create API Route**:
   ```bash
   mkdir -p api/webhooks
   # Copy the instasend.js file to api/webhooks/instasend.js
   ```

2. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Set Environment Variables in Vercel**:
   ```bash
   INSTASEND_WEBHOOK_SECRET=your_webhook_secret
   INSTASEND_SECRET_KEY=ISK_live_...
   ```

### Option 2: Netlify Functions

1. **Create Netlify Function**:
   ```bash
   mkdir -p netlify/functions
   # Copy instasend.js to netlify/functions/instasend.js
   ```

2. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Express.js Server

1. **Create Express Server**:
   ```javascript
   const express = require('express');
   const app = express();
   
   app.use('/api/webhooks/instasend', require('./webhook-handler'));
   
   app.listen(3000, () => {
     console.log('Server running on port 3000');
   });
   ```

## 📋 Environment Variables Required

```bash
# Webhook validation
INSTASEND_WEBHOOK_SECRET=your_webhook_secret_from_dashboard

# Backend API calls (if needed)
INSTASEND_SECRET_KEY=ISK_live_...
```

## 🔍 Testing the Webhook

1. **Deploy the endpoint**
2. **Test with curl**:
   ```bash
   curl -X POST https://hexai.website/api/webhooks/instasend \
     -H "Content-Type: application/json" \
     -H "x-intasend-signature: test_signature" \
     -d '{"test": "data"}'
   ```

3. **Check Instasend dashboard** for webhook status

## 🚀 Quick Fix Steps

1. **Deploy the webhook endpoint** using one of the options above
2. **Set the environment variables**
3. **Test the webhook** with Instasend
4. **Monitor the logs** for successful webhook processing

The webhook endpoint must return a 200 status code for Instasend to consider it successful.
