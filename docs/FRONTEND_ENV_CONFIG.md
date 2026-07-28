# 🎨 Frontend Environment Configuration

## Copy & Paste These Environment Variables

### For Netlify Dashboard

Go to: **Site settings → Environment variables → Edit variables**

Then copy-paste these:

```env
VITE_MCP_ADAPTER_URL=http://localhost:8083
VITE_WS_URL=ws://localhost:8081
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_MODELSCOPE_API_KEY=your-modelscope-api-key
```

⚠️ **Replace these placeholders:**
- `your-project-id` - Your Supabase project ID
- `your-supabase-anon-key-here` - Your Supabase anonymous key
- `your-modelscope-api-key` - Your ModelScope API key

**Get your API keys:**
- ModelScope: https://modelscope.ai (free tier available)
- Supabase: https://supabase.com (free tier available)

---

## Alternative: Local .env File

If running frontend locally, create `.env` file in project root:

```bash
# Backend URLs (Local)
VITE_MCP_ADAPTER_URL=http://localhost:8083
VITE_WS_URL=ws://localhost:8081

# Supabase (Replace with your values)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# ModelScope API (Qwen3.7-Plus)
VITE_MODELSCOPE_API_KEY=your-modelscope-api-key
```

---

## Get Your Supabase Keys

1. **Go to:** https://supabase.com/dashboard
2. **Select your project**
3. **Click:** Settings (⚙️) → API
4. **Copy:**
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

---

## Testing Backend Connection

After deploying frontend with new env vars:

1. **Open:** https://hexai.website/
2. **Open browser console** (F12)
3. **Look for:** 
   ```
   [MCP] Connected to adapter
   ✅ Authenticated with execution server
   ```

4. **Send test message:** "Hello, test the connection"

5. **Should see:**
   - ✅ AI responds
   - ✅ No errors in console
   - ✅ Real-time streaming works

---

## Troubleshooting

### "Failed to fetch" or "Network error"

**Check backend is running:**
```bash
# On your Oracle VM:
pm2 status

# Should show:
# hex-tool-server    │ online
# hex-mcp-adapter    │ online
```

**Test backend directly:**
```bash
curl https://hexai.website/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### "WebSocket connection failed"

**Check Nginx config:**
```bash
# On Oracle VM:
sudo nginx -t
sudo systemctl status nginx
```

**Check WebSocket endpoint:**
```bash
# On your local machine:
curl -I https://hexai.website/ws

# Should NOT return 404
```

### "CORS error"

**Add CORS headers to Nginx** (if needed):

```bash
sudo nano /etc/nginx/sites-available/hex-backend
```

Add inside server block:
```nginx
# Add CORS headers
add_header Access-Control-Allow-Origin "https://your-frontend-domain.netlify.app" always;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
```

Then:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Quick Reference

### Backend Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **Health Check** | `https://hexai.website/health` | Test if backend is up |
| **MCP Adapter** | `https://hexai.website/chat` | AI chat (SSE stream) |
| **WebSocket** | `wss://hexai.website/ws` | Tool execution |

### Test Commands

```bash
# Test health
curl https://hexai.website/health

# Test HTTPS
curl -I https://hexai.website/health

# Test SSL certificate
openssl s_client -connect hexai.website:443 -servername hexai.website

# Test DNS
nslookup hexai.website
```

---

## Environment Variable Checklist

- [ ] `VITE_MCP_ADAPTER_URL` = `https://hexai.website`
- [ ] `VITE_WS_URL` = `wss://hexai.website/ws`
- [ ] `VITE_SUPABASE_URL` = Your Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
- [ ] `VITE_MODELSCOPE_API_KEY` = Your ModelScope key
- [ ] Frontend redeployed after changes
- [ ] Browser cache cleared
- [ ] Tested in incognito mode

---

## After Updating Environment Variables

1. **In Netlify:** Changes trigger auto-redeploy (wait 2-3 minutes)
2. **Clear browser cache:** Ctrl+Shift+R or Cmd+Shift+R
3. **Test in incognito mode:** To ensure no old cache
4. **Check console:** F12 → Console tab for any errors

---

**🎉 Done!** Your frontend is now connected to your Oracle Cloud backend at hexai.website!
















