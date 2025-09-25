// Supabase Edge Function for Instasend Webhook
// Deploy with: supabase functions deploy instasend-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intasend-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const webhookSecret = Deno.env.get('INSTASEND_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!webhookSecret) {
      console.error('❌ INSTASEND_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the signature from headers
    const signature = req.headers.get('x-intasend-signature')
    
    if (!signature) {
      console.error('❌ Missing signature header')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the request body
    const body = await req.text()
    const event = JSON.parse(body)

    // Verify the signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Valid webhook received:', {
      invoice_id: event.invoice_id,
      state: event.state,
      amount: event.value,
      currency: event.currency,
      api_ref: event.api_ref
    })

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Handle different event states
    switch (event.state) {
      case 'COMPLETED':
        console.log('💰 Payment completed successfully')
        
        // Extract user ID from api_ref (format: hex_premium_{user_id}_{timestamp})
        const apiRefMatch = event.api_ref?.match(/hex_premium_([^_]+)_/)
        if (apiRefMatch) {
          const userId = apiRefMatch[1]
          
          // Update user subscription status
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'premium',
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            })
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Error updating user subscription:', updateError)
          } else {
            console.log('✅ User subscription updated successfully')
          }
        }
        break
        
      case 'FAILED':
        console.log('❌ Payment failed:', event.failed_reason)
        // TODO: Handle payment failure (maybe send notification email)
        break
        
      default:
        console.log('ℹ️ Event state:', event.state)
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        event_id: event.invoice_id,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
