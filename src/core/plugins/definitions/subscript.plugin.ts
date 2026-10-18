/**
 * Subscript Plugin
 * Renders H~2~O as H₂O
 */

import markdownItSub from 'markdown-it-sub';
import type { MarkdownPlugin } from '../types';

export const subscriptPlugin: MarkdownPlugin = {
  id: 'subscript',
  name: 'Subscript',
  version: '2.0.0',
  description: 'Render subscript with ~text~ syntax (e.g., H~2~O)',
  category: 'formatting',
  priority: 45,
  enabledByDefault: true,

  install(md) {
    md.use(markdownItSub);
  },
};
