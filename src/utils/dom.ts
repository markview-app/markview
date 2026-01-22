// MarkView DOM Utilities
// Helper functions for DOM manipulation
import { logger } from '@utils/logger';
import { getFontFamily } from './fonts';

/**
 * Extract markdown source from the page
 * Chrome displays raw markdown in a <pre> tag
 */
export function extractMarkdownSource(): string | null {
  // Chrome wraps raw text files in <pre> tags
  const preElement = document.querySelector('body > pre');
  if (preElement) {
    return preElement.textContent || '';
  }

  // Fallback: try to get from body if no <pre> tag
  const bodyText = document.body.textContent;
  if (bodyText && bodyText.trim()) {
    return bodyText.trim();
  }

  return null;
}

/**
 * Hide the original markdown <pre> element
 */
export function hideOriginalMarkdown(): void {
  const preElement = document.querySelector('body > pre');
  if (preElement) {
    (preElement as HTMLElement).style.display = 'none';
    logger.log('MarkView: Original <pre> element hidden');
  }
}

/**
 * Create and inject the rendered markdown container
 */
export function createMarkdownContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'markview-container';
  container.className = 'markview-content';

  // Insert at the beginning of body
  document.body.insertBefore(container, document.body.firstChild);

  return container;
}

/**
 * Inject rendered HTML into the markdown container
 */
export function injectRenderedHTML(html: string): HTMLElement {
  let container = document.getElementById('markview-container');

  if (!container) {
    container = createMarkdownContainer();
  }

  container.innerHTML = html;
  logger.log('MarkView: HTML injected into container');

  // Process table cells to parse HTML content
  processTableHTML();

  return container;
}

/**
 * Process table cells to convert HTML text into actual HTML elements
 * This handles cases where markdown parsers escape HTML in table cells
 */
function processTableHTML(): void {
  // No-op: HTML lists in tables are now handled by placeholder protection/restoration
  // in markdown.ts. This function kept for potential future use.
}

/**
 * Apply theme class to document and load appropriate syntax highlighting theme
 */
export function applyTheme(theme: 'light' | 'dark' | 'auto'): void {
  // Add base MarkView class to scope all CSS
  document.documentElement.classList.add('markview-active');

  document.documentElement.classList.remove('markview-light', 'markview-dark');

  if (theme === 'auto') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  document.documentElement.classList.add(`markview-${theme}`);

  // Apply syntax highlighting theme
  applySyntaxHighlightingTheme(theme);

  logger.log(`MarkView: Theme applied - ${theme}`);
}

/**
 * Apply syntax highlighting theme for code blocks
 * Note: Custom syntax highlighting theme is now imported in main.ts
 * and uses CSS variables for light/dark mode, so no need to load external theme
 */
function applySyntaxHighlightingTheme(theme: 'light' | 'dark'): void {
  // Custom theme is loaded via main.ts import and uses CSS variables
  // The theme automatically adapts to light/dark mode via .markview-dark class
  logger.log(`MarkView: Using custom syntax highlighting theme - ${theme}`);
}

/**
 * Apply layout settings to container
 */
