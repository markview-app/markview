/**
 * Extension Info Modal Component
 * Displays extension information, version, and quick access links
 * Follows MarkView brand design system
 */

import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';
import { openExternalLink } from '@utils/open-external-link';
import { getExtensionStoreUrl, getStoreName } from '@utils/browser-detection';

// Extension links configuration
const EXTENSION_LINKS = {
  DEMO_VIDEO: 'https://www.youtube.com/watch?v=DVsQg_OBTHs',
  WHATS_NEW: 'https://getmarkview.com/whats-new',
  SUPPORT: 'https://getmarkview.com/support',
  WEBSITE: 'https://getmarkview.com',
} as const;

/**
 * Show extension info modal
 * Displays version, description, and quick access links
 */
export async function showExtensionInfoModal(): Promise<void> {
  logger.log('[ExtensionInfoModal] Showing modal');

  // Get current font family setting
  const { getSettings } = await import('@core/storage');
  const { getFontFamily } = await import('@utils/fonts');
  const settings = await getSettings();
  const fontFamily = settings.fontFamily ? getFontFamily(settings.fontFamily) : 'inherit';

  // Get extension version from manifest
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'markview-extension-info-overlay';

  // Create modal content container
  const modal = document.createElement('div');
  modal.className = 'markview-extension-info-modal';
  if (fontFamily !== 'inherit') {
    modal.style.fontFamily = fontFamily;
  }

  // Create modal header (fixed, no scroll)
  const modalHeader = document.createElement('div');
  modalHeader.className = 'markview-extension-info-header';
  modalHeader.innerHTML = getHeaderHTML(version);

  // Create modal body (scrollable)
  const modalBody = document.createElement('div');
  modalBody.className = 'markview-extension-info-body';
  modalBody.innerHTML = getBodyHTML();

  // Assemble modal structure
  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Setup event listeners
  setupEventListeners(modalHeader, modalBody, overlay);

  logger.log('[ExtensionInfoModal] Modal displayed successfully');
}

/**
 * Generate header HTML with current language
 */
function getHeaderHTML(version: string): string {
  return `
    <button class="markview-extension-info-close" title="${MESSAGES.common.close}">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    
    <div class="markview-extension-info-header-content">
      <div class="markview-extension-info-logo">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="url(#logo-gradient)" stroke="url(#logo-gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient id="logo-gradient" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#667eea"/>
              <stop offset="100%" stop-color="#764ba2"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h1 class="markview-extension-info-title">MarkView</h1>
      <p class="markview-extension-info-version">Version ${version}</p>
      <p class="markview-extension-info-tagline">${MESSAGES.appDescription || 'Modern Markdown Viewer for Chrome'}</p>
    </div>
  `;
}

/**
 * Generate body HTML with current language
 */
