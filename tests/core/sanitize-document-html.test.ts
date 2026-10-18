// @vitest-environment jsdom
/**
 * Tests for the document HTML sanitizer (src/core/sanitize-document-html.ts).
 *
 * Three groups: payloads that used to run script must come out inert; markup MarkView renders today must come out
 * unchanged; setDocumentHTML must insert exactly the sanitized nodes. Assertions inspect parsed DOM, not string shape.
 *
 * Runs in jsdom, not the suite's happy-dom: DOMPurify's result depends on the DOM it parses with. Under happy-dom it
 * kept a span's `onmouseover` and an SVG `<set>`, kept an entity-encoded `javascript:` href, lost KaTeX's MathML
 * `<semantics>` and left `&gt;` undecoded in a Mermaid source; a browser does none of that. jsdom passes every case.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { logger } from '@utils/logger';
import DOMPurify from 'dompurify';
import { sanitizeDocumentHTML, setDocumentHTML } from '@core/sanitize-document-html';
import { MarkdownRenderer } from '@core/markdown';

/** Sanitize and parse into an inert template, so assertions read real attributes. */
function sanitizeToFragment(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = sanitizeDocumentHTML(html);
  return template.content;
}

/** Every attribute name on every element of the fragment, lower-cased. */
function allAttributeNames(fragment: DocumentFragment): string[] {
  return Array.from(fragment.querySelectorAll('*')).flatMap(element =>
    Array.from(element.attributes, attribute => attribute.name.toLowerCase())
  );
}

const INVESTIGATION_PAYLOADS = `
<img src="does-not-exist.png" onerror="window.__mv=(window.__mv||[]).concat('img-onerror')">
<script>window.__mv=(window.__mv||[]).concat('script-element')</script>
<iframe srcdoc="&lt;script&gt;parent.__mv=1&lt;/script&gt;"></iframe>
<span onmouseover="window.__mv=(window.__mv||[]).concat('span-onmouseover')">hover target</span>`;

