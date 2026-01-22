/**
 * Centralized utility for opening external links in new tabs
 * Works reliably in all contexts including sandboxed environments
 *
 * This utility:
 * - Preserves browser history (both window.open and chrome.tabs.create do this)
 * - Works in sandboxed contexts (VSCode webviews, CSP-restricted iframes)
 * - Provides fallback mechanism for reliability
 */

import { logger } from './logger';
import { openInNewTab } from './open-tab';
import { isSandboxed } from './sandbox-detection';

/**
 * Open an external URL in a new tab
 *
 * Strategy:
 * - In sandboxed contexts: Uses chrome.runtime messaging (window.open is blocked)
 * - In normal contexts: Uses window.open with fallback to chrome.runtime messaging
 *
 * Both methods preserve browser history and create real browser tabs
 *
 * @param url The URL to open in a new tab
 * @param source Optional source identifier for logging (e.g., 'ProModal', 'HelpModal')
 * @returns Promise that resolves when tab is opened, rejects on error
 *
 * @example
 * ```ts
 * // Basic usage
 * await openExternalLink('https://example.com');
 *
 * // With source for better logging
 * await openExternalLink('https://example.com', 'MyComponent');
 * ```
 */
export async function openExternalLink(url: string, source = 'ExternalLink'): Promise<void> {
  if (!url) {
    logger.error(`[${source}] Cannot open link: URL is empty`);
    throw new Error('URL is required');
  }

  logger.log(`[${source}] Opening external link:`, url);

  // Check if we're in a sandboxed context
  const sandboxed = isSandboxed();

  if (sandboxed) {
    // Use background script message passing for sandboxed contexts
    logger.log(`[${source}] Sandboxed context detected, using background script`);
    try {
      await openInNewTab(url);
      logger.log(`[${source}] Link opened successfully via background script`);
    } catch (error) {
      logger.error(`[${source}] Failed to open link via background:`, error);
      throw error;
    }
  } else {
    // Use direct window.open() for normal contexts (faster, more direct)
    logger.log(`[${source}] Normal context, using window.open()`);
    try {
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // window.open() was blocked (popup blocker, etc.)
        logger.warn(`[${source}] window.open() blocked, falling back to background script`);
        await openInNewTab(url);
      }
      logger.log(`[${source}] Link opened successfully`);
    } catch (error) {
      logger.error(`[${source}] Failed to open link via window.open():`, error);
      // Fallback to background script if window.open() fails
      logger.log(`[${source}] Falling back to background script`);
      await openInNewTab(url);
    }
  }
}
