# Development Guide

This guide covers building, testing, and contributing to the MarkView open-source edition.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Build System](#build-system)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Architecture Overview](#architecture-overview)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm** 8.0.0 or higher ([Installation](https://pnpm.io/installation))
- **Git** 2.0 or higher

### Verify Installation

```bash
node --version  # Should be v18.0.0 or higher
pnpm --version  # Should be 8.0.0 or higher
git --version   # Should be 2.0 or higher
```

### Installing pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/markview-app/markview.git
cd markview
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages listed in `package.json`.

### 3. Build the Extension

```bash
# Development build (with source maps)
pnpm run dev

# Production build (minified)
pnpm run build
```

The extension will be built to the `dist/` directory.

### 4. Load in Browser

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from the project directory
5. Enable **"Allow access to file URLs"** in extension details

---

## Project Structure

```bash
markview/
├── src/                          # Source code
│   ├── core/                     # Core rendering engine
│   │   ├── markdown.ts          # Markdown-it configuration
│   │   ├── document-renderer.ts # Document rendering logic
│   │   ├── lifecycle.ts         # Extension lifecycle
│   │   └── plugins/             # Markdown-it plugins
│   ├── components/              # UI components
│   │   ├── theme-toggle.ts     # Theme switcher
│   │   └── toc-sidebar.ts      # Table of contents
│   ├── utils/                   # Utility functions
│   │   ├── dom.ts              # DOM manipulation
│   │   ├── logger.ts           # Logging utility
│   │   └── i18n.ts             # Internationalization
│   ├── styles/                  # CSS stylesheets
│   │   ├── main.css            # Main styles
│   │   ├── themes.css          # Theme definitions
│   │   └── syntax-highlighting.css
│   ├── manifest.json            # Extension manifest
│   └── main.ts                  # Entry point
├── build/                       # Build configuration
│   ├── webpack.common.js       # Shared webpack config
│   ├── webpack.dev.js          # Development config
│   └── webpack.prod.js         # Production config
├── docs/                        # Documentation
├── examples/                    # Sample markdown files
├── tests/                       # Unit tests
├── dist/                        # Build output (generated)
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                    # This file
```

---

## Build System

### Available Scripts

```bash
# Development
pnpm run dev              # Build with watch mode (auto-rebuild on changes)
pnpm run dev:clean        # Clean build + watch mode

# Production
pnpm run build            # Production build (minified)
pnpm run build:clean      # Clean + production build

# Utilities
pnpm run clean            # Remove dist/ folder
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix ESLint issues
pnpm run format           # Format code with Prettier
pnpm run format:check     # Check code formatting
pnpm run type-check       # TypeScript type checking

# Testing
pnpm run test             # Run tests with watch mode
pnpm run test:run         # Run tests once
pnpm run test:coverage    # Generate coverage report
pnpm run test:ui          # Open Vitest UI
```

### Build Modes

**Development Mode** (`pnpm run dev`):

- Source maps enabled for debugging
- No minification (faster builds)
- Watch mode for auto-rebuild
- Detailed error messages

**Production Mode** (`pnpm run build`):

- Minified code
- Optimized bundle size
- Source maps disabled
- Ready for distribution

---

## Development Workflow

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Start development server**:

   ```bash
   pnpm run dev
   ```

3. **Make your changes** in `src/`

4. **Test in browser**:
   - Changes auto-rebuild with watch mode
   - Refresh the extension: `chrome://extensions/` → Click reload icon
   - Or use `Ctrl+R` on the markdown page

5. **Lint and format**:

   ```bash
   pnpm run lint:fix
   pnpm run format
   ```

6. **Run tests**:

   ```bash
   pnpm run test
   ```

7. **Commit changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test additions or changes
- `chore:` - Build process or tooling changes

**Examples**:

```bash
git commit -m "feat: add KaTeX math rendering support"
git commit -m "fix: resolve TOC scroll sync issue"
git commit -m "docs: update README with new features"
```

---

## Testing

### Running Tests

```bash
# Watch mode (recommended during development)
pnpm run test

# Single run (for CI)
pnpm run test:run

# Coverage report
pnpm run test:coverage

# Interactive UI
pnpm run test:ui
```

### Writing Tests

We use **Vitest** for testing. Create test files adjacent to source files:

```bash
src/utils/dom.ts
src/utils/dom.test.ts
```

**Example test**:

```typescript
import { describe, it, expect } from 'vitest';
import { stripMarkdownSyntax } from './dom';

describe('stripMarkdownSyntax', () => {
  it('should remove heading markers', () => {
    expect(stripMarkdownSyntax('### Hello World')).toBe('Hello World');
  });

  it('should remove bold syntax', () => {
    expect(stripMarkdownSyntax('**bold text**')).toBe('bold text');
  });
});
```

### Test Coverage

Aim for:

- **80%+ coverage** for core utilities
- **100% coverage** for critical rendering logic
- **Unit tests** for pure functions
- **Integration tests** for component interactions

---

## Code Style

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Enable strict mode** (already configured)
- **Avoid `any` type** - use specific types or `unknown`
- **Use interfaces** for object shapes
- **Export types** from dedicated type files

**Example**:

```typescript
// Good
interface MarkdownOptions {
  theme: 'light' | 'dark';
  plugins: string[];
}

function renderMarkdown(options: MarkdownOptions): string {
  // Implementation
}

// Avoid
function renderMarkdown(options: any): any {
  // Implementation
}
```

### Code Formatting

We use **Prettier** for automatic formatting:

```bash
# Format all files
pnpm run format

# Check formatting
pnpm run format:check
```

**Prettier settings** (`.prettierrc`):

- 2 spaces indentation
- Single quotes
- Semicolons
- 100 character line length

### ESLint Rules

We use **ESLint** for code quality:

```bash
# Check for issues
pnpm run lint

# Auto-fix issues
pnpm run lint:fix
```

**Key rules**:

- No unused variables
- No console.log in production code (use logger utility)
- Prefer `const` over `let`
- Always use `===` instead of `==`

---

## Architecture Overview

### Core Concepts

**1. Pure TypeScript Architecture**

- No UI frameworks (React, Vue, Angular)
- Direct DOM manipulation
- TypeScript classes for components
- Event-driven communication

**2. Modular Design**

- Core rendering engine (`src/core/`)
- Reusable components (`src/components/`)
- Utility functions (`src/utils/`)
- Clear separation of concerns

**3. Plugin System**

- Markdown-it plugins for extended syntax
- Centralized plugin registry
- Priority-based installation

**4. State Management**

- State passed as function parameters (no globals)
- Type-safe state objects
- Explicit data flow

### Key Files

- **`src/main.ts`** - Entry point, initializes extension
- **`src/core/markdown.ts`** - Markdown rendering configuration
- **`src/core/document-renderer.ts`** - Document rendering pipeline
- **`src/manifest.json`** - Extension configuration

For detailed architecture documentation, see the main MarkView repository's [TECH_STACK_AND_ARCHITECTURE.md](https://github.com/markview-app/markview).

---

## Common Tasks

### Adding a New Markdown Plugin

1. Install the plugin:

   ```bash
   pnpm add markdown-it-plugin-name
   ```

2. Add to `src/core/plugins/registry.ts`:

   ```typescript
   import pluginName from 'markdown-it-plugin-name';

   export const PLUGINS = {
     // ... existing plugins
     pluginName: [pluginName /* options */],
   };
   ```

3. Update manifest and rebuild:

   ```bash
   pnpm run build
   ```

### Adding a New Component

1. Create component file:

   ```bash
   touch src/components/my-component.ts
   touch src/styles/my-component.css
   ```

2. Implement component class:

   ```typescript
   export class MyComponent {
     private container: HTMLElement;

     constructor() {
       this.container = this.createContainer();
     }

     private createContainer(): HTMLElement {
       const div = document.createElement('div');
       div.className = 'my-component';
       return div;
     }

     public render(): void {
       document.body.appendChild(this.container);
     }

     public destroy(): void {
       this.container.remove();
     }
   }
   ```

3. Import CSS in `src/main.ts`:

   ```typescript
   import './styles/my-component.css';
   ```

### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update package-name

# Check for outdated packages
pnpm outdated
```

---

## Troubleshooting

### Build Errors

**Error**: `Cannot find module 'xyz'`
**Solution**:

```bash
pnpm install
```

**Error**: TypeScript compilation errors
**Solution**:

```bash
pnpm run type-check
# Fix reported type errors
```

### Extension Not Loading

**Problem**: Extension doesn't appear in browser
**Solution**:

1. Check `dist/` folder exists
2. Ensure `manifest.json` is in `dist/`
3. Check browser console for errors
4. Try rebuilding: `pnpm run build:clean`

### Watch Mode Not Working

**Problem**: Changes don't trigger rebuild
**Solution**:

1. Stop watch mode (`Ctrl+C`)
2. Run `pnpm run clean`
3. Restart: `pnpm run dev`

### Tests Failing

**Problem**: Tests fail after changes
**Solution**:

1. Check test file matches implementation
2. Run `pnpm run test:coverage` to see coverage
3. Clear test cache: `pnpm run test -- --clearCache`

---

## Performance Tips

### Faster Builds

- Use `pnpm run dev` for development (faster than production builds)
- Enable webpack caching (already configured)
- Close unnecessary applications to free up system resources

### Bundle Size Optimization

- Avoid large dependencies
- Use tree-shaking (import only what you need)
- Check bundle analysis: Add `webpack-bundle-analyzer` if needed

---

## Getting Help

### Resources

- **Documentation**: [docs/](./docs/)
- **GitHub Issues**: [Report bugs](https://github.com/markview-app/markview/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/markview-app/support/discussions)

### Before Asking

1. Check existing documentation
2. Search closed GitHub issues
3. Try debugging with browser DevTools (F12)
4. Check browser console for errors

---

**Happy coding! 🚀**

---

**Last Updated**: January 2026
