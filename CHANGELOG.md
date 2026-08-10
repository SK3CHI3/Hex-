# Changelog

All notable changes to Hex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
3. Commit: `git commit -am "Release v2.4.0"`
4. Tag: `git tag v2.4.0`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`

## Versioning Strategy

- **MAJOR**: Breaking changes (API changes, removed features)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (no new features)
