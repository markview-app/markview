/**
 * Settings Manager
 * Handles settings changes and updates
 */

import { createTocSidebar } from '@components/toc-sidebar';
import { getSettings } from '@core/storage';
import { applyLayoutSettings, applyTheme, resetContentMargins } from '@utils/dom';
import { logger } from '@utils/logger';
import { startAutoRefresh, stopAutoRefresh } from '@utils/auto-refresh';
import { ComponentInstances, destroyAllComponents } from './component-manager';
import { initI18n } from '@utils/i18n';
import { loadSyntaxTheme } from '@utils/syntax-theme-loader';

/**
 * TOC visibility state
 */
export interface TocState {
  userClosed: boolean;
}

/**
 * Handle settings changes
 */
export async function handleSettingsChange(
  changes: any,
  components: ComponentInstances,
  tocState: TocState,
  renderContentFn: () => Promise<void>,
  reinitFn: () => Promise<void>
): Promise<void> {
  logger.log('MarkView: Settings changed', changes);

  // Re-apply theme if changed
  if (changes.theme) {
    applyTheme(changes.theme);

    // Re-render Mermaid diagrams with new theme
    const hasMermaidDiagrams = document.querySelectorAll('.mermaid-container').length > 0;
    if (hasMermaidDiagrams) {
      import('@utils/mermaid-renderer').then(({ reRenderDiagrams }) => {
        reRenderDiagrams().catch(err => {
          logger.error('[MarkView] Failed to re-render Mermaid diagrams on theme change:', err);
        });
      });
    }
  }

  // Handle syntax theme changes
  if (changes.syntaxTheme !== undefined) {
    logger.log('[SettingsManager] Syntax theme changed to:', changes.syntaxTheme);
    await loadSyntaxTheme(changes.syntaxTheme);
  }

  // Re-apply layout if changed
  if (
    changes.centered !== undefined ||
    changes.maxWidth ||
    changes.fontSize ||
    changes.lineHeight ||
    changes.fontFamily
  ) {
    // Get fresh settings to ensure we have latest values
    // Force cache refresh by invalidating it first
    const currentSettings = await getSettings();

    // If font family changed, load the Google Font on demand
    if (changes.fontFamily !== undefined) {
      const { loadGoogleFont } = await import('@utils/fonts');
      await loadGoogleFont(changes.fontFamily);
    }

    // Apply layout with merged settings (use changed values if available)
    applyLayoutSettings({
      centered: changes.centered !== undefined ? changes.centered : currentSettings.centered,
      maxWidth: changes.maxWidth !== undefined ? changes.maxWidth : currentSettings.maxWidth,
      fontSize: changes.fontSize !== undefined ? changes.fontSize : currentSettings.fontSize,
      lineHeight:
        changes.lineHeight !== undefined ? changes.lineHeight : currentSettings.lineHeight,
      fontFamily:
        changes.fontFamily !== undefined ? changes.fontFamily : currentSettings.fontFamily,
    });
  }

  // Handle TOC visibility changes
  if (changes.tocVisible !== undefined) {
    if (changes.tocVisible && !components.tocSidebar) {
      // Create TOC if it doesn't exist
      const currentSettings = await getSettings();
      components.tocSidebar = await createTocSidebar({
        position:
          changes.tocPosition !== undefined ? changes.tocPosition : currentSettings.tocPosition,
        width: changes.tocWidth !== undefined ? changes.tocWidth : currentSettings.tocWidth,
        collapsible: true,
      });
      // Reset user closed flag when toggling via popup
      tocState.userClosed = false;
    } else if (!changes.tocVisible && components.tocSidebar) {
      // Hide TOC and mark as user-closed
      components.tocSidebar.hide();
      tocState.userClosed = true;
    } else if (changes.tocVisible && components.tocSidebar) {
      // Show TOC and reset user closed flag
      components.tocSidebar.show();
      tocState.userClosed = false;
    }
  }

  // Re-render if enabled state changed
  if (changes.enabled !== undefined) {
    if (changes.enabled) {
      // Extension re-enabled: re-initialize everything
      await reinitFn();
    } else {
      // Extension disabled: hide all MarkView components
      const container = document.getElementById('markview-container');
      if (container) {
        container.style.display = 'none';
      }
      const preElement = document.querySelector('body > pre') as HTMLElement;
      if (preElement) {
        preElement.style.display = 'block';
      }

      // Destroy all components
      destroyAllComponents(components);

      // Reset margins
      resetContentMargins();
    }
  }

  // Handle auto-refresh changes
  if (changes.autoRefresh !== undefined) {
    if (changes.autoRefresh) {
      const currentSettings = await getSettings();
      const interval =
        changes.autoRefreshInterval !== undefined
          ? changes.autoRefreshInterval
          : currentSettings.autoRefreshInterval;
      startAutoRefresh(interval, renderContentFn);
    } else {
      stopAutoRefresh();
    }
  }

  // Handle auto-refresh interval changes
  if (changes.autoRefreshInterval !== undefined) {
    const currentSettings = await getSettings();
    const isAutoRefreshEnabled =
      changes.autoRefresh !== undefined ? changes.autoRefresh : currentSettings.autoRefresh;
    if (isAutoRefreshEnabled) {
      stopAutoRefresh();
      startAutoRefresh(changes.autoRefreshInterval, renderContentFn);
    }
  }

  // Handle language changes
  if (changes.language !== undefined) {
    logger.log('[SettingsManager] Language changed, reloading i18n and updating components');

    // Reload locale messages with new language (avoid cache race condition)
    await initI18n(changes.language);

    // Dispatch event to notify all components to update their text
    const event = new CustomEvent('markview:languageChanged', {
      detail: { newLanguage: changes.language },
    });
    document.dispatchEvent(event);

    logger.log('[SettingsManager] Language change event dispatched');
  }

  // Handle plugin settings changes
  if (changes.pluginSettings !== undefined) {
    // Plugin settings changed, need to re-render content
    logger.log('[SettingsManager] Plugin settings changed, re-rendering content');
    await renderContentFn();
  }

  // Handle display settings changes
  if (changes.displaySettings !== undefined) {
    if (changes.displaySettings.codeBlockDisplay !== undefined) {
      const container = document.getElementById('markview-container');
      if (container) {
        // Remove both classes first
        container.classList.remove('code-block-wrap', 'code-block-scroll');
        // Add the new class based on setting
        const displayMode = changes.displaySettings.codeBlockDisplay;
        container.classList.add(`code-block-${displayMode}`);
        logger.log(`[SettingsManager] Code block display mode changed to: ${displayMode}`);
      }
    }
  }
}
