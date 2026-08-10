# Changelog

All notable changes to Hex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.13] - 2026-08-13

### Added
- **install_tool function** — AI can automatically install missing tools via apt, pip, npm, go, or git
- **Automatic tool installation** — When a tool is not found, Hex installs it on-the-fly
- **Skills system** — Create reusable multi-step attack workflows with `/skill` command
- **skill_manage tool** — AI can create, delete, and list skills programmatically
- **Built-in skills** — web-recon, network-scan, password-audit, vuln-scan
- **/clear-memory command** — Tell AI to forget previous context from prior conversations

### Changed
- **System prompt rewrite** — Cleaner, more effective prompt for uncensored models
- **Tool documentation** — System prompt now only lists 17 tools that actually exist
- **Built-in skills** — Fixed to use real tool names (removed non-existent subfinder_enum, httpx_probe, nuclei_scan)

### Fixed
- **Stale vim mode references** — Removed from /help and accessibility.js
- **Ghost text autocomplete** — Added /clear-memory to command list
- **Keyboard shortcuts documentation** — Updated to reflect actual shortcuts

## [2.5.12] - 2026-08-13

### Fixed
- **System prompt inconsistencies** — Removed 12 non-existent tools from prompt
- **Built-in skills** — Fixed tool references to match actual tool definitions
- **Tool name mismatches** — Corrected hydra_brute → hydra_attack, hash_crack → hashcat_crack

## [2.5.11] - 2026-08-13

### Added
- **Fixed input at bottom** — Input box stays at terminal bottom while content scrolls
- **Virtual scrolling** — MessageHistory only renders visible messages for performance
- **Scroll indicator** — Shows "↑ N more messages above" when content is hidden
- **Terminal resize handling** — App tracks terminal height and adjusts layout

### Changed
- **App layout** — Banner and messages scroll, input stays fixed
- **MessageHistory** — Implements virtual scrolling with maxHeight calculation

## [2.5.10] - 2026-08-13

### Changed
- **System prompt** — Complete rewrite for clarity and effectiveness with uncensored models
- **Removed jailbreak language** — Cleaner prompt without excessive "override" language
- **Tool documentation** — Comprehensive list of all 17 available tools with parameters
- **Agentic behavior** — Clear examples of tool chaining and autonomous execution
- **Skills system docs** — Better documentation for skill creation in system prompt

## [2.5.9] - 2026-08-13

### Fixed
- **Vim mode removed** — Ctrl+V no longer toggles vim mode (conflicted with Windows paste)
- **Paste handling** — Pasting now works smoothly without triggering mode changes
- **Screen refresh optimization** — Removed useEffect hooks that ran on every keystroke
- **Rendering performance** — Reduced re-renders from 3 to 1 per keystroke

### Changed
- **Input handler** — Ghost text calculation moved directly into input handler
- **inputRef updates** — Synchronous updates instead of via useEffect

## [2.5.8] - 2026-08-13

### Added
- **/clear-memory command** — Injects system message telling AI to forget previous context
- **Error handling improvements** — Comprehensive error handling across the codebase

### Fixed
- **Error recovery** — Dismissible error screen instead of app death
- **Summarization crashes** — Try/catch prevents app death if summarization fails
- **Stream interruptions** — Partial content preserved when connection drops
- **Progress saving** — Conversation saved before showing error
- **Network detection** — Checks connectivity before retrying (avoids wasting 7 seconds)
- **Error messages** — Better messages for connection failures

## [2.5.7] - 2026-08-13

### Added
- **Skill management tools** — AI can create/delete/list skills via skill_manage tool
- **executeSkill function** — Implements skill execution with variable substitution
- **Skills system documentation** — System prompt teaches AI when and how to create skills

### Changed
- **System prompt** — Added SKILLS SYSTEM section with examples
- **Skill creation** — Users can ask AI to "save this as a skill" or "create a skill for"

## [2.5.6] - 2026-08-13

### Fixed
- **Paste detection** — Multi-char input triggers handlePaste()
- **Cursor position after paste** — Advances by input.length instead of 1
- **Paste cache** — Large pastes stored in pasteCache, expanded on submit
- **Cursor rendering** — Cursor renders at actual position in text (not always at end)

### Changed
- **Input handling** — Detects paste vs typing based on input length
- **Paste handler** — Wired up handlePaste() function that was previously unused

## [2.5.5] - 2026-08-13

### Fixed
- **Cursor position in input box** — Cursor now renders at correct position
- **Cursor rendering logic** — Split text at cursorPosition: before-cursor, cursor-char, after-cursor
- **Visual cursor** — Inverse video character at actual position, not always at end

## [2.5.4] - 2026-08-13

