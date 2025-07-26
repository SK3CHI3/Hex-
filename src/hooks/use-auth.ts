import { useState, useEffect } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase, authFunctions, cleanupFunctions, type UserProfile } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState({ messageCount: 0, canSendMessage: true });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserData(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setDailyUsage({ messageCount: 0, canSendMessage: true });
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load profile and usage in parallel
      const [profileResult, usageResult] = await Promise.all([
        authFunctions.getUserProfile(userId),
        authFunctions.getDailyUsage(userId)
      ]);

      if (profileResult.profile) {
        setProfile(profileResult.profile);
      }

      setDailyUsage({
        messageCount: usageResult.messageCount,
        canSendMessage: usageResult.canSendMessage
      });

      // Run cleanup check for authenticated users
      cleanupFunctions.runCleanupIfNeeded().catch(console.warn);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) return false;

    const { success } = await authFunctions.incrementDailyUsage(user.id);
    if (success) {
      const usageResult = await authFunctions.getDailyUsage(user.id);
      setDailyUsage({
        messageCount: usageResult.messageCount,
        canSendMessage: usageResult.canSendMessage
      });
    }
    return success;
  };

  const refreshProfile = async () => {
    if (user) {
      const { profile } = await authFunctions.getUserProfile(user.id);
      if (profile) setProfile(profile);
    }
  };

  const refreshUsage = async () => {
    if (user) {
      const usageResult = await authFunctions.getDailyUsage(user.id);
      setDailyUsage({
        messageCount: usageResult.messageCount,
        canSendMessage: usageResult.canSendMessage
      });
    }
  };

  return {
    session,
    user,
    profile,
    loading,
    dailyUsage,
    signInWithGitHub,
    signOut,
    incrementUsage,
    refreshProfile,
    refreshUsage,
    isAuthenticated: !!session,
    isPremium: profile?.subscription_status === 'premium',
    canSendMessage: dailyUsage.canSendMessage,
  };
}
