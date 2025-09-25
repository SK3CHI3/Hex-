import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, LogOut, User, MessageCircle, Crown, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AuthButton() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading,
    dailyUsage,
    signInWithGitHub,
    signOut,
    isAuthenticated,
    isPremium,
    canSendMessage
  } = useAuth();

  // Only ONE admin user allowed
  const isAdmin = user?.email === 'vomollo101@gmail.com';

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="border-green-500/30 text-green-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={signInWithGitHub}
        className="border-green-500/30 text-green-400 hover:bg-green-500/10 px-3 py-1"
      >
        <Github className="h-4 w-4 mr-2" />
        Sign in with GitHub
      </Button>
    );
  }

  // For desktop, show minimal user info (no sign out button)
  // For mobile, the profile modal will handle everything
  return (
    <div className="flex items-center">
      {/* Simple user indicator - no sign out button */}
      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 border border-green-500/20">
        <User className="h-3 w-3 text-green-400" />
        <span className="hidden sm:inline text-green-300/80 text-xs font-light">
          {profile?.github_username || 'User'}
        </span>
      </div>
    </div>
  );
}

export function AuthCard() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading,
    dailyUsage,
    signInWithGitHub,
    signOut,
    isAuthenticated,
    isPremium,
    canSendMessage
  } = useAuth();

  // Only ONE admin user allowed
  const isAdmin = user?.email === 'vomollo101@gmail.com';

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="text-center text-green-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            Authenticating...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-green-400 text-lg flex items-center gap-2">
            <Github className="h-5 w-5" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm">
            Sign in with GitHub to start using Hex AI assistant with conversation memory.
          </p>
          <Button
            onClick={signInWithGitHub}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Github className="h-4 w-4 mr-2" />
            Sign in with GitHub
          </Button>
          <div className="text-xs text-gray-500 text-center">
            Free: 3 messages/day • Premium: Unlimited ($3/month)
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-green-400 text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {profile?.avatar_url && (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <div className="text-green-400 font-medium">
              {profile?.github_username || 'User'}
            </div>
            <div className="text-xs text-gray-400">
              {profile?.email}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Plan:</span>
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
          <span className="text-sm text-gray-400">Daily Messages:</span>
          <span className={`text-sm ${canSendMessage ? 'text-green-400' : 'text-red-400'}`}>
            {isPremium ? 'Unlimited' : `${dailyUsage.messageCount}/3`}
          </span>
        </div>

        {!isPremium && !canSendMessage && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg space-y-2">
            <div className="text-red-400 text-sm font-medium">
              Daily limit reached
            </div>
            <div className="text-red-300 text-xs mb-2">
              Upgrade to Premium for unlimited messages
            </div>
            <Button
              onClick={() => navigate('/billing')}
              size="sm"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Admin Dashboard Button */}
        {isAdmin && (
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>
        )}

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
