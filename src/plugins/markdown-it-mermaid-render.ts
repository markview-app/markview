/**
 * Custom Mermaid plugin for markdown-it
 *
 * This plugin renders Mermaid diagrams during the markdown parsing phase,
 * not after DOM injection. This is critical for Chrome extension compatibility.
 */

import type MarkdownIt from 'markdown-it';

/**
 * Generate unique ID for mermaid diagram
 * Simple hash based on content
 */
function generateId(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'mermaid-' + Math.abs(hash).toString(36);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m: string) => map[m] || m);
}

/**
 * Markdown-it Mermaid plugin
 * Note: Theme and config options are handled in mermaid-renderer.ts, not here
 */
export function markdownItMermaidRender(md: MarkdownIt) {
  // Store the original fence renderer
  const defaultFenceRenderer = md.renderer.rules.fence!.bind(md.renderer.rules);

  // Override fence renderer to detect mermaid blocks
  md.renderer.rules.fence = (tokens, idx, renderOptions, env, self) => {
    const token = tokens[idx];
    if (!token) {
      return defaultFenceRenderer(tokens, idx, renderOptions, env, self);
    }

    const code = token.content.trim();
    const language = token.info.trim();

    // Check if this is a mermaid block
    if (language === 'mermaid') {
      const id = generateId(code);

      // Output a placeholder div with the code in a data attribute
      // The actual rendering will be handled by src/utils/mermaid-renderer.ts
      return `<div class="mermaid-placeholder" id="${id}" data-code="${escapeHtml(code)}"></div>`;
    }

    // Use default renderer for other code blocks
    return defaultFenceRenderer(tokens, idx, renderOptions, env, self);
  };
}
