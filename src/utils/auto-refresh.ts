/**
 * Auto-refresh utilities for MarkView
 * Handles automatic content reloading for external files
 */

import { extractMarkdownSource } from './dom';
import { logger } from './logger';
import { showNotification } from './notification';
import { MESSAGES } from './messages';

// Auto-refresh state
let autoRefreshInterval: number | null = null;
let lastFileContent: string | null = null;
let currentFileUrl: string | null = null;

/**
 * Start auto-refresh polling for external files (browser-rendered)
 */
export function startAutoRefresh(
  interval: number = 2000,
  onContentChange: (content: string) => Promise<void>
): void {
  // Stop existing interval if any
  stopAutoRefresh();

  logger.log('[MarkView] Starting auto-refresh, interval:', interval, 'ms');

  // Store current URL and content
  currentFileUrl = window.location.href;
  lastFileContent = extractMarkdownSource();

  // Set up polling interval
  autoRefreshInterval = window.setInterval(async () => {
    try {
      // Use background service worker to fetch the file
      // This avoids CORS issues since the service worker has host_permissions
      chrome.runtime.sendMessage({ action: 'fetch', url: currentFileUrl }, response => {
        if (chrome.runtime.lastError) {
          logger.log('[MarkView] Runtime error:', chrome.runtime.lastError.message);
          return;
        }

        if (!response || response.error) {
          logger.log('[MarkView] Auto-refresh fetch failed:', response?.error);
          return;
        }

        // Extract markdown content from HTML response
        // Browsers wrap markdown files in <pre> tags
        let newContent = response.content;

        if (newContent && newContent.includes('<pre>')) {
          // Parse HTML to extract content from <pre> tag
          const parser = new DOMParser();
          const doc = parser.parseFromString(newContent, 'text/html');
          const preElement = doc.querySelector('body > pre');

          if (preElement && preElement.textContent) {
            newContent = preElement.textContent;
          }
        }

        // Check if content has changed
        if (newContent && newContent !== lastFileContent) {
          logger.log('[MarkView] File content changed, re-rendering...');
          lastFileContent = newContent;
          onContentChange(newContent).then(() => {
            showNotification(MESSAGES.notification.contentUpdated, 'info', 1500);
          });
        }
      });
    } catch (err) {
      // Silently ignore errors to avoid showing in the extension error log
      // chrome://extensions/?errors=idjpfcnfiddjhbgkejkdgbgmmenhmnbh
    }
  }, interval);
}

/**
 * Start auto-refresh for local files using File System Access API
 * NOTE: This feature has been removed in the open source version
 */
export async function startLocalFileAutoRefresh(
  _interval: number = 2000,
  _onContentChange: (content: string) => Promise<void>,
  _providedFileHandle?: FileSystemFileHandle
): Promise<void> {
  logger.log('[MarkView] Local file auto-refresh is not available in open source version');
  showNotification(MESSAGES.notification.autoRefreshUnavailable, 'info', 5000);
}

/**
 * Stop auto-refresh polling
 */
export function stopAutoRefresh(): void {
  if (autoRefreshInterval !== null) {
    logger.log('[MarkView] Stopping auto-refresh');
    window.clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

/**
 * Reset auto-refresh state (when switching files or cleaning up)
 */
export function resetAutoRefreshState(): void {
  stopAutoRefresh();
  lastFileContent = null;
  currentFileUrl = null;
}
