// MarkView Theme Toggle Component
import { getSettings, updateSetting } from '@core/storage';
import { showNotification } from '@utils/notification';
import { keyboardManager } from '@utils/keyboard-shortcuts';
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

export class ThemeToggle {
  private button: HTMLButtonElement | null = null;
  private currentTheme: 'light' | 'dark' | 'auto' = 'light';

  constructor() {
    this.init();

    // Listen for language changes
    document.addEventListener('markview:languageChanged', () => {
      this.updateLanguage();
    });
  }

  private async init(): Promise<void> {
    await this.loadCurrentTheme();
    this.createButton();
    this.setupListeners();
  }

  private async loadCurrentTheme(): Promise<void> {
    const settings = await getSettings();
    this.currentTheme = settings.theme;
  }

  private createButton(): void {
    // Create toggle button
    this.button = document.createElement('button');
    this.button.id = 'markview-theme-toggle';
    this.button.className = 'btn btn-primary btn-icon';
    this.button.title = MESSAGES.theme.toggleButtonTitle;
    this.updateButtonIcon();

    document.body.appendChild(this.button);
  }

  private updateButtonIcon(): void {
    if (!this.button) return;

    // Determine actual theme (resolve 'auto' to actual theme)
    let displayTheme: 'light' | 'dark' = 'light';
    if (this.currentTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      displayTheme = prefersDark ? 'dark' : 'light';
    } else {
      displayTheme = this.currentTheme;
    }

    // Set icon based on current theme
    const icons: Record<'light' | 'dark', string> = {
      light: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
          <path d="M12 1v3m0 16v3M21 12h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m12.728 0l-2.121-2.121M8.757 8.757L6.636 6.636" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
      dark: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
    };

    this.button.innerHTML = icons[displayTheme];
  }

  private setupListeners(): void {
    if (!this.button) return;

    // Click handler
    this.button.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
    // Changed from Ctrl+Shift+T to avoid conflict with browser's "Reopen closed tab"
    keyboardManager.register('theme-toggle', {
      key: 'D',
      ctrl: true,
      shift: true,
      description: MESSAGES.theme.toggleButtonTitle,
      action: () => this.toggleTheme(),
    });

    // Listen for system theme changes when in auto mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.updateButtonIcon();
      }
    });

    // Listen for theme changes from popup
    chrome.storage.onChanged.addListener(changes => {
      if (changes.theme) {
        this.currentTheme = changes.theme.newValue;
        this.updateButtonIcon();
      }
    });
  }

  private async toggleTheme(): Promise<void> {
    // Cycle through: light -> dark -> auto -> light
    const themeOrder: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themeOrder.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const newTheme = themeOrder[nextIndex];
    if (!newTheme) return; // Should never happen

    this.currentTheme = newTheme;

    // Update icon immediately for instant feedback
    this.updateButtonIcon();

    // Show notification immediately
    this.showNotification();

    // Apply theme (fast - just CSS class changes)
    this.applyTheme();

    // Save to storage asynchronously (non-blocking)
    // This will trigger the settings change listener in main.ts
    // which handles Mermaid re-rendering
    updateSetting('theme', this.currentTheme).catch(err => {
      logger.error('[ThemeToggle] Failed to save theme setting:', err);
    });
  }

  private applyTheme(): void {
    document.documentElement.classList.remove('markview-light', 'markview-dark');

    let actualTheme = this.currentTheme;
    if (this.currentTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.classList.add(`markview-${actualTheme}`);
    logger.log(`MarkView: Theme toggled to ${this.currentTheme} (${actualTheme})`);

    // Note: Mermaid re-rendering is handled by the settings change listener in main.ts
    // This avoids double-rendering and keeps the UI responsive
  }

  private showNotification(): void {
    const themeName = {
      light: MESSAGES.theme.light,
      dark: MESSAGES.theme.dark,
      auto: MESSAGES.theme.auto,
    }[this.currentTheme];

    showNotification(themeName, 'action', 2000);
  }

  /**
   * Update language for button title
   */
  private updateLanguage(): void {
    logger.log('[ThemeToggle] Updating language');
    if (this.button) {
      this.button.title = MESSAGES.theme.toggleButtonTitle;
    }
  }

  public destroy(): void {
    keyboardManager.unregister('theme-toggle');
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
  }
}
