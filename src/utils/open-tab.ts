/**
 * Utility for opening URLs in new tabs
 * Works in all contexts including sandboxed environments where window.open() is blocked
 * Uses background script message passing for reliable tab opening
 */

import { logger } from './logger';

/**
 * Open a URL in a new tab
 * Uses chrome.runtime.sendMessage to background script for consistent behavior
 * Works in sandboxed contexts where window.open() is blocked by CSP
 *
 * @param url The URL to open in a new tab
 * @returns Promise that resolves when tab is opened, rejects on error
 */
export async function openInNewTab(url: string): Promise<void> {
  if (!url) {
    throw new Error('URL is required');
  }

  return new Promise((resolve, reject) => {
    logger.log('[openInNewTab] Opening URL:', url);

    // Send message to background script to open tab
    // This works in all contexts including sandboxed iframes where window.open() is blocked
    chrome.runtime.sendMessage(
      {
        action: 'openTab',
        url: url,
      },
      response => {
        if (chrome.runtime.lastError) {
          logger.error('[openInNewTab] Runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.error) {
          logger.error('[openInNewTab] Background script error:', response.error);
          reject(new Error(response.error));
        } else if (response?.success) {
          logger.log('[openInNewTab] Tab opened successfully:', {
            tabId: response.tabId,
            url: response.url,
          });
          resolve();
        } else {
          logger.error('[openInNewTab] Unexpected response:', response);
          reject(new Error('Unexpected response from background script'));
        }
      }
    );
  });
}
