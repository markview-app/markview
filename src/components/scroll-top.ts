// MarkView Scroll to Top Button Component
import { showNotification } from '@utils/notification';
import { keyboardManager } from '@utils/keyboard-shortcuts';
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

export class ScrollTopButton {
  private button: HTMLButtonElement | null = null;
  private isVisible: boolean = false;
  private scrollThreshold: number = 300; // Show button after scrolling 300px

  constructor() {
    this.init();

    // Listen for language changes
    document.addEventListener('markview:languageChanged', () => {
      this.updateLanguage();
    });
  }

  private init(): void {
    this.createButton();
    this.setupListeners();
    this.checkScrollPosition(); // Initial check
  }

  private createButton(): void {
    // Create scroll to top button
    this.button = document.createElement('button');
    this.button.id = 'markview-scroll-top';
    this.button.className = 'btn btn-secondary btn-icon';
    this.button.title = MESSAGES.ui.scrollTopTitle;
    this.button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    document.body.appendChild(this.button);
  }

  private setupListeners(): void {
    if (!this.button) return;

    // Click handler
    this.button.addEventListener('click', () => {
      this.scrollToTop();
    });

    // Scroll listener to show/hide button
    window.addEventListener('scroll', () => {
      this.checkScrollPosition();
    });

    // Keyboard shortcut: Home key
    keyboardManager.register('scroll-top', {
      key: 'Home',
      description: MESSAGES.ui.scrollTopTitle,
      action: () => this.scrollToTop(),
      ignoreInInputs: true,
    });
  }

  private checkScrollPosition(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    const shouldBeVisible = scrollY > this.scrollThreshold;

    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible;
      this.updateVisibility();
    }
  }

  private updateVisibility(): void {
    if (!this.button) return;

    if (this.isVisible) {
      this.button.classList.add('visible');
    } else {
      this.button.classList.remove('visible');
    }
  }

  private scrollToTop(): void {
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Show brief notification
    this.showNotification();
  }

  private showNotification(): void {
    showNotification(MESSAGES.ui.scrolledTop, 'action', 1500);
  }

  /**
   * Update language for button title
   */
  private updateLanguage(): void {
    logger.log('[ScrollTop] Updating language');
    if (this.button) {
      this.button.title = MESSAGES.ui.scrollTopTitle;
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    keyboardManager.unregister('scroll-top');
    this.button?.remove();
    this.button = null;
  }
}
