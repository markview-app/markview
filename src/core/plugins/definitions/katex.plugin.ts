/**
 * KaTeX Math Plugin
 * Renders LaTeX math equations using KaTeX
 */

import markdownItKatex from '@iktakahiro/markdown-it-katex';
import type { MarkdownPlugin } from '../types';

export const katexPlugin: MarkdownPlugin = {
  id: 'katex',
  name: 'Math Equations',
  version: '0.16.25', // KaTeX version
  description: 'Render LaTeX math equations ($...$ inline, $$...$$ display)',
  category: 'content',
  priority: 20,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItKatex, {
      throwOnError: false,
      errorColor: '#cc0000',
    });
  },
};
