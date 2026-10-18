// @vitest-environment jsdom
/**
 * Corpus differential test for the document HTML sanitizer.
 *
 * Every markdown document in the repository (examples/, docs/ and the top-level README, CHANGELOG and policies) and a
 * set of inline fixtures for what those documents do not exercise (math, alerts, containers, task lists, RTL text,
 * raw HTML that documents commonly embed) is rendered once, then parsed twice into inert templates: as rendered, and
 * after sanitizeDocumentHTML(). The two DOMs must be equal node for node. A dropped attribute, element or text node
 * fails the test and names the first place it differs, so a sanitizer change that breaks real documents cannot pass
 * quietly.
 *
 * Three expected differences, removed before comparing. The first two are deliberate DOMPurify protections against
 * mutation XSS; the third is how DOMPurify parses its input:
 *
 * - HTML-namespace elements whose parent is a MathML element. KaTeX nests `<mi>lim</mi>` inside `<mo>` for operators
 *   such as lim; `<mo>` is a MathML text integration point, so the parser puts that `<mi>` in the HTML namespace, and
 *   DOMPurify removes HTML elements named like MathML ones because that namespace confusion is how payloads are built.
 *   It only touches the visually hidden MathML copy screen readers use; the visible KaTeX HTML is unchanged.
 * - Comments that contain markup (`<tag` or `</tag`). Inert in the page and invisible, but a comment carrying markup
 *   is a classic mutation-XSS carrier, so SAFE_FOR_XML removes it. Comments without markup are kept.
 * - Comments before the document's first content. DOMPurify parses its input as a whole document, so a leading
 *   comment lands outside `<body>` and is dropped. It is invisible and precedes everything else.
 *
 * Runs in jsdom for the reason given in sanitize-document-html.test.ts: happy-dom parses differently from a browser.
 */

import { describe, it, expect, vi } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

