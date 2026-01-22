/**
 * Event Handlers
 * Handles all event listeners and navigation
 */

import { createTocSidebar } from '@components/toc-sidebar';
import { getSettings, updateSetting } from '@core/storage';
import { logger } from '@utils/logger';
import { lazyImageLoader } from '@utils/lazy-load-images';
import { debounce } from '@utils/performance';
import { validateMarkdownPage } from '@utils/validation';
import {
  clearBlobCache,
  resolveImagesInHTML,
  setCurrentFilePath,
} from '@utils/relative-path-resolver';
import { initMermaidZoom } from '@components/mermaid-zoom';
import { startAutoRefresh, startLocalFileAutoRefresh, stopAutoRefresh } from '@utils/auto-refresh';
import { ComponentInstances } from './component-manager';
import { TocState } from './settings-manager';

/**
 * Setup TOC event listeners
 */
export function setupTocEventListeners(tocState: TocState): void {
  // Listen for TOC close event
  document.addEventListener('markview:tocHidden', () => {
    tocState.userClosed = true;
    logger.log('[MarkView] User manually closed TOC');
  });

  // Listen for TOC show event
  document.addEventListener('markview:tocShown', () => {
    tocState.userClosed = false;
    logger.log('[MarkView] User manually opened TOC');
  });
}

/**
 * Setup file loading event listener
 */
export function setupFileLoadingListener(
  components: ComponentInstances,
  tocState: TocState,
  markdownSourceType: { value: string },
  renderContentFn: (content?: string, filename?: string, skipHashScroll?: boolean) => Promise<void>
): void {
  document.addEventListener('markview:loadFile', async (event: Event) => {
    const customEvent = event as CustomEvent;
    const { content, filename, fileHandle, filePath } = customEvent.detail;
    logger.log('[MarkView] Loading custom file:', filename, 'path:', filePath);

    // Manage TOC visibility when switching files
    const settings = await getSettings();
    if (!components.tocSidebar) {
      // Create TOC if it doesn't exist (only if not manually closed by user)
      if (!tocState.userClosed) {
        logger.log('[MarkView] Re-initializing TOC sidebar for new file');
        try {
          components.tocSidebar = await createTocSidebar({
            position: settings.tocPosition,
            width: settings.tocWidth,
            collapsible: true,
          });
          await updateSetting('tocVisible', true);
        } catch (err) {
          logger.error('[MarkView] Failed to re-initialize TOC sidebar:', err);
        }
      }
    } else {
      // Only show TOC if user hasn't manually closed it
      if (!tocState.userClosed) {
        logger.log('[MarkView] Showing TOC sidebar for new file');
        components.tocSidebar.show();
        await updateSetting('tocVisible', true);
      } else {
        logger.log('[MarkView] TOC remains hidden (user preference)');
      }
    }

    // Clear previous blob cache to free memory
    clearBlobCache();

    // Set current file path for relative path resolution
    if (filePath) {
      setCurrentFilePath(filePath);
    }

    // Always skip hash scrolling when loading from UI
    // Reason: URL doesn't update when switching files, so any hash
    // in the URL belongs to a previous file context and shouldn't be used
    const skipHashScroll = true;

    // Render content (skipHashScroll=true prevents using URL hash from previous file)
    await renderContentFn(content, filename, skipHashScroll);

    // Get container for image processing and lazy loading
    const container = document.getElementById('markview-container');
    if (container) {
      // Resolve relative image paths BEFORE lazy loading
      if (filePath) {
        logger.log('[MarkView] Resolving relative image paths for:', filePath);
        await resolveImagesInHTML(container);
      }

      // Apply lazy loading AFTER path resolution
      lazyImageLoader.applyToContainer(container);
    }

    // Restart auto-refresh for the new file if enabled
    if (settings.autoRefresh && markdownSourceType.value === 'local-file-system' && fileHandle) {
      logger.log('[MarkView] Restarting auto-refresh for new file:', filename);
      startLocalFileAutoRefresh(settings.autoRefreshInterval, renderContentFn, fileHandle);
    }
  });
}

/**
 * Setup raw view event listener
 */
export function setupRawViewListener(): void {
  document.addEventListener('markview:rawViewDisabled', () => {
    logger.log('[MarkView] Raw view disabled, re-initializing Mermaid zoom controls');
    initMermaidZoom();
  });
}

/**
 * Setup visibility change listener
 */
