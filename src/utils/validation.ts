/**
 * Validation utilities for MarkView
 * Checks if current page is a valid markdown file
 */

import { detectMarkdownSource, isMarkdownContentType } from './content-detection';

/**
 * Check if this is a markdown file by URL extension
 */
export function isMarkdownFile(): boolean {
  const url = window.location.href;
  // Strip fragment (#...) and query string (?...) before checking extension
  const withoutFragment = url.split('#')[0] ?? url;
  const baseUrl = withoutFragment.split('?')[0] ?? withoutFragment;
  return /\.(md|markdown|mkd|mdx)$/i.test(baseUrl);
}

/**
 * Validate if current page is a valid markdown file that should be processed
 * Returns the source type if valid, or null if invalid
 */
export function validateMarkdownPage(): 'browser-rendered' | 'local-file-system' | null {
  // Check 1: URL must end with markdown extension
  if (!isMarkdownFile()) {
    return null; // Not a markdown file
  }

  // Check 2: Detect if this is actually a browser-rendered markdown file
  const sourceType = detectMarkdownSource();

  // Exit immediately if source type is unknown (e.g., GitHub blob pages)
  if (sourceType === 'unknown') {
    return null; // Complex HTML page, not raw markdown
  }

  // Check 3: For browser-rendered markdown, verify content type
  if (sourceType === 'browser-rendered') {
    if (!isMarkdownContentType()) {
      return null; // Wrong MIME type
    }
  }

  return sourceType;
}
