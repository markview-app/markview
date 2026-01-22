/**
 * Sandbox & CSP Detection Utility
 * Detects if the current page is running in a sandboxed or CSP-restricted context
 *
 * References:
 * - MDN CSP Sandbox: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox
 * - Sandblaster library: https://github.com/JamesMGreene/sandblaster
 *
 * Sandboxed contexts block certain features including:
 * - window.print() (requires allow-modals)
 * - window.alert(), window.confirm(), window.prompt() (require allow-modals)
 * - External resource loading like fonts (requires CSP permissions)
 */

import { logger } from './logger';

/**
 * Cached sandbox detection result
 */
let cachedSandboxStatus: boolean | null = null;

/**
 * Cached CSP detection result for external resources
 */
let cachedCSPBlocks: boolean | null = null;

/**
 * Check if the current context is sandboxed
 *
 * A sandboxed context restricts modal dialogs (print, alert, confirm, prompt)
 * unless the sandbox has the 'allow-modals' flag.
 *
 * Common sandboxed contexts:
 * - Raw files from GitHub (raw.githubusercontent.com)
 * - Files opened via direct URLs in some browsers
 * - Iframes with sandbox attribute
 *
 * @returns true if running in a sandboxed context, false otherwise
 */
export function isSandboxed(): boolean {
  // Return cached result if available
  if (cachedSandboxStatus !== null) {
    return cachedSandboxStatus;
  }

  try {
    let isSandbox = false;

    // Method 1: Check if we're in an iframe
    // Sandboxed iframes: window.self !== window.top
    const isInIframe = window.self !== window.top;

    // Method 2: Check document contentType
    // Raw markdown files are served as text/plain
    const isPlainText = document.contentType === 'text/plain';

    // Method 3: Check for external raw file URLs
    // GitHub raw files, GitLab raw files, etc.
    const isRawFileURL =
      /^https?:\/\/raw\.githubusercontent\.com/.test(window.location.href) ||
      /^https?:\/\/raw\.githubassets\.com/.test(window.location.href) ||
      /^https?:\/\/.*\/raw\//.test(window.location.href);

    // Method 4: Check if sandbox attribute exists (for iframes)
    const hasSandboxAttr = document.documentElement.hasAttribute('sandbox');

    // Method 5: Try to detect if modals are blocked
    // We can't actually test window.print() without triggering it,
    // but we can check if the function exists
    const hasModalFunctions =
      typeof window.print === 'function' &&
      typeof window.alert === 'function' &&
      typeof window.confirm === 'function';

    // Method 6: Check if we're on a local file:// URL
    // Local files should NOT be treated as sandboxed even if contentType is text/plain
    const isLocalFile = window.location.protocol === 'file:';

    // Determine sandbox status
    // Local files (file://) are excluded from sandbox restrictions even if text/plain
    // Only remote plain text files (http/https) are considered sandboxed
    isSandbox =
      (isPlainText && !isLocalFile) ||
      isRawFileURL ||
      hasSandboxAttr ||
      (isInIframe && !hasModalFunctions);

    // Cache the result
    cachedSandboxStatus = isSandbox;

    // Always log detection results for debugging (including non-sandboxed contexts)
    logger.log('[SandboxDetection] Context detection completed', {
      isSandboxed: isSandbox,
      protocol: window.location.protocol,
      contentType: document.contentType,
      isInIframe,
      isPlainText,
      isLocalFile,
      isRawFileURL,
      hasSandboxAttr,
      hasModalFunctions,
    });

    return isSandbox;
  } catch (error) {
    logger.error('[SandboxDetection] Error detecting sandbox:', error);
    // Assume not sandboxed if we can't detect
    cachedSandboxStatus = false;
    return false;
  }
}

/**
 * Check if CSP blocks external resources (fonts, scripts, etc.)
 *
 * This is useful for determining if Google Fonts or other external resources
 * can be loaded, similar to the check in fonts.ts
 *
 * @returns true if CSP blocks external resources, false otherwise
 */
export function doesCSPBlockExternalResources(): boolean {
  // Return cached result if available
  if (cachedCSPBlocks !== null) {
    return cachedCSPBlocks;
  }

  try {
    // Check if we're in a sandboxed context first
    // Sandboxed contexts typically have strict CSP
    const isSandboxContext = window.location.protocol === 'https:' && window.self !== window.top;

    // Check if document is plain text (raw files)
    const isPlainText = document.contentType === 'text/plain';

    // Sandboxed raw file views (like GitHub) have very strict CSP
    if (isPlainText || isSandboxContext) {
      cachedCSPBlocks = true;
      logger.log('[SandboxDetection] CSP blocks external resources (sandboxed context)');
      return true;
    }

    cachedCSPBlocks = false;
    return false;
  } catch (error) {
    logger.error('[SandboxDetection] Error detecting CSP:', error);
    cachedCSPBlocks = true;
    return true;
  }
}

/**
 * Check if a specific window feature is available
 *
 * @param feature The window feature to check (e.g., 'print', 'alert', 'confirm')
 * @returns true if the feature is available and is a function, false otherwise
 */
export function isFeatureAvailable(feature: keyof Window): boolean {
  try {
    return typeof window[feature] === 'function';
  } catch {
    return false;
  }
}

/**
 * Reset cached detection results (useful for testing)
 */
export function resetDetectionCache(): void {
  cachedSandboxStatus = null;
  cachedCSPBlocks = null;
}
