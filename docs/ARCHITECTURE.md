# Architecture Overview

This document provides a high-level overview of the MarkView architecture.

---

## Design Philosophy

### Core Principles

1. **Pure TypeScript** - No UI frameworks (React, Vue, Angular)
2. **Lightweight** - Minimal dependencies, small bundle size
3. **Privacy-First** - All processing happens locally
4. **Open & Transparent** - Auditable codebase
5. **Standards-Compliant** - Chrome Extension Manifest V3

---

## Architecture Diagram

```bash
┌─────────────────────────────────────────────────────────┐
│                   Browser (Chrome/Edge)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Content Script (main.ts)                 │   │
│  │  - Detects markdown files                        │   │
│  │  - Initializes extension                         │   │
│  │  - Orchestrates rendering                        │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 │                                       │
│  ┌──────────────▼───────────────────────────────────┐   │
│  │       Core Rendering Engine                      │   │
│  │  ┌─────────────────────────────────────────┐     │   │
│  │  │  Markdown Parser (markdown-it)          │     │   │
│  │  │  - Plugin system                        │     │   │
│  │  │  - GFM support                          │     │   │
│  │  └─────────────────────────────────────────┘     │   │
│  │  ┌─────────────────────────────────────────┐     │   │
│  │  │  Document Renderer                      │     │   │
│  │  │  - HTML generation                      │     │   │
│  │  │  - Content injection                    │     │   │
│  │  └─────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          UI Components                           │   │
│  │  - Theme Toggle                                  │   │
│  │  - Table of Contents (Basic)                     │   │
│  │  - Scroll to Top Button                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Utilities                               │   │
│  │  - DOM Manipulation                              │   │
│  │  - Logger                                        │   │
│  │  - Internationalization                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Core Modules

### 1. Entry Point (`src/main.ts`)

**Responsibilities**:

- Detect markdown files by URL pattern
- Extract raw markdown from `<pre>` tag
- Initialize extension lifecycle
- Render content

**Flow**:

```typescript
1. URL matches *.md pattern → Content script injected
2. Extract markdown from <pre> element
3. Initialize lifecycle (hide original, setup DOM)
4. Parse and render markdown
5. Mount to document
```

### 2. Core Rendering (`src/core/`)

#### `markdown.ts`

- Configures markdown-it parser
- Registers plugins
- Provides rendering function

#### `document-renderer.ts`

- Converts markdown to HTML
- Injects content into DOM
- Manages layout
- Coordinates with UI components

#### `lifecycle.ts`

- Extension initialization
- DOM setup (meta tags, icons)
- State management

#### `plugins/`

Plugin system for extended markdown features:

- Syntax highlighting
- Mermaid diagrams
- KaTeX math
- Tables, task lists, footnotes
- GitHub alerts
- Custom containers

### 3. UI Components (`src/components/`)

#### `theme-toggle.ts`

- Light/Dark theme switcher
- Theme persistence
- CSS class management

#### `toc-sidebar.ts`

- Auto-generated table of contents
- H1-H2 heading extraction
- Smooth scrolling navigation
- Basic styling (not collapsible in open-source)

### 4. Utilities (`src/utils/`)

#### `dom.ts`

- DOM manipulation helpers
- Element creation
- CSS utilities

#### `logger.ts`

- Environment-aware logging
- Disabled in production
- Helpful for debugging

#### `i18n.ts`

- Internationalization support
- Message retrieval (English only in open-source)

---

## Data Flow

### Rendering Pipeline

```bash
Raw Markdown (from <pre> tag)
         ↓
  Remove Frontmatter
         ↓
  Parse with markdown-it
         ↓
  Apply Plugins (in priority order)
    - Syntax highlighting
    - Mermaid diagrams
    - KaTeX math
    - Tables, footnotes, etc.
         ↓
  Generate HTML
         ↓
  Post-processing
    - Add IDs to headings
    - Enhance links
    - Apply lazy loading
         ↓
  Inject into DOM
         ↓
  Render UI Components
    - Theme toggle
    - TOC sidebar
         ↓
  Apply Theme
         ↓
  Mount to document
