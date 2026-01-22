/**
 * Settings Tab Component
 * Handles all settings-related logic in the popup
 */

import { logger } from '@utils/logger';
import { DEFAULT_SETTINGS, getSettings, updateSetting, type MarkViewSettings } from '@core/storage';
import { applyTranslations, initI18n, getMessage } from '@utils/i18n';
import { PopupUI } from './popup-ui';

export class SettingsTab {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initialize settings tab - load settings and setup listeners
   */
  async initialize(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
  }

  /**
   * Load settings from storage and update UI
   */
  async loadSettings(): Promise<void> {
    try {
      const settings = await getSettings();
      logger.log('Loading settings:', settings);

      // General
      const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
      const languageSelect = document.getElementById('language') as HTMLSelectElement;
      const themeSelect = document.getElementById('theme') as HTMLSelectElement;

      if (enabledCheckbox) enabledCheckbox.checked = settings.enabled;
      if (languageSelect) languageSelect.value = settings.language;
      if (themeSelect) themeSelect.value = settings.theme;

      // Layout
      const centeredCheckbox = document.getElementById('centered') as HTMLInputElement;
      const maxWidthSlider = document.getElementById('maxWidth') as HTMLInputElement;
      const fontSizeSlider = document.getElementById('fontSize') as HTMLInputElement;
      const lineHeightSlider = document.getElementById('lineHeight') as HTMLInputElement;
      const fontFamilySelect = document.getElementById('fontFamily') as HTMLSelectElement;

      if (centeredCheckbox) centeredCheckbox.checked = settings.centered;
      if (maxWidthSlider) {
        maxWidthSlider.value = String(settings.maxWidth);
        this.updateValueDisplay('maxWidth', settings.maxWidth);
        this.updateSliderFill(maxWidthSlider);
      }
      if (fontSizeSlider) {
        fontSizeSlider.value = String(settings.fontSize);
        this.updateValueDisplay('fontSize', settings.fontSize);
        this.updateSliderFill(fontSizeSlider);
      }
      if (lineHeightSlider) {
        lineHeightSlider.value = String(settings.lineHeight);
        this.updateValueDisplay('lineHeight', settings.lineHeight);
        this.updateSliderFill(lineHeightSlider);
      }
      if (fontFamilySelect) {
        fontFamilySelect.value = settings.fontFamily;
      }

      // Sidebars
      const tocVisibleCheckbox = document.getElementById('tocVisible') as HTMLInputElement;

      if (tocVisibleCheckbox) tocVisibleCheckbox.checked = settings.tocVisible;

      // Live Preview
      const autoRefreshCheckbox = document.getElementById('autoRefresh') as HTMLInputElement;
      if (autoRefreshCheckbox) autoRefreshCheckbox.checked = settings.autoRefresh;

      // Features
      const syntaxThemeSelect = document.getElementById('syntaxTheme') as HTMLSelectElement;
      if (syntaxThemeSelect) syntaxThemeSelect.value = settings.syntaxTheme || 'custom';

      const codeBlockDisplaySelect = document.getElementById(
        'codeBlockDisplay'
      ) as HTMLSelectElement;
      if (codeBlockDisplaySelect)
        codeBlockDisplaySelect.value = settings.displaySettings?.codeBlockDisplay || 'scroll';
    } catch (error) {
      logger.error('Error loading settings:', error);
    }
  }

  /**
   * Update value displays for sliders
   */
  private updateValueDisplay(id: string, value: number | string): void {
    const display = document.getElementById(`${id}-value`);
    if (display) {
      if (id === 'maxWidth' || id === 'fontSize') {
        display.textContent = `${value}px`;
      } else {
        display.textContent = String(value);
      }
    }
  }

