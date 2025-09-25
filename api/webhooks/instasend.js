// Instasend Webhook Handler
// This should be deployed as a serverless function or API endpoint

const crypto = require('crypto');

// Environment variables required:
// INSTASEND_WEBHOOK_SECRET=your_webhook_secret
// INSTASEND_SECRET_KEY=ISK_live_... (for additional API calls if needed)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the signature from headers
    const signature = req.headers['x-intasend-signature'];
    const webhookSecret = process.env.INSTASEND_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the raw body for signature verification
    const payload = JSON.stringify(req.body);
    
    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the webhook event
    const event = req.body;
    console.log('✅ Valid webhook received:', event);

    // Handle different event types
    switch (event.state) {
      case 'COMPLETED':
        console.log('💰 Payment completed:', {
          invoice_id: event.invoice_id,
          amount: event.value,
          currency: event.currency,
          api_ref: event.api_ref
        });
        
        // TODO: Update user subscription status in database
        // TODO: Send confirmation email to user
        // TODO: Log transaction for analytics
        
        break;
        
      case 'FAILED':
        console.log('❌ Payment failed:', {
          invoice_id: event.invoice_id,
          failed_reason: event.failed_reason,
          failed_code: event.failed_code,
          api_ref: event.api_ref
        });
        
        // TODO: Notify user of payment failure
        // TODO: Log failure for analytics
        
        break;
        
      default:
        console.log('ℹ️ Unknown event state:', event.state);
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event_id: event.invoice_id 
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