export function applyLayoutSettings(settings: {
  centered?: boolean;
  maxWidth?: number;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
}): void {
  const container = document.getElementById('markview-container');
  if (!container) {
    logger.error('[applyLayoutSettings] Container not found!');
    return;
  }

  const styles: Record<string, string> = {};

  // Get current sidebar margins
  const margins = getContentMargins();

  // Handle centered vs full-width layout
  // NEW: Unified layout system - maxWidth works in both modes
  if (settings.centered !== undefined) {
    const maxW = settings.maxWidth || 0; // 0 = no max width constraint
    const scrollbarWidth = getScrollbarWidth();
    const totalMargins = margins.left + margins.right;

    // Base padding for all layouts
    styles.padding = '20px';

    if (settings.centered) {
      // ═══════════════════════════════════════════════════════════════
      // CENTERED LAYOUT
      // ═══════════════════════════════════════════════════════════════

      if (maxW > 0) {
        // Centered with max width constraint
        styles.maxWidth = `${maxW}px`;
        styles.width = 'auto';

        if (margins.left === 0 && margins.right === 0) {
          // No sidebars: simple auto-centering
          styles.marginLeft = 'auto';
          styles.marginRight = 'auto';
        } else {
          // With sidebars: center content between them
          // Formula: center within available space (viewport - sidebars)
          styles.marginLeft = `max(${margins.left}px, calc((100vw - ${totalMargins}px - min(${maxW}px, 100vw - ${totalMargins}px - 40px)) / 2 + ${margins.left}px))`;
          styles.marginRight = `max(${margins.right}px, calc((100vw - ${totalMargins}px - min(${maxW}px, 100vw - ${totalMargins}px - 40px)) / 2 + ${margins.right}px))`;
        }
      } else {
        // Centered without max width (fills available space)
        styles.maxWidth = 'none';

        if (totalMargins > 0) {
          // With sidebars: fill space between them, content still "centered"
          styles.width = `calc(100vw - ${totalMargins}px - ${scrollbarWidth}px)`;
          styles.marginLeft = `${margins.left}px`;
          styles.marginRight = `${margins.right}px`;
        } else {
          // No sidebars: fill viewport
          styles.width = '100%';
          styles.marginLeft = 'auto';
          styles.marginRight = 'auto';
        }
      }
    } else {
      // ═══════════════════════════════════════════════════════════════
      // FULL-WIDTH LAYOUT (LEFT-ALIGNED)
      // ═══════════════════════════════════════════════════════════════

      // In full-width mode, always fill available space
      // Remove maxWidth constraint to allow content to expand
      styles.maxWidth = 'none';
      styles.marginLeft = margins.left > 0 ? `${margins.left}px` : '0';
      styles.marginRight = margins.right > 0 ? `${margins.right}px` : '0';

      if (totalMargins > 0) {
        // With sidebars: calculate exact width to fill space between them
        styles.width = `calc(100vw - ${totalMargins}px - ${scrollbarWidth}px)`;
      } else {
        // No sidebars: full viewport width
        styles.width = '100%';
      }
    }
  }

  if (settings.fontSize) {
    styles.fontSize = `${settings.fontSize}px`;
  }

  if (settings.lineHeight) {
    styles.lineHeight = `${settings.lineHeight}`;
  }

  if (settings.fontFamily) {
    styles.fontFamily = getFontFamily(settings.fontFamily);

    // Also apply font to sidebars and other UI elements
    const tocSidebar = document.querySelector('.markview-toc-sidebar') as HTMLElement;
    const bookmarkMenu = document.querySelector('.markview-bookmark-menu') as HTMLElement;
    const actionMenu = document.querySelector('.markview-actions-menu') as HTMLElement;
    const proModal = document.querySelector('.markview-pro-modal') as HTMLElement;
    const keyboardShortcutsModal = document.querySelector(
      '.markview-keyboard-shortcuts-modal'
    ) as HTMLElement;
    const pluginConfigModal = document.querySelector(
      '.markview-plugin-config-modal'
    ) as HTMLElement;

    if (tocSidebar) {
      tocSidebar.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    if (bookmarkMenu) {
      bookmarkMenu.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    if (actionMenu) {
      actionMenu.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    if (proModal) {
      proModal.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    if (keyboardShortcutsModal) {
      keyboardShortcutsModal.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    if (pluginConfigModal) {
      pluginConfigModal.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    const extensionInfoModal = document.querySelector(
      '.markview-extension-info-modal'
    ) as HTMLElement;
    if (extensionInfoModal) {
      extensionInfoModal.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    const licenseInfoModal = document.querySelector('.markview-license-info-modal') as HTMLElement;
    if (licenseInfoModal) {
      licenseInfoModal.style.fontFamily = getFontFamily(settings.fontFamily);
    }

    // Quick Settings modal
    const quickSettingsModal = document.querySelector(
      '.markview-quick-settings-modal'
    ) as HTMLElement;
    if (quickSettingsModal) {
      quickSettingsModal.style.fontFamily = getFontFamily(settings.fontFamily);
    }
  }

  Object.assign(container.style, styles);

  // Force reflow to ensure styles are applied
  container.offsetHeight;

  logger.log('MarkView: Layout settings applied', settings);
}

/**
 * Wait for DOM to be ready
 */
export function waitForDOMReady(): Promise<void> {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve());
    } else {
      resolve();
    }
  });
}

/**
 * Safely execute a function with error handling
 */
export function safeExecute<T>(fn: () => T, errorMessage: string): T | null {
  try {
    return fn();
  } catch (err) {
    logger.error(`MarkView: ${errorMessage}`, err);
    return null;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Centralized content margin management
 * Keeps track of left and right sidebar margins to avoid conflicts
 */
const contentMargins = {
  left: 0,
  right: 0,
};

/**
 * Calculate the width of the vertical scrollbar
 * The scrollbar width is the difference between window.innerWidth (including scrollbar)
 * and document.documentElement.clientWidth (excluding scrollbar)
 */
function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Get current content margins
 */
export function getContentMargins(): { left: number; right: number } {
  return { ...contentMargins };
}

export function setContentMargin(side: 'left' | 'right', width: number): void {
  contentMargins[side] = width;
  applyContentMargins();
}

export function clearContentMargin(side: 'left' | 'right'): void {
  contentMargins[side] = 0;
  applyContentMargins();
}

export function resetContentMargins(): void {
  contentMargins.left = 0;
  contentMargins.right = 0;
  applyContentMargins();
}

export function refreshContentMargins(): void {
  logger.log('MarkView: Refreshing content margins...');
  applyContentMargins();
}

function applyContentMargins(): void {
  const container = document.getElementById('markview-container');
  if (!container) {
    logger.log('MarkView: Container not found, cannot apply margins');
    return;
  }

  // If we have manual margins, disable auto centering
  if (contentMargins.left > 0 || contentMargins.right > 0) {
    container.style.marginLeft = contentMargins.left > 0 ? `${contentMargins.left}px` : '0';
    container.style.marginRight = contentMargins.right > 0 ? `${contentMargins.right}px` : '0';
  } else {
    // No manual margins, restore auto centering
    container.style.marginLeft = '';
    container.style.marginRight = '';
  }

  logger.log(
    `MarkView: Content margins applied - left: ${contentMargins.left}px, right: ${contentMargins.right}px`
  );
}

/**
 * Note: Mermaid diagram rendering is now handled by:
 * - src/plugins/markdown-it-mermaid-render.ts (placeholder generation)
 * - src/utils/mermaid-renderer.ts (async rendering with v11 API)
 * - src/components/mermaid-zoom.ts (zoom/pan controls)
 */
