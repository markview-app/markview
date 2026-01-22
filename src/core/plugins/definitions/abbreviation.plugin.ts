/**
 * Abbreviation Plugin
 * Adds support for abbreviations with hover tooltips
 */

import markdownItAbbr from 'markdown-it-abbr';
import type { MarkdownPlugin } from '../types';

export const abbreviationPlugin: MarkdownPlugin = {
  id: 'abbreviation',
  name: 'Abbreviations',
  version: '2.0.0',
  description: 'Define abbreviations with *[abbr]: definition syntax',
  category: 'extensions',
  priority: 65,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(markdownItAbbr);
  },
};
