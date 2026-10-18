# Changelog

All notable changes to MarkView (Open-Source Edition) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The first public version, to be released as 1.0.0.

### Added

- **Rendering**
  - GitHub Flavored Markdown: tables, task lists, strikethrough, footnotes, autolinks
  - GitHub-style alerts (Note, Tip, Important, Warning, Caution)
  - Subscript, superscript, inserted and highlighted text, abbreviations, definition lists, custom containers, emoji
  - Syntax highlighting with the highlight.js common language set, a copy-code button and 14 color themes
  - Mermaid diagrams, with zoom and download
  - KaTeX math, inline and display
- **Reading**
  - Light and dark themes
  - Table of contents for H1–H3 headings, in a resizable sidebar
  - Raw markdown view, print styles, image viewer, font selection
  - Auto-refresh when the file changes
  - Toolbar popup with recent documents and settings
  - Keyboard shortcuts
  - Interface in 12 languages
- **Files**
  - Local (`file://`) and remote (`http://`, `https://`) documents: `.md`, `.markdown`, `.mkd`, `.mdx`
  - Remote plain-text pages that block inline content are detected, and their images are loaded through the
    extension's background worker
  - UTF-8 documents that a server sends as `text/plain` without a charset render correctly. The browser decodes such a
    file with the locale's legacy encoding, which turns emoji into garbled symbols (`ðŸ›‘` for `🛑`); MarkView reverses
    that decode when it can do so losslessly
    ([markview-app/support#59](https://github.com/markview-app/support/issues/59))
- **Project**
  - TypeScript, webpack, Vitest, ESLint and Prettier
  - MIT License

### Security

- HTML embedded in a document can no longer run script; it is sanitized before rendering.

[Unreleased]: https://github.com/markview-app/markview/commits/main
