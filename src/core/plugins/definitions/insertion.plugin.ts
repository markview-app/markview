/**
 * Insertion Plugin
 * Renders ++inserted++ as <ins>inserted</ins>
 */

import markdownItIns from 'markdown-it-ins';
import type { MarkdownPlugin } from '../types';

export const insertionPlugin: MarkdownPlugin = {
  id: 'insertion',
  name: 'Insertion',
  version: '4.0.0',
  description: 'Render insertion with ++text++ syntax',
  category: 'formatting',
  priority: 47,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItIns);
  },
};