export function setupVisibilityChangeListener(
  markdownSourceType: { value: string },
  renderContentFn: () => Promise<void>
): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      logger.log('[MarkView] Tab hidden, pausing auto-refresh');
      stopAutoRefresh();
    } else {
      getSettings().then(settings => {
        if (settings.autoRefresh) {
          if (markdownSourceType.value === 'browser-rendered') {
            logger.log('[MarkView] Tab visible, resuming auto-refresh for external file');
            startAutoRefresh(settings.autoRefreshInterval, renderContentFn);
          } else if (markdownSourceType.value === 'local-file-system') {
            logger.log('[MarkView] Tab visible, resuming auto-refresh for local file');
            startLocalFileAutoRefresh(settings.autoRefreshInterval, renderContentFn);
          }
        }
      });
    }
  });
}

/**
 * Setup print event listener
 */
export function setupPrintListener(): void {
  window.addEventListener('beforeprint', async () => {
    logger.log('[MarkView] Print detected, loading all images');
    await lazyImageLoader.loadAll();
  });
}

/**
 * Setup navigation observers
 */
export function setupNavigationObservers(
  _isExtensionActive: { value: boolean },
  handleNavigationFn: () => void
): void {
  // Helper to extract URL without fragment (hash changes shouldn't trigger re-init)
  const getUrlWithoutHash = (url: string): string => url.split('#')[0] ?? url;

  let lastUrl = getUrlWithoutHash(window.location.href);

  // Observe changes to document title and URL (catches SPA navigation)
  const navigationObserver = new MutationObserver(
    debounce(() => {
      const currentUrl = getUrlWithoutHash(window.location.href);
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        logger.log('[MarkView] URL changed to:', currentUrl);
        handleNavigationFn();
      }
    }, 100)
  );

  navigationObserver.observe(document.querySelector('head > title') || document.head, {
    subtree: true,
    characterData: true,
    childList: true,
  });

  // Listen for popstate (browser back/forward)
  window.addEventListener('popstate', () => {
    logger.log('[MarkView] Browser navigation detected (back/forward)');
    setTimeout(() => {
      handleNavigationFn();
    }, 100);
  });
}

/**
 * Handle navigation events
 */
export function handleNavigation(
  isExtensionActive: { value: boolean },
  initFn: () => Promise<void>
): void {
  const activeValue = isExtensionActive.value;
  logger.log('[MarkView] handleNavigation called', {
    url: window.location.href,
    isExtensionActive: activeValue,
  });

  const currentSourceType = validateMarkdownPage();
  logger.log('[MarkView] currentSourceType:', currentSourceType);

  if (!currentSourceType) {
    // Navigated to non-markdown page
    logger.log('[MarkView] Setting isExtensionActive to false');
    isExtensionActive.value = false;
  } else if (!isExtensionActive.value) {
    // Valid markdown page but extension not active
    logger.log('[MarkView] Calling init() because isExtensionActive is false');
    initFn();
  } else {
    logger.log('[MarkView] Already active, skipping re-initialization');
  }
}

/**
 * Setup listener for loading files from recent documents
 */
export function setupRecentDocumentsFileLoadingListener(
  renderContent: (content?: string, filename?: string) => Promise<void>
): void {
  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'markview:loadFileContent') {
      logger.log('[EventHandlers] Loading file from recent documents:', message.filename);
      renderContent(message.content, message.filename);
    }

    // Handle clear in-memory caches request from popup
    if (message.type === 'clearInMemoryCaches') {
      logger.log('[EventHandlers] Clearing in-memory caches (blob cache, renderer cache)');

      // Clear blob URL cache
      clearBlobCache();

      // Clear markdown renderer cache
      import('../core/markdown').then(({ clearRendererCache }) => {
        clearRendererCache();
        logger.log('[EventHandlers] Renderer cache cleared');
      });
    }
  });
}

/**
 * Setup hash change listener for within-document navigation
 * Handles when user clicks internal anchor links (not TOC links which handle their own scroll)
 * Also syncs TOC sidebar when hash changes
 */
export function setupHashChangeListener(components: ComponentInstances): void {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      logger.log('[MarkView] Hash changed via anchor link:', hash);

      // Safely decode hash, fallback to raw hash if malformed
      let decodedHash: string;
      try {
        decodedHash = decodeURIComponent(hash);
      } catch {
        decodedHash = hash;
      }

      const element = document.getElementById(decodedHash);
      if (element) {
        // Only scroll if element exists and isn't already in view
        const rect = element.getBoundingClientRect();
        const isInView = rect.top >= 0 && rect.top <= window.innerHeight * 0.3;
        if (!isInView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Sync TOC sidebar active state
        if (components.tocSidebar) {
          components.tocSidebar.syncActiveHeading(element.id);
        }
      }
    }
  });
}
