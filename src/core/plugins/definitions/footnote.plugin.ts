/**
 * Footnote Plugin
 * Adds support for footnotes [^1]
 */

import markdownItFootnote from 'markdown-it-footnote';
import type { MarkdownPlugin } from '../types';

export const footnotePlugin: MarkdownPlugin = {
  id: 'footnote',
  name: 'Footnotes',
  version: '4.0.0', // markdown-it-footnote version
  description: 'Add footnotes with [^1] syntax',
  category: 'extensions',
  priority: 60,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItFootnote);
  },
};
