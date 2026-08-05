# Terminal UI Patterns from Qwen Code

Research findings from analyzing Qwen Code's terminal implementation (August 2026).
These patterns can be applied to improve Hex's terminal experience.

---

## 1. UI Framework: React + Ink

**Qwen Code's Approach:**
- Uses React with [Ink](https://github.com/vadimdemedes/ink) for terminal rendering
- Component-based architecture (App.tsx, MainContent.tsx, Composer.tsx, etc.)
- Declarative UI with React hooks for state management
- Virtual DOM diffing for efficient terminal updates

**Key Components:**
- `App.tsx` - Root component with layout switching (screen reader vs default)
- `MainContent.tsx` - Main content area with virtual scrolling
- `Composer.tsx` - Input composition area
- `InputPrompt.tsx` - Text input with syntax highlighting
- `BaseTextInput.tsx` - Reusable text input with readline shortcuts

**How Hex Could Apply This:**
Hex currently uses raw `readline` + `process.stdout.write`. Migrating to Ink would enable:
- Component-based UI (easier to maintain)
- Automatic re-rendering on state changes
- Better cursor management
- Easier to add features like syntax highlighting

**Migration Path:**
1. Start with Ink for the input prompt only
2. Gradually migrate output formatting to Ink components
3. Keep readline as fallback for non-interactive mode

---

## 2. Virtual Scrolling for Large Histories

**Qwen Code's Approach:**
- Uses `ScrollableList` component for virtualized rendering
- Only renders visible items in the viewport
- Tracks scroll position and viewport size
- Falls back to Ink's `<Static>` for completed items (write-once optimization)

**Implementation Details:**
```typescript
// From MainContent.tsx
if (useVirtualScroll) {
  return <ScrollableList items={history} renderItem={VirtualHistoryItem} />;
} else {
  return (
    <>
      <Static>{completedItems.map(item => <HistoryItemDisplay />)}</Static>
      <Box>{pendingItems.map(item => <HistoryItemDisplay />)}</Box>
    </>
  );
}
```

**How Hex Could Apply This:**
- Add virtual scrolling for long conversation histories
- Track viewport size with `process.stdout.rows`
- Only render last N messages, load older ones on scroll
- Use `<Static>` equivalent for completed tool outputs (write once, never re-render)

**Benefits:**
- Prevents memory issues with long conversations
- Faster rendering (only visible items)
- Smoother scrolling experience

---

## 3. Software Cursor Rendering

**Qwen Code's Approach:**
- Custom cursor rendering using Unicode block characters
- Tracks cursor position in visual coordinates (not logical)
- Handles multi-line input with proper cursor positioning
- Uses `useCursor()` hook from Ink for physical cursor positioning (for IME support)

**Implementation Details:**
```typescript
// From BaseTextInput.tsx
function defaultRenderLine({ lineText, isOnCursorLine, cursorCol, showCursor }) {
  if (!isOnCursorLine || !showCursor) return <Text>{lineText}</Text>;
  
  const before = cpSlice(lineText, 0, cursorCol);
  const cursorChar = cpSlice(lineText, cursorCol, cursorCol + 1);
  const after = cpSlice(lineText, cursorCol + 1);
  
  return (
    <Text>
      {before}
      {renderSoftwareCursor(cursorChar)}  // Inverted block character
      {after}
    </Text>
  );
}
```

**How Hex Could Apply This:**
- Replace terminal's native cursor with software cursor
- Better control over cursor appearance (color, shape)
- Easier to implement features like vim mode visual indicators
- Works better with complex terminal layouts

---

## 4. Syntax Highlighting in Input

**Qwen Code's Approach:**
- Real-time syntax highlighting as user types
- Detects slash commands, file paths, @mentions
- Uses `parseInputForHighlighting()` to tokenize input
- Applies theme colors to different token types

**Implementation Details:**
```typescript
// From InputPrompt.tsx
function renderLineWithHighlighting({ lineText, buffer }) {
  const tokens = parseInputForHighlighting(lineText);
  return tokens.map(token => {
    const color = getTokenColor(token.type);  // command, file, mention, text
    return <Text color={color}>{token.text}</Text>;
  });
}
```

**How Hex Could Apply This:**
- Highlight slash commands (/help, /skills, etc.) in different color
- Highlight file paths when user types @path/to/file
- Highlight tool names when user mentions them
- Highlight variables in skill commands (/skill web-recon target=192.168.1.1)

**Benefits:**
- Visual feedback as user types
- Reduces errors (typos in commands visible immediately)
- Better UX for complex commands

---

## 5. Ghost Text Suggestions (Inline Autocomplete)

**Qwen Code's Approach:**
- Shows autocomplete suggestions as ghost text inline
- First character highlighted as cursor, rest dimmed
- Tab or Right Arrow accepts suggestion
- Suggestions come from: slash commands, file paths, history, AI predictions

**Implementation Details:**
```typescript
// From InputPrompt.tsx
if (cursorAtEnd && ghostText) {
  return (
    <Text>
      {inputText}
      <Text color={theme.text.accent}>{ghostText[0]}</Text>  // Highlighted first char
      <Text color={theme.text.secondary}>{ghostText.slice(1)}</Text>  // Dimmed rest
    </Text>
  );
}
```

**How Hex Could Apply This:**
- Show ghost text for slash commands as user types /
- Show file path completions when user types @
- Show tool name completions
- Show skill name completions
- AI-powered next command predictions (like "you might want to run nmap next")

**Benefits:**
- Faster command entry
- Reduces typos
- Helps users discover features

---

## 6. Smart Paste Handling

**Qwen Code's Approach:**
- Detects large pastes (>1000 chars or >10 lines)
- Replaces with placeholder `[Pasted Content N chars]` to prevent UI lag
- Detects image pastes (from clipboard or terminal file drops)
- Converts images to attachments
- Expands placeholders on submission

**Implementation Details:**
```typescript
// From InputPrompt.tsx
function handleInput(key) {
  if (isPaste && (text.length > 1000 || lines > 10)) {
    setPendingPastePlaceholder(`[Pasted Content ${text.length} chars]`);
    return;
  }
  
  if (clipboardHasImage || isFilePath(key.sequence)) {
    const attachment = await convertToAttachment(key.sequence);
    setAttachments([...attachments, attachment]);
    return;
  }
}

function handleSubmit() {
  const expandedText = expandPendingPastePlaceholders(inputText);
  onSubmit(expandedText);
}
```

**How Hex Could Apply This:**
- Detect large pastes (e.g., nmap output, logs)
- Show placeholder while typing, expand on submit
- Detect image pastes (screenshots of vulnerabilities)
- Convert pasted IPs/domains to targets automatically

**Benefits:**
- Prevents UI lag from large pastes
- Better handling of rich content
- Smoother user experience

---

## 7. Vim Mode Support

**Qwen Code's Approach:**
- Full vim keybindings (normal, insert, visual modes)
- Mode indicator in prompt ("NORMAL" or "INSERT")
- Vim-style cursor (block in normal, line in insert)
- All vim commands: h/j/k/l, w/b, 0/$, dd, yy, p, etc.

**Implementation Details:**
```typescript
// From Composer.tsx
const { vimMode, vimHandleInput } = useVimModeState();

if (vimMode.enabled) {
  const placeholder = vimMode.mode === 'normal' 
    ? "NORMAL mode (press 'i' to insert)"
    : "INSERT mode (press Esc for normal)";
  
  return <InputPrompt vimHandleInput={vimHandleInput} placeholder={placeholder} />;
}
```

**How Hex Could Apply This:**
- Add vim mode for power users
- Toggle with `/vim` command
- Show mode indicator in prompt
- Support vim navigation in multi-line input
- Support vim editing commands (dd, yy, p, etc.)

**Benefits:**
- Power users love vim
- Faster editing of long commands
- Familiar to developers

---

## 8. Centralized Key Binding System

**Qwen Code's Approach:**
- `keyMatchers.ts` defines all key bindings in one place
- Uses `Command` enum for all actions (SUBMIT, ESCAPE, HOME, END, etc.)
- `KeyBinding` type supports modifiers (ctrl, shift, alt, meta)
- Easy to customize key bindings via config

**Implementation Details:**
```typescript
// From keyMatchers.ts
enum Command {
  SUBMIT,
  ESCAPE,
  HOME,
  END,
  KILL_LINE_RIGHT,
  KILL_LINE_LEFT,
  DELETE_WORD_BACKWARD,
  OPEN_EXTERNAL_EDITOR,
  // ...
}

const defaultKeyBindings: KeyBindingConfig = {
  [Command.SUBMIT]: [{ key: 'return' }],
  [Command.ESCAPE]: [{ key: 'escape' }],
  [Command.HOME]: [{ key: 'a', ctrl: true }],
  [Command.END]: [{ key: 'e', ctrl: true }],
  [Command.KILL_LINE_RIGHT]: [{ key: 'k', ctrl: true }],
  [Command.KILL_LINE_LEFT]: [{ key: 'u', ctrl: true }],
  [Command.DELETE_WORD_BACKWARD]: [{ key: 'w', ctrl: true }, { key: 'backspace', alt: true }],
  [Command.OPEN_EXTERNAL_EDITOR]: [{ key: 'e', ctrl: true, ctrl: true }],  // Ctrl+X Ctrl+E
};

export const keyMatchers = createKeyMatchers(defaultKeyBindings);
```

**How Hex Could Apply This:**
- Create `cli/keyBindings.js` with all key bindings
- Use Command enum for all actions
- Allow users to customize key bindings in config
- Document all key bindings in `/help`

**Benefits:**
- Easier to maintain (all bindings in one place)
- User-customizable
- Consistent key handling across the app

---

## 9. Semantic Color Theme System

**Qwen Code's Approach:**
- `semantic-colors.ts` defines semantic color categories (text, background, border, ui, status)
- `themeManager` resolves colors at runtime (supports multiple themes)
- `Theme` class defines color palettes (default dark, light, etc.)
- Colors are accessed via `theme.text.primary`, `theme.status.success`, etc.

**Implementation Details:**
```typescript
// From semantic-colors.ts
export const theme = {
  get text() { return themeManager.getSemanticColors().text; },
  get background() { return themeManager.getSemanticColors().background; },
  get border() { return themeManager.getSemanticColors().border; },
  get ui() { return themeManager.getSemanticColors().ui; },
  get status() { return themeManager.getSemanticColors().status; },
};

// From themes/default.ts
export const DefaultDark = new Theme('dark', {
  text: {
    primary: '#E0E0E0',
    secondary: '#A0A0A0',
    accent: '#00FF41',
  },
  background: '#1E1E1E',
  border: {
    focused: '#00FF41',
    unfocused: '#5C6370',
  },
  status: {
    success: '#98C379',
    error: '#E06C75',
    warning: '#E5C07B',
    info: '#61AFEF',
  },
});
```

**How Hex Could Apply This:**
- Create `cli/themes.js` with semantic color categories
- Support multiple themes (dark, light, high-contrast)
- Allow users to switch themes with `/theme` command
- Use semantic colors consistently (e.g., `theme.status.success` for all success messages)

**Benefits:**
- Consistent color usage
- Easy to add new themes
- User-customizable appearance
- Better accessibility (high-contrast theme)

---

## 10. ANSI Output Rendering

**Qwen Code's Approach:**
- `AnsiOutput.tsx` renders ANSI escape codes from tool output
- Parses ANSI tokens (color, bold, italic, underline, etc.)
- Handles inverse video (swapped fg/bg colors)
- Truncates long output to fit terminal height
- Shows stats bar (lines hidden, memory usage)

**Implementation Details:**
```typescript
// From AnsiOutput.tsx
export const AnsiOutputText: React.FC<AnsiOutputProps> = ({ data, availableTerminalHeight }) => {
  const lastLines = data.slice(-(availableTerminalHeight || 24));
  
  return (
    <MaxSizedBox maxHeight={availableTerminalHeight}>
      {lastLines.map((line, lineIndex) => (
        <Box key={lineIndex}>
          {line.map((token, tokenIndex) => (
            <Text
              key={tokenIndex}
              color={token.inverse ? token.bg : token.fg}
              backgroundColor={token.inverse ? token.fg : token.bg}
              dimColor={token.dim}
              bold={token.bold}
              italic={token.italic}
              underline={token.underline}
            >
              {token.text}
            </Text>
          ))}
        </Box>
      ))}
    </MaxSizedBox>
  );
};
```

**How Hex Could Apply This:**
- Parse ANSI codes from tool output (nmap, sqlmap, etc.)
- Render with proper colors (preserve tool's own color output)
- Truncate long output to fit terminal
- Show "N more lines" indicator
- Add stats bar (lines hidden, output size)

**Benefits:**
- Preserves tool color output (nmap's colored output)
- Better handling of long output
- Cleaner UI with truncation

---

## 11. Streaming State Management

**Qwen Code's Approach:**
- `StreamingContext` provides streaming state to all components
- `StreamingState` enum: `Idle`, `Responding`, `ToolExecution`
- Components react to streaming state changes (show/hide spinners, etc.)
- `useStreamingContext()` hook for accessing state

**Implementation Details:**
```typescript
// From StreamingContext.tsx
export enum StreamingState {
  Idle,
  Responding,
  ToolExecution,
}

export const StreamingContext = React.createContext(StreamingState.Idle);

// From GeminiRespondingSpinner.tsx
export const GeminiRespondingSpinner = () => {
  const streamingState = useStreamingContext();
  
  if (streamingState === StreamingState.Responding) {
    return <Spinner type="dots" />;
  }
  return null;
};
```

**How Hex Could Apply This:**
- Create streaming state context (Idle, Thinking, ToolExecution)
- Show spinners only when state is Thinking or ToolExecution
- Hide spinners when state is Idle
- Use state to control UI updates (only update when streaming)

**Benefits:**
- Cleaner UI (spinners only when needed)
- Better performance (fewer re-renders)
- Easier to reason about UI state

---

## 12. Terminal Buffer Management

**Qwen Code's Approach:**
- Two rendering modes: normal terminal buffer vs virtual terminal buffer
- Virtual buffer uses alternate screen (like vim, less, etc.)
- Enables full-screen UI with scrolling
- Toggle with Ctrl+O

**Implementation Details:**
```typescript
// From MainContent.tsx
const useVirtualScroll = useUIState(state => state.useTerminalBuffer);

if (useVirtualScroll) {
  // Use alternate screen buffer
  process.stdout.write('\x1b[?1049h');  // Enter alternate screen
  return <ScrollableList items={history} />;
} else {
  // Use normal terminal buffer
  return <Static>{history.map(item => <HistoryItemDisplay />)}</Static>;
}

// On exit
process.stdout.write('\x1b[?1049l');  // Exit alternate screen
```

**How Hex Could Apply This:**
- Add `/fullscreen` command to toggle virtual buffer
- Use virtual buffer for long conversations
- Enables proper scrolling (up/down arrows)
- Better for reviewing long output

**Benefits:**
- Full-screen UI when needed
- Proper scrolling support
- Better for long conversations

---

## 13. Mouse Support (Click-to-Position Cursor)

**Qwen Code's Approach:**
- `TextInputMouseController` handles mouse clicks
- Converts mouse coordinates to buffer position
- Moves cursor to clicked position
- Only enabled in virtual buffer mode (alternate screen)

**Implementation Details:**
```typescript
// From TextInputMouseController.tsx
export const TextInputMouseController = ({ buffer, linesRef }) => {
  useEffect(() => {
    const handleMouse = (data) => {
      if (data.button === 'left' && data.action === 'press') {
        const position = convertMouseToPosition(data.x, data.y);
        buffer.moveTo(position.row, position.col);
      }
    };
    
    process.stdin.on('mousepress', handleMouse);
    return () => process.stdin.off('mousepress', handleMouse);
  }, [buffer]);
  
  return null;
};
```

**How Hex Could Apply This:**
- Enable mouse support in virtual buffer mode
- Click to position cursor in multi-line input
- Click to select text (copy/paste)
- Click on links to open them

**Benefits:**
- More intuitive cursor positioning
- Easier to edit multi-line input
- Better for power users

---

## 14. Multi-line Input with Readline Shortcuts

**Qwen Code's Approach:**
- Full readline shortcuts: Ctrl+A/E/K/U/W, Alt+Backspace, etc.
- Multi-line input with Shift+Enter or Ctrl+J
- Visual line wrapping with proper cursor movement
- History navigation with Up/Down arrows

**Implementation Details:**
```typescript
// From BaseTextInput.tsx
const handleKey = (key) => {
  // Ctrl+A → home
  if (key.ctrl && key.name === 'a') {
    buffer.move('home');
    return;
  }
  
  // Ctrl+E → end
  if (key.ctrl && key.name === 'e') {
    buffer.move('end');
    return;
  }
  
  // Ctrl+K → kill to end of line
  if (key.ctrl && key.name === 'k') {
    buffer.killLineRight();
    return;
  }
  
  // Ctrl+U → kill to start of line
  if (key.ctrl && key.name === 'u') {
    buffer.killLineLeft();
    return;
  }
  
  // Ctrl+W → delete word backward
  if (key.ctrl && key.name === 'w') {
    buffer.deleteWordLeft();
    return;
  }
  
  // Shift+Enter → newline
  if (key.shift && key.name === 'return') {
    buffer.newline();
    return;
  }
};
```

**How Hex Could Apply This:**
- Add all readline shortcuts to input
- Support multi-line input (Shift+Enter for newline)
- Visual line wrapping with proper cursor movement
- History navigation with Up/Down

**Benefits:**
- Familiar to Unix users
- Faster editing
- Better for complex commands

---

## 15. Reverse Search (Ctrl+R)

**Qwen Code's Approach:**
- Ctrl+R toggles reverse search mode
- Searches command history as user types
- Shows matching command inline
- Enter accepts match, Esc cancels
- Supports both chat history and shell history

**Implementation Details:**
```typescript
// From InputPrompt.tsx
const [reverseSearchActive, setReverseSearchActive] = useState(false);
const [searchQuery, setSearchQuery] = useState('');

if (key.ctrl && key.name === 'r') {
  setReverseSearchActive(true);
  return;
}

if (reverseSearchActive) {
  const match = searchHistory(searchQuery);
  if (match) {
    // Show match inline
    return <Text>(reverse-i-search)`{searchQuery}': {match}</Text>;
  }
}

if (key.name === 'return' && reverseSearchActive) {
  buffer.setText(match);
  setReverseSearchActive(false);
  return;
}
```

**How Hex Could Apply This:**
- Add Ctrl+R for reverse search
- Search conversation history
- Search command history (/help, /skills, etc.)
- Search tool output history

**Benefits:**
- Quick access to previous commands
- Familiar to Unix users
- Faster workflow

---

## 16. External Editor Integration

**Qwen Code's Approach:**
- Ctrl+X Ctrl+E opens input in external editor
- Uses $EDITOR environment variable (defaults to vim)
- Waits for editor to close
- Loads edited content back into input

**Implementation Details:**
```typescript
// From BaseTextInput.tsx
if (key.ctrl && key.name === 'x' && nextKey.ctrl && nextKey.name === 'e') {
  const editor = process.env.EDITOR || 'vim';
  const tempFile = '/tmp/hex-input.txt';
  
  // Write current input to temp file
  fs.writeFileSync(tempFile, buffer.text);
  
  // Open editor
  spawn.sync(editor, [tempFile], { stdio: 'inherit' });
  
  // Load edited content
  const edited = fs.readFileSync(tempFile, 'utf-8');
  buffer.setText(edited);
  
  return;
}
```

**How Hex Could Apply This:**
- Add Ctrl+X Ctrl+E to open in external editor
- Use $EDITOR or default to vim/nano
- Useful for long multi-line commands
- Useful for editing skill definitions

**Benefits:**
- Better for long commands
- Familiar to Unix users
- Full editor features (syntax highlighting, etc.)

---

## 17. Backpressure Handling for PTY I/O

**Qwen Code's Approach:**
- `terminal-bridge.ts` manages bidirectional PTY I/O
- Handles backpressure (when stdout buffer is full)
- Pauses PTY when stdout can't accept more data
- Resumes when stdout drains

**Implementation Details:**
```typescript
// From terminal-bridge.ts
async function writeWithBackpressure(data) {
  if (!stdout.write(data)) {
    // stdout buffer full, pause PTY
    pty.pause();
    
    // Wait for drain
    await new Promise(resolve => {
      stdout.once('drain', resolve);
    });
    
    // Resume PTY
    pty.resume();
  }
}
```

**How Hex Could Apply This:**
- Add backpressure handling for Docker PTY
- Prevent memory issues with large tool output
- Pause tool when output is too fast
- Resume when output is consumed

**Benefits:**
- Prevents memory issues
- Smoother output streaming
- Better for long-running tools

---

## 18. Tmux Detection and Special Handling

**Qwen Code's Approach:**
- Detects if running inside tmux via `process.env.TMUX`
- Uses simpler spinner animation in tmux (standard spinners don't work well)
- Adjusts rendering for tmux's limitations

**Implementation Details:**
```typescript
// From GeminiRespondingSpinner.tsx
const isTmux = Boolean(process.env.TMUX);

if (isTmux) {
  // Use simple 2-frame animation
  const [frameIndex, setFrameIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % 2);
    }, 750);
    return () => clearInterval(interval);
  }, []);
  
  return <Text>{['. ', '..'][frameIndex]}</Text>;
} else {
  // Use full ink-spinner
  return <Spinner type="dots" />;
}
```

**How Hex Could Apply This:**
- Detect tmux environment
- Use simpler animations in tmux
- Adjust colors for tmux (some colors don't render correctly)
- Document tmux limitations

**Benefits:**
- Better experience in tmux
- Prevents rendering issues
- Smoother animations

---

## 19. Screen Reader Support (Accessibility)

**Qwen Code's Approach:**
- Detects screen reader via `useIsScreenReaderEnabled()`
- Renders accessible text instead of visual animations
- Uses ARIA labels for interactive elements
- Provides text alternatives for visual elements

**Implementation Details:**
```typescript
// From GeminiRespondingSpinner.tsx
const isScreenReaderEnabled = useIsScreenReaderEnabled();

