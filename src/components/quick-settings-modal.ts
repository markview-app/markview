/**
 * Quick Settings Modal Component
 * Provides quick access to frequently-used settings without opening the extension popup
 * Follows MarkView brand design system
 */

import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';
import { getSettings, updateSetting, type MarkViewSettings } from '@core/storage';
import { keyboardManager } from '@utils/keyboard-shortcuts';
import { showNotification } from '@utils/notification';

// Track if modal is currently open to prevent duplicates
let isModalOpen = false;

/**
 * Initialize Quick Settings Modal keyboard shortcuts
 */
export function initQuickSettingsModal(): void {
  logger.log('[QuickSettingsModal] Initializing keyboard shortcuts...');

  // Keyboard shortcut: Ctrl+Shift+K (or Cmd+Shift+K on Mac)
  keyboardManager.register('quick-settings', {
    key: 'K',
    ctrl: true,
    shift: true,
    description: 'Open Quick Settings modal',
    action: () => {
      logger.log('[QuickSettingsModal] Received Ctrl+Shift+K keyboard shortcut');
      showQuickSettingsModal();
    },
  });
}

/**
 * Clean up Quick Settings Modal resources
 */
export function destroyQuickSettingsModal(): void {
  keyboardManager.unregister('quick-settings');
}

/**
 * Show quick settings modal
 * Allows users to quickly adjust common settings
 */
export async function showQuickSettingsModal(): Promise<void> {
  // Prevent opening multiple instances
  if (isModalOpen) {
    logger.log('[QuickSettingsModal] Modal already open, ignoring request');
    return;
  }

  isModalOpen = true;
  logger.log('[QuickSettingsModal] Showing modal');

  // Get current font family setting
  const settings = await getSettings();
  const { getFontFamily } = await import('@utils/fonts');
  const fontFamily = settings.fontFamily ? getFontFamily(settings.fontFamily) : 'inherit';

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'markview-quick-settings-overlay';

  // Create modal content container
  const modal = document.createElement('div');
  modal.className = 'markview-quick-settings-modal';
  if (fontFamily !== 'inherit') {
    modal.style.fontFamily = fontFamily;
  }

  // Create modal header (fixed, no scroll)
  const modalHeader = document.createElement('div');
  modalHeader.className = 'markview-quick-settings-header';
  modalHeader.innerHTML = getHeaderHTML();

  // Create modal body (scrollable)
  const modalBody = document.createElement('div');
  modalBody.className = 'markview-quick-settings-body';

  // Load content asynchronously
  await loadBodyContent(modalBody, modal);

  // Assemble modal structure
  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close button handler
  const closeBtn = modalHeader.querySelector('.markview-quick-settings-close') as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(overlay));
  }

  // Close on background click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      closeModal(overlay);
    }
  });

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal(overlay);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('markview:languageChanged', handleLanguageChange);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Listen for language changes and update modal content
  const handleLanguageChange = () => {
    updateModalContent(modalHeader, modalBody);
  };
  document.addEventListener('markview:languageChanged', handleLanguageChange);

  logger.log('[QuickSettingsModal] Modal displayed successfully');
}

/**
 * Generate header HTML with current language
 */
function getHeaderHTML(): string {
  return `
    <button class="markview-quick-settings-close" aria-label="Close" title="${MESSAGES.common.close || 'Close'}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div class="markview-quick-settings-title-section">
      <div class="markview-quick-settings-icon">⚡</div>
      <h2 class="markview-quick-settings-title">${MESSAGES.actions.quickSettings || 'Quick Settings'}</h2>
      <p class="markview-quick-settings-subtitle">${MESSAGES.actions.quickSettingsSubtitle || 'Adjust frequently-used settings'}</p>
    </div>
  `;
}

/**
 * Load body content with settings controls
 */
