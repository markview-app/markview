// MarkView Centered Layout Toggle Component
import { getSettings, updateSetting } from '@core/storage';
import { applyLayoutSettings } from '@utils/dom';
import { showNotification } from '@utils/notification';
import { keyboardManager } from '@utils/keyboard-shortcuts';
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

export class CenteredToggle {
  private button: HTMLButtonElement | null = null;
  private isCentered: boolean = true;

  constructor() {
    this.init();

    // Listen for language changes
    document.addEventListener('markview:languageChanged', () => {
      this.updateLanguage();
    });
  }

  private async init(): Promise<void> {
    await this.loadCurrentState();
    this.createButton();
    this.setupListeners();

    // Apply initial layout to ensure proper margins with sidebars
    await this.applyLayout();
  }

  private async loadCurrentState(): Promise<void> {
    const settings = await getSettings();
    this.isCentered = settings.centered;
  }

  private createButton(): void {
    // Create toggle button
    this.button = document.createElement('button');
    this.button.id = 'markview-centered-toggle';
    this.button.className = 'btn btn-primary btn-icon';
    this.button.title = MESSAGES.centered.toggleButtonTitle;
    this.updateButtonIcon();

    document.body.appendChild(this.button);
  }

  private updateButtonIcon(): void {
    if (!this.button) return;

    // Set icon based on current state
    const icons = {
      centered: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="7" y="4" width="10" height="16" rx="1" stroke="currentColor" stroke-width="2"/>
          <path d="M4 8h2m0 8H4m16-8h-2m0 8h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
      fullWidth: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" stroke-width="2"/>
          <path d="M7 8h10M7 12h10M7 16h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
    };

    this.button.innerHTML = this.isCentered ? icons.centered : icons.fullWidth;
  }

  private setupListeners(): void {
    if (!this.button) return;

    // Click handler
    this.button.addEventListener('click', () => {
      this.toggle();
    });

    // Keyboard shortcut: Ctrl+Shift+C (or Cmd+Shift+C on Mac)
    keyboardManager.register('centered-toggle', {
      key: 'C',
      ctrl: true,
      shift: true,
      description: MESSAGES.centered.toggleButtonTitle,
      action: () => this.toggle(),
    });

    // Listen for centered changes from popup
    chrome.storage.onChanged.addListener(changes => {
      if (changes.centered !== undefined) {
        this.isCentered = changes.centered.newValue;
        this.updateButtonIcon();
      }
    });

    // Listen for margin changes (when sidebars are toggled)
    document.addEventListener('markview:marginsChanged', async () => {
      await this.applyLayout();
    });
  }

  private async toggle(): Promise<void> {
    // Toggle centered state
    this.isCentered = !this.isCentered;

    // Save to storage
    await updateSetting('centered', this.isCentered);

    // Update icon
    this.updateButtonIcon();

    // Apply layout immediately
    await this.applyLayout();

    // Show notification
    this.showNotification();
  }

  private async applyLayout(): Promise<void> {
    const settings = await getSettings();
    applyLayoutSettings({
      centered: this.isCentered,
      maxWidth: settings.maxWidth,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      fontFamily: settings.fontFamily,
    });
  }

  private showNotification(): void {
    const layoutName = this.isCentered ? MESSAGES.centered.centered : MESSAGES.centered.fullWidth;
    showNotification(layoutName, 'action', 2000);
  }

  /**
   * Update language for button title
   */
  private updateLanguage(): void {
    logger.log('[CenteredToggle] Updating language');
    if (this.button) {
      this.button.title = MESSAGES.centered.toggleButtonTitle;
    }
  }

  public destroy(): void {
    keyboardManager.unregister('centered-toggle');
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
  }
}
