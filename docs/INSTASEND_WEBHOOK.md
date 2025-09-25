# Instasend Webhook Configuration

## Live Mode Setup

When using Instasend in live mode, you need to configure webhooks in your Instasend dashboard.

### Required Environment Variables

```bash
# Live mode configuration
VITE_INSTASEND_PUBLISHABLE_KEY=ISPK_live_...  # Your live publishable key
VITE_INSTASEND_LIVE=true                      # Enable live mode
```

### Webhook URL

For live mode, configure this webhook URL in your Instasend dashboard:
```
https://hexai.website/api/webhooks/instasend
```

### Webhook Events

The webhook will receive the following events:
- `payment.completed` - When payment is successful
- `payment.failed` - When payment fails
- `payment.pending` - When payment is pending

### Security

- Verify webhook signatures using Instasend's webhook secret
- Use HTTPS only for webhook endpoints
- Implement proper error handling and logging

### Testing

Before going live:
1. Test with sandbox mode first
2. Verify webhook endpoints are accessible
3. Test payment flow end-to-end
4. Monitor logs for any issues

### Domain Verification

Ensure your domain `hexai.website` is verified in your Instasend dashboard for live mode.
