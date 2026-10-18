// @vitest-environment jsdom
/**
 * Tests for dom.ts:
 * - extractMarkdownSource: the source every reader uses, recovered to UTF-8 when the browser decoded a UTF-8 file
 *   with its legacy fallback (markview-app/support#59).
 * - injectRenderedHTML: the rendered document reaches the page through the sanitizer. Runs in jsdom because
 *   DOMPurify under happy-dom keeps handlers a browser removes (see tests/core/sanitize-document-html.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { extractMarkdownSource, injectRenderedHTML } from '@utils/dom';

describe('extractMarkdownSource', () => {
  // windows-1258 (Vietnamese) rather than windows-1252: Node decodes windows-1252 as latin1, unlike the browser
  // (see tests/utils/source-encoding.test.ts); the wiring under test is the same for every locale default.
  const HEADING = '## 📆 Tiếng Việt';
  const browserDecoded = new TextDecoder('windows-1258').decode(new TextEncoder().encode(HEADING));

  function setCharacterSet(characterSet: string): void {
    Object.defineProperty(document, 'characterSet', { value: characterSet, configurable: true });
  }

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Drop the own-property override so the DOM's UTF-8 getter applies again.
    delete (document as unknown as Record<string, unknown>).characterSet;
    document.body.innerHTML = '';
  });

  it('should return the <pre> text unchanged on a UTF-8 page', () => {
    document.body.innerHTML = `<pre>${HEADING}\n\nBody</pre>`;

    expect(extractMarkdownSource()).toBe(`${HEADING}\n\nBody`);
  });

  it('should recover UTF-8 from <pre> text the browser decoded with its legacy fallback', () => {
    setCharacterSet('windows-1258');
    const pre = document.createElement('pre');
    pre.textContent = `${browserDecoded}\n\nBody`;
    document.body.appendChild(pre);

    expect(extractMarkdownSource()).toBe(`${HEADING}\n\nBody`);
  });

  it('should recover the body-text fallback the same way', () => {
    setCharacterSet('windows-1258');
    const div = document.createElement('div');
    div.textContent = browserDecoded;
    document.body.appendChild(div);

    expect(extractMarkdownSource()).toBe(HEADING);
  });

  it('should keep text that is not a reversible legacy decode', () => {
    setCharacterSet('windows-1258');
    document.body.innerHTML = '<pre>Cà phê sữa đá</pre>';

    expect(extractMarkdownSource()).toBe('Cà phê sữa đá');
  });
});

describe('injectRenderedHTML', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should insert the rendered HTML without script-capable attributes (raw HTML XSS regression)', () => {
    const container = injectRenderedHTML(
      '<h2 id="images">Images</h2>' +
        '<img src="x.png" onerror="window.__mv=1"><span onmouseover="window.__mv=2">hover</span>' +
        '<iframe srcdoc="&lt;script&gt;parent.__mv=3&lt;/script&gt;"></iframe>'
    );

    const attributeNames = Array.from(container.querySelectorAll('*')).flatMap(element =>
      Array.from(element.attributes, attribute => attribute.name)
    );
    expect(attributeNames.filter(name => name.startsWith('on') || name === 'srcdoc')).toEqual([]);
    expect(container.querySelector('h2')?.id).toBe('images');
    expect(container.querySelector('span')?.textContent).toBe('hover');
  });

  it('should replace the previous content of an existing container', () => {
    injectRenderedHTML('<p>first</p>');
    const container = injectRenderedHTML('<p>second</p>');

    expect(container.id).toBe('markview-container');
    expect(container.textContent).toBe('second');
    expect(document.querySelectorAll('#markview-container')).toHaveLength(1);
  });
});
