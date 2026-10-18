# Architecture

How MarkView (Open-Source Edition) turns a raw markdown page into a rendered document. For building and running the
code, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Principles

1. **Local processing.** Documents are parsed and rendered in the tab. Nothing about them is sent anywhere.
2. **No UI framework.** Plain TypeScript classes build and manage their own DOM.
3. **Explicit state.** One `ExtensionState` object, created at startup, is passed to the functions that need it. There
   are no module-level singletons holding document state.
4. **Manifest V3.** A content script, a service worker and a popup; no remote code.

## Parts of the extension

| Part           | Entry               | Role                                                                               |
| -------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Content script | `src/main.ts`       | Runs on markdown URLs, renders the document and mounts the reading UI              |
| Service worker | `src/background.ts` | Fetches the document for auto-refresh and images the page may not load; opens tabs |
| Popup          | `src/popup/`        | Recent documents and settings                                                      |

The content script is declared for `.md`, `.markdown`, `.mkd` and `.mdx` URLs (with upper-case and query-string
variants) on `file://` and `http(s)://`, and runs at `document_end`.

## From page load to rendered document

```text
Browser opens a .md URL and shows the raw text in <pre>
  │
  ▼
main.ts ── validateMarkdownPage() (src/utils/validation.ts)
  │          • URL has a markdown extension
  │          • the page is a browser-rendered text document: a <pre> with content and almost nothing else
  │          • document.contentType is text/plain, text/markdown or text/x-markdown
  │        Any check fails → exit without touching the page
  ▼
lifecycle.ts ── create ExtensionState, load settings, set up the page
  ▼
document-renderer.ts ── renderMarkdownContent()
```

`renderMarkdownContent()` runs twelve stages:

