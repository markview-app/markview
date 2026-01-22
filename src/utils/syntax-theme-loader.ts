/**
 * Syntax Theme Loader
 * Manages syntax highlighting themes for code blocks
 * Supports custom theme (default) and popular highlight.js themes
 */

import { logger } from '@utils/logger';

/**
 * Available syntax themes
 * 'custom' uses the built-in MarkView theme from syntax-highlighting.css
 * Other themes are loaded from highlight.js styles
 */
export interface SyntaxTheme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'auto'; // Indicates theme preference
}

/**
 * Available syntax highlighting themes
 * Curated list of popular and high-quality themes
 */
export const SYNTAX_THEMES: SyntaxTheme[] = [
  // Custom theme (default) - automatically adapts to light/dark mode
  { id: 'custom', name: 'MarkView (Default)', type: 'auto' },

  // Light themes
  { id: 'github', name: 'GitHub', type: 'light' },
  { id: 'vs', name: 'Visual Studio', type: 'light' },
  { id: 'atom-one-light', name: 'Atom One Light', type: 'light' },
  { id: 'tokyo-night-light', name: 'Tokyo Night Light', type: 'light' },

  // Dark themes
  { id: 'github-dark', name: 'GitHub Dark', type: 'dark' },
  { id: 'github-dark-dimmed', name: 'GitHub Dark Dimmed', type: 'dark' },
  { id: 'vs2015', name: 'Visual Studio 2015', type: 'dark' },
  { id: 'atom-one-dark', name: 'Atom One Dark', type: 'dark' },
  { id: 'monokai', name: 'Monokai', type: 'dark' },
  { id: 'monokai-sublime', name: 'Monokai Sublime', type: 'dark' },
  { id: 'tokyo-night-dark', name: 'Tokyo Night Dark', type: 'dark' },
  { id: 'nord', name: 'Nord', type: 'dark' },
  { id: 'night-owl', name: 'Night Owl', type: 'dark' },
];

// Track currently loaded external theme
let currentExternalTheme: string | null = null;
let themeStyleElement: HTMLStyleElement | null = null;

/**
 * Get theme info by ID
 */
export function getThemeById(themeId: string): SyntaxTheme | undefined {
  return SYNTAX_THEMES.find(t => t.id === themeId);
}

/**
 * Get themes filtered by type
 */
export function getThemesByType(type: 'light' | 'dark' | 'auto'): SyntaxTheme[] {
  return SYNTAX_THEMES.filter(t => t.type === type);
}

/**
 * Check if a theme is the custom MarkView theme
 */
export function isCustomTheme(themeId: string): boolean {
  return themeId === 'custom';
}

/**
 * Load and apply a syntax highlighting theme
 * @param themeId - The theme ID to load
 * @returns Promise that resolves when theme is loaded
 */
export async function loadSyntaxTheme(themeId: string): Promise<void> {
  logger.log(`[SyntaxThemeLoader] Loading theme: ${themeId}`);

  // If switching to custom theme, remove external theme stylesheet
  if (isCustomTheme(themeId)) {
    removeExternalTheme();
    enableCustomTheme();
    currentExternalTheme = null;
    logger.log('[SyntaxThemeLoader] Switched to custom MarkView theme');
    return;
  }

  // Don't reload if already loaded
  if (currentExternalTheme === themeId) {
    logger.log(`[SyntaxThemeLoader] Theme ${themeId} already loaded`);
    return;
  }

  // Disable custom theme when using external themes
  disableCustomTheme();

  // Load external highlight.js theme
  try {
    const themeCss = await fetchThemeCss(themeId);
    applyExternalTheme(themeId, themeCss);
    currentExternalTheme = themeId;
    logger.log(`[SyntaxThemeLoader] Loaded external theme: ${themeId}`);
  } catch (error) {
    logger.error(`[SyntaxThemeLoader] Failed to load theme ${themeId}:`, error);
    // Fallback to custom theme
    removeExternalTheme();
    enableCustomTheme();
    currentExternalTheme = null;
  }
}

/**
 * Fetch theme CSS from extension assets
 */
async function fetchThemeCss(themeId: string): Promise<string> {
  const themeUrl = chrome.runtime.getURL(`node_modules/highlight.js/styles/${themeId}.css`);

  const response = await fetch(themeUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch theme: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Apply external theme CSS
 * Scopes the CSS to #markview-container to prevent conflicts
 */
function applyExternalTheme(themeId: string, css: string): void {
  // Remove existing external theme
  removeExternalTheme();

  // Scope CSS to #markview-container
  const scopedCss = scopeThemeCss(css);

  // Create and inject style element
  themeStyleElement = document.createElement('style');
  themeStyleElement.id = 'markview-syntax-theme';
  themeStyleElement.setAttribute('data-theme', themeId);
  themeStyleElement.textContent = scopedCss;

  document.head.appendChild(themeStyleElement);
}

/**
 * Scope theme CSS to .markview-external-syntax-theme #markview-container
 * This ensures external themes have equal specificity to the reset CSS
 * and prevents theme styles from affecting the host page
 */
function scopeThemeCss(css: string): string {
  // Replace .hljs with .markview-external-syntax-theme #markview-container .hljs
  // This gives external themes the same specificity as the reset CSS in syntax-highlighting.css
  // Handle both standalone .hljs and .hljs-* class selectors
  const scope = '.markview-external-syntax-theme #markview-container';
  return css
    .replace(/\.hljs(?![a-zA-Z0-9_-])/g, `${scope} .hljs`)
    .replace(/\.hljs-/g, `${scope} .hljs-`)
    .replace(/pre code\.hljs/g, `${scope} pre code.hljs`)
    .replace(/code\.hljs/g, `${scope} code.hljs`);
}

/**
 * Remove external theme stylesheet
 */
function removeExternalTheme(): void {
  if (themeStyleElement) {
    themeStyleElement.remove();
    themeStyleElement = null;
  }

  // Also remove any existing theme style element
  const existingTheme = document.getElementById('markview-syntax-theme');
  if (existingTheme) {
    existingTheme.remove();
  }
}

/**
 * Disable custom theme (hide it when using external themes)
 * The custom theme is imported via main.ts and always present
 * We disable it by adding a class that hides the custom styles
 */
function disableCustomTheme(): void {
  document.documentElement.classList.add('markview-external-syntax-theme');
}

/**
 * Enable custom theme (show it when not using external themes)
 */
function enableCustomTheme(): void {
  document.documentElement.classList.remove('markview-external-syntax-theme');
}

/**
 * Get the currently active theme ID
 */
export function getCurrentTheme(): string {
  return currentExternalTheme || 'custom';
}
