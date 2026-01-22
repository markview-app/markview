/**
 * Markdown Renderer Tests
 * Tests for refactored MarkdownRenderer with plugin system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MarkdownRenderer,
  renderMarkdown,
  renderMarkdownInline,
  clearRendererCache,
} from '@core/markdown';

// Mock LicenseManager
vi.mock('@core/license-manager', () => ({
  LicenseManager: {
    getInstance: () => ({
      getTier: () => 'free',
    }),
  },
}));

// Mock logger
vi.mock('@utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock highlight loader
vi.mock('@utils/highlight-loader', () => ({
  highlightCodeSync: (code: string) => code,
}));

describe('MarkdownRenderer (Refactored)', () => {
  beforeEach(() => {
    clearRendererCache();
  });

  describe('Constructor', () => {
    it('should create a renderer with default options', () => {
      const renderer = new MarkdownRenderer();
      expect(renderer).toBeDefined();
      expect(renderer).toBeInstanceOf(MarkdownRenderer);
    });

    it('should create renderer with custom options', () => {
      const renderer = new MarkdownRenderer({
        highlight: false,
        tables: false,
      });
      expect(renderer).toBeDefined();
    });

    it('should accept legacy boolean options', () => {
      const renderer = new MarkdownRenderer({
        tables: false,
        taskLists: false,
        math: false,
      });
      expect(renderer).toBeDefined();
    });

    it('should accept new plugin system options', () => {
      const renderer = new MarkdownRenderer({
        enabledPlugins: ['tables', 'taskLists'],
      });
      expect(renderer).toBeDefined();
    });

    it('should accept disabled plugins list', () => {
      const renderer = new MarkdownRenderer({
        disabledPlugins: ['mermaid', 'emoji'],
      });
      expect(renderer).toBeDefined();
    });
  });

  describe('Basic Rendering', () => {
    it('should render simple markdown', () => {
      const renderer = new MarkdownRenderer();
      const html = renderer.render('# Hello World');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello World');
    });

    it('should render paragraphs', () => {
      const renderer = new MarkdownRenderer();
      const html = renderer.render('This is a paragraph.');
      expect(html).toContain('<p>');
      expect(html).toContain('This is a paragraph.');
    });

    it('should render lists', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = renderer.render(markdown);
      expect(html).toContain('<ul');
      expect(html).toContain('<li>');
      expect(html).toContain('Item 1');
    });

    it('should render code blocks', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = renderer.render(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('<code');
    });

    it('should handle empty input', () => {
      const renderer = new MarkdownRenderer();
      const html = renderer.render('');
      expect(html).toBe('');
    });

    it('should handle rendering errors gracefully', () => {
      const renderer = new MarkdownRenderer();
      // Even with potentially problematic input, shouldn't crash
      const html = renderer.render('# Test\n\n<script>alert("test")</script>');
      expect(typeof html).toBe('string');
    });
  });

  describe('Plugin Integration', () => {
    it('should render tables when enabled', () => {
      const renderer = new MarkdownRenderer({ tables: true });
      const markdown = '| Header |\n|--------|\n| Cell   |';
      const html = renderer.render(markdown);
      // Verify plugin is active
      expect(renderer.isPluginActive('tables')).toBe(true);
      expect(html).toBeTruthy();
    });

    it('should disable tables when explicitly set to false', () => {
      const renderer = new MarkdownRenderer({ tables: false });
      // Verify plugin is inactive
      expect(renderer.isPluginActive('tables')).toBe(false);
    });

    it('should render task lists when enabled', () => {
      const renderer = new MarkdownRenderer({ taskLists: true });
      const markdown = '- [ ] Todo\n- [x] Done';
      const html = renderer.render(markdown);
      expect(html).toContain('checkbox');
    });

    it('should render emoji when enabled', () => {
      const renderer = new MarkdownRenderer({ emoji: true });
      const markdown = ':smile:';
      const html = renderer.render(markdown);
      expect(html).toContain('😄');
    });

    it('should render subscript when enabled', () => {
      const renderer = new MarkdownRenderer({ extendedMarkdown: true });
      const markdown = 'H~2~O';
      const html = renderer.render(markdown);
      expect(html).toContain('<sub>');
    });

    it('should render superscript when enabled', () => {
      const renderer = new MarkdownRenderer({ extendedMarkdown: true });
      const markdown = 'x^2^';
      const html = renderer.render(markdown);
      expect(html).toContain('<sup>');
    });

    it('should render footnotes when enabled', () => {
      const renderer = new MarkdownRenderer({ extendedMarkdown: true });
      const markdown = 'Text[^1]\n\n[^1]: Footnote';
      const html = renderer.render(markdown);
      expect(html).toContain('footnote');
    });
  });

  describe('Plugin Manager Access', () => {
    it('should provide access to plugin manager', () => {
      const renderer = new MarkdownRenderer();
      const manager = renderer.getPluginManager();
      expect(manager).toBeDefined();
    });

    it('should check if plugin is active', () => {
      const renderer = new MarkdownRenderer({ enabledPlugins: ['tables'] });
      expect(renderer.isPluginActive('tables')).toBe(true);
    });

    it('should return false for inactive plugin', () => {
      const renderer = new MarkdownRenderer({ disabledPlugins: ['tables'] });
      expect(renderer.isPluginActive('tables')).toBe(false);
    });
  });

  describe('Custom Renderers', () => {
    it('should open external links in new tab', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '[Link](https://example.com)';
      const html = renderer.render(markdown);
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('should not add target to internal links', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '[Link](/internal)';
      const html = renderer.render(markdown);
      expect(html).not.toContain('target="_blank"');
    });

    it('should defer relative image loading', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '![Alt](./image.png)';
      const html = renderer.render(markdown);
      expect(html).toContain('data-src');
      expect(html).toContain('loading="lazy"');
    });

    it('should not defer absolute image URLs', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '![Alt](https://example.com/image.png)';
      const html = renderer.render(markdown);
      expect(html).toContain('src="https://example.com/image.png"');
    });

    it('should convert HTML height attribute to inline style', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '<img src="test.jpg" height="150">';
      const html = renderer.render(markdown);
      expect(html).toContain('style="height: 150px"');
    });

    it('should convert HTML width attribute to inline style', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '<img src="test.jpg" width="200">';
      const html = renderer.render(markdown);
      expect(html).toContain('style="width: 200px"');
    });

    it('should convert both height and width attributes to inline styles', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '<img src="test.jpg" height="150" width="200">';
      const html = renderer.render(markdown);
      expect(html).toContain('height: 150px');
      expect(html).toContain('width: 200px');
    });

    it('should preserve existing inline styles when adding dimension styles', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '<img src="test.jpg" height="150" style="border: 1px solid red;">';
      const html = renderer.render(markdown);
      expect(html).toContain('border: 1px solid red');
      expect(html).toContain('height: 150px');
    });

    it('should handle height/width with units already specified', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '<img src="test.jpg" height="150px" width="50%">';
      const html = renderer.render(markdown);
      expect(html).toContain('height: 150px');
      expect(html).toContain('width: 50%');
    });
  });

  describe('Inline Rendering', () => {
    it('should render inline markdown without <p> tags', () => {
      const renderer = new MarkdownRenderer();
      const html = renderer.renderInline('**bold** text');
      expect(html).toContain('<strong>');
      expect(html).not.toContain('<p>');
    });

    it('should handle inline rendering errors', () => {
      const renderer = new MarkdownRenderer();
      const html = renderer.renderInline('# Not inline');
      expect(typeof html).toBe('string');
    });
  });

  describe('Renderer Caching', () => {
    it('should cache renderers with same options', () => {
      const html1 = renderMarkdown('# Test', { tables: true });
      const html2 = renderMarkdown('# Test', { tables: true });
      expect(html1).toBe(html2);
    });

    it('should create different renderers for different options', () => {
      clearRendererCache();
      renderMarkdown('# Test', { tables: true });
      renderMarkdown('# Test', { tables: false });
      // Both should work without errors
      expect(true).toBe(true);
    });

    it('should clear cache on demand', () => {
      renderMarkdown('# Test', { tables: true });
      clearRendererCache();
      // Should work after clearing cache
      const html = renderMarkdown('# Test', { tables: true });
      expect(html).toContain('<h1');
    });
  });

  describe('Legacy API Compatibility', () => {
    it('should support renderMarkdown function', () => {
      const html = renderMarkdown('# Hello');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello');
    });

    it('should support renderMarkdownInline function', () => {
      const html = renderMarkdownInline('**bold**');
      expect(html).toContain('<strong>');
    });

    it('should merge options with defaults', () => {
      const html = renderMarkdown('# Test', { tables: false });
      expect(typeof html).toBe('string');
    });
  });

  describe('Table HTML Protection', () => {
    it('should protect HTML in table cells', () => {
      const renderer = new MarkdownRenderer();
      const markdown = '| Header |\n|--------|\n| <ul><li>Item</li></ul> |';
      const html = renderer.render(markdown);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup plugin manager on destroy', () => {
      const renderer = new MarkdownRenderer();
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('should be safe to destroy multiple times', () => {
      const renderer = new MarkdownRenderer();
      renderer.destroy();
      renderer.destroy();
      expect(true).toBe(true);
    });
  });

  describe('Legacy Options Conversion', () => {
    it('should convert tables:false to disabled plugin', () => {
      const renderer = new MarkdownRenderer({ tables: false });
      expect(renderer.isPluginActive('tables')).toBe(false);
    });

    it('should convert taskLists:false to disabled plugin', () => {
      const renderer = new MarkdownRenderer({ taskLists: false });
      expect(renderer.isPluginActive('taskLists')).toBe(false);
    });

    it('should convert math:false to disabled katex plugin', () => {
      const renderer = new MarkdownRenderer({ math: false });
      expect(renderer.isPluginActive('katex')).toBe(false);
    });

    it('should convert mermaid:false to disabled plugin', () => {
      const renderer = new MarkdownRenderer({ mermaid: false });
      expect(renderer.isPluginActive('mermaid')).toBe(false);
    });

    it('should convert emoji:false to disabled plugin', () => {
      const renderer = new MarkdownRenderer({ emoji: false });
      expect(renderer.isPluginActive('emoji')).toBe(false);
    });

    it('should convert extendedMarkdown:false to multiple disabled plugins', () => {
      const renderer = new MarkdownRenderer({ extendedMarkdown: false });
      expect(renderer.isPluginActive('subscript')).toBe(false);
      expect(renderer.isPluginActive('superscript')).toBe(false);
      expect(renderer.isPluginActive('footnote')).toBe(false);
    });
  });

  describe('Markdown-It Access', () => {
    it('should provide access to markdown-it instance', () => {
      const renderer = new MarkdownRenderer();
      const md = renderer.getMarkdownIt();
      expect(md).toBeDefined();
      expect(md.render).toBeDefined();
    });
  });
});
