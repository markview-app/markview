// MarkView Markdown Rendering Engine
// Converts markdown text to HTML using markdown-it

import { logger } from '@utils/logger';
import { highlightCodeSync } from '@utils/highlight-loader';
import MarkdownIt from 'markdown-it';
import { PluginManager } from './plugins';

/**
 * Renderer options interface
 * @deprecated Use enabledPlugins/disabledPlugins instead of boolean flags
 */
export interface MarkdownRendererOptions {
  // === LEGACY OPTIONS (for backward compatibility) ===
  /** @deprecated Use disabledPlugins: ['highlight'] instead */
  highlight?: boolean;
  /** @deprecated Use disabledPlugins: ['tables'] instead */
  tables?: boolean;
  /** @deprecated Use disabledPlugins: ['taskLists'] instead */
  taskLists?: boolean;
  /** @deprecated Use disabledPlugins: ['katex'] instead */
  math?: boolean;
  /** @deprecated Use disabledPlugins: ['mermaid'] instead */
  mermaid?: boolean;
  /** @deprecated Use disabledPlugins: ['emoji'] instead */
  emoji?: boolean;
  /** @deprecated Use disabledPlugins: ['footnote', 'subscript', ...] instead */
  extendedMarkdown?: boolean;

  // === CORE MARKDOWN-IT OPTIONS ===
  html?: boolean;
  breaks?: boolean;
  linkify?: boolean;
  typographer?: boolean;

  // === NEW PLUGIN SYSTEM OPTIONS ===
  /** List of plugin IDs to enable (if undefined, uses defaults) */
  enabledPlugins?: string[];
  /** List of plugin IDs to disable */
  disabledPlugins?: string[];
}

/**
 * Convert legacy boolean options to disabled plugins list
 */
function convertLegacyOptions(options: MarkdownRendererOptions): string[] {
  const disabled: string[] = [];

  // Map legacy boolean options to plugin IDs
  if (options.highlight === false) {
    // Highlight is handled separately by markdown-it, not a plugin
  }
  if (options.tables === false) disabled.push('tables');
  if (options.taskLists === false) disabled.push('taskLists');
  if (options.math === false) disabled.push('katex');
  if (options.mermaid === false) disabled.push('mermaid');
  if (options.emoji === false) disabled.push('emoji');
  if (options.extendedMarkdown === false) {
    disabled.push('subscript', 'superscript', 'footnote', 'abbreviation', 'insertion', 'mark');
  }

  return disabled;
}

export class MarkdownRenderer {
  private md: MarkdownIt;
  private pluginManager: PluginManager;

  constructor(options: MarkdownRendererOptions = {}) {
    // Initialize markdown-it with core options
    this.md = new MarkdownIt({
      html: options.html ?? true,
      linkify: options.linkify ?? true,
      breaks: options.breaks ?? false, // Use CommonMark behavior: single newlines = spaces, only <br> or 2 trailing spaces create breaks
      typographer: options.typographer ?? true,
      highlight: options.highlight !== false ? this.highlightCode.bind(this) : undefined,
    });

    // Determine disabled plugins
    const legacyDisabled = convertLegacyOptions(options);
    const explicitDisabled = options.disabledPlugins || [];
    const allDisabled = [...new Set([...legacyDisabled, ...explicitDisabled])];

    // Disable built-in table parser if tables are explicitly disabled
    // If tables are enabled, the advanced tables plugin will be installed alongside the built-in parser
    if (options.tables === false || allDisabled.includes('tables')) {
      this.md.disable(['table']);
    }

    // Initialize plugin manager
    this.pluginManager = new PluginManager(this.md);

    // Install plugins
    this.pluginManager.installPlugins(options.enabledPlugins, allDisabled);

    // Setup custom renderers (these are not plugins, they're markdown-it renderer rules)
    this.setupCustomRenderers();
  }

