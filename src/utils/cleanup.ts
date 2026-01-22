/**
 * Cleanup utilities for MarkView
 * Handles cleanup of existing MarkView elements when navigating or reinitializing
 */

import { logger } from './logger';
import { resetContentMargins } from './dom';

/**
 * Clean up all existing MarkView DOM elements
 */
export function cleanupMarkViewElements(): void {
  // Clean up any existing MarkView elements from previous page
  const existingSidebar = document.getElementById('markview-sidebar');
  if (existingSidebar) {
    logger.log('MarkView: Removing existing sidebar');
    existingSidebar.remove();
  }

  const existingTocSidebar = document.querySelector('.markview-toc-sidebar');
  if (existingTocSidebar) {
    logger.log('MarkView: Removing existing TOC sidebar');
    existingTocSidebar.remove();
  }

  // Remove all toggle buttons from previous page
  const existingToggleButtons = document.querySelectorAll(
    '.markview-sidebar-toggle, .markview-toc-toggle, .markview-theme-toggle, ' +
      '.markview-centered-toggle, .markview-scroll-top'
  );
  existingToggleButtons.forEach(btn => {
    logger.log('MarkView: Removing existing toggle button:', btn.className);
    btn.remove();
  });

  // Remove action buttons from previous page
  const existingActionButtons = document.getElementById('markview-action-buttons');
  if (existingActionButtons) {
    logger.log('MarkView: Removing existing action buttons');
    existingActionButtons.remove();
  }

  // Remove any existing MarkView container
  const existingContainer = document.getElementById('markview-container');
  if (existingContainer) {
    logger.log('MarkView: Removing existing container');
    existingContainer.remove();
  }

  // Reset content margins (clean slate for new page)
  resetContentMargins();
}