if (isScreenReaderEnabled) {
  return <Text>Loading...</Text>;  // Accessible text
} else {
  return <Spinner type="dots" />;  // Visual animation
}
```

**How Hex Could Apply This:**
- Detect screen reader
- Provide text alternatives for animations
- Add ARIA labels to interactive elements
- Document accessibility features

**Benefits:**
- Better accessibility
- Compliance with accessibility standards
- Wider user base

---

## 20. Progressive Replay for Large Histories

**Qwen Code's Approach:**
- Renders large histories in chunks (progressive replay)
- Prevents UI blocking during initial mount
- Uses `replayCount` state to track progress
- Renders N items at a time with setTimeout

**Implementation Details:**
```typescript
// From MainContent.tsx
const [replayCount, setReplayCount] = useState(0);
const CHUNK_SIZE = 50;

useEffect(() => {
  if (replayCount < history.length) {
    setTimeout(() => {
      setReplayCount(replayCount + CHUNK_SIZE);
    }, 0);
  }
}, [replayCount, history.length]);

const visibleItems = history.slice(0, replayCount);
return visibleItems.map(item => <HistoryItemDisplay />);
```

**How Hex Could Apply This:**
- Render conversation history in chunks
- Prevent UI blocking with long conversations
- Show "Loading older messages..." indicator
- Load more on scroll

**Benefits:**
- Faster initial render
- Smoother UI
- Better for long conversations

---

## Implementation Priority for Hex

### Phase 1: Quick Wins (1-2 weeks)
1. **Centralized key bindings** - Create `cli/keyBindings.js`
2. **Readline shortcuts** - Add Ctrl+A/E/K/U/W to input
3. **Semantic color theme** - Create `cli/themes.js` with categories
4. **Tmux detection** - Adjust animations for tmux

### Phase 2: Input Improvements (2-3 weeks)
5. **Multi-line input** - Support Shift+Enter for newline
6. **Reverse search** - Add Ctrl+R for history search
7. **Ghost text suggestions** - Inline autocomplete for commands
8. **Smart paste handling** - Detect large pastes, show placeholder

### Phase 3: Output Improvements (2-3 weeks)
9. **ANSI output rendering** - Preserve tool color output
10. **Virtual scrolling** - Only render visible history items
11. **Progressive replay** - Render history in chunks
12. **Backpressure handling** - Prevent memory issues with large output

### Phase 4: Advanced Features (3-4 weeks)
13. **Syntax highlighting in input** - Highlight commands, paths, etc.
14. **Vim mode** - Full vim keybindings
15. **External editor integration** - Ctrl+X Ctrl+E
16. **Virtual terminal buffer** - Full-screen mode with scrolling

### Phase 5: Polish (ongoing)
17. **Mouse support** - Click-to-position cursor
18. **Screen reader support** - Accessibility features
19. **Theme customization** - Allow users to switch themes
20. **Key binding customization** - Allow users to customize keys

---

## Conclusion

Qwen Code's terminal implementation is **extremely sophisticated** with 20+ advanced patterns. Hex can learn a lot from their approach, especially:

1. **React + Ink** - Component-based UI is much easier to maintain than raw readline
2. **Virtual scrolling** - Essential for long conversations
3. **Semantic colors** - Consistent theming across the app
4. **Key binding system** - Centralized, customizable key handling
5. **ANSI output rendering** - Preserve tool color output

The migration path is gradual:
- Start with quick wins (key bindings, themes)
- Then input improvements (multi-line, reverse search)
- Then output improvements (virtual scrolling, ANSI rendering)
- Then advanced features (vim mode, syntax highlighting)

Each phase delivers value, so we can ship incrementally.
