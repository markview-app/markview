# MarkView

## 📖 What is MarkView?

A **lightweight, open-source markdown viewer** for Chrome, Edge & Chromium Browsers. This repository provides the core rendering engine with essential features, designed for transparency, security auditing, and self-hosted deployments.

> **Note**: This is the **open-source version** of MarkView. For the full-featured extension with advanced productivity tools, visit [MarkView on Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien) or [MarkView on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-red?logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)
[![Edge Add-on](https://img.shields.io/badge/Edge-Add--on-blue?logo=microsoft-edge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

### ✨ Features Included

- ✅ **Full GFM Support** - GitHub Flavored Markdown (tables, task lists, strikethrough, footnotes)
- ✅ **Syntax Highlighting** - Code blocks with basic theme (180+ languages supported)
- ✅ **Mermaid Diagrams** - Flowcharts, sequence diagrams, class diagrams, and more
- ✅ **KaTeX Math Rendering** - Beautiful LaTeX equations (inline and display)
- ✅ **Dark/Light Themes** - Eye-friendly theme toggle
- ✅ **Basic Table of Contents** - Auto-generated TOC for H1-H2 headings
- ✅ **GitHub-Style Alerts** - Note, Tip, Important, Warning, Caution callouts
- ✅ **Extended Markdown** - Superscript, subscript, insert, mark, abbreviations, definition lists
- ✅ **Local & Remote Files** - View markdown from file:// and https:// URLs
- ✅ **Privacy-First** - All processing happens locally, no data collection

---

## 🚀 Quick Start

### Option 1: Install Full Extension (Recommended)

Get the complete MarkView experience with all productivity features:

- **[Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)** - For Chrome & Chromium-based browsers
- **[Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed)** - For Edge browser
- **[Official Website](https://getmarkview.com/)** - Learn more about features

### Option 2: Build from Source (This Repository)

For developers, security auditing, or restricted environments:

```bash
# Clone the repository
git clone https://github.com/markview-app/markview.git
cd markview

# Install dependencies (requires pnpm)
pnpm install

# Build the extension
pnpm run build

# Load the unpacked extension
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

**Requirements**: Node.js 18+, pnpm 8+

---

## 💡 Which Version Should You Choose?

**Choose Open-Source Edition if you:**

- Need to audit the code for security/privacy
- Work in a corporate environment requiring open-source software
- Want a lightweight viewer for basic markdown files
- Need to self-host or modify the extension
- Are in a region where Chrome Web Store is blocked

**Choose Full Extension if you:**

- Want productivity features like folder navigation and folder bookmarks
- Want presentation mode for markdown slides
- Need export to HTML and Word documents
- Need advanced features like Mermaid fullscreen zoom, image viewer with gallery navigation
- Prefer automatic updates from Chrome Web Store
- And many more!

---

## 📚 Documentation

- **[Upgrade Guide](docs/UPGRADE.md)** - How to migrate to the full extension
- **[Development Guide](docs/DEVELOPMENT.md)** - Build, test, and contribute
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - How to contribute
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Technical documentation

---

## 🛠️ Technical Stack

- **TypeScript 5.0+** - Type-safe development
- **Webpack 5** - Module bundling with esbuild-loader
- **markdown-it 14.1.0** - Markdown parser with plugin ecosystem
- **highlight.js 11.6.0** - Syntax highlighting
- **Mermaid 11.4.0** - Diagram rendering
- **KaTeX 0.16.25** - Math equation rendering
- **Chrome Extension Manifest V3** - Modern extension platform

See [package.json](package.json) for complete dependencies.

---

## 🤝 Contributing

We welcome contributions to the **core rendering features**! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) before submitting a pull request.

### What Can You Contribute?

✅ **Welcome Contributions:**

- Bug fixes in core rendering
- Performance improvements
- New markdown-it plugins (if useful for everyone)
- Documentation improvements
- Translation improvements
- Accessibility enhancements
- Security fixes

❌ **Not Accepting:**

- PRO-tier features (maintained separately)
- Features that significantly increase bundle size
- Breaking changes to existing APIs

---

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/markview-app/markview/issues/new?template=bug_report.yml)
- **Feature Requests**: [GitHub Issues](https://github.com/markview-app/markview/issues/new?template=feature_request.yml)
- **Questions**: [GitHub Discussions](https://github.com/markview-app/support/discussions)
- **Full Extension Support**: [MarkView Support](https://github.com/markview-app/support)

---

## 📄 License

This open-source edition is released under the **MIT License**. See [LICENSE](LICENSE) for details.

> **Note**: This is the **open-source version** of MarkView. For the full-featured extension with advanced productivity tools, visit [MarkView on Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien) or [MarkView on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed).

---

## 🔗 Related Links

### MarkView Full Extension

- **Website**: [https://getmarkview.com/](https://getmarkview.com/)
- **Chrome Web Store**: [Install Extension](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)
- **Edge Add-ons**: [Install Extension](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed)
- **Support & FAQ**: [https://getmarkview.com/support](https://getmarkview.com/support)
- **Privacy Policy**: [https://getmarkview.com/privacy-policy](https://getmarkview.com/privacy-policy)

### Community

- **Main Support Repository**: [markview-app/support](https://github.com/markview-app/support)
- **Sample Markdown Files**: [markview-app/sample-markdown](https://github.com/markview-app/sample-markdown)
- **Organization Profile**: [markview-app](https://github.com/markview-app)

---

## ⭐ Show Your Support

If you find this project useful:

- ⭐ **Star this repository** on GitHub
- 🐦 **Share it** on social media
- 📝 **Write a review** on [Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)
- 💬 **Join discussions** in [GitHub Discussions](https://github.com/markview-app/support/discussions)
- 🚀 **Upgrade to PRO** to support continued development

---

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

<div align="center">

**Made with ❤️ by the MarkView Team**

[Website](https://getmarkview.com/) • [Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien) • [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed) • [Support](https://github.com/markview-app/support)

</div>