### Added
- **Animated braille spinner** — Cycles through 10 frames during AI thinking and tool execution
- **Processing state** — Spinner animates during slash command execution
- **Dual activity states** — streaming (AI + tools) and processing (slash commands)

### Fixed
- **Static spinner** — Was hardcoded ⠋ character, now animates through frames
- **Spinner timing** — 80ms interval, properly cleaned up on unmount

## [2.5.3] - 2026-08-13

### Changed
- **Version bump** — Minor version update

## [2.5.2] - 2026-08-13

### Fixed
- **Dynamic import paths** — Corrected import paths for modular structure
- **Config bugs** — Fixed configuration loading issues

## [2.5.1] - 2026-08-13

### Fixed
- **Missing messagesRef declaration** — Added missing ref declaration

## [2.5.0] - 2026-08-13

### Added
- **React + Ink migration** — Full migration from raw readline to React + Ink
- **Component-based UI** — App, InputBox, MessageHistory, Banner, ToolOutput components
- **Semantic color themes** — Dark/light themes with consistent color categories
- **Centralized key bindings** — All keyboard shortcuts in keyBindings.js
- **Syntax highlighting** — Color-coded slash commands, file paths, variables
- **Ghost text autocomplete** — Inline suggestions for slash commands
- **Smart paste handling** — Detects large pastes, shows placeholder, expands on submit
- **Reverse search** — Ctrl+R searches command history
- **External editor** — Ctrl+X Ctrl+E opens input in vim/nano/etc.
- **Multi-line input** — Shift+Enter or Ctrl+J for newlines
- **Tool output ANSI support** — Preserves tool color output
- **Thinking models support** — Collapsible display for AI reasoning
- **Token management** — Automatic summarization when approaching token limit
- **Agentic loop** — Up to 100 rounds of tool execution
- **Web search** — DuckDuckGo integration with caching
- **14 AI providers** — 9 cloud + 5 local providers
- **Skills system** — Reusable multi-step attack workflows
- **Conversation storage** — JSON-based persistence in ~/.hex/

### Changed
- **Project structure** — Reorganized into cli/core, cli/ai, cli/tools, cli/storage, cli/ui, cli/utils
- **Architecture** — Component-based React + Ink architecture
- **UI rendering** — React + Ink instead of raw readline + chalk

## [2.4.0] - 2024-01-16

### Added
- **Web search caching** - 600x faster repeated queries (1-hour TTL, 100 entry limit)
- **Search timeout protection** - Automatic 10-second timeout prevents hanging
- **Enhanced terminal formatting** - Colored output with ANSI codes for better readability
- **Result filtering** - Filter search results by domain and snippet length
- **Page content fetcher** - Fetch full article text beyond snippets
- **Search history tracking** - Automatic tracking of last 50 searches
- **Vim mode improvements** - Proper `dd` command implementation
- **CHANGELOG.md** - Standard changelog for version tracking
- **.nvmrc** - Node version specification for consistent development

### Changed
- **Project reorganization** - Restructured `cli/` into logical folders (core, tools, ai, storage, ui, utils)
- **Documentation structure** - Moved development docs to `docs/dev/`
- **Error messages** - More helpful and actionable error descriptions
- **Package.json** - Added repository, bugs, and homepage fields

### Fixed
- **Input cursor positioning** - Cursor now appears at start of placeholder, not after it
- **Vim delete line** - `dd` command now requires double `d` press as in real Vim
- **Paste handler** - Consistent return type (always returns object)
- **External editor** - Fixed key binding to use Ctrl+X then Ctrl+E
- **Tool output expand** - Added working toggle functionality for long outputs
- **Theme consistency** - Blue thinking indicator across both dark and light themes
- **Message state** - Fixed race condition in conversation state management
- **Unused imports** - Cleaned up 11 unused imports in index.js
- **ANSI parsing** - Improved handling of cursor movement and non-color sequences

## [2.3.1] - 2024-01-15

### Added
- Multi-provider AI support (OpenAI, Anthropic, Google, Ollama, etc.)
- 42+ pentesting tools
- Docker isolation option
- Terminal UI with React/Ink
- Conversation storage
- Skills system

### Changed
- Improved setup wizard
- Better token management

### Fixed
- Various stability improvements

## [2.3.0] - 2024-01-10

### Added
- Initial public release
- Core pentesting toolkit
- AI-powered command interface

---

## Release Process

1. Update CHANGELOG.md with new version
2. Update version in package.json
3. Commit: `git commit -am "Release v2.5.13"`
4. Tag: `git tag v2.5.13`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`

## Versioning Strategy

- **MAJOR**: Breaking changes (API changes, removed features)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (no new features)
