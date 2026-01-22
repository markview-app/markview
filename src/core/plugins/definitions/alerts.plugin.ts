/**
 * GitHub-Style Alerts Plugin
 * Renders special blockquote syntax as styled alert boxes
 */

import { alert } from '@mdit/plugin-alert';
import type { MarkdownPlugin } from '../types';

export const alertsPlugin: MarkdownPlugin = {
  id: 'alerts',
  name: 'GitHub Alerts',
  version: '0.14.0', // @mdit/plugin-alert version
  description: 'Render [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION] blocks',
  category: 'content',
  priority: 30,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    md.use(alert, {
      alertNames: ['note', 'tip', 'important', 'warning', 'caution'],
    });
  },
};
