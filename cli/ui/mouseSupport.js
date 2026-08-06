/**
 * Mouse support for terminal UI
 * Enables click-to-position cursor and text selection
 */

import { useEffect, useRef } from 'react';

// Enable mouse events in terminal
export const enableMouseSupport = () => {
  // Enable mouse tracking (VT100 mode)
  process.stdout.write('\x1b[?1000h'); // Enable mouse click tracking
  process.stdout.write('\x1b[?1002h'); // Enable mouse move tracking
  process.stdout.write('\x1b[?1006h'); // Enable SGR extended mode
};

// Disable mouse events
export const disableMouseSupport = () => {
  process.stdout.write('\x1b[?1006l');
  process.stdout.write('\x1b[?1002l');
  process.stdout.write('\x1b[?1000l');
};

// Parse mouse event from terminal input
export const parseMouseEvent = (data) => {
  // SGR mouse format: \x1b[<button;x;yM or \x1b[<button;x;ym
  const sgrMatch = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
  
  if (sgrMatch) {
    const button = parseInt(sgrMatch[1]);
    const x = parseInt(sgrMatch[2]) - 1; // Convert to 0-indexed
    const y = parseInt(sgrMatch[3]) - 1;
    const action = sgrMatch[4] === 'M' ? 'press' : 'release';
    
    return {
      button: button & 3, // 0=left, 1=middle, 2=right
      action,
      x,
      y,
      shift: Boolean(button & 4),
      meta: Boolean(button & 8),
      ctrl: Boolean(button & 16),
    };
  }
  
  // Normal mouse format: \x1b[Mbutton;x;y
  const normalMatch = data.match(/\x1b\[M(.)(.)(.)/);
  
  if (normalMatch) {
    const button = normalMatch[1].charCodeAt(0) - 32;
    const x = normalMatch[2].charCodeAt(0) - 33;
    const y = normalMatch[3].charCodeAt(0) - 33;
    
    return {
      button: button & 3,
      action: (button & 3) === 3 ? 'release' : 'press',
      x,
      y,
      shift: Boolean(button & 4),
      meta: Boolean(button & 8),
      ctrl: Boolean(button & 16),
    };
  }
  
  return null;
};

// Hook for mouse support
export const useMouseSupport = (enabled = false, onMouseClick) => {
  useEffect(() => {
    if (!enabled) return;
    
    enableMouseSupport();
    
    const handleData = (data) => {
      const event = parseMouseEvent(data.toString());
      if (event && event.action === 'press' && onMouseClick) {
        onMouseClick(event);
      }
    };
    
    process.stdin.on('data', handleData);
    
    return () => {
      process.stdin.off('data', handleData);
      disableMouseSupport();
    };
  }, [enabled, onMouseClick]);
};

// Convert mouse position to buffer position
export const mouseToBufferPosition = (mouseX, mouseY, bufferLayout) => {
  const { x: bufferX, y: bufferY, width, lines } = bufferLayout;
  
  // Check if click is within buffer bounds
  if (mouseX < bufferX || mouseX >= bufferX + width) {
    return null;
  }
  
  const lineIndex = mouseY - bufferY;
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return null;
  }
  
  const column = mouseX - bufferX;
  const line = lines[lineIndex];
  
  // Calculate character position in line
  let charPos = 0;
  let visualCol = 0;
  
  for (let i = 0; i < line.length; i++) {
    if (visualCol >= column) break;
    charPos++;
    visualCol++;
  }
  
  // Calculate absolute position in buffer
  let absolutePos = 0;
  for (let i = 0; i < lineIndex; i++) {
    absolutePos += lines[i].length + 1; // +1 for newline
  }
  absolutePos += charPos;
  
  return { line: lineIndex, column: charPos, absolute: absolutePos };
};
