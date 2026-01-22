// MarkView Chrome Storage Wrapper
// Provides type-safe access to Chrome Storage API

import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';

/**
 * Check if Chrome extension context is valid
 * Returns false if extension was reloaded/updated
 */
function isExtensionContextValid(): boolean {
  try {
    // Try to access chrome.runtime.id - will throw if context is invalidated
    return !!chrome?.runtime?.id;
  } catch (err) {
    return false;
  }
}

/**
 * Check if error is due to extension context invalidation
 */
function isContextInvalidationError(err: unknown): boolean {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorString = String(err);

  // Check for various forms of context invalidation error
  return (
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('extension context') ||
    errorString.includes('Extension context invalidated') ||
    !isExtensionContextValid()
  );
}

/**
 * Handle extension context invalidation
 * Shows a user-friendly message and reloads the page
 */
let reloadScheduled = false; // Prevent multiple reloads

function handleContextInvalidated(operation: string): void {
  if (reloadScheduled) {
    return; // Already handling reload, don't do it again
  }

  reloadScheduled = true;

  logger.log(`MarkView: Extension was updated. Page will reload to apply changes. (${operation})`);

  // Show notification to user
  const notification = document.createElement('div');
  notification.textContent = MESSAGES.notification.extensionUpdated;
  Object.assign(notification.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px 30px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: '999999',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif',
  });
  document.body.appendChild(notification);

  // Reload page after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

export interface DisplaySettings {
  codeBlockDisplay: 'wrap' | 'scroll';
}

export interface MarkViewSettings {
  enabled: boolean;
  language:
    | 'auto'
    | 'en'
    | 'vi'
    | 'ja'
    | 'ko'
    | 'zh_CN'
    | 'zh_TW'
    | 'es'
    | 'fr'
    | 'pt_BR'
    | 'id'
    | 'de'
    | 'ru';
  theme: 'light' | 'dark' | 'auto';
  centered: boolean;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  maxWidth: number;
  highlight: boolean;
  taskLists: boolean;
  tables: boolean;
  tocVisible: boolean;
  tocPosition: 'left' | 'right';
  tocWidth: number;
  autoRefresh: boolean;
  autoRefreshInterval: number; // in milliseconds
  syntaxTheme: string; // 'custom' or highlight.js theme name

  /**
   * Per-plugin enabled/disabled state
   * Key is plugin ID, value is enabled state
   * If not set, uses plugin's default
   */
  pluginSettings?: Record<string, boolean>;

  /**
   * Display settings for content rendering
   */
  displaySettings?: DisplaySettings;
}

export const DEFAULT_SETTINGS: MarkViewSettings = {
  enabled: true,
  language: 'auto',
  theme: 'light',
  centered: true,
  fontSize: 16,
  fontFamily: 'default',
  lineHeight: 1.6,
  maxWidth: 1000,
  highlight: true,
  taskLists: true,
  tables: true,
  tocVisible: true,
  tocPosition: 'left',
  tocWidth: 250,
  autoRefresh: false,
  autoRefreshInterval: 2000, // 2 seconds
  syntaxTheme: 'custom', // Use custom theme by default (matches design system)
  pluginSettings: {}, // Use plugin defaults (empty object means use each plugin's default)
  displaySettings: {
    codeBlockDisplay: 'scroll', // Default to scroll mode (preserves formatting)
  },
};

/**
 * Settings cache to reduce Chrome storage API calls
 * Cache is invalidated when settings change
 */
let settingsCache: MarkViewSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds cache lifetime

/**
 * Invalidate settings cache (called when settings are updated)
 */
function invalidateSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get all settings from Chrome Storage (with caching)
 */
