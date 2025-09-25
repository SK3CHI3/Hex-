# Instasend Webhook Implementation Guide

## Webhook Configuration in Dashboard

### 1. Endpoint URL
```
https://hexai.website/api/webhooks/instasend
```

### 2. Challenge/Secret
- Generate a random secret key (32+ characters)
- Store as environment variable: `INSTASEND_WEBHOOK_SECRET`
- Use this secret to validate webhook signatures

### 3. Events to Subscribe
Select these events:
- ✅ **Collection event** (payment completed/failed)
- ✅ **Send money event** (if needed)

## Webhook Handler Implementation

### Environment Variables Required
```bash
INSTASEND_WEBHOOK_SECRET=your_random_secret_key_here
```

### Webhook Endpoint Code
```javascript
// POST /api/webhooks/instasend
app.post('/api/webhooks/instasend', (req, res) => {
  const signature = req.headers['x-intasend-signature'];
  const payload = JSON.stringify(req.body);
  
  // Validate signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.INSTASEND_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook event
  const event = req.body;
  
  switch (event.type) {
    case 'collection.success':
      // Handle successful payment
      console.log('Payment successful:', event.data);
      break;
    case 'collection.failed':
      // Handle failed payment
      console.log('Payment failed:', event.data);
      break;
    default:
      console.log('Unknown event type:', event.type);
  }
  
  res.status(200).send('OK');
});
```

## Security Best Practices

1. **Always validate signatures** - Never trust webhooks without verification
2. **Use HTTPS only** - Never use HTTP for webhooks
3. **Implement idempotency** - Handle duplicate events gracefully
4. **Log everything** - Keep detailed logs for debugging
5. **Rate limiting** - Implement rate limiting to prevent abuse

## Testing

1. **Use Instasend test tools** to send sample events
2. **Monitor logs** to ensure events are received
3. **Test signature validation** with invalid signatures
4. **Verify event processing** logic works correctly
