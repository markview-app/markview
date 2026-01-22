/**
 * Mermaid Diagrams Plugin
 * Renders Mermaid diagrams with placeholder generation
 * Actual rendering happens in src/utils/mermaid-renderer.ts
 */

import { markdownItMermaidRender } from '@plugins/markdown-it-mermaid-render';
import type { MarkdownPlugin } from '../types';

export const mermaidPlugin: MarkdownPlugin = {
  id: 'mermaid',
  name: 'Mermaid Diagrams',
  version: '11.4.0', // Mermaid library version
  description: 'Render flowcharts, sequence diagrams, class diagrams, and more',
  category: 'content',
  priority: 25,
  enabledByDefault: true,
  requiresPro: false, // First diagram is FREE, additional diagrams may require PRO

  install(md) {
    // @ts-ignore - Type mismatch between markdown-it versions
    md.use(markdownItMermaidRender);
  },
};
