# Development Guide

How to build, run and test MarkView (Open-Source Edition), and where things live.

## Requirements

- Node.js 20 or later (Vitest 4 and happy-dom require it)
- pnpm 8 or later: `npm install -g pnpm`. The project refuses other package managers (`preinstall` runs
  `only-allow pnpm`).

## Build and load

```bash
git clone https://github.com/markview-app/markview.git
cd markview
pnpm install
pnpm run build
```

`pnpm run build` cleans, copies the version from `package.json` into the manifest, bundles with webpack in production
mode into `extension/`, and zips that folder into `dist/markview-<version>.zip`.

Load `extension/` in the browser:

1. Open `chrome://extensions/` (or `edge://extensions/`) and turn on **Developer mode**
2. Click **Load unpacked** and select the `extension/` folder
3. For local files, open the extension's **Details** and turn on **Allow access to file URLs**

## Day-to-day work

```bash
pnpm run dev          # development build into extension/, rebuilt on every change (inline source maps)
```

After a rebuild, click the reload icon on the extension's card in `chrome://extensions/`, then reload the markdown
tab. The content script is only injected on page load.

| Script                   | Does                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm run dev`           | Development build in watch mode                               |
| `pnpm run dev:clean`     | `clean`, then `dev`                                           |
| `pnpm run build`         | Clean production build into `extension/` and a zip in `dist/` |
| `pnpm run clean`         | Remove `extension/` and `dist/`                               |
| `pnpm run test`          | Vitest in watch mode                                          |
| `pnpm run test:run`      | Vitest, single run (what CI runs)                             |
| `pnpm run test:coverage` | Coverage report (v8) for `src/core` and `src/utils`           |
| `pnpm run test:ui`       | Vitest UI                                                     |
| `pnpm run lint`          | ESLint on `src/`                                              |
| `pnpm run lint:fix`      | ESLint with auto-fix                                          |
| `pnpm run format`        | Prettier on `src/`                                            |
| `pnpm run format:check`  | Prettier check on `src/`                                      |
| `pnpm run type-check`    | `tsc --noEmit` over `src/` and `tests/`                       |

CI (`.github/workflows/ci.yml`) runs lint, format check, type check, tests and the build on every push and pull
request.

## Project layout

```text
src/
├── main.ts                 # Content script entry: validates the page, then starts the lifecycle
├── background.ts           # Service worker: fetches for auto-refresh and blocked images, opens tabs
├── manifest.json           # Extension manifest (version is filled in from package.json at build)
├── core/
│   ├── lifecycle.ts        # Builds the ExtensionState and runs startup
│   ├── document-renderer.ts# Markdown source → rendered page
│   ├── markdown.ts         # markdown-it setup and post-processing
│   ├── sanitize-document-html.ts # DOMPurify sanitizer for the rendered document
│   ├── component-manager.ts# Mounts and unmounts UI components
│   ├── event-handlers.ts   # Wires UI events
│   ├── settings-manager.ts # Applies and reacts to settings
│   ├── storage.ts          # chrome.storage access
│   └── plugins/            # Plugin registry, manager and one definition file per plugin
├── components/             # UI components (TOC sidebar, theme toggle, code copy, image viewer, …)
├── popup/                  # Toolbar popup: recent documents and settings tabs
├── plugins/                # Custom markdown-it plugin for Mermaid
├── utils/                  # DOM helpers, i18n, logger, auto-refresh, fonts, source extraction, …
├── styles/                 # CSS, one file per area; tokens.css holds the design tokens
├── _locales/               # Interface strings, one messages.json per language
├── assets/icons/           # Extension icons
└── types/                  # Type declarations for untyped markdown-it plugins
build/                      # webpack.common.cjs, webpack.dev.cjs, webpack.prod.cjs
scripts/                    # clean, manifest version sync, zip
tests/                      # Vitest suites, mirroring src/ (tests/core, tests/utils)
examples/                   # Sample documents for trying the renderer
```

## Conventions

- **No UI framework.** Components are TypeScript classes that build and manage their own DOM.
- **No global state.** The `ExtensionState` created in `core/lifecycle.ts` is passed to the functions that need it.
- **No bundle splitting.** Webpack emits one file per entry (`content.js`, `background.js`, `popup.js`), because a
  content script cannot load extra chunks at run time under extension CSP.
- **Interface strings** come from `src/_locales/<language>/messages.json` through `getMessage()` in
  `src/utils/i18n.ts`, collected in `src/utils/messages.ts`. A new string needs an entry in every locale; use the
  English text where you cannot translate it.
- **Logging** goes through `logger` from `src/utils/logger.ts`, not `console.log` (ESLint warns on it).
- **Document HTML reaches the page only through the sanitizer.** HTML derived from a document (rendered markdown, raw
  HTML) is inserted with `setDocumentHTML()` from `src/core/sanitize-document-html.ts`, or passed through
  `sanitizeDocumentHTML()`, never with `innerHTML`. HTML that is only read is parsed with `DOMParser`. Never move
  parser-created nodes into the page from the content script: Chrome binds `on*` handlers to the page's main world at
  parse time, and removing the attribute from the isolated world leaves them alive. See "Security notes" in
  [ARCHITECTURE.md](ARCHITECTURE.md).

## Code style

Prettier (`.prettierrc`): 2-space indentation, single quotes, semicolons, trailing commas where valid in ES5, 100
character lines, LF line endings.

ESLint (`.eslintrc.cjs`) highlights:

- `prefer-const` and `no-var` are errors; unused variables are errors unless prefixed with `_`
- `any` is a warning: prefer a real type or `unknown`
- `console.log` is a warning; `console.warn` and `console.error` are allowed

## Tests

Vitest with the happy-dom environment and Chrome API mocks from `tests/setup.ts`. Tests live in `tests/`, mirroring
`src/`: a test for `src/utils/dom.ts` goes in `tests/utils/dom.test.ts`.

```typescript
import { describe, it, expect } from 'vitest';
import { extractFileNameFromUrl } from '@core/document-renderer';