async function loadBodyContent(bodyElement: HTMLElement, modalElement: HTMLElement): Promise<void> {
  const settings = await getSettings();

  // Create settings cards
  const settingsHTML = `
    <div class="quick-settings-section">
      <!-- Auto Refresh -->
      <div class="quick-setting-card">
        <label class="quick-setting-label">
          <span class="quick-setting-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>${MESSAGES.settings.autoRefresh || 'Auto-Refresh'}</span>
          </span>
          <input type="checkbox" class="quick-setting-toggle" data-setting="autoRefresh" ${settings.autoRefresh ? 'checked' : ''}>
        </label>
        <p class="quick-setting-description">${MESSAGES.settings.autoRefreshDescription || 'Automatically reload when file changes (every 2 seconds)'}</p>
      </div>

      <!-- Code Block Display -->
      <div class="quick-setting-card">
        <label class="quick-setting-label">
          <span class="quick-setting-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
            <span>${MESSAGES.settings.codeBlockDisplay || 'Code Block Display'}</span>
          </span>
        </label>
        <select class="quick-setting-select" data-setting="codeBlockDisplay">
          <option value="scroll" ${settings.displaySettings?.codeBlockDisplay === 'scroll' ? 'selected' : ''}>${MESSAGES.settings.codeBlockDisplayScroll || 'Scroll (preserve formatting)'}</option>
          <option value="wrap" ${settings.displaySettings?.codeBlockDisplay === 'wrap' ? 'selected' : ''}>${MESSAGES.settings.codeBlockDisplayWrap || 'Wrap (break long lines)'}</option>
        </select>
        <p class="quick-setting-description">${MESSAGES.settings.codeBlockDisplayDescription || 'How to handle long lines in code blocks'}</p>
      </div>

      <!-- Font Family -->
      <div class="quick-setting-card">
        <label class="quick-setting-label">
          <span class="quick-setting-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 20l4-16m4 16l4-16M9 12h6" />
            </svg>
            <span>${MESSAGES.settings.fontFamily || 'Font Family'}</span>
          </span>
        </label>
        <select class="quick-setting-select" data-setting="fontFamily">
          <option value="default" ${settings.fontFamily === 'default' ? 'selected' : ''}>${MESSAGES.settings.fontDefault || 'Default'}</option>
          <option value="Inter" ${settings.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
          <option value="Merriweather" ${settings.fontFamily === 'Merriweather' ? 'selected' : ''}>Merriweather</option>
          <option value="Merriweather Sans" ${settings.fontFamily === 'Merriweather Sans' ? 'selected' : ''}>Merriweather Sans</option>
          <option value="Noto Sans" ${settings.fontFamily === 'Noto Sans' ? 'selected' : ''}>Noto Sans</option>
          <option value="Noto Serif SC" ${settings.fontFamily === 'Noto Serif SC' ? 'selected' : ''}>Noto Serif SC</option>
          <option value="Open Sans" ${settings.fontFamily === 'Open Sans' ? 'selected' : ''}>Open Sans</option>
          <option value="Roboto" ${settings.fontFamily === 'Roboto' ? 'selected' : ''}>Roboto</option>
          <option value="Source Sans 3" ${settings.fontFamily === 'Source Sans 3' ? 'selected' : ''}>Source Sans 3</option>
        </select>
      </div>

      <!-- Language -->
      <div class="quick-setting-card">
        <label class="quick-setting-label">
          <span class="quick-setting-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>${MESSAGES.settings.language || 'Language'}</span>
          </span>
        </label>
        <select class="quick-setting-select" data-setting="language">
          <option value="auto" ${settings.language === 'auto' ? 'selected' : ''}>Auto</option>
          <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
          <option value="vi" ${settings.language === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
          <option value="ja" ${settings.language === 'ja' ? 'selected' : ''}>日本語</option>
          <option value="ko" ${settings.language === 'ko' ? 'selected' : ''}>한국어</option>
          <option value="zh_CN" ${settings.language === 'zh_CN' ? 'selected' : ''}>简体中文</option>
          <option value="zh_TW" ${settings.language === 'zh_TW' ? 'selected' : ''}>繁體中文</option>
          <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Español</option>
          <option value="fr" ${settings.language === 'fr' ? 'selected' : ''}>Français</option>
          <option value="pt_BR" ${settings.language === 'pt_BR' ? 'selected' : ''}>Português (Brasil)</option>
          <option value="id" ${settings.language === 'id' ? 'selected' : ''}>Bahasa Indonesia</option>
          <option value="de" ${settings.language === 'de' ? 'selected' : ''}>Deutsch</option>
          <option value="ru" ${settings.language === 'ru' ? 'selected' : ''}>Русский</option>
        </select>
      </div>

      <!-- Reset to Defaults Button -->
      <button id="quick-settings-reset" class="quick-settings-reset-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        ${MESSAGES.quickSettings.resetDefaults || 'Reset to Defaults'}
      </button>
    </div>
  `;

  bodyElement.innerHTML = settingsHTML;

  // Setup event listeners for all controls
  setupSettingListeners(bodyElement, modalElement);
}

/**
 * Setup event listeners for settings controls
 */
