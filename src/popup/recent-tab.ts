/**
 * Recent Tab Component
 * Handles all recent documents logic in the popup
 */

import { logger } from '@utils/logger';
import { getMessage, applyTranslations } from '@utils/i18n';
import { PopupUI } from './popup-ui';

// Recent Documents Management
interface RecentDocument {
  url: string;
  title: string;
  lastAccess: string;
  source: 'browser-rendered' | 'local-file-system'; // Track source type
}

export class RecentTab {
  private container: HTMLElement;
  private allRecentDocuments: RecentDocument[] = [];
  private filteredRecentDocuments: RecentDocument[] = [];

  // Track current notification and timeout to prevent duplicates
  private currentNotification: HTMLElement | null = null;
  private notificationTimeout: NodeJS.Timeout | null = null;
  private notificationHideTimeout: NodeJS.Timeout | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initialize recent tab - load files and setup listeners
   */
  async initialize(): Promise<void> {
    this.setupEventListeners();
    await this.loadRecentFiles();
  }

  /**
   * Setup event listeners for recent documents
   */
  private setupEventListeners(): void {
    // Search input
    const searchInput = document.getElementById('recent-search') as HTMLInputElement;
    logger.log('Search input element:', searchInput);
    if (searchInput) {
      logger.log('Adding input event listener to search input');
      searchInput.addEventListener('input', e => {
        const query = (e.target as HTMLInputElement).value;
        logger.log('Search input event fired, query:', query);
        this.handleRecentSearch(query);
      });
    } else {
      logger.warn('Search input element not found!');
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-recent') as HTMLButtonElement;
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        // Add visual feedback
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';

        await this.loadRecentFiles();

        // Reset button
        refreshBtn.disabled = false;
        refreshBtn.textContent = getMessage('recent_refresh') || 'Refresh';

        // Show brief success feedback
        this.showNotification(getMessage('recent_refreshed') || 'Recent documents refreshed', 'success');
      });
    }

    // Clear all button
    const clearBtn = document.getElementById('clear-recent');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearAllRecentDocuments();
      });
    }
  }

  /**
   * Load recent files from storage (public method)
   */
  async loadRecentFiles(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['markviewHistory']);
      this.allRecentDocuments = result.markviewHistory || [];
      this.filteredRecentDocuments = this.allRecentDocuments;
      this.renderRecentFiles(this.filteredRecentDocuments);
    } catch (error) {
      logger.error('Failed to load recent documents:', error);
      this.showRecentError('Failed to load recent documents');
    }
  }

  /**
   * Render recent files list
   */
  private renderRecentFiles(documents: RecentDocument[]): void {
    const emptyState = document.querySelector('.popup-empty-state');
    const filesList = document.getElementById('recent-files-list');
    const noResults = document.querySelector('.recent-no-results');

    if (!filesList) return;

    // Clear existing items
    filesList.innerHTML = '';

    // Show empty state if no documents
    if (documents.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      filesList.classList.add('hidden');
      if (noResults) noResults.remove();
      return;
    }

    // Hide empty state and show list
    if (emptyState) emptyState.classList.add('hidden');
    filesList.classList.remove('hidden');

    // Check if this is a search with no results
    const searchInput = document.getElementById('recent-search') as HTMLInputElement;
    const hasSearchQuery = searchInput && searchInput.value.trim();

    if (hasSearchQuery && documents.length === 0 && this.allRecentDocuments.length > 0) {
      // Create no results message for failed search
      let noResultsEl = document.querySelector('.recent-no-results');
      if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = 'recent-no-results';
        noResultsEl.textContent = getMessage('recent_noResults') || 'No documents match your search';
        filesList.parentElement?.insertBefore(noResultsEl, filesList);
      }
      filesList.classList.add('hidden');
      return;
    } else {
      // Remove no results message if it exists
      const noResultsEl = document.querySelector('.recent-no-results');
      if (noResultsEl) noResultsEl.remove();
    }

    // Group documents by source type
    // Local files: File System API OR file:// protocol
    // External files: http:// or https:// protocol
    const localFiles = documents.filter(
      d => d.source === 'local-file-system' || d.url.startsWith('file://')
    );
    const externalFiles = documents.filter(
      d => d.url.startsWith('http://') || d.url.startsWith('https://')
    );

    // Render Local Files section
    if (localFiles.length > 0) {
      const localSection = document.createElement('div');
      localSection.className = 'recent-files-section';
      localSection.innerHTML = `
      <div class="recent-section-header">
        <svg class="icon-base" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${getMessage('recent_localFiles') || 'Local Files'}</span>
        <span class="badge">${localFiles.length}</span>
      </div>
      <ul class="recent-section-list"></ul>
    `;

      const localList = localSection.querySelector('.recent-section-list');

      // Show flat list of files
      localFiles.forEach(doc => {
        const li = this.createRecentFileItem(doc);
        localList?.appendChild(li);
      });

      filesList.appendChild(localSection);
    }

    // Render External Files section
    if (externalFiles.length > 0) {
      const externalSection = document.createElement('div');
      externalSection.className = 'recent-files-section';
      externalSection.innerHTML = `
      <div class="recent-section-header">
        <svg class="icon-base" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>${getMessage('recent_externalFiles') || 'External Files'}</span>
        <span class="badge">${externalFiles.length}</span>
      </div>
      <ul class="recent-section-list"></ul>
    `;

      const externalList = externalSection.querySelector('.recent-section-list');

      // Show flat list of files
      externalFiles.forEach(doc => {
        const li = this.createRecentFileItem(doc);
        externalList?.appendChild(li);
      });

      filesList.appendChild(externalSection);
    }
  }


  /**
   * Create a recent file item element
   */
  private createRecentFileItem(doc: RecentDocument): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'recent-file-item';
    li.dataset.url = doc.url;

    // Check if this is a File System API file (non-reopenable)
    const isFileSystemApi = doc.url.startsWith('fs-api://');
    if (isFileSystemApi) {
      li.classList.add('fs-api-file');
      li.title = getMessage('recent_cannotReopen');
    } else {
      // Regular files (http://, https://, file://) can be opened
      li.title = getMessage('recent_clickToOpen');
    }

    // Format timestamp
    const date = new Date(doc.lastAccess);
    const timeStr = this.formatRelativeTime(date);

    // Create content div
    const contentDiv = document.createElement('div');
    contentDiv.className = 'recent-file-content';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'recent-file-name';
    nameSpan.textContent = doc.title;

    const pathSpan = document.createElement('span');
    pathSpan.className = 'recent-file-path';
    // Display cleaned path (remove fs-api:// prefix for display)
    const displayUrl = isFileSystemApi ? doc.url.replace('fs-api://', 'Local: ') : doc.url;
    pathSpan.textContent = displayUrl;
    pathSpan.title = displayUrl;

    // Clock icon for access time
    const clockIcon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'recent-file-time';
    timeSpan.innerHTML = `${clockIcon} ${getMessage('recent_accessed')}: ${timeStr}`;

    contentDiv.appendChild(nameSpan);
    contentDiv.appendChild(pathSpan);
    contentDiv.appendChild(timeSpan);

    // Create actions div
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'recent-file-actions';

    // Copy URL button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'recent-action-btn';
    copyBtn.title = getMessage('recent_copyUrl');
    copyBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.copyUrlToClipboard(doc.url);
    });

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'recent-action-btn';
    removeBtn.title = getMessage('recent_removeItem');
    removeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.removeRecentDocument(doc.url);
    });

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(removeBtn);

    // Click handler for opening document
    // Shift+Click opens in new tab, regular click opens in current tab
    li.addEventListener('click', async (e: MouseEvent) => {
      await this.openRecentDocument(doc.url, e.shiftKey);
    });

    li.appendChild(contentDiv);
    li.appendChild(actionsDiv);

    return li;
  }

  /**
   * Format relative time
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    // For older dates, show actual date
    return date.toLocaleDateString(navigator.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Open a recent document
   */
  private async openRecentDocument(url: string, openInNewTab: boolean = false): Promise<void> {
    try {
      // File System API not supported in OSS version
      if (url.startsWith('fs-api://')) {
        this.showNotification(
          'Local file system support is not available in the open source version.',
          'error'
        );
        return;
      }

      // For browser-rendered files (http://, https://, file://) - existing logic
      if (openInNewTab) {
        // Open in new tab
        chrome.tabs.create({ url: url }, () => {
          window.close();
        });
      } else {
        // Open in current tab (default behavior - matches sidebar file clicks)
        // Query for active tab since popup doesn't have a "current tab" context
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.update(tabs[0].id, { url: url }, () => {
              window.close();
            });
          } else {
            // Fallback to new tab if active tab not found
            chrome.tabs.create({ url: url }, () => {
              window.close();
            });
          }
        });
      }
    } catch (error) {
      logger.error('Failed to open document:', error);
      this.showNotification(getMessage('recent_openFailed') || 'Failed to open document', 'error');
    }
  }

  /**
   * Copy URL to clipboard
   */
  private async copyUrlToClipboard(url: string): Promise<void> {
    try {
      // Check if this is a File System API file
      if (url.startsWith('fs-api://')) {
        // For File System API files, copy just the filename (more useful than synthetic URL)
        const filename = url.replace('fs-api:///', '');
        await navigator.clipboard.writeText(filename);
        this.showNotification(
          (getMessage('recent_filenameCopied') || 'Filename copied') + ': ' + filename,
          'success'
        );
      } else {
        // For regular files, copy the full URL
        await navigator.clipboard.writeText(url);
        this.showNotification(getMessage('recent_urlCopied'), 'success');
      }
    } catch (error) {
      logger.error('Failed to copy URL:', error);
    }
  }

  /**
   * Remove a recent document
   */
  private async removeRecentDocument(url: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['markviewHistory']);
      const history: RecentDocument[] = result.markviewHistory || [];
      const filteredHistory = history.filter(item => item.url !== url);
      await chrome.storage.local.set({ markviewHistory: filteredHistory });
      await this.loadRecentFiles();
      this.showNotification(getMessage('recent_removed') || 'Document removed from list', 'success');
    } catch (error) {
      logger.error('Failed to remove document:', error);
    }
  }

  /**
   * Clear all recent documents
   */
  private async clearAllRecentDocuments(): Promise<void> {
    const confirmed = await this.showClearHistoryDialog();
    if (!confirmed) return;

    try {
      await chrome.storage.local.set({ markviewHistory: [] });
      await this.loadRecentFiles();
      this.showNotification(getMessage('recent_clearSuccess') || 'Recent documents cleared', 'success');
    } catch (error) {
      logger.error('Failed to clear recent documents:', error);
      this.showNotification(
        getMessage('recent_clearFailed') || 'Failed to clear recent documents',
        'error'
      );
    }
  }

  /**
   * Show clear history dialog
   */
  private showClearHistoryDialog(): Promise<boolean> {
    return new Promise(resolve => {
      let dialog = document.getElementById('clear-history-dialog');
      if (!dialog) {
        dialog = PopupUI.createClearHistoryDialog();
        document.body.appendChild(dialog);
        applyTranslations(dialog);
      }

      // Show dialog
      dialog.classList.remove('hidden');

      const confirmBtn = dialog.querySelector('.clear-history-confirm') as HTMLButtonElement;
      const cancelBtn = dialog.querySelector('.clear-history-cancel') as HTMLButtonElement;

      if (!confirmBtn || !cancelBtn) {
        resolve(false);
        return;
      }

      const handleConfirm = () => {
        dialog.classList.add('hidden');
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        dialog.classList.add('hidden');
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        dialog.removeEventListener('click', handleBackdropClick);
      };

      const handleBackdropClick = (e: MouseEvent) => {
        if (e.target === dialog) {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      dialog.addEventListener('click', handleBackdropClick);
    });
  }

  /**
   * Show error in recent files view
   */
  private showRecentError(message: string): void {
    const emptyState = document.querySelector('.popup-empty-state');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const title = emptyState.querySelector('.popup-empty-title');
      const text = emptyState.querySelector('.popup-empty-text');
      if (title) title.textContent = 'Error';
      if (text) text.textContent = message;
    }
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error'): void {
    // Remove existing notification if any
    if (this.currentNotification) {
      if (this.currentNotification.parentNode) {
        this.currentNotification.parentNode.removeChild(this.currentNotification);
      }
      this.currentNotification = null;
    }

    // Clear existing timeouts
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    if (this.notificationHideTimeout) {
      clearTimeout(this.notificationHideTimeout);
      this.notificationHideTimeout = null;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `popup-notification popup-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: ${type === 'error' ? '#f44336' : '#4caf50'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-size: 14px;
    max-width: 320px;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

    // Add to body
    document.body.appendChild(notification);
    this.currentNotification = notification;

    // Trigger slide down animation
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
    });

    // Remove after 4 seconds
    this.notificationTimeout = setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';

      this.notificationHideTimeout = setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (this.currentNotification === notification) {
          this.currentNotification = null;
        }
        this.notificationHideTimeout = null;
      }, 300);

      this.notificationTimeout = null;
    }, 4000);

    // Also log to console
    logger.log(`[${type.toUpperCase()}]`, message);
  }

  /**
   * Handle search query
   */
  private handleRecentSearch(query: string): void {
    logger.log('handleRecentSearch called with query:', query);
    logger.log('allRecentDocuments length:', this.allRecentDocuments.length);

    if (!query.trim()) {
      this.filteredRecentDocuments = this.allRecentDocuments;
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredRecentDocuments = this.allRecentDocuments.filter(
        doc =>
          doc.title.toLowerCase().includes(lowerQuery) || doc.url.toLowerCase().includes(lowerQuery)
      );
    }

    logger.log('filteredRecentDocuments length:', this.filteredRecentDocuments.length);
    this.renderRecentFiles(this.filteredRecentDocuments);
  }

  /**
   * Get the container element
   */
  getElement(): HTMLElement {
    return this.container;
  }
}