  /**
   * Update slider gradient fill
   */
  private updateSliderFill(slider: HTMLInputElement): void {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const value = parseFloat(slider.value);
    const percentage = ((value - min) / (max - min)) * 100;

    slider.style.background = `linear-gradient(to right, #667eea 0%, #667eea ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
  }

  /**
   * Save a single setting
   */
  private async saveSetting(key: keyof MarkViewSettings, value: any): Promise<void> {
    try {
      await updateSetting(key, value);
      logger.log(`Setting saved: ${key} =`, value);
      this.showSaveNotification();
    } catch (error) {
      logger.error('Error saving setting:', error);
    }
  }

  /**
   * Show save notification
   */
  private showSaveNotification(messageKey?: string): void {
    let notification = document.getElementById('save-notification');
    if (!notification) {
      notification = PopupUI.createSaveNotification();
      document.body.appendChild(notification);
    }

    // Update message if custom key provided
    const key = messageKey || 'popup_settingsSaved';
    notification.setAttribute('data-i18n', key);

    // Update text content directly since applyTranslations only checks children
    const message = getMessage(key);
    if (message) {
      notification.textContent = message;
    }

    notification.classList.remove('hidden');
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 2000);
  }

  /**
   * Setup event listeners for all settings controls
   */
  private setupEventListeners(): void {
    // General settings
    const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
    const themeSelect = document.getElementById('theme') as HTMLSelectElement;

    if (enabledCheckbox) {
      enabledCheckbox.addEventListener('change', () => {
        this.saveSetting('enabled', enabledCheckbox.checked);
      });
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        this.saveSetting('theme', themeSelect.value as 'light' | 'dark' | 'auto');
      });
    }

    const languageSelect = document.getElementById('language') as HTMLSelectElement;
    if (languageSelect) {
      languageSelect.addEventListener('change', async () => {
        await this.saveSetting('language', languageSelect.value);

        // Reload popup UI to apply language change
        await initI18n();
        applyTranslations();

        // Show brief notification
        this.showSaveNotification();
      });
    }

    // Layout settings
    const centeredCheckbox = document.getElementById('centered') as HTMLInputElement;
    const maxWidthSlider = document.getElementById('maxWidth') as HTMLInputElement;
    const fontSizeSlider = document.getElementById('fontSize') as HTMLInputElement;
    const lineHeightSlider = document.getElementById('lineHeight') as HTMLInputElement;
    const fontFamilySelect = document.getElementById('fontFamily') as HTMLSelectElement;

    if (centeredCheckbox) {
      centeredCheckbox.addEventListener('change', () => {
        this.saveSetting('centered', centeredCheckbox.checked);
      });
    }

    if (maxWidthSlider) {
      maxWidthSlider.addEventListener('input', () => {
        const value = parseInt(maxWidthSlider.value);
        this.updateValueDisplay('maxWidth', value);
        this.updateSliderFill(maxWidthSlider);
      });
      maxWidthSlider.addEventListener('change', () => {
        this.saveSetting('maxWidth', parseInt(maxWidthSlider.value));
      });
    }

    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', () => {
        const value = parseInt(fontSizeSlider.value);
        this.updateValueDisplay('fontSize', value);
        this.updateSliderFill(fontSizeSlider);
      });
      fontSizeSlider.addEventListener('change', () => {
        this.saveSetting('fontSize', parseInt(fontSizeSlider.value));
      });
    }

    if (lineHeightSlider) {
      lineHeightSlider.addEventListener('input', () => {
        const value = parseFloat(lineHeightSlider.value);
        this.updateValueDisplay('lineHeight', value);
        this.updateSliderFill(lineHeightSlider);
      });
      lineHeightSlider.addEventListener('change', () => {
        this.saveSetting('lineHeight', parseFloat(lineHeightSlider.value));
      });
    }

    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', () => {
        this.saveSetting('fontFamily', fontFamilySelect.value);
      });
    }

    // Syntax Theme selector
    const syntaxThemeSelect = document.getElementById('syntaxTheme') as HTMLSelectElement;
    if (syntaxThemeSelect) {
      syntaxThemeSelect.addEventListener('change', () => {
        this.saveSetting('syntaxTheme', syntaxThemeSelect.value);
      });
    }

    // Code Block Display selector
    const codeBlockDisplaySelect = document.getElementById('codeBlockDisplay') as HTMLSelectElement;
    if (codeBlockDisplaySelect) {
      codeBlockDisplaySelect.addEventListener('change', async () => {
        const settings = await getSettings();
        const displaySettings = {
          ...settings.displaySettings,
          codeBlockDisplay: codeBlockDisplaySelect.value as 'wrap' | 'scroll',
        };
        this.saveSetting('displaySettings', displaySettings);
      });
    }

    // Sidebars
    const tocVisibleCheckbox = document.getElementById('tocVisible') as HTMLInputElement;

    if (tocVisibleCheckbox) {
      tocVisibleCheckbox.addEventListener('change', () => {
        this.saveSetting('tocVisible', tocVisibleCheckbox.checked);
      });
    }

    // Live Preview
    const autoRefreshCheckbox = document.getElementById('autoRefresh') as HTMLInputElement;

    if (autoRefreshCheckbox) {
      autoRefreshCheckbox.addEventListener('change', () => {
        this.saveSetting('autoRefresh', autoRefreshCheckbox.checked);
      });
    }

    // Clear cache button
    const clearCacheButton = document.getElementById('clear-cache');
    if (clearCacheButton) {
      clearCacheButton.addEventListener('click', async () => {
        const confirmed = await this.showClearCacheDialog();
        if (confirmed) {
          await this.clearCache();
        }
      });
    }

    // Reset button
    const resetButton = document.getElementById('reset-settings');
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        const confirmed = await this.showConfirmDialog();
        if (confirmed) {
          await this.resetSettings();
        }
      });
    }

    // Listen for storage changes from content script
    const centeredCheckboxRef = centeredCheckbox;
    const tocVisibleCheckboxRef = tocVisibleCheckbox;
    const themeSelectRef = themeSelect;

    chrome.storage.local.onChanged.addListener(changes => {
      // Update TOC visibility checkbox
      if (changes.tocVisible && tocVisibleCheckboxRef) {
        tocVisibleCheckboxRef.checked = changes.tocVisible.newValue;
      }

      // Update theme select when changed from theme toggle button on page
      if (changes.theme && themeSelectRef) {
        themeSelectRef.value = changes.theme.newValue;
      }

      // Update centered checkbox when changed from centered toggle button on page
      if (changes.centered !== undefined && centeredCheckboxRef) {
        centeredCheckboxRef.checked = changes.centered.newValue;
      }
    });
  }

  /**
   * Show confirm dialog
   */
  private showConfirmDialog(): Promise<boolean> {
    return new Promise(resolve => {
      let dialog = document.getElementById('confirm-dialog');
      if (!dialog) {
        dialog = PopupUI.createConfirmDialog();
        document.body.appendChild(dialog);
        applyTranslations(dialog);
      }

      const confirmBtn = document.getElementById('confirm-reset');
      const cancelBtn = document.getElementById('confirm-cancel');

      if (!confirmBtn || !cancelBtn) {
        resolve(false);
        return;
      }

      // Show dialog
      dialog.classList.remove('hidden');

      // Handle confirm
      const handleConfirm = () => {
        dialog.classList.add('hidden');
        cleanup();
        resolve(true);
      };

      // Handle cancel
      const handleCancel = () => {
        dialog.classList.add('hidden');
        cleanup();
        resolve(false);
      };

      // Cleanup listeners
      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        dialog.removeEventListener('click', handleDialogClick);
      };

      // Close on backdrop click
      const handleDialogClick = (e: MouseEvent) => {
        if (e.target === dialog) {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      dialog.addEventListener('click', handleDialogClick);
    });
  }

  /**
   * Show clear cache confirm dialog
   */
  private showClearCacheDialog(): Promise<boolean> {
    return new Promise(resolve => {
      let dialog = document.getElementById('clear-cache-dialog');
      if (!dialog) {
        dialog = PopupUI.createClearCacheDialog();
        document.body.appendChild(dialog);
        applyTranslations(dialog);
      }

      const confirmBtn = document.getElementById('clear-cache-confirm');
      const cancelBtn = document.getElementById('clear-cache-cancel');

      if (!confirmBtn || !cancelBtn) {
        resolve(false);
        return;
      }

      // Show dialog
      dialog.classList.remove('hidden');

      // Handle confirm
      const handleConfirm = () => {
        dialog.classList.add('hidden');
        cleanup();
        resolve(true);
      };

      // Handle cancel
      const handleCancel = () => {
        dialog.classList.add('hidden');
        cleanup();
        resolve(false);
      };

      // Cleanup listeners
      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        dialog.removeEventListener('click', handleDialogClick);
      };

      // Close on backdrop click
      const handleDialogClick = (e: MouseEvent) => {
        if (e.target === dialog) {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      dialog.addEventListener('click', handleDialogClick);
    });
  }

  /**
   * Clear IndexedDB cache and in-memory caches
   */
  private async clearCache(): Promise<void> {
    try {
      logger.log('[ClearCache] Starting cache clear operation...');

      // Clear Chrome Storage caches
      // 1. Clear directory cache (file tree cache with 5-min TTL)
      await chrome.storage.local.remove(['directoryCache']);

      // 2. Clear URL metadata cache (7-day TTL for link previews)
      const allKeys = await chrome.storage.local.get(null);
      const urlMetadataKeys = Object.keys(allKeys).filter(key => key.startsWith('url_metadata_'));
      if (urlMetadataKeys.length > 0) {
        await chrome.storage.local.remove(urlMetadataKeys);
        logger.log(`[ClearCache] Cleared ${urlMetadataKeys.length} URL metadata entries`);
      }

      // 3. Clear in-memory caches in active tab (blob cache, renderer cache)
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'clearInMemoryCaches' });
          logger.log('[ClearCache] Cleared in-memory caches in active tab');
        } catch (error) {
          // Tab might not have MarkView loaded, ignore
          logger.log('[ClearCache] Active tab does not have MarkView loaded (expected)');
        }
      }

      logger.log('[ClearCache] All caches cleared successfully');
      this.showSaveNotification('popup_cacheCleared');
    } catch (error) {
      logger.error('[ClearCache] Error clearing cache:', error);
    }
  }

  /**
   * Reset all settings to defaults
   */
  private async resetSettings(): Promise<void> {
    try {
      // Get current history before resetting
      const result = await chrome.storage.local.get(['markviewHistory']);
      const history = result.markviewHistory || [];

      // Reset settings and preserve history
      await chrome.storage.local.set({
        ...DEFAULT_SETTINGS,
        markviewHistory: history,
      });

      logger.log('Settings reset to defaults (history preserved)');
      await this.loadSettings();
      this.showSaveNotification();

      // Reload active tab to apply changes (especially language)
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }

      // Reload popup to apply language change
      window.location.reload();
    } catch (error) {
      logger.error('Error resetting settings:', error);
    }
  }

  /**
   * Get the container element
   */
  getElement(): HTMLElement {
    return this.container;
  }
}
