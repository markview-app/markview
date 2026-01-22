/**
 * Keyboard Shortcuts Help Modal Component
 * Displays all available keyboard shortcuts in a user-friendly format
 * Follows MarkView brand design system
 */

import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

/**
 * Show keyboard shortcuts help modal
 */
export async function showKeyboardShortcutsHelp(): Promise<void> {
  logger.log('[KeyboardShortcutsHelp] Showing modal');

  // Get current font family setting
  const { getSettings } = await import('@core/storage');
  const { getFontFamily } = await import('@utils/fonts');
  const settings = await getSettings();
  const fontFamily = settings.fontFamily ? getFontFamily(settings.fontFamily) : 'inherit';

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'markview-keyboard-help-overlay';

  // Create modal content container
  const modal = document.createElement('div');
  modal.className = 'markview-keyboard-help-modal';
  if (fontFamily !== 'inherit') {
    modal.style.fontFamily = fontFamily;
  }

  // Create modal header (fixed, no scroll)
  const modalHeader = document.createElement('div');
  modalHeader.className = 'markview-keyboard-help-header';
  modalHeader.innerHTML = getHeaderHTML();

  // Create modal body (scrollable)
  const modalBody = document.createElement('div');
  modalBody.className = 'markview-keyboard-help-body';
  modalBody.innerHTML = getBodyHTML();

  // Assemble modal structure
  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Setup close button handler
  const setupCloseButton = () => {
    const closeBtn = modalHeader.querySelector(
      '.markview-keyboard-help-close'
    ) as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(overlay));
    }
  };
  setupCloseButton();

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
    // Re-attach close button listener after content update
    setupCloseButton();
  };
  document.addEventListener('markview:languageChanged', handleLanguageChange);

  logger.log('[KeyboardShortcutsHelp] Modal displayed successfully');
}

/**
 * Generate header HTML with current language
 */
function getHeaderHTML(): string {
  return `
    <button class="markview-keyboard-help-close" title="${MESSAGES.common.close}">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    
    <div class="markview-keyboard-help-header-content">
      <div class="markview-keyboard-help-icon">⌨️</div>
      <h1 class="markview-keyboard-help-title">${MESSAGES.keyboardHelp.title}</h1>
      <p class="markview-keyboard-help-subtitle">${MESSAGES.keyboardHelp.subtitle}</p>
    </div>
  `;
}

/**
 * Generate body HTML with current language
 */
function getBodyHTML(): string {
  // Detect platform for modifier key display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  return `
    <div class="markview-keyboard-help-content">
      <!-- View Toggles Section -->
      <div class="markview-keyboard-help-section">
        <h2 class="markview-keyboard-help-section-title">${MESSAGES.keyboardHelp.viewToggles}</h2>
        <div class="markview-keyboard-help-shortcuts">
          ${createShortcutRow(`${modifierKey} + Shift + D`, MESSAGES.keyboardHelp.toggleTheme)}
          ${createShortcutRow(`${modifierKey} + Shift + M`, MESSAGES.keyboardHelp.toggleRaw)}
          ${createShortcutRow(`${modifierKey} + Shift + C`, MESSAGES.keyboardHelp.toggleLayout)}
          ${createShortcutRow(`${modifierKey} + Shift + L`, MESSAGES.keyboardHelp.toggleToc)}
          ${createShortcutRow(`${modifierKey} + Shift + K`, MESSAGES.keyboardHelp.openQuickSettings)}
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="markview-keyboard-help-section">
        <h2 class="markview-keyboard-help-section-title">${MESSAGES.keyboardHelp.navigation}</h2>
        <div class="markview-keyboard-help-shortcuts">
          ${createShortcutRow('Home', MESSAGES.keyboardHelp.scrollTop)}
          ${createShortcutRow('Escape', MESSAGES.keyboardHelp.closeModal)}
          ${createShortcutRow(`${modifierKey} + P`, MESSAGES.actions.print)}
        </div>
      </div>

      <!-- Image Gallery Section -->
      <div class="markview-keyboard-help-section">
        <h2 class="markview-keyboard-help-section-title">${MESSAGES.keyboardHelp.imageGallery}</h2>
        <div class="markview-keyboard-help-shortcuts">
          ${createShortcutRow('←', MESSAGES.keyboardHelp.previousImage)}
          ${createShortcutRow('→', MESSAGES.keyboardHelp.nextImage)}
          ${createShortcutRow('Escape', MESSAGES.keyboardHelp.closeViewer)}
        </div>
      </div>

      <!-- Platform Note -->
      <div class="markview-keyboard-help-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>${isMac ? MESSAGES.keyboardHelp.macNote : MESSAGES.keyboardHelp.windowsNote}</span>
      </div>
    </div>
  `;
}

/**
 * Create a single shortcut row
 */
function createShortcutRow(keys: string, description: string): string {
  // Split combined keys by + for proper rendering
  const keyParts = keys.split(' + ').map(k => k.trim());
  const keysHTML = keyParts
    .map(key => `<kbd class="markview-keyboard-key">${key}</kbd>`)
    .join('<span class="markview-keyboard-plus">+</span>');

  return `
    <div class="markview-keyboard-help-row">
      <div class="markview-keyboard-help-keys">
        ${keysHTML}
      </div>
      <div class="markview-keyboard-help-description">${description}</div>
    </div>
  `;
}

/**
 * Close modal with fade-out animation
 */
function closeModal(overlay: HTMLElement): void {
  // Add fade out animation using inline styles (more reliable than CSS class)
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.2s ease-out';
  setTimeout(() => {
    overlay.remove();
  }, 200);
  logger.log('[KeyboardShortcutsHelp] Modal closed');
}

/**
 * Update modal content when language changes
 */
function updateModalContent(header: HTMLElement, body: HTMLElement): void {
  header.innerHTML = getHeaderHTML();
  body.innerHTML = getBodyHTML();
  logger.log('[KeyboardShortcutsHelp] Modal content updated for language change');
}
