// TOC Toggle Button
// Floating button to show/hide TOC sidebar
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

export class TocToggleButton {
  private button: HTMLElement | null = null;
  private onToggle: () => void;

  constructor(onToggle: () => void) {
    this.onToggle = onToggle;
    this.setupEventListeners();

    // Listen for language changes
    document.addEventListener('markview:languageChanged', () => {
      this.updateLanguage();
    });
  }

  /**
   * Setup event listeners for TOC show/hide events
   */
  private setupEventListeners(): void {
    // Listen for TOC hidden event - show the button
    document.addEventListener('markview:tocHidden', () => {
      logger.log('[TocToggleButton] TOC hidden event received');
      this.show();
    });

    // Listen for TOC shown event - hide the button
    document.addEventListener('markview:tocShown', () => {
      logger.log('[TocToggleButton] TOC shown event received');
      this.hide();
    });
  }

  /**
   * Create and show the toggle button
   */
  show(): void {
    if (this.button) {
      this.button.style.display = 'flex';
      return;
    }

    this.button = document.createElement('button');
    this.button.id = 'markview-toc-toggle';
    this.button.className = 'markview-toc-toggle';
    this.button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="7" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="18" r="1.5" fill="currentColor"/>
      </svg>
    `;
    this.button.title = MESSAGES.toc.toggleButtonTitle;
    this.button.style.zIndex = '10000';
    this.button.addEventListener('click', this.onToggle);

    document.body.appendChild(this.button);
  }

  /**
   * Hide the toggle button
   */
  hide(): void {
    if (this.button) {
      this.button.style.display = 'none';
    }
  }

  /**
   * Update language for button title
   */
  private updateLanguage(): void {
    logger.log('[TocToggle] Updating language');
    if (this.button) {
      this.button.title = MESSAGES.toc.toggleButtonTitle;
    }
  }

  /**
   * Remove the toggle button
   */
  destroy(): void {
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
  }
}
