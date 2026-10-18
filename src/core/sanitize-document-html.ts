/**
 * Sanitizer for HTML derived from a document: the rendered markdown, raw HTML blocks included.
 *
 * markdown-it runs with `html: true`, so HTML written in a `.md` file reaches the page. MarkView renders that HTML
 * into the page that serves the file, so an inline handler (`<img onerror>`, `<span onmouseover>`) or an
 * `<iframe srcdoc>` used to run as script in the document's origin, on `file://` and on any host without a CSP.
 * Everything that can run script is removed here; everything MarkView renders today is kept, which
 * `tests/core/sanitize-document-html-corpus.test.ts` proves against the examples and a set of inline fixtures.
 *
 * Rule: document-derived HTML enters the live document only through `setDocumentHTML()`, or as a string from
 * `sanitizeDocumentHTML()`, never through `innerHTML`.
 */

import DOMPurify, { type Config } from 'dompurify';
import { logger } from '@utils/logger';

/**
 * Dedicated DOMPurify instance, so the hooks below never reach any other DOMPurify user. Mermaid sanitizes its
 * labels with the default instance and registers hooks of its own there; neither side should see the other's.
 */
const documentPurifier = DOMPurify(window);

/**
 * Every departure from DOMPurify's defaults, each because the default would change how a real document renders
 * (each one was found by the corpus test). The defaults that stay are the ones that matter for safety: `on*`
 * attributes, `srcdoc`, `*script:` URLs, `data:` URLs outside media tags, and `script`, `object`, `embed`, `base`,
 * `meta`, `link`, SVG `animate`/`set`, comments that contain markup, and HTML-namespace elements nested in MathML are
 * all removed.
 */
const DOCUMENT_HTML_CONFIG: Config = Object.freeze({
  ADD_TAGS: [
    // Video and page embeds. Kept as an element (see the hook for its `src`), so the document's structure does not
    // change around it.
    'iframe',
    // KaTeX's MathML output wraps the formula in <semantics> with an <annotation> holding the TeX source.
    // `annotation-xml`, the dangerous sibling, stays forbidden.
    'semantics',
    'annotation',
    // HTML comments in a document are inert, and removing one merges the text nodes around it. Comments that contain
    // markup are still removed (SAFE_FOR_XML).
    '#comment',
  ],
  ADD_ATTR: [
    // External links open in a new tab (`link_open` in src/core/markdown.ts sets it).
    'target',
    // What embed snippets carry.
    'allow',
    'allowfullscreen',
    'frameborder',
    // KaTeX MathML for aligned environments.
    'columnalign',
    'columnspacing',
  ],
  // Links with schemes other than the web ones are legitimate in documents: `file:` to a sibling file, `vscode:`,
  // `obsidian:` and other app links. Only `*script:` and `data:` (outside media tags) can run anything, and
  // DOMPurify still blocks those with this option on.
  ALLOW_UNKNOWN_PROTOCOLS: true,
  // DOM-clobbering protection strips any `id` that names a `document` property. It removes `images`, `title`,
  // `links`, `forms`, `body`, `location`, `cookie`, `scripts` and `children`, which heading slugs hit constantly and
  // TOC links depend on. MarkView's own code runs in the isolated world and does not read named properties off
  // `document`, so turning it off restores today's behavior without exposing MarkView.
  SANITIZE_DOM: false,
});

/**
 * Keep attribute values verbatim. DOMPurify trims them before validating, which rewrote Mermaid sources
 * (`data-code`, which must survive unchanged) and `alt` text. Restoring the original value does not weaken any check:
 * URL validation strips whitespace itself before matching, and the comment-in-attribute check runs on the value set
 * here. SVG and MathML attribute names are case-sensitive and arrive lower-cased, so `getAttribute` may not find
 * them; those keep the trimmed value.
 */
documentPurifier.addHook('uponSanitizeAttribute', (node, data) => {
  const original = node.getAttribute(data.attrName);
  if (original !== null) {
    data.attrValue = original;
  }
});

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MERMAID_SOURCE_ATTRIBUTE = 'data-code';

/**
 * Mermaid sources must survive verbatim, or the diagram cannot render. DOMPurify's SAFE_FOR_XML removes any attribute
 * containing `-->`, which is Mermaid's arrow, and it runs before a hook can force-keep the attribute. So the value is
 * recorded before attributes are sanitized and put back after, on the placeholder elements
 * `src/plugins/markdown-it-mermaid-render.ts` emits only: an HTML-namespace `div.mermaid-placeholder` outside SVG and
 * MathML, where an attribute stays an attribute however often the markup is re-parsed. A `data-*` value is never
 * interpreted by the browser; `src/utils/mermaid-renderer.ts` reads it as diagram source text.
 */
const pendingMermaidSources = new WeakMap<Element, string>();

