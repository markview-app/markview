// MarkView Raw/Rendered View Toggle Component
import { extractMarkdownSource } from '@utils/dom';
import { showNotification } from '@utils/notification';
import { keyboardManager } from '@utils/keyboard-shortcuts';
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

export class RawToggle {
  private isRawView: boolean = false;
  private renderedContent: string = '';
  private rawContent: string = '';
  private container: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    logger.log('[RawToggle] Initializing...');
    this.container = document.getElementById('markview-container');
    if (!this.container) {
      logger.warn(
        '[RawToggle] Container not found at init time, but setting up event listeners anyway'
      );
      // Still setup event listeners even if container doesn't exist yet
      // This is important for the custom event from ActionButtons
      this.setupListeners();
      return;
    }

    // Store the rendered content
    this.renderedContent = this.container.innerHTML;

    // Extract raw markdown
    this.rawContent = extractMarkdownSource() || '';

    this.setupListeners();
  }

  private setupListeners(): void {
    logger.log('[RawToggle] Setting up event listeners');
    // Listen for custom event from ActionButtons menu
    document.addEventListener('markview:toggleRawView', () => {
      logger.log('[RawToggle] Received markview:toggleRawView event');
      this.toggle();
    });

    // Keyboard shortcut: Ctrl+Shift+M (or Cmd+Shift+M on Mac)
    // Changed from Ctrl+Shift+R to avoid conflict with browser's "Hard reload"
    keyboardManager.register('raw-toggle', {
      key: 'M',
      ctrl: true,
      shift: true,
      description: 'Toggle RAW markdown view',
      action: () => {
        logger.log('[RawToggle] Received Ctrl+Shift+M keyboard shortcut');
        this.toggle();
      },
    });
  }

  private toggle(): void {
    if (!this.container) {
      logger.warn('[RawToggle] Cannot toggle: container is null');
      return;
    }

    this.isRawView = !this.isRawView;
    logger.log('[RawToggle] Toggling raw view, isRawView:', this.isRawView);

    if (this.isRawView) {
      // Make sure we have the raw content (in case it wasn't extracted at init)
      if (!this.rawContent) {
        this.rawContent = extractMarkdownSource() || '';
        logger.log('[RawToggle] Raw content extracted on demand');
      }
      // Show raw markdown
      this.showRawView();
      // Dispatch event to notify other components (e.g., TOC)
      logger.log('[RawToggle] Dispatching markview:rawViewEnabled');
      document.dispatchEvent(new CustomEvent('markview:rawViewEnabled'));
    } else {
      // Show rendered HTML
      this.showRenderedView();
      // Dispatch event to notify other components to re-initialize
      logger.log('[RawToggle] Dispatching markview:rawViewDisabled');
      document.dispatchEvent(new CustomEvent('markview:rawViewDisabled'));
    }

    // Show notification
    this.showNotification();
  }

  private showRawView(): void {
    if (!this.container) return;

    // Store current rendered content before switching to raw view
    this.renderedContent = this.container.innerHTML;

    // Create a pre element to show raw markdown
    const pre = document.createElement('pre');
    pre.className = 'markview-raw-view';
    pre.textContent = this.rawContent;

    // Replace container content with raw view
    this.container.innerHTML = '';
    this.container.appendChild(pre);
  }

  private showRenderedView(): void {
    if (!this.container) return;

    // Restore rendered HTML from cache
    this.container.innerHTML = this.renderedContent;

    // Update cache with current container content to ensure it's fresh
    // This is important when files are switched while in raw mode
    this.renderedContent = this.container.innerHTML;
  }

  private showNotification(): void {
    const message = this.isRawView ? MESSAGES.ui.rawView : MESSAGES.ui.renderedView;
    showNotification(message, 'action', 2000);
  }

  /**
   * Check if currently in raw view mode
   */
  isInRawMode(): boolean {
    return this.isRawView;
  }

  /**
   * Update raw content (call this when markdown is reloaded)
   */
  updateContent(rawMarkdown: string, renderedHtml: string): void {
    this.rawContent = rawMarkdown;
    this.renderedContent = renderedHtml;

    // If currently in raw view, update the display
    if (this.isRawView && this.container) {
      this.showRawView();
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    keyboardManager.unregister('raw-toggle');
    // No button to remove - toggle is now managed via ActionButtons menu
  }
}