describe('sanitizeDocumentHTML', () => {
  beforeEach(() => {
    vi.mocked(logger.log).mockClear();
  });

  describe('payloads that used to run script', () => {
    it('should neutralise the investigation payload block (regression for the reported bug)', () => {
      const fragment = sanitizeToFragment(INVESTIGATION_PAYLOADS);

      const attributes = allAttributeNames(fragment);
      expect(attributes.filter(name => name.startsWith('on'))).toEqual([]);
      expect(attributes).not.toContain('srcdoc');
      expect(fragment.querySelector('script')).toBeNull();
      expect(fragment.querySelector('img')?.getAttribute('src')).toBe('does-not-exist.png');
      expect(fragment.querySelector('span')?.textContent).toBe('hover target');
      expect(fragment.querySelector('iframe')).not.toBeNull();
    });

    it.each([
      ['img onerror', '<img src="x" onerror="alert(1)">'],
      ['mixed-case handler', '<img src="x" OnError="alert(1)">'],
      ['svg onload', '<svg onload="alert(1)"><rect/></svg>'],
      ['details ontoggle', '<details open ontoggle="alert(1)"><summary>s</summary></details>'],
      ['body onload', '<body onload="alert(1)"><p>x</p></body>'],
    ])('should remove the event handler from %s', (_name, html) => {
      const attributes = allAttributeNames(sanitizeToFragment(html));
      expect(attributes.filter(name => name.startsWith('on'))).toEqual([]);
    });

    it.each([
      ['javascript: src', '<iframe src="javascript:alert(1)"></iframe>'],
      ['data:text/html src', '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'],
      ['http: src', '<iframe src="http://example.com/page"></iframe>'],
    ])('should keep the iframe but drop a %s', (_name, html) => {
      const iframe = sanitizeToFragment(html).querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.hasAttribute('src')).toBe(false);
    });

    it.each([
      ['javascript:', '<a href="javascript:alert(1)">x</a>'],
      ['entity-encoded javascript:', '<a href="&#106;avascript:alert(1)">x</a>'],
      ['javascript: with control characters', '<a href="java\tscript:alert(1)">x</a>'],
      ['data:text/html', '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
      ['vbscript:', '<a href="vbscript:msgbox(1)">x</a>'],
    ])('should drop a raw anchor href using %s', (_name, html) => {
      const anchor = sanitizeToFragment(html).querySelector('a');
      expect(anchor).not.toBeNull();
      expect(anchor?.hasAttribute('href')).toBe(false);
    });

    it('should drop SVG link and animation vectors', () => {
      const fragment = sanitizeToFragment(
        '<svg><a xlink:href="javascript:alert(1)"><animate attributeName="href" values="javascript:alert(1)"/>' +
          '<set attributeName="href" to="javascript:alert(1)"/><text>t</text></a></svg>'
      );
      expect(allAttributeNames(fragment)).not.toContain('xlink:href');
      expect(fragment.querySelector('animate')).toBeNull();
      expect(fragment.querySelector('set')).toBeNull();
      expect(fragment.querySelector('text')?.textContent).toBe('t');
    });

    it('should drop a javascript: formaction', () => {
      const fragment = sanitizeToFragment(
        '<form><button formaction="javascript:alert(1)">b</button></form>'
      );
      expect(allAttributeNames(fragment)).not.toContain('formaction');
    });

    it.each([
      ['script', '<script>alert(1)</script>'],
      ['base', '<base href="https://evil.example/">'],
      ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
      ['object', '<object data="x.swf"></object>'],
      ['embed', '<embed src="x.swf">'],
    ])('should remove a %s element', (name, html) => {
      const tag = name.split(' ')[0]!;
      expect(sanitizeToFragment(`<p>before</p>${html}<p>after</p>`).querySelector(tag)).toBeNull();
    });

    it.each([
      [
        'a raw <details> block the renderer stamps with dir',
        '<details>\n<summary>More</summary>\n\n<img src="x" onerror="alert(1)">\n\n</details>',
      ],
      [
        'a table cell whose HTML the renderer protects and restores',
        '| a | b |\n|---|---|\n| <img src="x" onerror="alert(1)"> | <span onmouseover="alert(2)">c</span> |',
      ],
    ])('should neutralise a payload nested in %s', (_name, markdown) => {
      const rawHtml = new MarkdownRenderer().render(markdown);
      // Guard: the payload really reaches the rendered HTML, so the assertion below is not vacuous.
      expect(rawHtml).toMatch(/on(error|mouseover)=/);

      const attributes = allAttributeNames(sanitizeToFragment(rawHtml));
      expect(attributes.filter(name => name.startsWith('on'))).toEqual([]);
    });

    it.each([
      ['livescript:', '<a href="livescript:alert(1)">x</a>'],
      ['javascript: behind leading whitespace', '<a href="  javascript:alert(1)">x</a>'],
    ])('should drop a %s href even with unknown protocols allowed', (_name, html) => {
      expect(sanitizeToFragment(html).querySelector('a')?.hasAttribute('href')).toBe(false);
    });

    it('should remove a comment that carries markup', () => {
      const fragment = sanitizeToFragment('<p>a<!-- <img src=x onerror=alert(1)> -->b</p>');
      expect(fragment.querySelector('p')?.childNodes).toHaveLength(1);
      expect(fragment.querySelector('p')?.textContent).toBe('ab');
    });

    it('should still drop `-->` in an attribute of an element that is not a diagram placeholder', () => {
      const div = sanitizeToFragment('<div data-note="a --> b">x</div>').querySelector('div');
      expect(div?.hasAttribute('data-note')).toBe(false);
    });

    it('should remove an HTML element named like a MathML one inside MathML (namespace confusion)', () => {
      const fragment = sanitizeToFragment(
        '<math><mo><mi>lim</mi><mo>x</mo></mo></math><p>after</p>'
      );
      expect(fragment.querySelector('mo mi')).toBeNull();
      expect(fragment.querySelector('p')?.textContent).toBe('after');
    });

    it('should log what it removed by name, without the document text', () => {
      sanitizeDocumentHTML('<img src="x" onerror="secretPayload()">');

      expect(logger.log).toHaveBeenCalledTimes(1);
      const message = String(vi.mocked(logger.log).mock.calls[0]?.[0]);
      expect(message).toContain('@onerror');
      expect(message).not.toContain('secretPayload');
    });
  });

  describe('markup MarkView renders today', () => {
    it('should keep an external link opening in a new tab', () => {
      const html = new MarkdownRenderer().render('[site](https://example.com)');
      const anchor = sanitizeToFragment(html).querySelector('a');
      expect(anchor?.getAttribute('href')).toBe('https://example.com');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should complete rel on a raw target="_blank" anchor and keep existing tokens', () => {
      const anchor = sanitizeToFragment(
        '<a href="https://example.com" target="_blank" rel="author">x</a>'
      ).querySelector('a');
      expect(anchor?.getAttribute('rel')?.split(' ').sort()).toEqual([
        'author',
        'noopener',
        'noreferrer',
      ]);
    });

    it('should keep dir on blocks and on a direction wrapper span', () => {
      const fragment = sanitizeToFragment(
        '<p dir="rtl">مرحبا</p><div dir="auto"><span dir="ltr">label</span></div>'
      );
      expect(fragment.querySelector('p')?.getAttribute('dir')).toBe('rtl');
      expect(fragment.querySelector('div')?.getAttribute('dir')).toBe('auto');
      expect(fragment.querySelector('span')?.getAttribute('dir')).toBe('ltr');
    });

    it.each(['images', 'title', 'links', 'forms', 'body', 'scripts', 'children'])(
      'should keep the heading id "%s" (TOC links depend on it)',
      id => {
        expect(sanitizeToFragment(`<h2 id="${id}">${id}</h2>`).querySelector('h2')?.id).toBe(id);
      }
    );

    it('should keep an open details block and task-list checkboxes', () => {
      const fragment = sanitizeToFragment(
        '<details open><summary>s</summary>body</details>' +
          '<ul><li class="task-list-item"><input type="checkbox" checked disabled> done</li></ul>'
      );
      expect(fragment.querySelector('details')?.hasAttribute('open')).toBe(true);
      const checkbox = fragment.querySelector('input');
      expect(checkbox?.getAttribute('type')).toBe('checkbox');
      expect(checkbox?.hasAttribute('checked')).toBe(true);
      expect(checkbox?.hasAttribute('disabled')).toBe(true);
    });

    it("should keep KaTeX's MathML semantics and TeX annotation", () => {
      const html = new MarkdownRenderer().render('Inline $x^2$ math.');
      const fragment = sanitizeToFragment(html);
      expect(fragment.querySelector('math semantics')).not.toBeNull();
      expect(fragment.querySelector('annotation')?.textContent).toBe('x^2');
    });

    it('should keep image loading attributes, inline style and a data:image source', () => {
      const img = sanitizeToFragment(
        '<img src="data:image/png;base64,AAAA" loading="lazy" srcset="a.png 1x" width="10" style="height: 5px">'
      ).querySelector('img');
      expect(img?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
      expect(img?.getAttribute('loading')).toBe('lazy');
      expect(img?.getAttribute('srcset')).toBe('a.png 1x');
      expect(img?.getAttribute('width')).toBe('10');
      expect(img?.getAttribute('style')).toBe('height: 5px');
    });

    it('should keep an https iframe embed with its embed attributes', () => {
      const iframe = sanitizeToFragment(
        '<iframe src="https://www.youtube.com/embed/abc" allow="autoplay" allowfullscreen frameborder="0"></iframe>'
      ).querySelector('iframe');
      expect(iframe?.getAttribute('src')).toBe('https://www.youtube.com/embed/abc');
      expect(iframe?.getAttribute('allow')).toBe('autoplay');
      expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
      expect(iframe?.getAttribute('frameborder')).toBe('0');
    });

    it('should keep data-* and aria-* attributes and a file: link', () => {
      const fragment = sanitizeToFragment(
        '<div data-line="3" aria-label="note" role="note"><a href="file:///home/user/notes.md">notes</a></div>'
      );
      const div = fragment.querySelector('div');
      expect(div?.getAttribute('data-line')).toBe('3');
      expect(div?.getAttribute('aria-label')).toBe('note');
      expect(fragment.querySelector('a')?.getAttribute('href')).toBe('file:///home/user/notes.md');
    });

    it('should keep links with application schemes', () => {
      const fragment = sanitizeToFragment(
        '<a href="vscode:extension/example.ext">vscode</a><a href="obsidian://open?vault=x">obsidian</a>'
      );
      const hrefs = Array.from(fragment.querySelectorAll('a'), anchor =>
        anchor.getAttribute('href')
      );
      expect(hrefs).toEqual(['vscode:extension/example.ext', 'obsidian://open?vault=x']);
    });

    it('should keep a comment without markup, so the text around it is not merged', () => {
      const paragraph = sanitizeToFragment('<p>before<!-- note -->after</p>').querySelector('p');
      expect(paragraph?.childNodes).toHaveLength(3);
      expect(paragraph?.childNodes[1]?.nodeType).toBe(Node.COMMENT_NODE);
    });

    it('should keep a Mermaid source verbatim, arrows and surrounding whitespace included', () => {
      const source = 'graph LR\n  A --> B\n  B --> C\n';
      const placeholder = sanitizeToFragment(
        `<div class="mermaid-placeholder" id="mermaid-1" data-code="${source}"></div>`
      ).querySelector('.mermaid-placeholder');
      expect(placeholder?.getAttribute('data-code')).toBe(source);
      expect(placeholder?.id).toBe('mermaid-1');
    });

    it('should keep the Mermaid placeholder the renderer emits for a fence', () => {
      const html = new MarkdownRenderer().render('```mermaid\ngraph LR\n  A --> B\n```');
      const placeholder = sanitizeToFragment(html).querySelector('.mermaid-placeholder');
      expect(placeholder?.getAttribute('data-code')).toBe('graph LR\n  A --> B');
    });

    it('should keep attribute values untrimmed', () => {
      const img = sanitizeToFragment('<img src="a.png" alt="bold logo ">').querySelector('img');
      expect(img?.getAttribute('alt')).toBe('bold logo ');
    });

    it('should keep an unknown element such as an MDX <Note>, without its handlers', () => {
      const fragment = sanitizeToFragment(
        '<Note onclick="alert(1)"><p>inside</p></Note><p>after</p>'
      );
      const note = fragment.querySelector('note');
      expect(note).not.toBeNull();
      expect(note?.hasAttribute('onclick')).toBe(false);
      expect(note?.querySelector('p')?.textContent).toBe('inside');
    });

    it('should not log when nothing was removed', () => {
      sanitizeDocumentHTML('<p>plain</p>');
      expect(logger.log).not.toHaveBeenCalled();
    });
  });

  describe('isolation from the default DOMPurify instance', () => {
    it('should leave the default instance, which Mermaid uses, without these hooks', () => {
      // The unknown-element hook keeps <Note> on the document instance only.
      expect(DOMPurify.sanitize('<Note>inside</Note>')).toBe('inside');
      expect(sanitizeDocumentHTML('<Note>inside</Note>')).toBe('<note>inside</note>');
    });
  });
});

describe('setDocumentHTML', () => {
  it('should replace the previous children with the sanitized nodes', () => {
    const target = document.createElement('div');
    target.innerHTML = '<p>old</p>';

    setDocumentHTML(target, '<p>new</p><img src="x" onerror="alert(1)">');

    expect(target.querySelector('p')?.textContent).toBe('new');
    expect(target.textContent).not.toContain('old');
    expect(target.querySelector('img')?.hasAttribute('onerror')).toBe(false);
  });

  it('should not add text that was not in the input', () => {
    const target = document.createElement('div');
    setDocumentHTML(target, '<p>one</p><p>two</p>');
    expect(target.textContent).toBe('onetwo');
  });

  it('should leave the target empty for empty or whitespace-only input', () => {
    const target = document.createElement('div');
    target.innerHTML = '<p>old</p>';

    setDocumentHTML(target, '');
    expect(target.childNodes).toHaveLength(0);

    setDocumentHTML(target, '   ');
    expect(target.textContent?.trim()).toBe('');
  });
});
