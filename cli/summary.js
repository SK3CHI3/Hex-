import { countMessagesTokens, getTokenLimit } from './tokens.js';

/**
 * Simple summarization - keeps recent messages and summarizes older ones
 * This is a lightweight approach that doesn't require additional API calls
 */
export function summarizeOldMessages(messages, model, keepRecent = 10) {
  if (messages.length <= keepRecent) {
    return messages; // Nothing to summarize
  }

  const tokens = countMessagesTokens(messages);
  const limit = getTokenLimit(model);
  
  // Only summarize if we're over 70% of the limit
  if (tokens < limit * 0.7) {
    return messages;
  }

  // Keep system message + recent messages
  const systemMsg = messages.find(m => m.role === 'system');
  const recentMessages = messages.slice(-keepRecent);
  const oldMessages = messages.filter(m => m.role !== 'system').slice(0, -keepRecent);

  if (oldMessages.length === 0) {
    return messages; // Nothing to summarize
  }

  // Create a summary of old messages
  const summary = createSimpleSummary(oldMessages);
  
  // Reconstruct messages: system + summary + recent
  const newMessages = [];
  if (systemMsg) {
    newMessages.push(systemMsg);
  }
  
  // Add summary as a user message
  newMessages.push({
    role: 'user',
    content: `[Previous conversation summary: ${summary}]`
  });
  
  // Add assistant acknowledgment
  newMessages.push({
    role: 'assistant',
    content: 'I understand. I have context from our previous conversation.'
  });
  
  // Add recent messages
  newMessages.push(...recentMessages);
  
  return newMessages;
}

/**
 * Create a simple summary by extracting key points from messages
 */
function createSimpleSummary(messages) {
  const keyPoints = [];
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      // Extract user requests (first 100 chars)
      const content = msg.content || '';
      if (content.length > 0) {
        keyPoints.push(`User asked: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      }
    } else if (msg.role === 'assistant') {
      // Extract assistant responses (first 100 chars)
      const content = msg.content || '';
      if (content.length > 0 && !content.startsWith('[')) {
        keyPoints.push(`Assistant: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      }
    } else if (msg.role === 'tool') {
      // Just note that tools were used
      keyPoints.push(`Tool executed: ${msg.name || 'unknown'}`);
    }
  }
  
  // Limit to 10 key points
  const limited = keyPoints.slice(0, 10);
  
  if (limited.length === 0) {
    return 'Previous conversation context';
  }
  
  return limited.join('; ');
}

/**
 * Aggressive truncation - just cut off old messages if summary fails
 */
export function truncateMessages(messages, model, keepRecent = 20) {
  const tokens = countMessagesTokens(messages);
  const limit = getTokenLimit(model);
  
  // If we're under 80%, keep everything
  if (tokens < limit * 0.8) {
    return messages;
  }
  
  // Keep system message + recent messages
  const systemMsg = messages.find(m => m.role === 'system');
  const recentMessages = messages.slice(-keepRecent);
  
  const newMessages = [];
  if (systemMsg) {
    newMessages.push(systemMsg);
  }
  newMessages.push(...recentMessages);
  
  return newMessages;
}
