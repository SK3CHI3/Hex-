-- Database Performance Indexes for Hex Chat Application
-- Run these commands in your Supabase SQL Editor

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Index for conversations by user and update time (most common query)
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON conversations(user_id, updated_at DESC);

-- Index for messages by conversation and creation time (message loading)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at ASC);

-- Index for messages by conversation, type, and creation time (filtering user/assistant messages)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_type_created 
ON messages(conversation_id, type, created_at ASC);

-- Index for active conversations only (common filter)
CREATE INDEX IF NOT EXISTS idx_conversations_user_active_updated 
ON conversations(user_id, updated_at DESC) 
WHERE is_active = true;

-- Index for non-error messages (common filter)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_no_error 
ON messages(conversation_id, created_at ASC) 
WHERE is_error = false;

-- Index for daily usage queries
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date 
ON daily_usage(user_id, usage_date DESC);

-- ============================================
-- CONSTRAINTS AND VALIDATIONS
-- ============================================

-- Ensure message type is valid
ALTER TABLE messages 
ADD CONSTRAINT IF NOT EXISTS chk_message_type 
CHECK (type IN ('user', 'assistant'));

-- Ensure conversation title length
ALTER TABLE conversations 
ADD CONSTRAINT IF NOT EXISTS chk_title_length 
CHECK (title IS NULL OR length(title) <= 200);

-- Ensure token count is non-negative
ALTER TABLE messages 
ADD CONSTRAINT IF NOT EXISTS chk_token_count_positive 
CHECK (token_count >= 0);

-- ============================================
-- ROW LEVEL SECURITY (if not already enabled)
-- ============================================

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table  
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for conversations - users can only access their own
DROP POLICY IF EXISTS "Users can only access their own conversations" ON conversations;
CREATE POLICY "Users can only access their own conversations" ON conversations
FOR ALL USING (auth.uid() = user_id);

-- Policy for messages - users can only access messages from their conversations
DROP POLICY IF EXISTS "Users can only access messages from their conversations" ON messages;
CREATE POLICY "Users can only access messages from their conversations" ON messages
FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================
-- CLEANUP FUNCTION
-- ============================================

-- Function to cleanup old conversations and messages (15 days)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff_date timestamptz;
  deleted_conversations integer;
  deleted_messages integer;
BEGIN
  -- Calculate cutoff date (15 days ago)
  cutoff_date := NOW() - INTERVAL '15 days';
  
  -- Log the cleanup operation
  RAISE NOTICE 'Starting cleanup for data older than %', cutoff_date;
  
  -- First, mark old conversations as inactive
  UPDATE conversations 
  SET is_active = false, updated_at = NOW()
  WHERE updated_at < cutoff_date 
    AND is_active = true;
  
  GET DIAGNOSTICS deleted_conversations = ROW_COUNT;
  
  -- Delete messages from inactive conversations older than cutoff
  DELETE FROM messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE is_active = false 
      AND updated_at < cutoff_date
  );
  
  GET DIAGNOSTICS deleted_messages = ROW_COUNT;
  
  -- Finally, delete the inactive conversations
  DELETE FROM conversations 
  WHERE is_active = false 
    AND updated_at < cutoff_date;
  
  -- Log results
  RAISE NOTICE 'Cleanup completed: % conversations and % messages removed', 
    deleted_conversations, deleted_messages;
END;
$$;

-- ============================================
-- SCHEDULED CLEANUP (using pg_cron extension)
-- ============================================

-- Note: This requires the pg_cron extension to be enabled in Supabase
-- You can also trigger this manually or via a serverless function

-- Schedule cleanup to run daily at 2 AM UTC
-- SELECT cron.schedule('cleanup-old-chat-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- ============================================
-- MANUAL CLEANUP TRIGGER
-- ============================================

-- Create a function that can be called from the application
CREATE OR REPLACE FUNCTION trigger_cleanup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Call the cleanup function
  PERFORM cleanup_old_data();
  
  -- Return success status
  result := json_build_object(
    'success', true,
    'message', 'Cleanup completed successfully',
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (optional - you might want to restrict this)
-- GRANT EXECUTE ON FUNCTION trigger_cleanup() TO authenticated;
