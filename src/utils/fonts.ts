/**
 * Font Family Utility
 * Provides mapping from font names to CSS font-family values
 * Implements lazy loading with CSP detection for Google Fonts
 */
import { logger } from '@utils/logger';
import { doesCSPBlockExternalResources } from '@utils/sandbox-detection';

/**
 * Map of font names to CSS font-family values
 * Each font includes system font fallbacks
 */
const FONT_FAMILIES: Record<string, string> = {
  default:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif',
  Inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  Merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
  'Merriweather Sans':
    '"Merriweather Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'Noto Sans': '"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'Noto Serif SC': '"Noto Serif SC", Georgia, "Times New Roman", serif',
  'Open Sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Roboto: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'Source Sans 3': '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

/**
 * Google Fonts that need to be loaded from external URL
 * Only "default" uses system fonts
 */
const GOOGLE_FONTS: Record<string, string> = {
  Inter: 'Inter:wght@400;500;600;700',
  Merriweather: 'Merriweather:wght@400;700',
  'Merriweather Sans': 'Merriweather+Sans:wght@400;500;600;700',
  'Noto Sans': 'Noto+Sans:wght@400;500;600;700',
  'Noto Serif SC': 'Noto+Serif+SC:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
  'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700',
};

/**
 * Track which fonts have been loaded
 */
const loadedFonts = new Set<string>();

/**
 * Get CSS font-family value from font name
 */
export function getFontFamily(fontName: string): string {
  return FONT_FAMILIES[fontName] ?? FONT_FAMILIES.default!;
}

/**
 * Check if browser allows loading external fonts (CSP detection)
 * Uses consolidated sandbox detection utility
 */
function canLoadExternalFonts(): boolean {
  // Use the centralized CSP detection from sandbox-detection.ts
  // This avoids code duplication and ensures consistent detection across the app
  return !doesCSPBlockExternalResources();
}

/**
 * Load a specific Google Font on demand
 * @param fontName - Name of the font to load (e.g., "Inter", "Roboto")
 * @returns Promise that resolves when font is loaded or fails gracefully
 */
export async function loadGoogleFont(fontName: string): Promise<void> {
  // Skip if font doesn't need Google Fonts (only "default")
  if (!GOOGLE_FONTS[fontName]) {
    logger.log(`[Fonts] "${fontName}" uses system fonts, no external loading needed`);
    return;
  }

  // Skip if already loaded
  if (loadedFonts.has(fontName)) {
    logger.log(`[Fonts] "${fontName}" already loaded`);
    return;
  }

  // Check CSP - if blocked, silently fall back to system fonts
  if (!canLoadExternalFonts()) {
    logger.log(`[Fonts] CSP blocks external fonts, using system fallback for "${fontName}"`);
    loadedFonts.add(fontName); // Mark as "loaded" to avoid retrying
    return;
  }

  // Load the specific font
  try {
    const fontQuery = GOOGLE_FONTS[fontName];
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;

    // Create unique link ID for this font
    const linkId = `markview-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;

    // Check if link already exists (edge case)
    if (document.getElementById(linkId)) {
      loadedFonts.add(fontName);
      return;
    }

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = fontUrl;

    // Add load/error handlers
    await new Promise<void>(resolve => {
      link.onload = () => {
        loadedFonts.add(fontName);
        logger.log(`[Fonts] Successfully loaded "${fontName}"`);
        resolve();
      };

      link.onerror = () => {
        logger.log(`[Fonts] Failed to load "${fontName}", using system fallback`);
        loadedFonts.add(fontName); // Mark as loaded to prevent retries
        resolve(); // Resolve anyway (graceful degradation)
      };

      document.head.appendChild(link);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!loadedFonts.has(fontName)) {
          logger.log(`[Fonts] Timeout loading "${fontName}", using system fallback`);
          loadedFonts.add(fontName);
          resolve();
        }
      }, 5000);
    });
  } catch (err) {
    logger.log(`[Fonts] Error loading "${fontName}":`, err);
    loadedFonts.add(fontName); // Mark as loaded to prevent retries
  }
}

/**
 * Legacy function - now deprecated
 * @deprecated Use loadGoogleFont(fontName) for lazy loading instead
 */
export function loadGoogleFonts(): void {
  logger.log('[Fonts] loadGoogleFonts() is deprecated - fonts now load on demand');
}
