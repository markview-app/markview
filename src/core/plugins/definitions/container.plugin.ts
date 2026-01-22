/**
 * Custom Container Plugin
 * Provides support for custom containers with configurable styling
 */

import markdownItContainer from 'markdown-it-container';
import type { MarkdownPlugin } from '../types';

export const containerPlugin: MarkdownPlugin = {
  id: 'container',
  name: 'Custom Containers',
  version: '4.0.0', // markdown-it-container version
  description: 'Create custom block containers with ::: syntax',
  category: 'extensions',
  priority: 67,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    // Register common container types
    const containerTypes = ['info', 'warning', 'danger', 'details', 'spoiler'];

    containerTypes.forEach(type => {
      md.use(markdownItContainer, type, {
        validate: (params: string) => {
          return params.trim().match(new RegExp(`^${type}\\s*(.*)$`));
        },
        render: (tokens: any[], idx: number) => {
          const m = tokens[idx].info.trim().match(new RegExp(`^${type}\\s*(.*)$`));

          if (tokens[idx].nesting === 1) {
            // Opening tag
            const title = m && m[1] ? md.utils.escapeHtml(m[1]) : '';
            return (
              `<div class="custom-container custom-container-${type}">\n` +
              (title ? `<div class="custom-container-title">${title}</div>\n` : '')
            );
          } else {
            // Closing tag
            return '</div>\n';
          }
        },
      });
    });
  },
};
