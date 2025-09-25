import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Zap, MessageSquare, Shield, Clock } from 'lucide-react';

interface BillingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  dailyUsage: {
    messageCount: number;
    canSendMessage: boolean;
  };
}

const BillingPopup: React.FC<BillingPopupProps> = ({ isOpen, onClose, dailyUsage }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    console.log('🔄 BillingPopup: Upgrade Now button clicked');
    console.log('🔄 BillingPopup: Current daily usage:', dailyUsage);
    console.log('🔄 BillingPopup: Closing popup and navigating to /billing');
    
    // Close popup and navigate to billing page with InstaSend integration
    onClose();
    navigate('/billing');
    
    console.log('✅ BillingPopup: Navigation initiated to /billing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border-green-500/30 text-green-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-400">
            <Zap className="h-5 w-5" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Usage */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {dailyUsage.messageCount}/3
            </div>
            <p className="text-gray-300 text-sm">
              You've used all your free messages today
            </p>
          </div>

          {/* Premium Benefits */}
          <Card className="bg-green-900/20 border-green-500/30">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Premium Benefits
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Unlimited messages</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Advanced cybersecurity tools</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>No daily limits</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">$3</div>
            <div className="text-gray-300 text-sm">per month</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-green-600 hover:bg-green-700 text-black font-semibold"
            >
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>

          {/* Reset Info */}
          <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-3">
            <Clock className="h-3 w-3 inline mr-1" />
            Free messages reset daily at midnight UTC
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingPopup;