```

### Event Flow

```bash
User Action (theme toggle, scroll, etc.)
         ↓
  Component Event Handler
         ↓
  Update State
         ↓
  Re-render Affected Components
         ↓
  Update DOM
```

---

## Plugin System

### Architecture

Plugins extend markdown-it functionality:

```typescript
// Plugin registration
import MarkdownIt from 'markdown-it';
import highlightPlugin from './plugins/highlight';

const md = new MarkdownIt();
md.use(highlightPlugin, options);
```

### Built-in Plugins

1. **Syntax Highlighting** (highlight.js)
2. **Mermaid Diagrams** (mermaid library)
3. **KaTeX Math** (katex library)
4. **Tables** (markdown-it-table)
5. **Task Lists** (markdown-it-task-lists)
6. **Footnotes** (markdown-it-footnote)
7. **GitHub Alerts** (custom plugin)
8. **And more...**

---

## State Management

### Approach

State is **passed as function parameters**, not stored globally:

```typescript
// ✅ Good - Explicit state passing
function render(state: ExtensionState): void {
  updateTOC(state.headings);
  applyTheme(state.theme);
}

// ❌ Avoid - Global state
let globalState = {};
function render(): void {
  updateTOC(globalState.headings);
}
```

### Benefits

- **Type safety** - TypeScript catches issues
- **Clear data flow** - No hidden dependencies
- **Easier testing** - Mock state for tests
- **Predictable** - Same input = same output

---

## Technology Stack

### Core

- **TypeScript 5.0+** - Type-safe development
- **Webpack 5** - Module bundling
- **esbuild-loader** - Fast TypeScript compilation

### Markdown Rendering

- **markdown-it 14.1.0** - Parser with plugins
- **highlight.js 11.6.0** - Syntax highlighting (36 languages)
- **Mermaid 11.4.0** - Diagram rendering
- **KaTeX 0.16.25** - Math equations

### Build Tools

- **pnpm** - Fast package manager
- **Vitest** - Modern test runner
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## Performance Considerations

### Bundle Size

**Open-Source Edition**:

- Core rendering: ~500KB
- Syntax highlighting: ~100KB
- Mermaid: ~1MB
- KaTeX: ~500KB
- **Total**: ~2.1MB minified

**Optimizations**:

- Tree-shaking (remove unused code)
- Minification (production builds)
- Code splitting (async loading)
- No external network requests

### Rendering Performance

- **Lazy rendering** - Only visible content initially
- **Debounced handlers** - Prevent excessive updates
- **Cached results** - Parser caching
- **Progressive enhancement** - Basic content first, enhancements after

---

## Security Model

### Privacy

- ✅ **All processing local** - No external servers
- ✅ **No analytics** - No tracking or telemetry
- ✅ **No network calls** - Except for external images/files user requests
- ✅ **No data collection** - User data never leaves browser

### Content Security

- **Sandboxed execution** - Chrome extension isolation
- **CSP compliance** - Content Security Policy headers
- **XSS prevention** - HTML sanitization for user content
- **Permission model** - Explicit file access permissions

---

## Extension Manifest

### Key Configuration

```json
{
  "manifest_version": 3,
  "name": "MarkView (Open-Source)",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["file:///*", "*://*/*"],
  "content_scripts": [{
    "matches": ["*://*/*.md", "file://*/*.md"],
    "js": ["js/content.js"],
    "css": ["css/content.css"]
  }]
}
```

---

## Testing Strategy

### Unit Tests

- Pure functions in `src/utils/`
- Component methods
- Plugin functionality

### Integration Tests

- End-to-end rendering
- Component interactions
- Event handling

### Coverage Goals

- **80%+ overall** coverage
- **100%** for critical rendering logic
- **Unit tests** for utilities
- **Integration tests** for workflows

---

## Build Pipeline

```bash
Source Code (TypeScript)
         ↓
  ESLint Check
         ↓
  TypeScript Compilation (via esbuild-loader)
         ↓
  Webpack Bundling
    - Module resolution
    - Code splitting
    - Asset processing
         ↓
  Minification (production only)
         ↓
  Output to dist/
    - manifest.json
    - js/content.js
    - css/content.css
    - icons/
```

---

**Last Updated**: January 2026