  /**
   * Setup custom markdown-it renderer rules
   * These handle link targets and image lazy loading
   */
  private setupCustomRenderers(): void {
    // External links open in new tab
    this.md.renderer.rules.link_open = (tokens, idx, _options, _env, self) => {
      const token = tokens[idx];
      if (token) {
        const href = token.attrGet('href') || '';
        const isExternal =
          href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');

        if (isExternal) {
          token.attrSet('target', '_blank');
          token.attrSet('rel', 'noopener noreferrer');
        }
      }
      return self.renderToken(tokens, idx, {});
    };

    // Images: defer relative paths, add lazy loading
    this.md.renderer.rules.image = (tokens, idx, _options, _env, self) => {
      const token = tokens[idx];
      if (token) {
        const src = token.attrGet('src') || '';
        const isRelative =
          src &&
          !src.startsWith('http://') &&
          !src.startsWith('https://') &&
          !src.startsWith('file://') &&
          !src.startsWith('blob:') &&
          !src.startsWith('data:');

        if (isRelative) {
          token.attrSet('data-src', src);
          token.attrSet('src', '');
          logger.log('[MarkdownRenderer] Deferred relative image:', src);
        }
        token.attrSet('loading', 'lazy');

        // Convert HTML height/width attributes to inline styles to prevent CSS override
        // The global CSS rule `height: auto` overrides HTML attributes
        const height = token.attrGet('height');
        const width = token.attrGet('width');
        const existingStyle = token.attrGet('style') || '';

        const styleRules: string[] = [];
        if (existingStyle) {
          styleRules.push(existingStyle);
        }

        if (height) {
          // Add 'px' unit if height is a number
          const heightValue = /^\d+$/.test(height) ? `${height}px` : height;
          styleRules.push(`height: ${heightValue}`);
        }

        if (width) {
          // Add 'px' unit if width is a number
          const widthValue = /^\d+$/.test(width) ? `${width}px` : width;
          styleRules.push(`width: ${widthValue}`);
        }

        if (styleRules.length > 0) {
          token.attrSet('style', styleRules.join('; '));
        }
      }
      return self.renderToken(tokens, idx, {});
    };
  }

  /**
   * Highlight code blocks using highlight.js
   */
  private highlightCode(code: string, language: string): string {
    if (!language) {
      return this.md.utils.escapeHtml(code);
    }
    return highlightCodeSync(code, language);
  }

