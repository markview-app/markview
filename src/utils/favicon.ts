/**
 * Favicon utility
 * Sets the favicon for the markdown page
 */

import { logger } from './logger';

/**
 * Set the page favicon using the extension's icon
 * @param iconSize - Size of icon to use (16, 48, or 128)
 */
export function setFavicon(iconSize: 16 | 48 | 128 = 16): void {
  try {
    // Remove any existing favicons
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = chrome.runtime.getURL(`assets/icons/icon-${iconSize}.png`);

    // Append to head
    document.head.appendChild(link);

    logger.log(`[Favicon] Set to icon-${iconSize}.png`);
  } catch (error) {
    logger.error('[Favicon] Failed to set favicon:', error);
  }
}

/**
 * Set custom favicon for file type
 * @param isFolder - Whether to use folder icon
 */
export function setFileTypeFavicon(isFolder: boolean = false): void {
  try {
    // Remove any existing favicons
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';

    if (isFolder) {
      link.href = chrome.runtime.getURL('assets/icons/folder-closed-24.png');
    } else {
      link.href = chrome.runtime.getURL('assets/icons/file-icon-16.png');
    }

    // Append to head
    document.head.appendChild(link);

    logger.log(`[Favicon] Set to ${isFolder ? 'folder' : 'file'} icon`);
  } catch (error) {
    logger.error('[Favicon] Failed to set favicon:', error);
  }
}
