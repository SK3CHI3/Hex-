/**
 * Minimal SGR mouse support for terminals that opt in (Windows Terminal,
 * iTerm, wezterm, etc.). Ink 4 exposes the raw escape sequence through
 * useInput, so this stays alongside its normal keyboard handling.
 */
import { useEffect, useRef } from 'react';
import { useInput, useStdout } from 'ink';

const SGR_MOUSE = /^\[<(\d+);(\d+);(\d+)([Mm])$/;

export const isMouseSequence = (input = '') => input.startsWith('[<') && /[Mm]$/.test(input);

export const parseMouseClick = (input = '') => {
  const match = input.match(SGR_MOUSE);
  if (!match || match[4] !== 'M') return null;
  const button = Number(match[1]);
  // Button 0 is the primary-button press. Wheel and modifier events are not
  // treated as clicks so they never interfere with normal terminal scrolling.
  if ((button & 0b11) !== 0 || (button & 0b1000000)) return null;
  return { x: Number(match[2]), y: Number(match[3]) };
};

export const useTerminalMouse = (onClick) => {
  const { stdout } = useStdout();
  const callbackRef = useRef(onClick);
  callbackRef.current = onClick;

  useEffect(() => {
    if (!stdout?.isTTY) return undefined;
    // 1000 reports presses; 1006 gives unambiguous SGR coordinates.
    stdout.write('\x1b[?1000h\x1b[?1006h');
    return () => stdout.write('\x1b[?1000l\x1b[?1006l');
  }, [stdout]);

  useInput((input) => {
    const click = parseMouseClick(input);
    if (click) callbackRef.current?.(click);
  });
};