function setupSettingListeners(bodyElement: HTMLElement, modalElement: HTMLElement): void {
  // Toggle switches (checkboxes)
  const toggles = bodyElement.querySelectorAll<HTMLInputElement>('.quick-setting-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const settingName = toggle.getAttribute('data-setting') as keyof MarkViewSettings;
      if (settingName) {
        const newValue = toggle.checked;
        logger.log(`[QuickSettingsModal] Setting "${String(settingName)}" changed to ${newValue}`);
        await updateSetting(settingName as any, newValue);
        showNotification(MESSAGES.popup.settingsSaved, {
          type: 'success',
          scope: modalElement,
          badge: true,
        });
      }
    });
  });

  // Select dropdown (font family, language, code block display)
  const selects = bodyElement.querySelectorAll<HTMLSelectElement>('.quick-setting-select');
  selects.forEach(select => {
    select.addEventListener('change', async () => {
      const settingName = select.getAttribute('data-setting');
      if (settingName) {
        const newValue = select.value;
        logger.log(`[QuickSettingsModal] Setting "${String(settingName)}" changed to ${newValue}`);

        // Handle nested displaySettings
        if (settingName === 'codeBlockDisplay') {
          const currentSettings = await getSettings();
          const displaySettings = {
            ...currentSettings.displaySettings,
            codeBlockDisplay: newValue as 'wrap' | 'scroll',
          };
          await updateSetting('displaySettings', displaySettings);
        } else {
          // Handle regular settings
          await updateSetting(settingName as any, newValue);
        }

        showNotification(MESSAGES.popup.settingsSaved, {
          type: 'success',
          scope: modalElement,
          badge: true,
        });
      }
    });
  });

  // Reset to Defaults button
  const resetBtn = bodyElement.querySelector('#quick-settings-reset') as HTMLButtonElement;
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const confirmed = await showResetConfirmDialog(modalElement);
      if (confirmed) {
        await resetToDefaults(modalElement);
      }
    });
  }
}

/**
 * Show reset confirmation dialog
 */
function showResetConfirmDialog(parentElement: HTMLElement): Promise<boolean> {
  return new Promise(resolve => {
    // Create dialog overlay
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'quick-settings-confirm-overlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'quick-settings-confirm-dialog';
    dialog.innerHTML = `
      <h3 class="quick-settings-confirm-title">${MESSAGES.popup.resetTitle || 'Reset Settings?'}</h3>
      <p class="quick-settings-confirm-text">${MESSAGES.popup.resetText || 'This will reset all settings to their default values. This action cannot be undone.'}</p>
      <div class="quick-settings-confirm-actions">
        <button class="quick-settings-confirm-btn quick-settings-confirm-cancel">${MESSAGES.popup.cancel || 'Cancel'}</button>
        <button class="quick-settings-confirm-btn quick-settings-confirm-ok">${MESSAGES.popup.reset || 'Reset'}</button>
      </div>
    `;

    dialogOverlay.appendChild(dialog);
    parentElement.appendChild(dialogOverlay);

    const cancelBtn = dialog.querySelector('.quick-settings-confirm-cancel') as HTMLButtonElement;
    const okBtn = dialog.querySelector('.quick-settings-confirm-ok') as HTMLButtonElement;

    const cleanup = () => {
      dialogOverlay.remove();
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn?.addEventListener('click', handleCancel);
    okBtn?.addEventListener('click', handleOk);
    dialogOverlay.addEventListener('click', e => {
      if (e.target === dialogOverlay) {
        handleCancel();
      }
    });
  });
}

/**
 * Reset all settings to defaults while preserving history and license
 */
async function resetToDefaults(modalElement: HTMLElement): Promise<void> {
  try {
    const { DEFAULT_SETTINGS } = await import('@core/storage');

    // Get current history and license before resetting
    const result = await chrome.storage.local.get(['markviewHistory', 'licenseInfo']);
    const history = result.markviewHistory || [];
    const licenseInfo = result.licenseInfo;

    // Reset settings and preserve history + license
    await chrome.storage.local.set({
      ...DEFAULT_SETTINGS,
      markviewHistory: history,
      ...(licenseInfo && { licenseInfo }), // Preserve license if it exists
    });

    logger.log('[QuickSettings] Settings reset to defaults (history and license preserved)');

    // Show success notification
    showNotification(MESSAGES.popup.settingsSaved, {
      type: 'success',
      scope: modalElement,
      badge: true,
    });

    // Reload the page to apply changes (small delay to show notification)
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    logger.error('[QuickSettings] Error resetting settings:', error);
  }
}

/**
 * Close the modal with animation
 */
function closeModal(overlay: HTMLElement): void {
  // Add fade out animation
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.2s ease-out';
  setTimeout(() => {
    overlay.remove();
    isModalOpen = false; // Reset flag when modal is removed
  }, 200);
  logger.log('[QuickSettingsModal] Modal closed');
}

/**
 * Update modal content when language changes
 */
async function updateModalContent(
  headerElement: HTMLElement,
  bodyElement: HTMLElement
): Promise<void> {
  // Reload messages for new language
  const { initI18n } = await import('@utils/i18n');
  await initI18n();

  // Regenerate header content with new language
  headerElement.innerHTML = getHeaderHTML();

  // Re-attach close button listener
  const closeBtn = headerElement.querySelector(
    '.markview-quick-settings-close'
  ) as HTMLButtonElement;
  if (closeBtn) {
    const overlay = headerElement.closest('.markview-quick-settings-overlay') as HTMLElement;
    closeBtn.addEventListener('click', () => closeModal(overlay));
  }

  // Reload body content with new language
  const modal = headerElement.closest('.markview-quick-settings-modal') as HTMLElement;
  await loadBodyContent(bodyElement, modal);

  logger.log('[QuickSettingsModal] Modal content updated for language change');
}
