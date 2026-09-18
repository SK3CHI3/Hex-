/**
 * Full-height terminal application.
 *
 * The conversation is a bounded viewport; the composer owns a fixed four-row
 * footer, so output can never push it away from the bottom of the terminal.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, useStdout } from 'ink';
import InputBox from './InputBox.js';
import MessageHistory from './MessageHistory.js';
import { useTerminalMouse } from './mouse.js';
import DetailViewer from './DetailViewer.js';

const INPUT_HEIGHT = 4;

const App = ({
  messages = [], onSendMessage, streaming = false, processing = false,
  banner = null, model = '', executionMode = 'Direct', tokenCount = 0,
  showThinking = false, onToggleThinking = () => {},
  agentStatus = { phase: 'idle', toolName: null }, liveResponse = null,
}) => {
  const [showToolOutput, setShowToolOutput] = useState(false);
  const [expandedSections, setExpandedSections] = useState(() => new Set());
  const [detail, setDetail] = useState(null);
  const { stdout } = useStdout();
  const hitTargetsRef = useRef(new Map());
  const [rows, setRows] = useState(Math.max(8, stdout?.rows || 24));

  useEffect(() => {
    if (!stdout) return undefined;
    const onResize = () => setRows(Math.max(8, stdout.rows || 24));
    stdout.on('resize', onResize);
    return () => stdout.off('resize', onResize);
  }, [stdout]);

  // Ink 4 clears the screen when a dynamic frame reaches stdout.rows. Leave
  // one terminal row unused while still keeping the composer screen-anchored.
  const appHeight = Math.max(7, rows - 1);
  const historyHeight = Math.max(3, appHeight - INPUT_HEIGHT);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(current => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const registerHitTarget = useCallback((id, target) => {
    if (target) hitTargetsRef.current.set(id, target);
    else hitTargetsRef.current.delete(id);
  }, []);

  const openDetail = useCallback((nextDetail) => setDetail(nextDetail), []);

  useTerminalMouse(useCallback(({ x, y }) => {
    // Ink's Yoga coordinates are zero-based; SGR mouse rows/columns are one-based.
    for (const target of [...hitTargetsRef.current.values()].reverse()) {
      if (x >= target.x + 1 && x <= target.x + target.width && y >= target.y + 1 && y <= target.y + target.height) {
        target.onClick();
        return;
      }
    }
  }, []));

  return React.createElement(
    Box,
    { flexDirection: 'column', height: appHeight, overflow: 'hidden' },
    React.createElement(
      Box,
      { flexDirection: 'column', height: historyHeight, overflow: 'hidden' },
      detail
        ? React.createElement(DetailViewer, { detail, maxHeight: historyHeight, onClose: () => setDetail(null), onRegisterHitTarget: registerHitTarget })
        : React.createElement(MessageHistory, {
          messages, streaming, processing, showThinking, showToolOutput, expandedSections,
          onToggleSection: toggleSection, onOpenDetail: openDetail, onRegisterHitTarget: registerHitTarget,
          agentStatus, banner, liveResponse, maxHeight: historyHeight,
        })
    ),
    React.createElement(InputBox, {
      key: 'input', onSubmit: onSendMessage, disabled: streaming || processing,
      streaming, model, executionMode, tokenCount, showThinking,
      onToggleThinking, onToggleToolOutput: () => setShowToolOutput(value => !value), agentStatus,
    })
  );
};

export default App;