vi.mock('@utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { renderMarkdown } from '@core/markdown';
import { sanitizeDocumentHTML } from '@core/sanitize-document-html';

const REPOSITORY_ROOT = resolve(__dirname, '../..');
const MARKDOWN_FILE = /\.md$/i;

/** Markdown files directly inside a repository directory, as paths relative to the repository root. */
function markdownFilesIn(directory: string): string[] {
  return readdirSync(resolve(REPOSITORY_ROOT, directory))
    .filter(entry => MARKDOWN_FILE.test(entry))
    .map(entry => join(directory, entry));
}

const FILE_CORPUS = ['examples', 'docs', '.'].flatMap(markdownFilesIn).sort();

/**
 * What the repository's own documents do not exercise. Each fixture is markdown a user could write; none carries a
 * payload, so the sanitizer must leave every one unchanged.
 */
const INLINE_FIXTURES: Record<string, string> = {
  math: [
    'Inline $x^2 + y^2 = z^2$ and $\\lim_{n \\to \\infty} \\frac{1}{n} = 0$.',
    '',
    '$$',
    '\\begin{aligned}',
    'a &= b + c \\\\',
    'd &= e \\cdot f',
    '\\end{aligned}',
    '$$',
    '',
    '$$',
    '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix} \\quad \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
    '$$',
  ].join('\n'),
  alerts: ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']
    .map(kind => `> [!${kind}]\n> A ${kind.toLowerCase()} with **bold** and \`code\`.`)
    .join('\n\n'),
  containers: ['info', 'warning', 'danger', 'details', 'spoiler']
    .map(type => `::: ${type} Title for ${type}\nBody of the ${type} container.\n:::`)
    .join('\n\n'),
  'task lists': [
    '- [x] done',
    '- [ ] open',
    '  - [x] nested done',
    '  - [ ] nested open',
    '1. [ ] ordered open',
  ].join('\n'),
  'RTL text': [
    '# مرحبا بالعالم',
    '',
    'هذه فقرة باللغة العربية مع **نص عريض** و `code` و [رابط](https://example.com).',
    '',
    '<p dir="rtl">שלום עולם, זו פסקה בעברית.</p>',
    '',
    '<div dir="auto">Mixed: English then العربية then English.</div>',
    '',
    '| العمود | Column |',
    '| --- | --- |',
    '| خلية | cell |',
  ].join('\n'),
  'raw HTML documents embed': [
    '<p align="center"><img src="logo.png" alt="Logo " width="120" height="40"></p>',
    '',
    '<details open>',
    '<summary>Click to expand</summary>',
    '',
    'Hidden **markdown** content.',
    '',
    '</details>',
    '',
    'Press <kbd>Ctrl</kbd>+<kbd>C</kbd>, H<sub>2</sub>O, x<sup>2</sup>, <mark>marked</mark>.',
    '',
    '<a href="https://example.com" target="_blank" rel="noopener noreferrer">new tab</a>',
    '<a href="./sibling.md">sibling</a> <a href="#mermaid-diagrams">anchor</a>',
    '',
    '<iframe src="https://www.youtube.com/embed/abc" allow="autoplay; encrypted-media" allowfullscreen frameborder="0"></iframe>',
    '',
    '<picture><source srcset="dark.png" media="(prefers-color-scheme: dark)"><img src="light.png" alt="logo"></picture>',
    '',
    '<video src="clip.mp4" controls width="320"></video>',
    '',
    '<table><tr><td colspan="2" style="text-align: center">merged</td></tr></table>',
    '',
    'Text<!-- an author note -->more text.',
  ].join('\n'),
  'mermaid fences': [
    '```mermaid',
    'graph TD',
    '  A[Start] --> B{Is it?}',
    '  B -->|Yes| C[OK]',
    '  B -- No --> D[End]',
    '```',
    '',
    '```mermaid',
    'sequenceDiagram',
    '  Alice->>Bob: Hello "Bob" & <friends>',
    '  Bob-->>Alice: Hi',
    '```',
  ].join('\n'),
};

function parseInert(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

/** Same pattern DOMPurify's SAFE_FOR_XML uses to decide that a comment carries markup. */
const MARKUP_IN_COMMENT = /<[/\w]/;

/**
 * Drop comments, and the whitespace around them, before the first content. Applied to both trees: DOMPurify drops a
 * leading comment (see the header), and whitespace at the very start is not something either side relies on.
 */
function withoutLeadingComments(fragment: DocumentFragment): DocumentFragment {
  while (
    fragment.firstChild &&
    (fragment.firstChild.nodeType === Node.COMMENT_NODE ||
      (fragment.firstChild.nodeType === Node.TEXT_NODE && !fragment.firstChild.textContent?.trim()))
  ) {
    fragment.firstChild.remove();
  }
  return fragment;
}

/** Drop the expected differences (see the header) from the as-rendered tree. */
function withoutExpectedDifferences(fragment: DocumentFragment): DocumentFragment {
  const htmlInsideMathML = Array.from(fragment.querySelectorAll('*')).filter(
    element =>
      element.namespaceURI === XHTML_NAMESPACE &&
      element.parentElement?.namespaceURI === MATHML_NAMESPACE
  );
  htmlInsideMathML.forEach(element => element.remove());

  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
  const commentsWithMarkup: Comment[] = [];
  while (walker.nextNode()) {
    const comment = walker.currentNode as Comment;
    if (MARKUP_IN_COMMENT.test(comment.data)) commentsWithMarkup.push(comment);
  }
  commentsWithMarkup.forEach(comment => comment.remove());

  withoutLeadingComments(fragment);

  // Removing a node can leave two text nodes side by side; the sanitized side was re-parsed and has them merged.
  fragment.normalize();
  return fragment;
}

function describeNode(node: Node): string {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const attributes = Array.from(element.attributes, a => `${a.name}="${a.value}"`).join(' ');
    return `<${element.tagName.toLowerCase()}${attributes ? ' ' + attributes : ''}>`;
  }
  return `${node.nodeName} ${JSON.stringify((node.textContent ?? '').slice(0, 60))}`;
}

/** The first place two trees differ, as a readable path, or null when they are equal. */
function firstDifference(expected: Node, actual: Node, path = 'root'): string | null {
  if (expected.isEqualNode(actual)) return null;
  if (expected.nodeType !== actual.nodeType || expected.nodeName !== actual.nodeName) {
    return `${path}: expected ${describeNode(expected)}, got ${describeNode(actual)}`;
  }
  if (expected.nodeType === Node.ELEMENT_NODE) {
    const expectedElement = expected as Element;
    const actualElement = actual as Element;
    for (const attribute of Array.from(expectedElement.attributes)) {
      if (actualElement.getAttribute(attribute.name) !== attribute.value) {
        return `${path}: attribute ${attribute.name}="${attribute.value}" became ${JSON.stringify(
          actualElement.getAttribute(attribute.name)
        )} on ${describeNode(expected)}`;
      }
    }
    for (const attribute of Array.from(actualElement.attributes)) {
      if (!expectedElement.hasAttribute(attribute.name)) {
        return `${path}: attribute ${attribute.name} was added on ${describeNode(expected)}`;
      }
    }
  }
  const expectedChildren = Array.from(expected.childNodes);
  const actualChildren = Array.from(actual.childNodes);
  for (let index = 0; index < Math.max(expectedChildren.length, actualChildren.length); index++) {
    const expectedChild = expectedChildren[index];
    const actualChild = actualChildren[index];
    if (!expectedChild || !actualChild) {
      return `${path}: child ${index} ${expectedChild ? 'was removed: ' + describeNode(expectedChild) : 'was added: ' + describeNode(actualChild!)}`;
    }
    const difference = firstDifference(
      expectedChild,
      actualChild,
      `${path} > ${expected.nodeName.toLowerCase()}[${index}]`
    );
    if (difference) return difference;
  }
  return `${path}: ${describeNode(expected)} differs in a way the walk did not locate`;
}

function expectUnchangedBySanitizer(markdown: string): void {
  const html = renderMarkdown(markdown);

  const asRendered = withoutExpectedDifferences(parseInert(html));
  const sanitized = withoutLeadingComments(parseInert(sanitizeDocumentHTML(html)));

  expect(firstDifference(asRendered, sanitized)).toBeNull();
}

describe('sanitizeDocumentHTML on the repository documents and inline fixtures', () => {
  it('should find the documents', () => {
    // Guards against the test silently checking nothing if examples/ or docs/ moves.
    expect(FILE_CORPUS).toContain(join('examples', 'features-demo.md'));
    expect(FILE_CORPUS.length).toBeGreaterThanOrEqual(8);
  });

  it.each(FILE_CORPUS)('should render %s identically with and without the sanitizer', path => {
    expectUnchangedBySanitizer(readFileSync(resolve(REPOSITORY_ROOT, path), 'utf8'));
  });

  it.each(Object.entries(INLINE_FIXTURES))(
    'should render the %s fixture identically with and without the sanitizer',
    (_name, markdown) => {
      expectUnchangedBySanitizer(markdown);
    }
  );
});
