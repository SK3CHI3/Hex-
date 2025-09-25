// Simple Express server for Instasend webhook
// Run with: node server/webhook-server.js

const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware
app.use(express.json());

// Environment variables
const WEBHOOK_SECRET = process.env.INSTASEND_WEBHOOK_SECRET;
const SECRET_KEY = process.env.INSTASEND_SECRET_KEY;

if (!WEBHOOK_SECRET) {
  console.error('❌ INSTASEND_WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}

// Webhook endpoint
app.post('/api/webhooks/instasend', (req, res) => {
  try {
    // Get signature from headers
    const signature = req.headers['x-intasend-signature'];
    
    if (!signature) {
      console.error('❌ Missing signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook event
    const event = req.body;
    console.log('✅ Valid webhook received:', {
      invoice_id: event.invoice_id,
      state: event.state,
      amount: event.value,
      currency: event.currency,
      api_ref: event.api_ref
    });

    // Handle different states
    switch (event.state) {
      case 'COMPLETED':
        console.log('💰 Payment completed successfully');
        // TODO: Update user subscription in database
        break;
        
      case 'FAILED':
        console.log('❌ Payment failed:', event.failed_reason);
        // TODO: Handle payment failure
        break;
        
      default:
        console.log('ℹ️ Event state:', event.state);
    }

    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    webhook_secret_configured: !!WEBHOOK_SECRET
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhooks/instasend`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
