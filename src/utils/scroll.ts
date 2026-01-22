/**
 * Scroll utilities for MarkView
 */

import { logger } from './logger';

/**
 * Update scroll position to hash fragment in URL
 * Example: https://example.com/file.md#section-name
 */
export function scrollToHash(): void {
  if (window.location.hash) {
    setTimeout(() => {
      const hash = window.location.hash.slice(1); // Remove '#' prefix
      const decodedHash = decodeURIComponent(hash);

      // Try to find the heading with the matching ID
      const targetElement = document.getElementById(decodedHash);

      if (targetElement) {
        logger.log('[MarkView] Scrolling to hash:', decodedHash);
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        logger.warn('[MarkView] Hash target not found:', decodedHash);
      }
    }, 300); // Small delay to ensure rendering is complete
  }
}
