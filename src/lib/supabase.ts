import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  type: 'user' | 'assistant';
  content: string;
  created_at: string;
  token_count: number;
  is_error: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  current_conversation_id?: string;
  preferences: Record<string, any>;
  created_at: string;
  last_active: string;
}

export interface UserProfile {
  id: string;
  github_username?: string;
  avatar_url?: string;
  email?: string;
  full_name?: string;
  subscription_status: 'free' | 'premium';
  subscription_start_date?: string;
  subscription_end_date?: string;
  instasend_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyUsage {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface BillingTransaction {
  id: string;
  user_id: string;
  instasend_transaction_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_type: 'subscription' | 'one_time';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}



// Authentication functions
export const authFunctions = {
  // Sign in with GitHub
  async signInWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null, error: any }> {
    console.log('🔄 Getting user profile for:', userId);

    // Add a timeout at the query level
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      return { profile: data, error };
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('❌ Unexpected error in getUserProfile:', err);
      return { profile: null, error: err };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    return { profile: data, error };
  },

  // Check daily usage - simplified version without RPC
  async getDailyUsage(userId: string): Promise<{ messageCount: number, canSendMessage: boolean, error: any }> {
    console.log('🔄 Getting daily usage for:', userId);

    try {
      // First get user subscription status and expiry dates
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_status, subscription_end_date')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error getting user profile for usage:', profileError);
        return { messageCount: 0, canSendMessage: true, error: profileError };
      }

      // If premium, check if subscription has expired
      if (profile?.subscription_status === 'premium') {
        // Check if subscription has expired
        if (profile.subscription_end_date && new Date() > new Date(profile.subscription_end_date)) {
          console.log('⏰ Premium subscription expired, downgrading user');
          // Downgrade expired user
          await authFunctions.downgradeExpiredUser(userId);
          // Return as free user
          return { messageCount: 0, canSendMessage: false, error: null };
        }
        
        console.log('✅ Premium user - unlimited messages');
        return { messageCount: 0, canSendMessage: true, error: null };
      }

      // For free users, check today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usage, error: usageError } = await supabase
        .from('daily_usage')
        .select('message_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .single();

      if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ Error getting daily usage:', usageError);
        return { messageCount: 0, canSendMessage: true, error: usageError };
      }

      const messageCount = usage?.message_count || 0;
      const canSendMessage = messageCount < 3; // Allow 0, 1, 2 messages (3 total)

      console.log('✅ Daily usage result:', { messageCount, canSendMessage, limit: 3 });
      return { messageCount, canSendMessage, error: null };

    } catch (err) {
      console.error('❌ Unexpected error in getDailyUsage:', err);
      return { messageCount: 0, canSendMessage: true, error: err };
    }
  },

  // Downgrade expired premium user to free
  async downgradeExpiredUser(userId: string): Promise<{ success: boolean, error: any }> {
    console.log('🔄 Downgrading expired premium user:', userId);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'free',
          subscription_start_date: null,
          subscription_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error downgrading user:', error);
        return { success: false, error };
      }

      console.log('✅ Successfully downgraded expired premium user');
      return { success: true, error: null };
    } catch (err) {
      console.error('❌ Unexpected error downgrading user:', err);
      return { success: false, error: err };
    }
  },

  // Increment daily usage
  async incrementDailyUsage(userId: string): Promise<{ success: boolean, error: any }> {
    console.log('🔄 Calling increment_daily_usage for user:', userId);
    
    const { data, error } = await supabase.rpc('increment_daily_usage', {
      user_uuid: userId
    });

    console.log('📊 increment_daily_usage result:', { data, error });
    
    if (error) {
      console.error('❌ Error calling increment_daily_usage:', error);
      return { success: false, error };
    }

    const success = data === true;
    console.log(success ? '✅ Usage incremented successfully' : '❌ Usage increment blocked (limit exceeded)');
    
    return { success, error: null };
  }
};

