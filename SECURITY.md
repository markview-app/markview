# Security Policy

## Supported versions

Security fixes are made on the `main` branch and included in the next release. Older releases are not patched
separately.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately instead:

- **Preferred:** use [Report a vulnerability](https://github.com/markview-app/markview/security/advisories/new) in
  this repository's Security tab. Only the maintainers can see the report, and the discussion and fix happen in a
  private security advisory.
- **Without a GitHub account:** email **support@getmarkview.com**.

Include:

- what the problem is and what an attacker could do with it
- the steps or a sample markdown file that reproduce it
- the browser and version, and the MarkView commit or release you tested

You will get a reply through the advisory or by email. Please keep the details private until a fix is available.

## Scope

In scope: the code in this repository, the extension it builds, and how that extension handles documents and the
pages it renders them in.

Out of scope: the version of MarkView distributed through the Chrome Web Store and Edge Add-ons, which is a separate
code base (report its issues through [markview-app/support](https://github.com/markview-app/support)), and
vulnerabilities in the browser itself or in third-party libraries that are not reachable through MarkView.

How the extension handles network access, storage and raw HTML is described under "Network" and "Security notes" in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
