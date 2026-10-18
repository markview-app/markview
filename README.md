# MarkView (Open-Source Edition)

A lightweight, open-source markdown viewer for Chrome, Edge and other Chromium browsers. It is the core rendering
engine of [MarkView](https://getmarkview.com/), released under the MIT License for auditing, self-hosting and
restricted environments.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/markview-app/markview/actions/workflows/ci.yml/badge.svg)](https://github.com/markview-app/markview/actions/workflows/ci.yml)

Open a `.md` file in the browser, from disk or from a link, and MarkView renders it as a formatted document in place
of the raw text.

## Features

**Rendering**

- GitHub Flavored Markdown: tables, task lists, strikethrough, footnotes, autolinks
- GitHub-style alerts: Note, Tip, Important, Warning, Caution
- Extended syntax: subscript, superscript, inserted and highlighted text, abbreviations, definition lists, custom
  containers, emoji shortcodes
- Syntax highlighting with highlight.js (its common language set), a copy button and 14 color themes
- Mermaid diagrams, with zoom and download
- KaTeX math, inline and display

**Reading**

- Light and dark themes
- Table of contents for H1–H3 headings, in a resizable sidebar
- Raw markdown view, print styles, image viewer, font selection
- Auto-refresh when the file changes
- Recent documents and settings in the toolbar popup
- Keyboard shortcuts
- Interface in 12 languages

**Files**

- `.md`, `.markdown`, `.mkd` and `.mdx`, on `file://` and `http(s)://` URLs

## Install from source

Requirements: Node.js 20 or later, pnpm 8 or later.

```bash
git clone https://github.com/markview-app/markview.git
cd markview
pnpm install
pnpm run build
```

Then load the unpacked extension:

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Turn on **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. To view local files, open the extension's **Details** and turn on **Allow access to file URLs**

`pnpm run build` also writes a zip of the same build to `dist/`.

## Privacy

All rendering happens in the browser tab. MarkView has no analytics, telemetry or crash reporting, and it never sends
your documents anywhere. The only network requests it makes are:

| Request                                       | When                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| The document's own URL and images it links to | Opening a document; auto-refresh polls the document URL                                   |
| Google Fonts (`fonts.googleapis.com`)         | Only after you choose a font other than the default; the font name is part of the request |

**Permissions**

- `storage`: saves your settings and the recent-documents list in the browser
- Host access to `file:///*` and `*://*/*`: lets the extension render markdown files at any address, and lets its
  background worker fetch the open document (auto-refresh) and its images when the page itself is not allowed to

## Scope

This edition keeps to a small, stable core. Bug fixes, security fixes, documentation, translations and accessibility
improvements are welcome. New features outside core markdown rendering are generally not accepted, and the project
does not publish a roadmap. See [Contributing](docs/CONTRIBUTING.md) before opening a pull request.

## Documentation

- [Development guide](docs/DEVELOPMENT.md): build, test and project layout
- [Architecture](docs/ARCHITECTURE.md): how a document goes from raw text to rendered page
- [Contributing](docs/CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Support

- Bugs in this edition: [open an issue](https://github.com/markview-app/markview/issues/new/choose)
- Questions: [Discussions](https://github.com/markview-app/markview/discussions)
- Security vulnerabilities: see [SECURITY.md](SECURITY.md), not public issues

## License

[MIT](LICENSE). Third-party libraries keep their own licenses; see `package.json` for the list.

## MarkView for Chrome & Edge

This repository is the open-source core. MarkView is also available from the
[Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien) and
[Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed) as a
separately developed extension that adds folder navigation, presentation mode, and HTML and Word export. Its code is
not part of this repository, and this repository does not track its features.

Issues with the store version go to [markview-app/support](https://github.com/markview-app/support).

---

<div align="center">

[Website](https://getmarkview.com/) • [Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien) • [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed)

</div>
