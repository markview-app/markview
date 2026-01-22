/**
 * Task Lists Plugin
 * Renders GitHub-style task lists (checkboxes)
 */

import markdownItTaskLists from 'markdown-it-task-lists';
import type { MarkdownPlugin } from '../types';

export const taskListsPlugin: MarkdownPlugin = {
  id: 'taskLists',
  name: 'Task Lists',
  version: '2.1.1', // markdown-it-task-lists version
  description: 'Render GitHub-style task lists with checkboxes',
  category: 'core',
  priority: 15,
  enabledByDefault: true,
  requiresPro: false,
  settingsKey: 'taskLists',

  install(md) {
    md.use(markdownItTaskLists, {
      enabled: true,
      label: false,
    });
  },
};
