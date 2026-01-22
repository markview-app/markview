/**
 * Mark Plugin
 * Renders ==marked== as <mark>marked</mark>
 */

import markdownItMark from 'markdown-it-mark';
import type { MarkdownPlugin } from '../types';

export const markPlugin: MarkdownPlugin = {
  id: 'mark',
  name: 'Highlight',
  version: '4.0.0',
  description: 'Render highlighted text with ==text== syntax',
  category: 'formatting',
  priority: 48,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItMark);
  },
};