function isMermaidPlaceholder(node: Element): boolean {
  return (
    node.namespaceURI === XHTML_NAMESPACE &&
    node.localName === 'div' &&
    node.classList.contains('mermaid-placeholder') &&
    node.closest('svg, math') === null
  );
}

/**
 * Keep elements the HTML parser does not know, such as the `<Note>` or `<Steps>` of MDX pages. DOMPurify removes them
 * and hoists their children, which changes the document's structure. An unknown element has no behavior of its own;
 * its `on*` attributes are still removed, and DOMPurify's namespace check still runs afterwards, so an HTML element
 * named like an SVG or MathML one (the mutation-XSS trick) is removed regardless.
 */
documentPurifier.addHook('uponSanitizeElement', (node, data) => {
  if (
    node instanceof HTMLUnknownElement &&
    node.namespaceURI === XHTML_NAMESPACE &&
    !data.allowedTags[data.tagName]
  ) {
    data.allowedTags[data.tagName] = true;
  }
});

documentPurifier.addHook('beforeSanitizeAttributes', node => {
  if (!isMermaidPlaceholder(node)) return;
  const source = node.getAttribute(MERMAID_SOURCE_ATTRIBUTE);
  if (source !== null) {
    pendingMermaidSources.set(node, source);
  }
});

documentPurifier.addHook('afterSanitizeAttributes', node => {
  const source = pendingMermaidSources.get(node);
  if (source === undefined) return;
  pendingMermaidSources.delete(node);
  node.setAttribute(MERMAID_SOURCE_ATTRIBUTE, source);
});

/**
 * `<iframe>` keeps its element but loses `src` unless it resolves to `https:`: a `javascript:` or `data:` source
 * would run in a context the page can reach. `<a target="_blank">` always carries `noopener noreferrer`, so a raw
 * HTML link cannot hand the opened page a reference back to the document.
 */
documentPurifier.addHook('afterSanitizeAttributes', node => {
  const tagName = node.nodeName.toLowerCase();

  if (tagName === 'iframe') {
    const src = node.getAttribute('src');
    if (src !== null && !resolvesToHttps(src)) {
      node.removeAttribute('src');
    }
    return;
  }

  if (tagName === 'a' && node.getAttribute('target')?.toLowerCase() === '_blank') {
    const relTokens = new Set((node.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));
    relTokens.add('noopener');
    relTokens.add('noreferrer');
    node.setAttribute('rel', [...relTokens].join(' '));
  }
});

function resolvesToHttps(url: string): boolean {
  try {
    return new URL(url, document.baseURI).protocol === 'https:';
  } catch {
    // Not a URL at all: there is nothing safe to load.
    return false;
  }
}

/**
 * Log what was removed, by name only. The document's text and attribute values never reach the log.
 */
function logRemovals(context: string): void {
  const removed = documentPurifier.removed;
  if (removed.length === 0) return;

  const names = removed.map(entry =>
    'element' in entry
      ? `<${entry.element.nodeName.toLowerCase()}>`
      : `@${entry.attribute?.name ?? '?'}`
  );
  logger.log(
    `[sanitizeDocumentHTML] ${context}: removed ${removed.length} item(s): ${names.join(', ')}`
  );
}

/**
 * Sanitize document-derived HTML and return it as a string, for consumers that hand a string on.
 */
export function sanitizeDocumentHTML(html: string): string {
  const clean = documentPurifier.sanitize(html, DOCUMENT_HTML_CONFIG);
  logRemovals('string');
  return clean;
}

/**
 * Replace `target`'s children with the sanitized form of `html`.
 *
 * The sanitized nodes are inserted as clones made by `document.importNode`, never the nodes DOMPurify worked on and
 * never a re-parsed string:
 *
 * - Not re-parsed: nothing can change shape between sanitizing and inserting (the parse-serialize-parse gap that
 *   mutation XSS relies on).
 * - Not DOMPurify's own nodes: when the parser meets an `on*` attribute, even in DOMPurify's inert document, Chrome
 *   creates the event handler for the page's main world at once. This code runs in the content script's isolated
 *   world, and removing an attribute there only clears a handler belonging to the isolated world, so the main-world
 *   handler survives on the node with no attribute left to show for it. Moving such a node into the page made
 *   `<img onerror>` fire anyway. A clone is built from the remaining attributes only, so it carries no handler. No
 *   unit test can show this (the test DOMs have no worlds); only a check in the real extension can.
 *
 * Errors are not caught: callers already handle render failures, and this must never fall back to unsanitized
 * `innerHTML`.
 */
export function setDocumentHTML(target: Element, html: string): void {
  const sanitized = documentPurifier.sanitize(html, {
    ...DOCUMENT_HTML_CONFIG,
    RETURN_DOM_FRAGMENT: true,
  });
  logRemovals('fragment');
  target.replaceChildren(document.importNode(sanitized, true));
}
