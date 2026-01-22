/**
 * Optimized Language Loader for highlight.js
 * Bundles only essential languages, reducing bundle size from ~1.2MB to ~200KB
 * Uses highlight.js/lib/common which includes the most popular 38 languages
 */

import hljs from 'highlight.js/lib/common';
import { logger } from '@utils/logger';

// Track initialized state
let initialized = false;

// Map of common language aliases to their actual module names
const languageAliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  yml: 'yaml',
  cs: 'csharp',
  'c++': 'cpp',
};

/**
 * Initialize highlight.js (already has common languages)
 */
export function initializeHighlightJS(): void {
  if (initialized) {
    return;
  }

  const languages = hljs.listLanguages();
  logger.log(`[HighlightJS] Initialized with ${languages.length} built-in languages`);
  logger.log('[HighlightJS] Available:', languages.join(', '));

  initialized = true;
}

/**
 * Load a specific language (no-op as languages are pre-bundled)
 */
export async function loadLanguage(language: string): Promise<boolean> {
  initializeHighlightJS();

  // Normalize language name
  const normalizedLang = (languageAliases[language] || language).toLowerCase();

  // Check if language is available
  if (hljs.getLanguage(normalizedLang)) {
    return true;
  }

  logger.warn(`[HighlightJS] Language not available: ${normalizedLang}`);
  return false;
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  initializeHighlightJS();
  const normalizedLang = (languageAliases[language] || language).toLowerCase();
  return !!hljs.getLanguage(normalizedLang);
}

/**
 * Highlight code with automatic language loading
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  // Skip highlighting for Mermaid diagrams
  if (language === 'mermaid') {
    return escapeHtml(code);
  }

  // Normalize language
  const normalizedLang = (languageAliases[language] || language).toLowerCase();

  // Initialize if needed
  initializeHighlightJS();

  // Check if language is available
  if (hljs.getLanguage(normalizedLang)) {
    try {
      return hljs.highlight(code, { language: normalizedLang, ignoreIllegals: true }).value;
    } catch (err) {
      logger.warn(`[HighlightJS] Failed to highlight code for ${normalizedLang}:`, err);
    }
  }

  // Fallback to plain text
  return escapeHtml(code);
}

/**
 * Synchronous highlight for languages that are already loaded
 */
export function highlightCodeSync(code: string, language: string): string {
  // Skip highlighting for Mermaid diagrams
  if (language === 'mermaid') {
    return escapeHtml(code);
  }

  // Normalize language
  const normalizedLang = (languageAliases[language] || language).toLowerCase();

  // Only highlight if language is already loaded
  if (hljs.getLanguage(normalizedLang)) {
    try {
      return hljs.highlight(code, { language: normalizedLang, ignoreIllegals: true }).value;
    } catch (err) {
      logger.warn(`[HighlightJS] Failed to highlight code for ${normalizedLang}:`, err);
    }
  }

  // Fallback to plain text
  return escapeHtml(code);
}

/**
 * Extract languages from markdown content for preloading
 */
export function extractLanguagesFromMarkdown(markdown: string): string[] {
  const languages: string[] = [];
  // Match code fence language specifiers: ```language
  const codeBlockRegex = /```(\w+)/g;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const lang = match[1]?.toLowerCase();
    if (lang && lang !== 'mermaid' && !languages.includes(lang)) {
      languages.push(lang);
    }
  }

  return languages;
}

/**
 * Preload languages found in markdown content
 */
export async function preloadLanguages(markdown: string): Promise<void> {
  const languages = extractLanguagesFromMarkdown(markdown);

  if (languages.length > 0) {
    logger.log(`[HighlightJS] Preloading ${languages.length} languages:`, languages);
    await Promise.all(languages.map(lang => loadLanguage(lang)));
  }
}

/**
 * Get highlight.js instance for direct access
 */
export function getHighlightJS() {
  return hljs;
}

/**
 * Get list of available languages
 */
export function getLoadedLanguages(): string[] {
  initializeHighlightJS();
  return hljs.listLanguages();
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m] || m);
}
