/**
 * Superscript Plugin
 * Renders x^2^ as x²
 */

import markdownItSup from 'markdown-it-sup';
import type { MarkdownPlugin } from '../types';

export const superscriptPlugin: MarkdownPlugin = {
  id: 'superscript',
  name: 'Superscript',
  version: '2.0.0',
  description: 'Render superscript with ^text^ syntax (e.g., x^2^)',
  category: 'formatting',
  priority: 46,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItSup);
  },
};
