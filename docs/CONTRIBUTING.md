# Contributing

Thank you for helping with MarkView (Open-Source Edition). This edition is kept small on purpose: a stable core
renderer that is easy to read and audit. This guide explains what fits that scope and how to send a change.

By taking part you agree to follow the [Code of Conduct](../CODE_OF_CONDUCT.md).

## What fits

**Welcome**

- Bug fixes, especially in rendering, parsing and browser compatibility
- Security fixes (report vulnerabilities privately first: see [SECURITY.md](../SECURITY.md))
- Performance and bundle-size improvements that keep behavior the same
- Accessibility: keyboard use, screen readers, contrast
- Translations of interface strings in `src/_locales/`
- Documentation and tests

**Usually declined**

- New features beyond core markdown rendering. The project does not publish a roadmap, and feature requests are
  likely to be closed.
- Anything that sends data to an external service: analytics, sync, AI or third-party APIs
- New heavy dependencies or UI frameworks
- Changes that break existing documents or settings

If you are unsure whether a change fits, open an issue or a discussion before writing code.

## Reporting a bug

Use the [bug report form](https://github.com/markview-app/markview/issues/new?template=bug_report.yml). The most
useful reports include a small markdown file that shows the problem, whether it was opened from disk (`file://`) or a
link, the browser and its version, and any errors from the DevTools console.

This tracker is for the open-source edition. Problems with the version installed from the Chrome Web Store or Edge
Add-ons go to [markview-app/support](https://github.com/markview-app/support).

## Sending a pull request

1. Fork the repository and create a branch: `fix/toc-scroll`, `docs/dev-guide`, …
2. Set up and build as described in [DEVELOPMENT.md](DEVELOPMENT.md)
3. Keep the change focused: one fix or improvement per pull request
4. Add or update tests in `tests/` for behavior you change
5. Before pushing, run:

   ```bash
   pnpm run lint
   pnpm run format:check
   pnpm run type-check
   pnpm run test:run
   pnpm run build
   ```

6. Open the pull request and fill in the template. CI runs the same checks.

A maintainer reviews pull requests as time allows. A pull request may be closed if it falls outside the scope above,
even when the code is good; that is about scope, not quality.

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), imperative mood, first line under 72 characters:

```text
fix: keep TOC links working for headings with emoji
docs: correct the build output folder in DEVELOPMENT.md
test: cover UTF-8 recovery for windows-1258
```

Types used here: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`. Explain why in the
commit body when it is not obvious, and reference the issue (`Fixes #123`).

## Code style

Prettier and ESLint settings are in the repository; `pnpm run format` and `pnpm run lint:fix` apply most of them. The
conventions that tools do not check (no UI framework, no global state, strings from `_locales`, `logger` instead of
`console.log`) are listed in [DEVELOPMENT.md](DEVELOPMENT.md#conventions).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](../LICENSE).
