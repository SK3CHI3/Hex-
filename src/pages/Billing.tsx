import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  MessageCircle, 
  Zap, 
  Shield,
  Infinity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { billingFunctions } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import 'intasend-inlinejs-sdk';

declare global {
  interface Window {
    IntaSend: any;
  }
}

export default function Billing() {
  const navigate = useNavigate();
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const { user, profile, isPremium, dailyUsage, refreshProfile, loading } = useAuth();

  useEffect(() => {
    console.log('🔄 Billing useEffect triggered');
    console.log('🔄 Billing: User:', user?.id, user?.email);
    console.log('🔄 Billing: Profile:', profile?.email, profile?.subscription_status);
    console.log('🔄 Billing: Current transaction ID:', currentTransactionId);
    
    // Only initialize if user is available and not loading
    if (loading || !user) {
      console.log('⏳ Billing: Auth loading or user not available, skipping initialization');
      return;
    }

    // Initialize Instasend
    // Required environment variables for live mode:
    // Frontend (Public) - Safe to expose:
    // VITE_INSTASEND_PUBLISHABLE_KEY=ISPK_live_... (live publishable key)
    // VITE_INSTASEND_LIVE=true
    // 
    // Backend (Secret) - Keep secure, never expose:
    // INSTASEND_SECRET_KEY=ISK_live_... (live secret key - for server-to-server API calls)
    // INSTASEND_WEBHOOK_SECRET=your_webhook_secret (for webhook validation)
    const initializeInstasend = () => {
      console.log('🔄 Initializing InstaSend...');
      console.log('PublicAPIKey configured:', !!import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY);
      console.log('Live mode:', import.meta.env.VITE_INSTASEND_LIVE === 'true');
      console.log('Environment:', import.meta.env.VITE_INSTASEND_LIVE === 'true' ? 'LIVE' : 'SANDBOX');
      console.log('Domain:', window.location.origin);
      console.log('Window.IntaSend available:', !!window.IntaSend);

      if (window.IntaSend) {
        console.log('✅ IntaSend SDK loaded');
        
        // Validate live mode configuration
        if (import.meta.env.VITE_INSTASEND_LIVE === 'true') {
          console.log('🚀 LIVE MODE: Using production Instasend configuration');
          if (!import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY?.startsWith('ISPK_live_')) {
            console.warn('⚠️ WARNING: Live mode enabled but API key may not be live key');
          }
        } else {
          console.log('🧪 SANDBOX MODE: Using test Instasend configuration');
        }
        try {
        new window.IntaSend({
          publicAPIKey: import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY,
            live: import.meta.env.VITE_INSTASEND_LIVE === 'true',
            // Webhook URL for live mode (configure in Instasend dashboard)
            webhookUrl: import.meta.env.VITE_INSTASEND_LIVE === 'true' 
              ? `${window.location.origin}/api/webhooks/instasend` 
              : undefined
        })
        .on("COMPLETE", async (results: any) => {
          console.log("✅ Billing: Payment completed:", results);
          console.log("✅ Billing: Results details:", {
            invoice_id: results.invoice_id,
            amount: results.amount,
            currency: results.currency,
            status: results.status
          });
          
          try {
            // Create transaction record when payment completes
            console.log('🔄 Creating transaction record...');
            const { transaction, error } = await billingFunctions.createTransaction(
              user.id,
              3.00, // $3 USD
              'subscription',
              {
                plan: 'premium_monthly',
                description: 'Hex Premium - Unlimited Messages',
                invoice_id: results.invoice_id
              }
            );

            if (error || !transaction) {
              console.log('❌ Failed to create transaction:', error);
              throw new Error('Failed to create transaction record');
            }

            // Store the transaction ID
            setCurrentTransactionId(transaction.id);
            console.log('✅ Transaction created:', transaction.id);
            
            // Update transaction status to completed
            if (results.invoice_id) {
              await billingFunctions.updateTransactionStatus(
                transaction.id,
                'completed',
                results.invoice_id
              );
              
              // Upgrade user to premium
              await billingFunctions.upgradeUserToPremium(user.id, transaction.id);
              
              // Refresh user profile
              await refreshProfile();
              
              toast({
                title: "Payment Successful!",
                description: "Welcome to Hex Premium! You now have unlimited messages.",
                variant: "default",
              });
              
              // Redirect back to main app
              setTimeout(() => navigate('/'), 2000);
            } else {
              console.error('❌ Missing invoice_id');
              toast({
                title: "Payment Processing Error",
                description: "Payment completed but missing transaction information. Please contact support.",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Error processing payment completion:', error);
            toast({
              title: "Payment Processing Error",
              description: "Payment was successful but there was an error upgrading your account. Please contact support.",
              variant: "destructive",
            });
          }
        })
        .on("FAILED", (results: any) => {
          console.log("❌ Billing: Payment failed:", results);
          console.log("❌ Billing: Failure details:", {
            error: results.error,
            message: results.message,
            status: results.status
          });
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
        })
        .on("IN-PROGRESS", (results: any) => {
          console.log("🔄 Billing: Payment in progress:", results);
          console.log("🔄 Billing: Progress details:", {
            status: results.status,
            message: results.message
          });
          toast({
            title: "Processing Payment",
            description: "Please wait while we process your payment...",
          });
        });
        } catch (error) {
          console.error('❌ Error initializing Instasend:', error);
          toast({
            title: "Payment System Error",
            description: "Failed to initialize payment system. Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('❌ IntaSend SDK not loaded - will retry...');
        // Retry after a longer delay
        setTimeout(() => {
          if (window.IntaSend) {
            console.log('✅ IntaSend SDK loaded on retry');
            initializeInstasend();
          } else {
            console.error('❌ IntaSend SDK still not available after retry');
          }
        }, 2000);
      }
    };

    // Initialize after a short delay to ensure SDK is loaded
    setTimeout(initializeInstasend, 100);

    // Add click listener to track button clicks
    const addButtonClickListener = () => {
      const button = document.querySelector('.intaSendPayButton');
      if (button) {
        console.log('🔄 Billing: Adding click listener to Instasend button');
        button.addEventListener('click', (e) => {
          console.log('🔄 Billing: Instasend button clicked!');
          console.log('🔄 Billing: Button element:', button);
          console.log('🔄 Billing: Button data attributes:', {
            amount: button.getAttribute('data-amount'),
            currency: button.getAttribute('data-currency'),
            email: button.getAttribute('data-email'),
            first_name: button.getAttribute('data-first_name'),
            last_name: button.getAttribute('data-last_name'),
            api_ref: button.getAttribute('data-api_ref'),
            comment: button.getAttribute('data-comment'),
            redirect_url: button.getAttribute('data-redirect_url'),
            country: button.getAttribute('data-country'),
            method: button.getAttribute('data-method'),
            card_tarrif: button.getAttribute('data-card_tarrif'),
            phone_number: button.getAttribute('data-phone_number'),
            city: button.getAttribute('data-city'),
            state: button.getAttribute('data-state'),
            postal_code: button.getAttribute('data-postal_code'),
            address: button.getAttribute('data-address')
          });
          console.log('🔄 Billing: Instasend SDK available:', !!window.IntaSend);
          console.log('🔄 Billing: API Key available:', !!import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY);
          console.log('🔄 Billing: API Key configured:', !!import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY);
          console.log('🔄 Billing: Live mode:', import.meta.env.VITE_INSTASEND_LIVE);
        });
      } else {
        console.log('❌ Billing: Instasend button not found, retrying...');
        setTimeout(addButtonClickListener, 500);
      }
    };

    // Add button listener after a delay to ensure button is rendered
    setTimeout(addButtonClickListener, 200);
  }, [user, navigate, loading]);

  // Track when the button is actually rendered (must be before conditional returns)
  useEffect(() => {
    if (!user) return; // Skip if no user
    
    const checkButton = () => {
      const button = document.querySelector('.intaSendPayButton');
      if (button) {
        console.log('✅ Billing: Instasend button found in DOM');
        console.log('✅ Billing: Button classes:', button.className);
        console.log('✅ Billing: Button data attributes:', {
          amount: button.getAttribute('data-amount'),
          currency: button.getAttribute('data-currency'),
          email: button.getAttribute('data-email'),
          api_ref: button.getAttribute('data-api_ref'),
          method: button.getAttribute('data-method')
        });
      } else {
        console.log('❌ Billing: Instasend button not found in DOM');
      }
    };

    // Check immediately and after a delay
    checkButton();
    setTimeout(checkButton, 1000);
  }, [user]);

  // Show loading state while user data is being fetched
  if (loading) {
    console.log('⏳ Billing: Auth loading, showing loading state');
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p>Loading billing page...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if user is not authenticated (after loading)
  if (!user) {
    console.log('❌ Billing: User not authenticated, redirecting to home');
    navigate('/');
    return null;
  }

  console.log('🔄 Billing: Rendering billing page for user:', user.id);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <div className="border-b border-green-500/20 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hex
            </Button>
            <h1 className="text-xl font-light text-green-400">Billing & Subscription</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Plan */}
          <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Plan:</span>
                <Badge 
                  variant={isPremium ? "default" : "outline"}
                  className={isPremium ? "bg-yellow-600 text-white" : "border-green-500/30 text-green-400"}
                >
                  {isPremium ? (
                    <>
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </>
                  ) : (
                    'Free'
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Daily Messages:</span>
                <span className="text-green-400">
                  {isPremium ? (
                    <div className="flex items-center gap-1">
                      <Infinity className="h-4 w-4" />
                      Unlimited
                    </div>
                  ) : (
                    `${dailyUsage.messageCount}/3`
                  )}
                </span>
              </div>

              {profile?.subscription_end_date && isPremium && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Expires:</span>
                  <span className="text-green-400">
                    {new Date(profile.subscription_end_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {!isPremium && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-400 text-sm">
                    You're using the free plan with limited daily messages.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upgrade to Premium */}
          {!isPremium && (
            <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Upgrade to Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">$3/month</div>
                  <div className="text-gray-400 text-sm">Unlimited AI conversations</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Unlimited daily messages</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Persistent conversation history</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Advanced AI features</span>
                  </div>
                </div>

                <button
                  className="intaSendPayButton w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  data-amount="3.00"
                  data-currency="USD"
                  data-email={profile?.email || user.email}
                  data-first_name={profile?.full_name?.split(' ')[0] || 'User'}
                  data-last_name={profile?.full_name?.split(' ').slice(1).join(' ') || 'Premium'}
                  data-api_ref={`hex_premium_${user.id}_${Date.now()}`}
                  data-comment="Hex Premium Monthly Subscription"
                  data-redirect_url={`${window.location.origin}/billing`}
                  data-country="US"
                  data-method="CARD-PAYMENT"
                  data-card_tarrif="BUSINESS-PAYS"
                  data-phone_number=""
                  data-city=""
                  data-state=""
                  data-postal_code=""
                  data-address=""
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to Premium ($3/month)
                </button>


                <div className="text-xs text-gray-500 text-center">
                  Secure payment powered by Instasend
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Benefits */}
          {isPremium && (
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Premium Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-green-400 mb-4">
                  🎉 You're a Premium user!
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Unlimited daily messages</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Advanced features</span>
                  </div>
                </div>

                <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="text-green-400 text-sm text-center">
                    Thank you for supporting Hex! 🚀
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
