import React, { useEffect } from 'react';
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
  const { user, profile, isPremium, dailyUsage, refreshProfile } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate('/');
      return;
    }

    // Initialize Instasend
    const initializeInstasend = () => {
      console.log('🔄 Initializing InstaSend...');
      console.log('PublicAPIKey:', import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY);
      console.log('Live mode:', import.meta.env.VITE_INSTASEND_LIVE === 'true');

      if (window.IntaSend) {
        console.log('✅ IntaSend SDK loaded');
        new window.IntaSend({
          publicAPIKey: import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY,
          live: import.meta.env.VITE_INSTASEND_LIVE === 'true'
        })
        .on("COMPLETE", async (results: any) => {
          console.log("✅ Payment completed:", results);
          
          try {
            // Update transaction status to completed
            if (results.invoice_id) {
              await billingFunctions.updateTransactionStatus(
                results.api_ref, // This should be our transaction ID
                'completed',
                results.invoice_id
              );
              
              // Upgrade user to premium
              await billingFunctions.upgradeUserToPremium(user.id, results.api_ref);
              
              // Refresh user profile
              await refreshProfile();
              
              toast({
                title: "Payment Successful!",
                description: "Welcome to Hex Premium! You now have unlimited messages.",
                variant: "default",
              });
              
              // Redirect back to main app
              setTimeout(() => navigate('/'), 2000);
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
          console.log("❌ Payment failed:", results);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
        })
        .on("IN-PROGRESS", (results: any) => {
          console.log("🔄 Payment in progress:", results);
          toast({
            title: "Processing Payment",
            description: "Please wait while we process your payment...",
          });
        });
      } else {
        console.log('❌ IntaSend SDK not loaded');
      }
    };

    // Initialize after a short delay to ensure SDK is loaded
    setTimeout(initializeInstasend, 100);
  }, [user, navigate, refreshProfile]);

  const handleUpgrade = async () => {
    console.log('🔄 Upgrade button clicked');
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    try {
      console.log('🔄 Creating transaction record...');
      // Create a billing transaction record
      const { transaction, error } = await billingFunctions.createTransaction(
        user.id,
        5.00, // $5 USD
        'subscription',
        {
          plan: 'premium_monthly',
          description: 'Hex Premium - Unlimited Messages'
        }
      );

      if (error || !transaction) {
        console.log('❌ Failed to create transaction:', error);
        throw new Error('Failed to create transaction record');
      }

      // The Instasend button will use this transaction ID as api_ref
      console.log('✅ Transaction created:', transaction.id);

    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

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
                  <div className="text-3xl font-bold text-yellow-400 mb-2">$5/month</div>
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
                  data-amount="5"
                  data-currency="USD"
                  data-email={profile?.email || user.email}
                  data-first_name={profile?.full_name?.split(' ')[0] || 'User'}
                  data-last_name={profile?.full_name?.split(' ').slice(1).join(' ') || 'Premium'}
                  data-api_ref={`hex_premium_${user.id}_${Date.now()}`}
                  data-comment="Hex Premium Monthly Subscription"
                  data-redirect_url={`${window.location.origin}/billing`}
                  onClick={handleUpgrade}
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to Premium ($5/month)
                </button>

                {/* Debug Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>SDK Status: {typeof window !== 'undefined' && window.IntaSend ? '✅ Loaded' : '❌ Not Loaded'}</div>
                  <div>API Key: {import.meta.env.VITE_INSTASEND_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</div>
                  <div>Mode: {import.meta.env.VITE_INSTASEND_LIVE === 'true' ? 'Live' : 'Sandbox'}</div>
                </div>

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
