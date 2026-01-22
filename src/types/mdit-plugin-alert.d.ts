// Type definitions for @mdit/plugin-alert
// This plugin adds GitHub-style alerts/callouts support

declare module '@mdit/plugin-alert' {
  import type MarkdownIt from 'markdown-it';

  interface AlertOptions {
    /**
     * Alert types to support
     * Default: ['note', 'tip', 'important', 'warning', 'caution']
     */
    alertNames?: string[];

    /**
     * Opening marker
     * Default: '!'
     */
    openMarker?: string;

    /**
     * Closing marker
     * Default: '!'
     */
    closeMarker?: string;

    /**
     * Custom title resolver
     */
    titleResolver?: (type: string) => string;
  }

  /**
   * GitHub-style alerts plugin for markdown-it
   *
   * Syntax:
   * ```markdown
   * > [!NOTE]
   * > This is a note
   *
   * > [!IMPORTANT]
   * > This is important
   *
   * > [!WARNING]
   * > This is a warning
   * ```
   */
  export function alert(md: MarkdownIt, options?: AlertOptions): void;
}