1. **Source.** `extractMarkdownSource()` (`src/utils/dom.ts`) reads the `<pre>` text and, when the browser decoded a
   UTF-8 file with its legacy fallback encoding, recovers the real text (see [Encoding](#encoding)).
2. **Preload** the highlight.js languages the document uses.
3. **Theme** for code blocks.
4. **Render to HTML** with markdown-it and the registered plugins (`src/core/markdown.ts`).
5. **Inject** the HTML into the page, through the document HTML sanitizer (see [Security notes](#security-notes)).
6. **Metadata**: the page title.
7. **Layout**: font and layout settings; a non-default font is loaded from Google Fonts here.
8. **Lazy-load images**, resolving relative paths against the document URL.
9. **Diagrams**: Mermaid blocks render asynchronously.
10. **Components**: TOC, code copy buttons and the other UI react to the new content.
11. **History**: the document's address and title go into the recent-documents list in `chrome.storage.local`.
12. **Notification** that rendering finished.

### Encoding

A server that sends a markdown file as `text/plain` without a `charset` makes the browser decode it with the locale's
legacy encoding (`windows-1252` for English), which turns every multi-byte UTF-8 character into several wrong ones
(`ðŸ›‘` instead of `🛑`). `recoverUtf8FromLegacyDecode()` (`src/utils/source-encoding.ts`) maps the text back to bytes
and decodes them as UTF-8, under two guards: the encoding must map the 256 bytes to 256 distinct characters, and the
result must be valid UTF-8. Otherwise the text is kept as the browser decoded it. Multi-byte locale encodings (such as
Shift_JIS or GBK) lose information and cannot be reversed this way.

## Plugins

Each markdown-it plugin is a `MarkdownPlugin` definition in `src/core/plugins/definitions/`, listed in
`PLUGIN_REGISTRY` (`src/core/plugins/registry.ts`) and installed by `plugin-manager.ts` in ascending `priority`.

| Plugin        | Package                         |
| ------------- | ------------------------------- |
| Tables        | `markdown-it-multimd-table`     |
| Task lists    | `markdown-it-task-lists`        |
| Math          | `@iktakahiro/markdown-it-katex` |
| Mermaid       | custom (`src/plugins/`)         |
| Emoji         | `markdown-it-emoji`             |
| Alerts        | `@mdit/plugin-alert`            |
| Footnotes     | `markdown-it-footnote`          |
| Subscript     | `markdown-it-sub`               |
| Superscript   | `markdown-it-sup`               |
| Abbreviations | `markdown-it-abbr`              |
| Insert        | `markdown-it-ins`               |
| Mark          | `markdown-it-mark`              |
| Definitions   | `markdown-it-deflist`           |
| Containers    | `markdown-it-container`         |

Syntax highlighting (highlight.js, common language set) and typographic replacements are markdown-it options, not
plugins.

## UI components

Components live in `src/components/` and are mounted by `src/core/component-manager.ts`: the TOC sidebar (H1–H3, with
a resize handle), theme toggle, centered-layout toggle, raw view toggle, code copy buttons, scroll-to-top, action
menu, quick settings, keyboard shortcuts help, image viewer and Mermaid zoom with download.

Interface text comes from `src/_locales/<language>/messages.json` (12 languages) through `src/utils/i18n.ts`.

## Storage

Settings and the recent-documents list are stored in `chrome.storage.local`, on the device. Document content is never
stored.

## Network

| Request                                   | Made by                         | When                                                         |
| ----------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| The document URL                          | the browser; the service worker | Opening the document; each auto-refresh poll                 |
| Images the document references            | the page; the service worker    | Rendering; the worker fetches images a sandboxed page cannot |
| `fonts.googleapis.com` and its font files | the page                        | Only when a font other than the default is selected          |

There is no analytics, telemetry, crash reporting or remote configuration.

## Security notes

- **Isolation.** The content script runs in the extension's isolated world. The service worker fetches a URL only when
  the content script asks it to, and the content script asks only for the open document and its images.
- **Raw HTML.** markdown-it runs with `html: true`, so HTML written in a document is rendered as HTML, but only after
  DOMPurify sanitizes it (`src/core/sanitize-document-html.ts`). The rendered document reaches the page through
  `setDocumentHTML()`, which removes everything that can run script:
  - event handler attributes (`onerror`, `onmouseover`, …) and `srcdoc`
  - `javascript:` and other script URLs, and `data:` URLs outside images and media
  - `script`, `object`, `embed`, `base`, `meta` and `link` elements, and SVG `animate` and `set`

  Everything else a document uses is kept, which a corpus test checks node for node
  (`tests/core/sanitize-document-html-corpus.test.ts`): heading ids, `dir`, `details`, task-list checkboxes, KaTeX's
  MathML, links with app schemes such as `vscode:`, and elements the parser does not know (MDX `<Note>`). An `<iframe>`
  keeps its `src` only when it is an `https:` URL, so video and page embeds still work. A raw `target="_blank"` link
  always gets `rel="noopener noreferrer"`.

  The sanitized nodes are inserted as `document.importNode()` clones. Chrome creates the page's own event handler
  for an `on*` attribute as soon as it parses it, even in DOMPurify's inert document, and the content script, which
  runs in the isolated world, cannot remove that handler by removing the attribute. A clone is built from the
  remaining attributes only. Unit tests cannot show this, since their DOMs have no separate worlds: a change here
  has to be checked in the built extension.

- **Sandboxed pages.** Some servers deliver plain-text documents in a sandboxed or CSP-restricted context, which blocks
  dialogs such as print and external resources. MarkView detects this (`src/utils/sandbox-detection.ts`) and loads
  external images through the service worker instead.

To report a vulnerability, see [SECURITY.md](../SECURITY.md).

## Build output

Webpack (`build/`) bundles three entries, `content.js`, `background.js` and `popup.js`, into `extension/js/`, and
extracts CSS into `extension/css/`. Code splitting is disabled: a content script cannot load extra chunks under
extension CSP. Mermaid, KaTeX and highlight.js are bundled into `content.js`, which is about 3.8 MB minified; nothing
is loaded from a CDN.