describe('extractFileNameFromUrl', () => {
  it('should decode a URL-encoded filename', () => {
    expect(extractFileNameFromUrl('https://example.com/docs/My%20Document.md')).toBe(
      'My Document.md'
    );
  });
});
```

Tests that check DOMPurify's output run in jsdom instead, with a `// @vitest-environment jsdom` first line: under
happy-dom, DOMPurify keeps handlers and URLs that a browser's parser lets it remove, so a pass there proves nothing.

Path aliases (`@core`, `@utils`, `@components`, …) work in tests as in source. Coverage is reported for `src/core`
and `src/utils`; no minimum is enforced.

## Common tasks

### Add a markdown-it plugin

1. `pnpm add markdown-it-example`
2. Create `src/core/plugins/definitions/example.plugin.ts`:

   ```typescript
   import markdownItExample from 'markdown-it-example';
   import type { MarkdownPlugin } from '../types';

   export const examplePlugin: MarkdownPlugin = {
     id: 'example',
     name: 'Example',
     version: '1.0.0',
     description: 'What the syntax does',
     category: 'formatting',
     priority: 50, // lower installs earlier; ranges are documented in ../types.ts
     enabledByDefault: true,

     install(md) {
       md.use(markdownItExample);
     },
   };
   ```

3. Export it from `src/core/plugins/definitions/index.ts` and add it to `PLUGIN_REGISTRY` in
   `src/core/plugins/registry.ts`
4. If the package has no types, declare it in `src/types/markdown-it-plugins.d.ts`
5. Add a test in `tests/core/plugins/` and a sample to `examples/features-demo.md`

### Add a UI component

Create a class in `src/components/` that builds its element, mounts it and cleans up after itself, add its CSS in
`src/styles/`, and register it where the other components are mounted (`src/core/component-manager.ts`).

## Troubleshooting

- **The extension does not appear after Load unpacked:** make sure you selected `extension/` (not `dist/`) and that
  it contains `manifest.json`. Run `pnpm run build` again if not.
- **Local files are not rendered:** turn on **Allow access to file URLs** in the extension's Details.
- **Changes do not show up:** reload the extension in `chrome://extensions/`, then reload the markdown tab.
- **`pnpm install` fails with "Use pnpm":** the project only installs with pnpm.

## Getting help

- Questions: [Discussions](https://github.com/markview-app/markview/discussions)
- Bugs: [Issues](https://github.com/markview-app/markview/issues)
