/**
 * Definition List Plugin
 * Provides support for definition lists (dl, dt, dd elements)
 */

import markdownItDeflist from 'markdown-it-deflist';
import type { MarkdownPlugin } from '../types';

export const deflistPlugin: MarkdownPlugin = {
  id: 'deflist',
  name: 'Definition Lists',
  version: '3.0.0', // markdown-it-deflist version
  description: 'Support for definition lists with dl, dt, dd elements',
  category: 'extensions',
  priority: 66,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItDeflist);
  },
};
