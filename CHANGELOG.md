# Changelog

All notable changes to the MarkView (Open-Source Edition) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Initial open-source release
- Core markdown rendering
- Basic UI components

## [1.0.0] - TBD

### Added

- **Core Markdown Rendering**
  - Full GitHub Flavored Markdown (GFM) support
  - Tables, task lists, strikethrough, footnotes
  - Emoji support
  - Superscript, subscript, insert, mark
  - Abbreviations and definition lists
  - Custom containers
  - GitHub-style alerts (Note, Tip, Important, Warning, Caution)

- **Syntax Highlighting**
  - Code block highlighting for 36 programming languages
  - Basic theme (Atom One Light)
  - Copy code button
  - Line numbers

- **Diagrams & Math**
  - Mermaid diagram rendering (flowcharts, sequence, class, etc.)
  - Mermaid download (SVG/PNG)
  - KaTeX math equation rendering (inline and display)

- **UI Components**
  - Light/Dark theme toggle
  - Basic Table of Contents (H1-H2 headings)
  - Scroll to top button
  - Raw markdown view toggle

- **Print**
  - Print optimization

- **Technical Features**
  - Local file support (`file://` protocol)
  - External file support (`http://`, `https://`)
  - Sandbox and CSP detection
  - Privacy-first architecture (all processing local)
  - No analytics or tracking

- **Developer Tools**
  - TypeScript codebase
  - Webpack build system
  - Vitest testing framework
  - ESLint and Prettier
  - Comprehensive documentation

### Documentation

- README with feature comparison
- LICENSE (MIT)
- DEVELOPMENT.md - Development setup and workflow
- CONTRIBUTING.md - Contribution guidelines
- ARCHITECTURE.md - Technical architecture overview

---

## Release Notes Format

Each release will include:

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be-removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

[Unreleased]: https://github.com/markview-app/markview/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/markview-app/markview/releases/tag/v1.0.0