export async function getSettings(): Promise<MarkViewSettings> {
  // Return cached settings if still valid
  const now = Date.now();
  if (settingsCache && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }

  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    handleContextInvalidated('getSettings');
    return DEFAULT_SETTINGS;
  }

  try {
    // Get all stored values (null means get all keys)
    const stored = await chrome.storage.local.get(null);
    logger.log('[Storage] Retrieved from chrome.storage.local:', stored);

    // Merge with defaults, ensuring stored values override defaults
    const settings = { ...DEFAULT_SETTINGS, ...stored } as MarkViewSettings;
    logger.log('[Storage] Final merged settings:', settings);
    logger.log('[Storage] pluginSettings specifically:', settings.pluginSettings);

    // Update cache
    settingsCache = settings;
    cacheTimestamp = now;

    return settings;
  } catch (err) {
    // Check if error is due to context invalidation
    if (isContextInvalidationError(err)) {
      handleContextInvalidated('getSettings');
      return DEFAULT_SETTINGS;
    }

    // Only log unexpected errors
    logger.error('MarkView: Unexpected error getting settings', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get a specific setting value
 */
export async function getSetting<K extends keyof MarkViewSettings>(
  key: K
): Promise<MarkViewSettings[K]> {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    handleContextInvalidated('getSetting');
    return DEFAULT_SETTINGS[key];
  }

  try {
    const result = await chrome.storage.local.get(key);
    return result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
  } catch (err) {
    // Check if error is due to context invalidation
    if (isContextInvalidationError(err)) {
      handleContextInvalidated('getSetting');
      return DEFAULT_SETTINGS[key];
    }

    // Only log unexpected errors
    logger.error(`MarkView: Unexpected error getting setting "${key}"`, err);
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Update settings in Chrome Storage
 */
export async function updateSettings(settings: Partial<MarkViewSettings>): Promise<void> {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    handleContextInvalidated('updateSettings');
    return;
  }

  try {
    await chrome.storage.local.set(settings);
    invalidateSettingsCache(); // Invalidate cache after update
    logger.log('MarkView: Settings updated', settings);
  } catch (err) {
    // Check if error is due to context invalidation
    if (isContextInvalidationError(err)) {
      handleContextInvalidated('updateSettings');
      return;
    }

    // Only log and throw unexpected errors
    logger.error('MarkView: Unexpected error updating settings', err);
    throw err;
  }
}

/**
 * Update a specific setting value
 */
export async function updateSetting<K extends keyof MarkViewSettings>(
  key: K,
  value: MarkViewSettings[K]
): Promise<void> {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    handleContextInvalidated('updateSetting');
    return;
  }

  try {
    await chrome.storage.local.set({ [key]: value });
    invalidateSettingsCache(); // Invalidate cache after update
    logger.log(`MarkView: Setting "${key}" updated to`, value);
  } catch (err) {
    // Check if error is due to context invalidation
    if (isContextInvalidationError(err)) {
      handleContextInvalidated('updateSetting');
      return;
    }

    // Only log and throw unexpected errors
    logger.error(`MarkView: Unexpected error updating setting "${key}"`, err);
    throw err;
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetSettings(): Promise<void> {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    handleContextInvalidated('resetSettings');
    return;
  }

  try {
    await chrome.storage.local.clear();
    await chrome.storage.local.set(DEFAULT_SETTINGS);
    invalidateSettingsCache(); // Invalidate cache after reset
    logger.log('MarkView: Settings reset to defaults');
  } catch (err) {
    // Check if error is due to context invalidation
    if (isContextInvalidationError(err)) {
      handleContextInvalidated('resetSettings');
      return;
    }

    // Only log and throw unexpected errors
    logger.error('MarkView: Unexpected error resetting settings', err);
    throw err;
  }
}

/**
 * Listen for settings changes
 */
export function onSettingsChanged(callback: (changes: Partial<MarkViewSettings>) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    logger.log('[Storage] onChanged fired:', { changes, areaName });

    // Check if extension context is still valid before processing changes
    if (!isExtensionContextValid()) {
      // Don't spam console with errors, just silently ignore
      // The page will be reloaded by handleContextInvalidated() elsewhere
      return;
    }

    if (areaName === 'local') {
      const settingsChanges: Partial<MarkViewSettings> = {};
      for (const key in changes) {
        const change = changes[key];
        logger.log(
          `[Storage] Checking key "${key}": in DEFAULT_SETTINGS=${key in DEFAULT_SETTINGS}, newValue=`,
          change?.newValue
        );
        if (key in DEFAULT_SETTINGS && change?.newValue !== undefined) {
          settingsChanges[key as keyof MarkViewSettings] = change.newValue;
        }
      }
      logger.log('[Storage] Settings changes to propagate:', settingsChanges);
      if (Object.keys(settingsChanges).length > 0) {
        invalidateSettingsCache(); // Invalidate cache when settings change
        callback(settingsChanges);
      }
    }
  });
}
