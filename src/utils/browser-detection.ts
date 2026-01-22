/**
 * Browser Detection Utility
 * Provides utilities for detecting the browser type and getting browser-specific URLs
 */

export type BrowserType = 'chrome' | 'edge';

/**
 * Extension store URLs for different browsers
 */
const EXTENSION_STORE_URLS = {
  chrome: 'https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien',
  edge: 'https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed',
} as const;

/**
 * Extension management page URLs for different browsers
 */
const EXTENSION_MANAGEMENT_URLS = {
  chrome: 'chrome://extensions/',
  edge: 'edge://extensions/',
} as const;

/**
 * Detects the current browser type
 * @returns The browser type ('edge' or 'chrome')
 */
export function getBrowserType(): BrowserType {
  const userAgent = navigator.userAgent.toLowerCase();

  // Edge (Chromium-based) contains 'edg/' or 'edge/'
  if (userAgent.includes('edg/') || userAgent.includes('edge/')) {
    return 'edge';
  }

  // Default to Chrome for Chrome and other Chromium-based browsers
  return 'chrome';
}

/**
 * Gets the extension store URL for the current browser
 * @returns The URL to the extension's store page
 */
export function getExtensionStoreUrl(): string {
  const browserType = getBrowserType();
  return EXTENSION_STORE_URLS[browserType];
}

/**
 * Gets the extension management page URL for the current browser
 * @returns The URL to the browser's extension management page
 */
export function getExtensionManagementUrl(): string {
  const browserType = getBrowserType();
  return EXTENSION_MANAGEMENT_URLS[browserType];
}

/**
 * Gets the store name for the current browser
 * @returns The display name of the extension store
 */
export function getStoreName(): string {
  const browserType = getBrowserType();
  return browserType === 'edge' ? 'Microsoft Edge Add-ons' : 'Chrome Web Store';
}
