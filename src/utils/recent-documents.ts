/**
 * Recent Documents Manager
 * Tracks and manages recently opened markdown documents
 */

import { logger } from '@utils/logger';

export interface RecentDocument {
  url: string;
  title: string;
  lastAccess: string; // ISO 8601 timestamp
  source: 'browser-rendered' | 'local-file-system'; // Track source type
}

const STORAGE_KEY = 'markviewHistory';
const MAX_ITEMS = 100;

/**
 * Save current document to recent history
 */
export async function saveToHistory(
  url: string,
  title: string,
  source: 'browser-rendered' | 'local-file-system' = 'browser-rendered'
): Promise<void> {
  try {
    // Get existing history
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const history: RecentDocument[] = result[STORAGE_KEY] || [];

    // Remove existing entry for this URL (deduplication)
    const filteredHistory = history.filter(item => item.url !== url);

    // Add new entry at the beginning
    filteredHistory.unshift({
      url: url,
      title: title,
      lastAccess: new Date().toISOString(),
      source: source,
    });

    // Keep only last 100 items
    const trimmedHistory = filteredHistory.slice(0, MAX_ITEMS);

    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEY]: trimmedHistory });

    logger.log('[RecentDocuments] Saved to history:', { url, title, source });
  } catch (error) {
    // Silent error - don't break the app if history fails
    logger.error('[RecentDocuments] Failed to save to history:', error);
  }
}

/**
 * Get recent documents from storage
 */
export async function getRecentDocuments(): Promise<RecentDocument[]> {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    logger.error('[RecentDocuments] Failed to get history:', error);
    return [];
  }
}

/**
 * Clear all recent documents
 */
export async function clearRecentDocuments(): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    logger.log('[RecentDocuments] History cleared');
  } catch (error) {
    logger.error('[RecentDocuments] Failed to clear history:', error);
    throw error;
  }
}

/**
 * Remove a specific document from history
 */
export async function removeFromHistory(url: string): Promise<void> {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const history: RecentDocument[] = result[STORAGE_KEY] || [];

    // Filter out the specified URL
    const filteredHistory = history.filter(item => item.url !== url);

    await chrome.storage.local.set({ [STORAGE_KEY]: filteredHistory });

    logger.log('[RecentDocuments] Removed from history:', url);
  } catch (error) {
    logger.error('[RecentDocuments] Failed to remove from history:', error);
    throw error;
  }
}

/**
 * Extract filename from URL
 */
export function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || url;
    return decodeURIComponent(fileName);
  } catch (error) {
    return url;
  }
}

/**
 * Get current document URL
 * Handles both file:// and http(s):// protocols
 */
export function getCurrentDocumentUrl(): string {
  return window.location.href;
}

/**
 * Get current document title
 * Falls back to filename if title is not set
 */
export function getCurrentDocumentTitle(): string {
  const title = document.title;
  if (title && title.trim() && title !== 'Untitled') {
    return title.trim();
  }

  // Fallback to filename
  return extractFileName(getCurrentDocumentUrl());
}
