/**
 * Advanced Tables Plugin
 * Provides extended table features including multiline, rowspan, headerless
 */

import markdownItMultimdTable from 'markdown-it-multimd-table';
import type { MarkdownPlugin } from '../types';

export const tablesPlugin: MarkdownPlugin = {
  id: 'tables',
  name: 'Advanced Tables',
  version: '7.0.0', // markdown-it-multimd-table version
  description: 'Extended table features: multiline cells, rowspan, headerless tables',
  category: 'core',
  priority: 10,
  enabledByDefault: true,
  requiresPro: false,
  settingsKey: 'tables', // Maps to existing setting

  install(md) {
    md.use(markdownItMultimdTable, {
      multiline: true,
      rowspan: true,
      headerless: true,
      multibody: false,
      autolabel: true,
      enableMultilineRows: true,
      enableRowspan: true,
    });
  },
};
