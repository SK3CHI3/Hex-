/** Bounded transcript viewport for the fixed-composer terminal layout. */
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { getTheme } from './themes.js';
import ToolOutput from './ToolOutput.js';

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const clip = (text, lines = 3) => {
  const chunks = String(text || '').split('\n');
  return chunks.length > lines ? `${chunks.slice(0, lines).join('\n')}\n…` : chunks.join('\n');
};

const formatAgentStatus = ({ phase, toolName, toolIndex, toolTotal, detail } = {}) => {
  if (phase === 'planning') return 'Planning response...';
  if (phase === 'thinking') return 'Reasoning...';
  if (phase === 'running') return `Running${toolTotal ? ` ${toolIndex || 1}/${toolTotal}` : ''}: ${detail || toolName || 'tool'}...`;
  if (phase === 'continuing') return 'Reviewing tool results...';
  return 'Working...';
};

const getPosition = (node) => {
  let x = 0;
  let y = 0;
  let yogaNode = node?.yogaNode;
  while (yogaNode) {
    x += yogaNode.getComputedLeft?.() || 0;
    y += yogaNode.getComputedTop?.() || 0;
    yogaNode = yogaNode.getParent?.();
  }
  return { x, y };
};

const ThinkingCard = ({ id, expanded, onToggle, onOpenDetail, onRegisterHitTarget, text, theme }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const { x, y } = getPosition(ref.current);
    onRegisterHitTarget?.(id, {
      x, y, width: ref.current.yogaNode?.getComputedWidth?.() || 1, height: 1,
      onClick: () => onOpenDetail ? onOpenDetail({ id, title: 'Thinking', content: text }) : onToggle(id),
    });
    return () => onRegisterHitTarget?.(id, null);
  });
  return React.createElement(Box, { ref }, React.createElement(Text, { color: theme.status.thinking },
    `💭 ${expanded ? clip(text, 2) : `${text.split('\n')[0]}…`}  [click to view]`));
};

const renderMessage = (msg, index, theme, showThinking, showToolOutput, expandedSections, onToggleSection, onOpenDetail, onRegisterHitTarget, agentStatus) => {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.role === 'user') {
    return React.createElement(Box, { key: `user-${index}`, flexDirection: 'column', marginTop: 1, paddingX: 1 },
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '❯ '),
      React.createElement(Text, { color: theme.text.accent }, clip(msg.content, 2)));
  }
  if (msg.role === 'assistant') {
    if (msg.isCommandResult) return React.createElement(Box, { key: `command-${index}`, marginTop: 1, paddingX: 1 },
      React.createElement(Text, { color: theme.text.primary }, clip(msg.content, 3)));
    const children = [];
    if (msg.thinking) {
      const thinkingId = `thinking-${index}`;
      children.push(React.createElement(ThinkingCard, {
        key: thinkingId, id: thinkingId, text: msg.thinking, theme,
        expanded: showThinking || expandedSections.has(thinkingId), onToggle: onToggleSection, onOpenDetail, onRegisterHitTarget,
      }));
    }
    if (msg.content) children.push(React.createElement(Text, { key: 'content', color: theme.text.primary }, clip(msg.content, 3)));
    const total = msg.tool_calls?.length || 0;
    const activeToolIndex = agentStatus.phase === 'running'
      ? (msg.tool_calls || []).findIndex(toolCall => toolCall.id === agentStatus.toolCallId)
      : -1;
    if (activeToolIndex >= 0) {
      const toolCall = msg.tool_calls[activeToolIndex];
      const sectionId = `call-${toolCall.id || `${index}-${activeToolIndex}`}`;
      children.push(React.createElement(ToolOutput, {
        key: sectionId, toolName: toolCall.function?.name || 'tool', output: toolCall.function?.arguments || '',
        label: `Running tool ${activeToolIndex + 1}/${total}`, expanded: showToolOutput || expandedSections.has(sectionId), maxLines: 2,
        sectionId, onToggle: onToggleSection, onOpenDetail, onRegisterHitTarget,
      }));
      if (total > 1) children.push(React.createElement(Text, { key: 'queued', color: theme.text.muted }, `  ${total - 1} tool${total === 2 ? '' : 's'} queued`));
    } else if (total > 0) {
      children.push(React.createElement(Text, { key: 'tools-summary', color: theme.text.muted }, `⚡ ${total} tool call${total === 1 ? '' : 's'} ${agentStatus.phase === 'planning' ? 'planned' : 'recorded'}`));
    }
    return React.createElement(Box, { key: `assistant-${index}`, flexDirection: 'column', marginTop: 1, paddingX: 1 }, ...children);
  }
  if (msg.role === 'tool') return React.createElement(Box, { key: `tool-${index}`, paddingX: 1 }, React.createElement(ToolOutput, {
    toolName: msg.name || 'tool', output: msg.content || '', error: msg.isError,
    label: msg.isError ? 'Tool failed' : 'Tool result', expanded: showToolOutput || expandedSections.has(`tool-${msg.tool_call_id || index}`),
    fullOutputId: msg.fullOutputId, maxLines: 3, sectionId: `tool-${msg.tool_call_id || index}`,
    onToggle: onToggleSection, onOpenDetail, onRegisterHitTarget,
  }));
  return null;
};

const MessageHistory = ({ messages = [], streaming = false, processing = false, showThinking = false, showToolOutput = false, expandedSections = new Set(), onToggleSection = () => {}, onOpenDetail = null, onRegisterHitTarget = () => {}, agentStatus = { phase: 'idle' }, banner = null, liveResponse = null, maxHeight = 12 }) => {
  const theme = getTheme();
  const [frame, setFrame] = useState(0);
  const isActive = streaming || processing;
  useEffect(() => {
    if (!isActive) return undefined;
    const id = setInterval(() => setFrame(value => (value + 1) % BRAILLE_FRAMES.length), 80);
    return () => clearInterval(id);
  }, [isActive]);

  // Each compact row is capped to at most a few lines. Reserve room for the
  // live status and select recent messages that fit the viewport budget.
  const reserved = (isActive ? 2 : 0) + (liveResponse?.content ? 3 : 0) + (showThinking && liveResponse?.thinking ? 2 : 0);
  const visibleCount = Math.max(1, Math.floor(Math.max(1, maxHeight - reserved) / 4));
  const visibleMessages = messages.slice(-visibleCount);
  const showBanner = banner && messages.length === 0;

  return React.createElement(Box, { flexDirection: 'column', height: maxHeight, overflow: 'hidden' },
    showBanner && React.createElement(Box, { flexDirection: 'column', overflow: 'hidden' }, banner),
    ...visibleMessages.map((message, index) => renderMessage(message, messages.length - visibleMessages.length + index, theme, showThinking, showToolOutput, expandedSections, onToggleSection, onOpenDetail, onRegisterHitTarget, agentStatus)),
    liveResponse?.content && React.createElement(Text, { color: theme.text.primary }, clip(liveResponse.content, 2)),
    showThinking && liveResponse?.thinking && React.createElement(Text, { color: theme.text.muted }, `💭 ${clip(liveResponse.thinking, 1)}`),
    isActive && React.createElement(Text, { color: theme.status.thinking }, `${BRAILLE_FRAMES[frame]} ${processing && !streaming ? 'Processing command...' : formatAgentStatus(agentStatus)}`)
  );
};

export default MessageHistory;
