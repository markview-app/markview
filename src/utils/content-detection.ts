/**
 * Content Type Detection Utilities
 *
 * Provides utilities for detecting whether the current page should be processed
 * by the markdown viewer extension.
 */

/**
 * Supported content types for markdown files
 * Browsers may serve markdown files with different MIME types
 */
export const CONTENT_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown'] as const;

/**
 * Check if the current document's content type is supported
 *
 * @returns true if the document should be processed by the extension
 */
export function isMarkdownContentType(): boolean {
  const contentType = document.contentType;
  return CONTENT_TYPES.includes(contentType as any);
}

/**
 * Get the raw markdown container (browser's default <pre> tag)
 * When browsers load .md files directly, they display them in a <pre> element
 *
 * @returns The <pre> element containing raw markdown, or null if not found
 */
export function getRawContainer(): HTMLElement | null {
  return document.querySelector('body > pre');
}

/**
 * Extract markdown content from the page
 * Works with both browser-loaded files (<pre> tag) and normal HTML pages
 *
 * @returns The raw markdown text content, or null if not found
 */
export function extractMarkdownSource(): string | null {
  const rawContainer = getRawContainer();
  if (rawContainer) {
    return rawContainer.textContent || null;
  }
  return null;
}

/**
 * Check if we're viewing an external markdown file (not a local file)
 *
 * @returns true if the protocol is http or https
 */
export function isExternalFile(): boolean {
  return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

/**
 * Check if we're viewing a local markdown file
 *
 * @returns true if the protocol is file://
 */
export function isLocalFile(): boolean {
  return window.location.protocol === 'file:';
}

/**
 * Check if the current page is a browser-rendered markdown file
 * This happens when the browser loads a .md file directly and displays it in a <pre> tag
 *
 * @returns true if this is a browser-rendered markdown file
 */
export function isBrowserRenderedMarkdown(): boolean {
  // Check if we have a <pre> tag as direct child of body
  const rawContainer = getRawContainer();
  if (!rawContainer) {
    return false;
  }

  // Check if the <pre> tag contains text content
  const hasContent = !!rawContainer.textContent?.trim();
  if (!hasContent) {
    return false;
  }

  // STRICT CHECK: For external files, body should contain ONLY the <pre> tag
  // GitHub blob pages have complex HTML structure, not just a <pre> tag
  const bodyChildren = document.body.children;

  // Count actual element nodes (ignore text nodes, comments, etc.)
  let elementCount = 0;
  for (let i = 0; i < bodyChildren.length; i++) {
    const child = bodyChildren[i];
    if (child && child.nodeType === Node.ELEMENT_NODE) {
      elementCount++;
    }
  }

  // For raw markdown files, there should be exactly 1 element: the <pre> tag
  // Sometimes there might be a <style> tag too, so allow up to 2 elements
  const hasMinimalDOM = elementCount <= 2;

  // Additional check: the <pre> tag should be visible
  // Even short markdown files (a few lines) should be rendered
  const preIsVisible = rawContainer.offsetHeight > 0 && rawContainer.offsetWidth > 0;

  return hasContent && hasMinimalDOM && preIsVisible;
}

/**
 * Determine the source type of the current markdown page
 *
 * IMPORTANT: Check protocol FIRST before checking browser rendering!
 * Local files (file://) are also browser-rendered in <pre> tags,
 * but we need to treat them differently (with File System Access API)
 *
 * @returns 'browser-rendered' | 'local-file-system' | 'unknown'
 */
export function detectMarkdownSource(): 'browser-rendered' | 'local-file-system' | 'unknown' {
  // Priority 1: Check if it's a local file (file:// protocol)
  // Local files should use File System Access API for folder browsing
  if (isLocalFile()) {
    // Verify it's actually a markdown file being rendered
    if (isBrowserRenderedMarkdown()) {
      return 'local-file-system';
    }
  }

  // Priority 2: Check if it's an external file (http:// or https://)
  // External files get the "External File Mode" message
  if (isExternalFile()) {
    // Verify it's actually browser-rendered markdown
    if (isBrowserRenderedMarkdown()) {
      return 'browser-rendered';
    }
  }

  // Priority 3: Unknown - neither local nor external markdown
  return 'unknown';
}