  /**
   * Fix HTML image dimensions by converting height/width attributes to inline styles
   * This prevents CSS `height: auto` from overriding HTML attributes
   */
  private fixImageDimensions(html: string): string {
    return html.replace(/<img([^>]*?)>/gi, (match, attributes) => {
      // Extract height and width attributes
      const heightMatch = attributes.match(/\bheight=["']?(\d+(?:px|%|em|rem)?)?["']?/i);
      const widthMatch = attributes.match(/\bwidth=["']?(\d+(?:px|%|em|rem)?)?["']?/i);

      if (!heightMatch && !widthMatch) {
        return match; // No dimensions to fix
      }

      const styleRules: string[] = [];

      // Extract existing style attribute
      const existingStyleMatch = attributes.match(/\bstyle=["']([^"']*)["']/i);
      if (existingStyleMatch) {
        styleRules.push(existingStyleMatch[1]);
      }

      // Add height to style
      if (heightMatch) {
        const height = heightMatch[1];
        const heightValue = /^\d+$/.test(height) ? `${height}px` : height;
        styleRules.push(`height: ${heightValue}`);
      }

      // Add width to style
      if (widthMatch) {
        const width = widthMatch[1];
        const widthValue = /^\d+$/.test(width) ? `${width}px` : width;
        styleRules.push(`width: ${widthValue}`);
      }

      // Rebuild the img tag with inline styles
      let newAttributes = attributes;

      // Remove or update existing style attribute
      if (existingStyleMatch) {
        newAttributes = newAttributes.replace(/\bstyle=["'][^"']*["']/i, '');
      }

      // Add new style attribute
      const styleValue = styleRules.join('; ');
      newAttributes = `${newAttributes} style="${styleValue}"`;

      return `<img${newAttributes}>`;
    });
  }

  /**
   * Render markdown to HTML
   */
  render(markdown: string): string {
    try {
      // Run plugin preprocess hooks
      let processedMarkdown = this.pluginManager.preprocess(markdown);

      // Protect HTML in table cells
      processedMarkdown = this.protectTableHTML(processedMarkdown);

      // Render
      let html = this.md.render(processedMarkdown);

      // Restore protected HTML
      html = this.restoreTableHTML(html);
      html = this.postProcessTableHTML(html);

      // Convert HTML img height/width attributes to inline styles
      html = this.fixImageDimensions(html);

      // Run plugin postprocess hooks
      html = this.pluginManager.postprocess(html);

      return html;
    } catch (err) {
      logger.error('MarkView: Failed to render markdown', err);
      return '<p>Error rendering markdown. See console for details.</p>';
    }
  }

  /**
   * Render inline markdown (without wrapping <p> tags)
   */
  renderInline(markdown: string): string {
    try {
      return this.md.renderInline(markdown);
    } catch (err) {
      logger.error('MarkView: Failed to render inline markdown', err);
      return 'Error rendering markdown';
    }
  }

  /**
   * Get the markdown-it instance for advanced usage
   */
  getMarkdownIt(): MarkdownIt {
    return this.md;
  }

  /**
   * Get the plugin manager
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Check if a specific plugin is active
   */
  isPluginActive(pluginId: string): boolean {
    return this.pluginManager.isPluginActive(pluginId);
  }

  /**
   * Cleanup renderer and plugins
   */
  destroy(): void {
    this.pluginManager.cleanup();
  }

  // === TABLE HTML PROTECTION (unchanged from original) ===

  private protectTableHTML(markdown: string): string {
    const lines = markdown.split('\n');
    const processedLines = lines.map(line => {
      // Only process table rows
      if (!line.includes('|')) {
        return line;
      }

      // Don't protect HTML tags inside backticks (inline code)
      // Split by backticks to identify code spans
      const parts: string[] = [];
      let inCode = false;
      let lastIndex = 0;

      for (let i = 0; i < line.length; i++) {
        if (line[i] === '`') {
          if (inCode) {
            // End of code span - keep as-is
            parts.push(line.slice(lastIndex, i + 1));
            lastIndex = i + 1;
          } else {
            // Start of code span - protect non-code part
            const nonCodePart = line.slice(lastIndex, i);
            parts.push(this.protectHTMLTags(nonCodePart));
            lastIndex = i;
          }
          inCode = !inCode;
        }
      }

      // Handle remaining text after last backtick
      const remaining = line.slice(lastIndex);
      parts.push(inCode ? remaining : this.protectHTMLTags(remaining));

      return parts.join('');
    });
    return processedLines.join('\n');
  }

  private protectHTMLTags(text: string): string {
    return text
      .replace(/<ul>/g, '｟ul｠')
      .replace(/<\/ul>/g, '｟/ul｠')
      .replace(/<ol>/g, '｟ol｠')
      .replace(/<\/ol>/g, '｟/ol｠')
      .replace(/<li>/g, '｟li｠')
      .replace(/<\/li>/g, '｟/li｠')
      .replace(/<p>/g, '｟p｠')
      .replace(/<\/p>/g, '｟/p｠');
  }

  private restoreTableHTML(html: string): string {
    return html
      .replace(/｟ul｠/g, '<ul>')
      .replace(/｟\/ul｠/g, '</ul>')
      .replace(/｟ol｠/g, '<ol>')
      .replace(/｟\/ol｠/g, '</ol>')
      .replace(/｟li｠/g, '<li>')
      .replace(/｟\/li｠/g, '</li>')
      .replace(/｟p｠/g, '<p>')
      .replace(/｟\/p｠/g, '</p>');
  }

  private postProcessTableHTML(html: string): string {
    let processed = html;

    // Only unescape specific HTML tags that were protected for table cells
    // Do NOT unescape HTML inside <code> tags to preserve inline code display
    const unescapeProtectedTags = (content: string): string => {
      // Check if content has <code> tags - if so, only unescape outside code blocks
      if (content.includes('<code>')) {
        // Split by code tags and only process non-code parts
        const parts: string[] = [];
        let lastIndex = 0;
        const codeRegex = /<code[^>]*>.*?<\/code>/g;
        let match;

        while ((match = codeRegex.exec(content)) !== null) {
          // Process text before code tag
          if (match.index > lastIndex) {
            parts.push(this.unescapeProtectedHTML(content.slice(lastIndex, match.index)));
          }
          // Keep code tag as-is (escaped)
          parts.push(match[0]);
          lastIndex = match.index + match[0].length;
        }

        // Process remaining text after last code tag
        if (lastIndex < content.length) {
          parts.push(this.unescapeProtectedHTML(content.slice(lastIndex)));
        }

        return parts.join('');
      }

      // No code tags, safe to unescape protected HTML
      return this.unescapeProtectedHTML(content);
    };

    processed = processed.replace(/<th([^>]*)>([\s\S]*?)<\/th>/g, (match, attrs, content) => {
      if (content.includes('&lt;')) {
        return `<th${attrs}>${unescapeProtectedTags(content)}</th>`;
      }
      return match;
    });

    processed = processed.replace(/<td([^>]*)>([\s\S]*?)<\/td>/g, (match, attrs, content) => {
      if (content.includes('&lt;')) {
        return `<td${attrs}>${unescapeProtectedTags(content)}</td>`;
      }
      return match;
    });

    return processed;
  }

  /**
   * Unescape only the specific HTML tags that were protected for table cells
   * This preserves inline code and other escaped HTML
   */
  private unescapeProtectedHTML(text: string): string {
    return text
      .replace(/&lt;ul&gt;/g, '<ul>')
      .replace(/&lt;\/ul&gt;/g, '</ul>')
      .replace(/&lt;ol&gt;/g, '<ol>')
      .replace(/&lt;\/ol&gt;/g, '</ol>')
      .replace(/&lt;li&gt;/g, '<li>')
      .replace(/&lt;\/li&gt;/g, '</li>')
      .replace(/&lt;p&gt;/g, '<p>')
      .replace(/&lt;\/p&gt;/g, '</p>');
  }
}

// === RENDERER CACHING (NEW) ===

/**
 * Cache of renderer instances by configuration hash
 * Prevents creating new instances for identical configurations
 */
const rendererCache = new Map<string, MarkdownRenderer>();
const MAX_CACHE_SIZE = 5; // Keep at most 5 different configurations

/**
 * Generate cache key from options
 */
function getOptionsCacheKey(options: MarkdownRendererOptions): string {
  // Sort keys for consistent hashing
  const sortedOptions = Object.keys(options)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = (options as Record<string, unknown>)[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  return JSON.stringify(sortedOptions);
}

/**
 * Get or create a renderer with the given options
 * Uses caching to avoid recreating renderers with identical configurations
 */
function getRenderer(options: MarkdownRendererOptions = {}): MarkdownRenderer {
  const cacheKey = getOptionsCacheKey(options);

  if (rendererCache.has(cacheKey)) {
    return rendererCache.get(cacheKey)!;
  }

  // Evict oldest entry if cache is full
  if (rendererCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = rendererCache.keys().next().value;
    if (oldestKey) {
      const oldRenderer = rendererCache.get(oldestKey);
      oldRenderer?.destroy();
      rendererCache.delete(oldestKey);
    }
  }

  const renderer = new MarkdownRenderer(options);
  rendererCache.set(cacheKey, renderer);
  return renderer;
}

// === PUBLIC API (backward compatible) ===

const DEFAULT_RENDERER_OPTIONS: MarkdownRendererOptions = {
  highlight: true,
  tables: true,
  taskLists: true,
  breaks: false, // CommonMark: single newlines = spaces, only explicit breaks work
  linkify: true,
  math: true,
  mermaid: true,
  emoji: true,
  extendedMarkdown: true,
};

/**
 * Default renderer instance
 * @deprecated Use renderMarkdown() function instead for caching benefits
 */
export let defaultRenderer = new MarkdownRenderer(DEFAULT_RENDERER_OPTIONS);

/**
 * Quick render function with optional custom settings
 * Uses renderer caching for performance
 */
export function renderMarkdown(
  markdown: string,
  options?: Partial<MarkdownRendererOptions>
): string {
  const mergedOptions = { ...DEFAULT_RENDERER_OPTIONS, ...options };
  const renderer = getRenderer(mergedOptions);

  // Update defaultRenderer for backward compatibility
  // (some code might access defaultRenderer directly)
  defaultRenderer = renderer;

  return renderer.render(markdown);
}

/**
 * Quick inline render function using default renderer
 */
export function renderMarkdownInline(markdown: string): string {
  return defaultRenderer.renderInline(markdown);
}

/**
 * Clear renderer cache (useful for testing or memory cleanup)
 */
export function clearRendererCache(): void {
  for (const renderer of rendererCache.values()) {
    renderer.destroy();
  }
  rendererCache.clear();
}
