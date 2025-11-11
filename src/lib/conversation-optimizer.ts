/**
 * Conversation History Optimizer
 * Implements best practices for managing chat context:
 * - Sliding window (limits messages sent to API)
 * - Token estimation (prevents 413 errors)
 * - Message summarization (compresses old context)
 * - Memory optimization
 * 
 * Based on:
 * - Microsoft Semantic Kernel: https://devblogs.microsoft.com/semantic-kernel/managing-chat-history-for-large-language-models-llms/
 * - Chitika RAG Strategies: https://www.chitika.com/strategies-handling-long-chat-rag/
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OptimizationConfig {
  maxMessages?: number;          // Max messages in sliding window (default: 20)
  maxTokens?: number;            // Max estimated tokens (default: 120000)
  summarizeThreshold?: number;   // When to summarize old messages (default: 30)
  keepSystemMessage?: boolean;   // Always keep system prompt (default: true)
}

export class ConversationOptimizer {
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig = {}) {
    this.config = {
      maxMessages: config.maxMessages || 20,
      maxTokens: config.maxTokens || 120000, // DeepSeek context limit
      summarizeThreshold: config.summarizeThreshold || 30,
      keepSystemMessage: config.keepSystemMessage !== false
    };
  }

  /**
   * Estimate tokens in a message (rough approximation)
   * Average: 1 token ≈ 4 characters
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate total tokens in conversation
   */
  getTotalTokens(messages: Message[]): number {
    return messages.reduce((total, msg) => {
      return total + this.estimateTokens(msg.content);
    }, 0);
  }

  /**
   * Optimize conversation history using sliding window
   * Returns: Optimized message array that won't exceed limits
   */
  optimizeHistory(messages: Message[]): Message[] {
    if (messages.length === 0) return [];

    // Separate system message from conversation
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // If total messages under threshold, no optimization needed
    if (conversationMessages.length <= this.config.maxMessages!) {
      return messages;
    }

    // SLIDING WINDOW: Keep only recent messages
    const recentMessages = conversationMessages.slice(-this.config.maxMessages!);

    // Check if we need to summarize
    const shouldSummarize = conversationMessages.length > this.config.summarizeThreshold!;
    
    if (shouldSummarize && conversationMessages.length > this.config.maxMessages!) {
      // Get old messages that will be dropped
      const oldMessages = conversationMessages.slice(0, -(this.config.maxMessages! - 1));
      
      // Create summary of old context
      const summary = this.summarizeMessages(oldMessages);
      
      // Build optimized history: [system, summary, recent messages]
      return [
        ...systemMessages,
        {
          role: 'assistant' as const,
          content: `[Previous conversation summary: ${summary}]`
        },
        ...recentMessages
      ];
    }

    // Return system message + recent messages
    return [
      ...systemMessages,
      ...recentMessages
    ];
  }

  /**
   * Summarize old messages (simple extraction of key points)
   * In production, you'd use an LLM for better summarization
   */
  private summarizeMessages(messages: Message[]): string {
    // Count message types
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;

    // Extract key topics (simple keyword extraction)
    const allContent = messages.map(m => m.content).join(' ');
    const keywords = this.extractKeywords(allContent);

    return `User asked ${userMessages} questions about: ${keywords.join(', ')}. Assistant provided ${assistantMessages} detailed responses.`;
  }

  /**
   * Simple keyword extraction (for summarization)
   */
  private extractKeywords(text: string): string[] {
    // Common security/pentesting terms
    const securityTerms = [
      'nmap', 'scan', 'vulnerability', 'exploit', 'sqlmap', 'xss', 
      'injection', 'port', 'security', 'penetration', 'test',
      'metasploit', 'hydra', 'burp', 'gobuster', 'nikto'
    ];

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const term of securityTerms) {
      if (lowerText.includes(term) && !found.includes(term)) {
        found.push(term);
        if (found.length >= 5) break; // Limit to 5 keywords
      }
    }

    return found.length > 0 ? found : ['security topics'];
  }

  /**
   * Check if adding a new message would exceed limits
   */
  wouldExceedLimits(currentMessages: Message[], newMessage: string): boolean {
    const testMessages = [...currentMessages, { role: 'user' as const, content: newMessage }];
    const totalTokens = this.getTotalTokens(testMessages);
    
    return totalTokens > this.config.maxTokens! || 
           testMessages.length > this.config.maxMessages!;
  }

  /**
   * Get optimization statistics
   */
  getStats(messages: Message[]): {
    totalMessages: number;
    estimatedTokens: number;
    percentOfLimit: number;
    shouldOptimize: boolean;
  } {
    const totalTokens = this.getTotalTokens(messages);
    
    return {
      totalMessages: messages.length,
      estimatedTokens: totalTokens,
      percentOfLimit: (totalTokens / this.config.maxTokens!) * 100,
      shouldOptimize: messages.length > this.config.maxMessages!
    };
  }

  /**
   * Prune messages to fit within token budget
   * More aggressive than sliding window - removes oldest until it fits
   */
  pruneToFit(messages: Message[], maxTokens: number = this.config.maxTokens!): Message[] {
    if (this.getTotalTokens(messages) <= maxTokens) {
      return messages;
    }

    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Remove oldest messages until we fit
    let pruned = [...conversationMessages];
    while (this.getTotalTokens([...systemMessages, ...pruned]) > maxTokens && pruned.length > 5) {
      pruned.shift(); // Remove oldest message
    }

    return [...systemMessages, ...pruned];
  }
}

/**
 * Singleton instance for global use
 */
export const conversationOptimizer = new ConversationOptimizer({
  maxMessages: 20,        // Send max 20 messages to API
  maxTokens: 120000,      // DeepSeek limit
  summarizeThreshold: 30, // Summarize when > 30 messages
  keepSystemMessage: true
});













