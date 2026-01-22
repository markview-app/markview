/**
 * Extension Lifecycle
 * Manages initialization and state
 */

import { getSettings, onSettingsChanged } from '@core/storage';
import { cleanupMarkViewElements } from '@utils/cleanup';
import { initI18n } from '@utils/i18n';
import { logger } from '@utils/logger';
import { showWelcomeMessage } from '@utils/console-welcome';
import { validateMarkdownPage } from '@utils/validation';
import {
  resetAutoRefreshState,
  startAutoRefresh,
  startLocalFileAutoRefresh,
} from '@utils/auto-refresh';
import {
  ComponentInstances,
  createComponentInstances,
  initializeComponents,
} from './component-manager';
import { DocumentInfo, renderMarkdownContent } from './document-renderer';
import { handleSettingsChange, TocState } from './settings-manager';
import {
  setupTocEventListeners,
  setupFileLoadingListener,
  setupRawViewListener,
  setupVisibilityChangeListener,
  setupPrintListener,
  setupRecentDocumentsFileLoadingListener,
  setupHashChangeListener,
} from './event-handlers';

/**
 * Extension state container
 */
export interface ExtensionState {
  components: ComponentInstances;
  cachedMarkdownSource: { value: string | null };
  tocState: TocState;
  markdownSourceType: { value: 'browser-rendered' | 'local-file-system' | 'unknown' };
  isExtensionActive: { value: boolean };
  currentDocument: DocumentInfo;
}

/**
 * Create initial extension state
 */
export function createExtensionState(): ExtensionState {
  return {
    components: createComponentInstances(),
    cachedMarkdownSource: { value: null },
    tocState: { userClosed: false },
    markdownSourceType: { value: 'unknown' },
    isExtensionActive: { value: false },
    currentDocument: { url: '', title: '' },
  };
}

/**
 * Initialize the extension
 */
export async function initializeExtension(state: ExtensionState): Promise<void> {
  // Validate page first
  const validatedSourceType = validateMarkdownPage();
  if (!validatedSourceType) {
    return; // Not a valid markdown file
  }

  state.markdownSourceType.value = validatedSourceType;
  state.isExtensionActive.value = true;

  // Display welcome message
  showWelcomeMessage();

  // Initialize i18n
  await initI18n();

  logger.log('MarkView: Initializing on markdown file:', window.location.href);
  logger.log('MarkView: Source type:', state.markdownSourceType.value);
  logger.log('MarkView: Content type:', document.contentType);

  // Initialize highlight.js with default languages (non-blocking)
  const { initializeHighlightJS } = await import('@utils/highlight-loader');
  initializeHighlightJS();

  // Note: Google Fonts are now loaded on-demand when user selects a font
  // See src/utils/fonts.ts loadGoogleFont() for lazy loading implementation

  // Reset all global state
  resetAutoRefreshState();
  state.cachedMarkdownSource.value = null;
  state.components = createComponentInstances();
  cleanupMarkViewElements();

  // Check if extension is enabled
  const settings = await getSettings();
  if (!settings.enabled) {
    logger.log('MarkView: Extension disabled in settings');
    return;
  }

  // Render content wrapper
  const renderContent = async (
    customContent?: string,
    customFilename?: string,
    skipHashScroll = false
  ) => {
    await renderMarkdownContent(
      state.components,
      state.cachedMarkdownSource,
      state.currentDocument,
      customContent,
      customFilename,
      skipHashScroll
    );
  };

  // Render markdown content first (show content ASAP)
  await renderContent();

  // Initialize UI components in parallel
  await initializeComponents(state.components);

  // Sync TOC with URL fragment (after TOC has been initialized)
  // We disable scroll spy IMMEDIATELY to prevent IntersectionObserver from interfering
  // during the scroll animation, then sync after scroll completes
  if (window.location.hash && state.components.tocSidebar) {
    // Disable scroll spy immediately (before scroll even starts at T+300ms)
    state.components.tocSidebar.disableScrollSpy();
    logger.log('[MarkView] Disabled scroll spy for URL fragment navigation');

    // Sync after scroll animation completes
    // Delay: 300ms (scrollToHash delay) + 500ms (smooth scroll animation) = 800ms
    setTimeout(() => {
      if (!state.components.tocSidebar) return;

      try {
        const hash = decodeURIComponent(window.location.hash.slice(1));
        const element = document.getElementById(hash);
        if (element) {
          state.components.tocSidebar.syncActiveHeading(element.id);
          logger.log('[MarkView] TOC synced with URL fragment after scroll:', hash);
        }
      } catch {
        // Malformed URI, use raw hash
        const hash = window.location.hash.slice(1);
        const element = document.getElementById(hash);
        if (element) {
          state.components.tocSidebar.syncActiveHeading(element.id);
          logger.log('[MarkView] TOC synced with URL fragment after scroll (raw):', hash);
        }
      }
    }, 800);
  }

  // Setup event listeners
  setupTocEventListeners(state.tocState);
  setupFileLoadingListener(
    state.components,
    state.tocState,
    state.markdownSourceType,
    renderContent
  );
  setupRecentDocumentsFileLoadingListener(renderContent);
  setupRawViewListener();
  setupVisibilityChangeListener(state.markdownSourceType, renderContent);
  setupPrintListener();
  setupHashChangeListener(state.components);

  // Listen for settings changes
  onSettingsChanged(async changes => {
    await handleSettingsChange(changes, state.components, state.tocState, renderContent, () =>
      initializeExtension(state)
    );
  });

  // Initialize auto-refresh if enabled
  if (settings.autoRefresh) {
    if (state.markdownSourceType.value === 'browser-rendered') {
      logger.log('[MarkView] Auto-refresh enabled for external file');
      startAutoRefresh(settings.autoRefreshInterval, renderContent);
    } else if (state.markdownSourceType.value === 'local-file-system') {
      logger.log('[MarkView] Auto-refresh enabled for local file');
      startLocalFileAutoRefresh(settings.autoRefreshInterval, renderContent);
    }
  }
}