function getBodyHTML(): string {
  return `
    <div class="markview-extension-info-content">
      <!-- Quick Links Section -->
      <div class="markview-extension-info-section">
        <h2 class="markview-extension-info-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${MESSAGES.extensionInfo?.quickLinks || 'Quick Links'}
        </h2>
        
        <div class="markview-extension-info-links">
          <a href="#" class="markview-extension-info-link" data-link="demo">
            <div class="markview-extension-info-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="markview-extension-info-link-content">
              <span class="markview-extension-info-link-title">${MESSAGES.watchDemo || 'Watch Demo'}</span>
              <span class="markview-extension-info-link-subtitle">See MarkView in action</span>
            </div>
            <svg class="markview-extension-info-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>

          <a href="#" class="markview-extension-info-link" data-link="whats-new">
            <div class="markview-extension-info-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="markview-extension-info-link-content">
              <span class="markview-extension-info-link-title">${MESSAGES.whatsNew || "What's New"}</span>
              <span class="markview-extension-info-link-subtitle">Latest updates and features</span>
            </div>
            <svg class="markview-extension-info-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>

          <a href="#" class="markview-extension-info-link" data-link="support">
            <div class="markview-extension-info-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="markview-extension-info-link-content">
              <span class="markview-extension-info-link-title">${MESSAGES.reportIssue || 'Report Issue'}</span>
              <span class="markview-extension-info-link-subtitle">Get help and report bugs</span>
            </div>
            <svg class="markview-extension-info-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>

          <a href="#" class="markview-extension-info-link" data-link="website">
            <div class="markview-extension-info-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="2" y1="12" x2="22" y2="12" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="markview-extension-info-link-content">
              <span class="markview-extension-info-link-title">${MESSAGES.extensionInfo?.website || 'Official Website'}</span>
              <span class="markview-extension-info-link-subtitle">Visit getmarkview.com</span>
            </div>
            <svg class="markview-extension-info-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>

          <a href="#" class="markview-extension-info-link" data-link="extension-store">
            <div class="markview-extension-info-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="markview-extension-info-link-content">
              <span class="markview-extension-info-link-title">${MESSAGES.extensionInfo?.rateExtension || 'Rate Extension'}</span>
              <span class="markview-extension-info-link-subtitle">Leave a review on ${getStoreName()}</span>
            </div>
            <svg class="markview-extension-info-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- About Section -->
      <div class="markview-extension-info-section">
        <h2 class="markview-extension-info-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="16" x2="12" y2="12" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="8" x2="12.01" y2="8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${MESSAGES.extensionInfo?.about || 'About'}
        </h2>
        
        <p class="markview-extension-info-description">
          ${MESSAGES.extensionInfo?.description || 'MarkView transforms your Markdown files into beautifully rendered documents with support for syntax highlighting, Mermaid diagrams, math equations, and much more. Browse local files, customize themes, and enjoy a seamless reading experience.'}
        </p>

        <div class="markview-extension-info-features">
          <div class="markview-extension-info-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>180+ Programming Languages</span>
          </div>
          <div class="markview-extension-info-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Mermaid Diagrams & Math</span>
          </div>
          <div class="markview-extension-info-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Dark & Light Themes</span>
          </div>
          <div class="markview-extension-info-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Print & Quick Settings</span>
          </div>
          <div class="markview-extension-info-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Auto-Refresh & Live Preview</span>
          </div>
          <div class="markview-extension-info-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>12 Languages Support</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="markview-extension-info-footer">
        <p>${MESSAGES.extensionInfo?.madeWith || 'Made with'} ❤️ ${MESSAGES.extensionInfo?.forDevelopers || 'for developers and writers'}</p>
        <p class="markview-extension-info-copyright">&copy; 2026 MarkView. ${MESSAGES.extensionInfo?.allRightsReserved || 'All rights reserved'}.</p>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners for modal
 */
function setupEventListeners(
  headerElement: HTMLElement,
  bodyElement: HTMLElement,
  overlay: HTMLElement
): void {
  // Close button handler
  const closeBtn = headerElement.querySelector(
    '.markview-extension-info-close'
  ) as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(overlay));
  }

  // Link click handlers
  const links = bodyElement.querySelectorAll('.markview-extension-info-link');
  links.forEach(link => {
    link.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      const linkType = target.dataset.link;

      let url: string | undefined;
      switch (linkType) {
        case 'demo':
          url = EXTENSION_LINKS.DEMO_VIDEO;
          break;
        case 'whats-new':
          url = EXTENSION_LINKS.WHATS_NEW;
          break;
        case 'support':
          url = EXTENSION_LINKS.SUPPORT;
          break;
        case 'website':
          url = EXTENSION_LINKS.WEBSITE;
          break;
        case 'extension-store':
          url = getExtensionStoreUrl();
          break;
      }

      if (url) {
        logger.log(`[ExtensionInfoModal] Opening link: ${linkType} - ${url}`);
        await openExternalLink(url, 'ExtensionInfoModal');
      }
    });
  });

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
  const handleLanguageChange = async () => {
    await updateModalContent(headerElement, bodyElement, overlay);
  };
  document.addEventListener('markview:languageChanged', handleLanguageChange);
}

/**
 * Update modal content when language changes
 */
async function updateModalContent(
  headerElement: HTMLElement,
  bodyElement: HTMLElement,
  overlay: HTMLElement
): Promise<void> {
  // Get extension version
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  // Update header and body
  headerElement.innerHTML = getHeaderHTML(version);
  bodyElement.innerHTML = getBodyHTML();

  // Re-attach event listeners
  setupEventListeners(headerElement, bodyElement, overlay);

  logger.log('[ExtensionInfoModal] Modal content updated for language change');
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
  logger.log('[ExtensionInfoModal] Modal closed');
}
