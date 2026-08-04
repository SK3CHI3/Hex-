import chalk from 'chalk';

const MAX_OUTPUT_LINES = 15;
const MAX_OUTPUT_CHARS = 2000;

export class OutputFormatter {
  constructor() {
    this.collapsedOutputs = new Map();
    this.expandedOutputs = new Set();
  }

  /**
   * Format tool output with expand/collapse capability
   */
  formatToolOutput(toolName, output, toolCallId = null) {
    if (!output) return chalk.dim('  [No output]');

    const lines = output.split('\n');
    const isLong = lines.length > MAX_OUTPUT_LINES || output.length > MAX_OUTPUT_CHARS;
    
    if (!isLong || (toolCallId && this.expandedOutputs.has(toolCallId))) {
      // Show full output
      return this.formatFullOutput(toolName, output);
    }

    // Show collapsed output
    const key = toolCallId || `tool_${Date.now()}`;
    this.collapsedOutputs.set(key, output);

    const preview = lines.slice(0, MAX_OUTPUT_LINES).join('\n');
    const remaining = lines.length - MAX_OUTPUT_LINES;
    
    let formatted = chalk.dim(`\n  ⚡ ${toolName} output:\n`);
    formatted += this.indentOutput(preview);
    formatted += chalk.dim(`\n  ... ${remaining} more lines`);
    formatted += chalk.cyan(` [Press 'e' to expand]`);
    
    return formatted;
  }

  /**
   * Format thinking content with expand/collapse
   */
  formatThinkingContent(content, isExpanded = false) {
    if (!content) return '';

    const lines = content.split('\n');
    const isLong = lines.length > 10 || content.length > 1000;

    if (!isLong || isExpanded) {
      let formatted = chalk.dim('\n  💭 Thinking:\n');
      formatted += this.indentOutput(content);
      return formatted;
    }

    // Show collapsed thinking
    const preview = lines.slice(0, 5).join('\n');
    const remaining = lines.length - 5;

    let formatted = chalk.dim('\n  💭 Thinking');
    formatted += chalk.dim(` (${content.length} chars)`);
    formatted += chalk.cyan(` [Press 't' to expand]`);
    formatted += '\n';
    formatted += this.indentOutput(preview);
    if (remaining > 0) {
      formatted += chalk.dim(`\n  ... ${remaining} more lines`);
    }

    return formatted;
  }

  /**
   * Format AI response with optional truncation
   */
  formatAIResponse(content, maxLines = 50) {
    if (!content) return '';

    const lines = content.split('\n');
    
    if (lines.length <= maxLines) {
      return content;
    }

    // Show truncated response
    const preview = lines.slice(0, maxLines).join('\n');
    const remaining = lines.length - maxLines;

    let formatted = preview;
    formatted += chalk.dim(`\n\n  ... ${remaining} more lines`);
    formatted += chalk.cyan(` [Response truncated]`);

    return formatted;
  }

  /**
   * Format error output
   */
  formatError(error) {
    if (!error) return '';

    const message = typeof error === 'string' ? error : error.message || String(error);
    return chalk.red(`\n  ✗ Error: ${message}`);
  }

  /**
   * Format success message
   */
  formatSuccess(message) {
    return chalk.green(`\n  ✓ ${message}`);
  }

  /**
   * Format warning message
   */
  formatWarning(message) {
    return chalk.yellow(`\n  ⚠ ${message}`);
  }

  /**
   * Format info message
   */
  formatInfo(message) {
    return chalk.cyan(`\n  ℹ ${message}`);
  }

  /**
   * Indent output for better readability
   */
  indentOutput(text, indent = '    ') {
    return text.split('\n').map(line => indent + line).join('\n');
  }

  /**
   * Format full output without truncation
   */
  formatFullOutput(toolName, output) {
    let formatted = chalk.dim(`\n  ⚡ ${toolName} output:\n`);
    formatted += this.indentOutput(output);
    return formatted;
  }

  /**
   * Toggle expanded state for a tool output
   */
  toggleExpanded(toolCallId) {
    if (this.expandedOutputs.has(toolCallId)) {
      this.expandedOutputs.delete(toolCallId);
      return false;
    } else {
      this.expandedOutputs.add(toolCallId);
      return true;
    }
  }

  /**
   * Check if a tool output is expanded
   */
  isExpanded(toolCallId) {
    return this.expandedOutputs.has(toolCallId);
  }

  /**
   * Get full output for a collapsed tool
   */
  getFullOutput(key) {
    return this.collapsedOutputs.get(key);
  }

  /**
   * Clear all cached outputs
   */
  clear() {
    this.collapsedOutputs.clear();
    this.expandedOutputs.clear();
  }
}

// Global formatter instance
export const formatter = new OutputFormatter();
