/**
 * Emoji Plugin
 * Converts emoji shortcodes to unicode emoji
 */

import * as markdownItEmoji from 'markdown-it-emoji';
import type { MarkdownPlugin } from '../types';

export const emojiPlugin: MarkdownPlugin = {
  id: 'emoji',
  name: 'Emoji',
  version: '3.0.0', // markdown-it-emoji version
  description: 'Convert emoji shortcodes like :smile: to unicode emoji',
  category: 'formatting',
  priority: 50,
  enabledByDefault: true,
  requiresPro: false,

  install(md) {
    // @ts-ignore - Type mismatch
    md.use(markdownItEmoji.full);
  },
};