// Helper functions for conversation management
export class ConversationManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create a new conversation
  async createConversation(title?: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: this.userId,
        title: title || `Chat ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all conversations for the user
  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Add a message to a conversation
  async addMessage(
    conversationId: string,
    type: 'user' | 'assistant',
    content: string,
    tokenCount: number = 0,
    isError: boolean = false
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        type,
        content,
        token_count: tokenCount,
        is_error: isError,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('id', conversationId)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Clear all conversations
  async clearAllConversations(): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Update conversation timestamp (for thread activity)
  async updateConversationTimestamp(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Get or create user session
  async getOrCreateSession(): Promise<UserSession> {
    let { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Session doesn't exist, create it
      const { data: newSession, error: createError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: this.userId,
          preferences: {},
        })
        .select()
        .single();

      if (createError) throw createError;
      return newSession;
    }

    if (error) throw error;
    return data;
  }

  // Update user session
  async updateSession(updates: Partial<UserSession>): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        ...updates,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', this.userId);

    if (error) throw error;
  }
}

// Billing functions
export const billingFunctions = {
  // Create billing transaction record
  async createTransaction(
    userId: string,
    amount: number,
    transactionType: 'subscription' | 'one_time' = 'subscription',
    metadata: Record<string, any> = {}
  ) {
    const { data, error } = await supabase
      .from('billing_transactions')
      .insert({
        user_id: userId,
        amount,
        currency: 'USD',
        transaction_type: transactionType,
        metadata,
        status: 'pending'
      })
      .select()
      .single();

    return { transaction: data, error };
  },

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string,
    status: 'completed' | 'failed' | 'refunded',
    instasendTransactionId?: string
  ) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (instasendTransactionId) {
      updates.instasend_transaction_id = instasendTransactionId;
    }

    const { data, error } = await supabase
      .from('billing_transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    return { transaction: data, error };
  },

  // Upgrade user to premium
  async upgradeUserToPremium(userId: string, transactionId: string) {
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // 1 month subscription

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'premium',
        subscription_start_date: subscriptionStart.toISOString(),
        subscription_end_date: subscriptionEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { profile: data, error };
  }
};

// Database cleanup functions
export const cleanupFunctions = {
  // Check and expire subscriptions
  async checkAndExpireSubscriptions(): Promise<{ success: boolean, expiredCount: number, expiredUsers: string[], error?: any }> {
    try {
      const { data, error } = await supabase.rpc('check_and_expire_subscriptions');
      
      if (error) {
        console.error('❌ Error checking subscription expiry:', error);
        return { success: false, expiredCount: 0, expiredUsers: [], error };
      }

      const result = data[0];
      console.log(`✅ Checked subscriptions: ${result.expired_count} expired users processed`);
      
      return { 
        success: true, 
        expiredCount: result.expired_count || 0, 
        expiredUsers: result.expired_users || [], 
        error: null 
      };
    } catch (err) {
      console.error('❌ Unexpected error checking subscription expiry:', err);
      return { success: false, expiredCount: 0, expiredUsers: [], error: err };
    }
  },

  // Trigger manual cleanup (calls the database function)
  async triggerCleanup(): Promise<{ success: boolean, message: string, error?: any }> {
    try {
      const { data, error } = await supabase.rpc('trigger_cleanup');

      if (error) {
        console.error('❌ Cleanup failed:', error);
        return { success: false, message: 'Cleanup failed', error };
      }

      console.log('✅ Cleanup completed:', data);
      return { success: true, message: 'Cleanup completed successfully' };
    } catch (err) {
      console.error('❌ Unexpected cleanup error:', err);
      return { success: false, message: 'Unexpected error during cleanup', error: err };
    }
  },

  // Check if cleanup is needed (based on last cleanup time)
  async isCleanupNeeded(): Promise<boolean> {
    try {
      const lastCleanup = localStorage.getItem('last_cleanup_date');
      if (!lastCleanup) return true;

      const lastCleanupDate = new Date(lastCleanup);
      const now = new Date();
      const daysSinceCleanup = Math.floor((now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60 * 24));

      return daysSinceCleanup >= 15;
    } catch (err) {
      console.error('Error checking cleanup status:', err);
      return true; // Default to needing cleanup if we can't determine
    }
  },

  // Run cleanup if needed
  async runCleanupIfNeeded(): Promise<void> {
    try {
      const needsCleanup = await this.isCleanupNeeded();

      if (needsCleanup) {
        console.log('🧹 Running scheduled cleanup...');
        const result = await this.triggerCleanup();

        if (result.success) {
          // Update last cleanup date
          localStorage.setItem('last_cleanup_date', new Date().toISOString());
          console.log('✅ Scheduled cleanup completed');
        } else {
          console.error('❌ Scheduled cleanup failed:', result.error);
        }
      } else {
        console.log('⏭️ Cleanup not needed yet');
      }
    } catch (err) {
      console.error('❌ Error in scheduled cleanup:', err);
    }
  },

  // Get cleanup status for UI
  async getCleanupStatus(): Promise<{
    lastCleanup: string | null;
    daysSinceCleanup: number;
    needsCleanup: boolean;
  }> {
    const lastCleanup = localStorage.getItem('last_cleanup_date');
    let daysSinceCleanup = 0;

    if (lastCleanup) {
      const lastCleanupDate = new Date(lastCleanup);
      const now = new Date();
      daysSinceCleanup = Math.floor((now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      daysSinceCleanup = 999; // Never cleaned
    }

    return {
      lastCleanup,
      daysSinceCleanup,
      needsCleanup: daysSinceCleanup >= 15
    };
  }
};
