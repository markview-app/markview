/**
 * Document Renderer
 * Handles markdown rendering and content updates
 */

import { renderMarkdown } from '@core/markdown';
import { getSettings } from '@core/storage';
import {
  applyLayoutSettings,
  applyTheme,
  extractMarkdownSource,
  hideOriginalMarkdown,
  injectRenderedHTML,
  refreshContentMargins,
} from '@utils/dom';
import { showNotification } from '@utils/notification';
import { setFavicon } from '@utils/favicon';
import '@components/image-viewer'; // Initialize image viewer singleton
import { lazyImageLoader } from '@utils/lazy-load-images';
import { logger } from '@utils/logger';
import { renderMermaidDiagrams } from '@utils/mermaid-renderer';
import { MESSAGES } from '@utils/messages';
import { saveToHistory } from '@utils/recent-documents';
import { resolveImagesInHTML } from '@utils/relative-path-resolver';
import { scrollToHash } from '@utils/scroll';
import { loadSyntaxTheme } from '@utils/syntax-theme-loader';
import { ComponentInstances } from './component-manager';

// === TYPES ===

export interface DocumentInfo {
  url: string;
  title: string;
}

export interface RenderContext {
  components: ComponentInstances;
  cachedMarkdownSource: { value: string | null };
  currentDocument: DocumentInfo;
  customContent?: string;
  customFilename?: string;
}

interface RenderResult {
  html: string;
  markdownSource: string;
}

// === HELPER FUNCTIONS ===

/**
 * Extract filename from URL as fallback for document title
 */
export function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').filter(Boolean).pop();
    return filename ? decodeURIComponent(filename) : null;
  } catch {
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return lastPart ? decodeURIComponent(lastPart) : null;
  }
}

// === RENDER PIPELINE STAGES ===

/**
 * Stage 1: Extract and cache markdown source
 */
async function prepareMarkdownSource(context: RenderContext): Promise<string | null> {
  const { customContent, cachedMarkdownSource } = context;

  const markdownSource = customContent || cachedMarkdownSource.value || extractMarkdownSource();

  if (!markdownSource) {
    logger.warn('MarkView: No markdown source found on page');
    showNotification(MESSAGES.notification.noMarkdownFound, 'error');
    return null;
  }

  // Cache for re-renders (theme changes, etc.)
  cachedMarkdownSource.value = markdownSource;
  logger.log('MarkView: Markdown source extracted, length:', markdownSource.length);

  return markdownSource;
}

/**
 * Stage 2: Preload required assets (languages, fonts)
 */
async function preloadAssets(markdownSource: string): Promise<void> {
  // Preload languages for syntax highlighting
  const { preloadLanguages } = await import('@utils/highlight-loader');
  await preloadLanguages(markdownSource);
}

/**
 * Stage 3: Apply theme before rendering (needed for Mermaid)
 */
async function prepareTheme(): Promise<void> {
  const settings = await getSettings();
  applyTheme(settings.theme);

  // Load syntax highlighting theme (custom or external)
  await loadSyntaxTheme(settings.syntaxTheme || 'custom');
}

/**
 * Stage 4: Render markdown to HTML
 */
async function renderToHTML(markdownSource: string): Promise<RenderResult> {
  const settings = await getSettings();

  const html = renderMarkdown(markdownSource, {
    highlight: settings.highlight,
    tables: settings.tables,
    taskLists: settings.taskLists,
    // All plugins enabled by default, use settings.pluginSettings for overrides
    disabledPlugins: settings.pluginSettings
      ? Object.entries(settings.pluginSettings)
          .filter(([_id, enabled]) => !enabled)
          .map(([id]) => id)
      : [],
  });

  if (!html) {
    throw new Error('Failed to render markdown');
  }

  logger.log('MarkView: Markdown rendered to HTML');
  return { html, markdownSource };
}

/**
 * Stage 5: Inject HTML and setup DOM
 */
function injectContent(html: string): void {
  hideOriginalMarkdown();
  injectRenderedHTML(html);
  refreshContentMargins();
}

/**
 * Stage 6: Update document metadata
 */
function updateDocumentMetadata(context: RenderContext): void {
  const { currentDocument, customFilename } = context;

  if (customFilename) {
    document.title = customFilename;
    currentDocument.url = `fs-api:///${customFilename}`;
    currentDocument.title = customFilename;
  } else {
    currentDocument.url = window.location.href;
    currentDocument.title =
      document.title || extractFileNameFromUrl(window.location.href) || 'Untitled';
  }

  setFavicon(16);
}

/**
 * Stage 7: Apply layout settings
 */
async function applyLayout(): Promise<void> {
  const settings = await getSettings();

  // Load custom font if needed
  if (settings.fontFamily && settings.fontFamily !== 'default') {
    const { loadGoogleFont } = await import('@utils/fonts');
    await loadGoogleFont(settings.fontFamily);
  }

  applyLayoutSettings({
    centered: settings.centered,
    maxWidth: settings.maxWidth,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    fontFamily: settings.fontFamily,
  });

  // Apply code block display mode
  const container = document.getElementById('markview-container');
  if (container) {
    const displayMode = settings.displaySettings?.codeBlockDisplay || 'scroll';
    container.classList.remove('code-block-wrap', 'code-block-scroll');
    container.classList.add(`code-block-${displayMode}`);
    logger.log(`[DocumentRenderer] Applied code block display mode: ${displayMode}`);
  }
}

/**
 * Stage 8: Apply lazy loading for images
 */
/**
 * Stage 8: Setup lazy loading
 * Resolves relative image paths and applies lazy loading
 */
async function setupLazyLoading(isFileSystemAPI: boolean): Promise<void> {
  const container = document.getElementById('markview-container');
  if (!container) return;

  // Resolve relative image paths BEFORE lazy loading
  // This handles both local files (File System API) and external URLs
  logger.log('[MarkView] Resolving relative image paths...');
  await resolveImagesInHTML(container);

  // Apply lazy loading AFTER path resolution
  if (!isFileSystemAPI) {
    lazyImageLoader.applyToContainer(container);
  }
}

/**
 * Stage 9: Render Mermaid diagrams asynchronously
 */
async function renderDiagrams(
  components: ComponentInstances,
  markdownSource: string
): Promise<boolean> {
  const hasMermaidDiagrams = document.querySelectorAll('.mermaid-placeholder').length > 0;
  let wasInRawMode = false;

  if (hasMermaidDiagrams) {
    try {
      await renderMermaidDiagrams();
      logger.log('MarkView: Mermaid diagrams rendered');
    } catch (err) {
      logger.error('MarkView: Error rendering Mermaid diagrams', err);
    }
  }

  // Update raw toggle content
  if (components.rawToggle) {
    const container = document.getElementById('markview-container');
    if (container) {
      wasInRawMode = components.rawToggle.isInRawMode();
      components.rawToggle.updateContent(markdownSource, container.innerHTML);
    }
  }

  return wasInRawMode;
}

/**
 * Stage 10: Update UI components
 */
function updateComponents(
  components: ComponentInstances,
  _markdownSource: string,
  _customFilename: string | undefined,
  wasInRawMode: boolean
): void {
  // Update TOC
  if (components.tocSidebar) {
    if (wasInRawMode) {
      logger.log('MarkView: Staying in raw view mode');
      document.dispatchEvent(new CustomEvent('markview:rawViewEnabled'));
    } else {
      components.tocSidebar.updateContent();
    }
  }

  // Refresh code copy buttons
  if (components.codeCopy) {
    components.codeCopy.refresh();
  }

  // Other component updates completed
}

/**
 * Stage 11: Save to history
 *
 * IMPORTANT: Only saves to history when user navigates via address bar:
 * - External URLs (http/https) pasted in address bar
 * - Local file paths (file:///) pasted in address bar
 *
 * Does NOT save when:
 * - User switches files via UI interactions
 *
 * Rationale: customFilename indicates file was loaded via UI interaction,
 * not direct browser navigation. This keeps Recent Documents clean and
 * focused on intentional address bar navigations only.
 */
async function saveToHistoryAsync(
  currentDocument: DocumentInfo,
  customFilename: string | undefined
): Promise<void> {
  // Skip history saving for files loaded via UI interactions
  if (customFilename) {
    logger.log(
      '[RecentDocuments] Skipping history save - file loaded via UI interaction:',
      customFilename
    );
    return;
  }

  // Only save to history for browser address bar navigation
  try {
    await saveToHistory(currentDocument.url, currentDocument.title, 'browser-rendered');
    logger.log('[RecentDocuments] Saved to history - browser navigation:', currentDocument.url);
  } catch (err) {
    logger.error('[MarkView] Failed to save to history (non-critical):', err);
  }
}

/**
 * Stage 12: Show completion notification
 */
function showCompletionNotification(customFilename: string | undefined): void {
  logger.log('MarkView: Markdown rendering complete');
  showNotification(
    customFilename
      ? `${MESSAGES.notification.loadedWithFilename} ${customFilename}`
      : MESSAGES.notification.loadedSuccess,
    'success',
    2000
  );
}

// === MAIN RENDER FUNCTION ===

/**
 * Render markdown content
 * Orchestrates the entire rendering pipeline
 * @param skipHashScroll - Skip scrolling to URL hash (used when loading files from sidebar where URL doesn't change)
 */
export async function renderMarkdownContent(
  components: ComponentInstances,
  cachedMarkdownSource: { value: string | null },
  currentDocument: DocumentInfo,
  customContent?: string,
  customFilename?: string,
  skipHashScroll = false
): Promise<void> {
  const context: RenderContext = {
    components,
    cachedMarkdownSource,
    currentDocument,
    customContent,
    customFilename,
  };

  try {
    // Stage 1: Prepare source
    const markdownSource = await prepareMarkdownSource(context);
    if (!markdownSource) return;

    // Stage 2: Preload assets
    await preloadAssets(markdownSource);

    // Stage 3: Apply theme
    await prepareTheme();

    // Stage 4: Render to HTML
    const { html } = await renderToHTML(markdownSource);

    // Stage 5: Inject content
    injectContent(html);

    // Stage 6: Update metadata
    updateDocumentMetadata(context);

    // Stage 7: Apply layout
    await applyLayout();

    // Stage 8: Setup lazy loading
    await setupLazyLoading(!!customContent);

    // Scroll to hash (skip if loading from sidebar where URL doesn't reflect current file)
    if (!skipHashScroll) {
      scrollToHash();
    } else {
      logger.log('[URL Fragment] Skipping hash scroll (loaded from sidebar, URL not updated)');
    }

    // Stage 9: Render diagrams (async)
    const wasInRawMode = await renderDiagrams(components, markdownSource);

    // Stage 10: Update components
    updateComponents(components, markdownSource, customFilename, wasInRawMode);

    // Note: TOC sync with URL fragment happens in lifecycle.ts after components are initialized

    // Stage 11: Save to history
    await saveToHistoryAsync(currentDocument, customFilename);

    // Stage 12: Show notification
    showCompletionNotification(customFilename);

    // Dispatch content updated event
    document.dispatchEvent(new CustomEvent('markview:contentUpdated'));
    logger.log('MarkView: Content updated event dispatched');
  } catch (err) {
    logger.error('MarkView: Error rendering markdown', err);
    showNotification(MESSAGES.notification.renderError, 'error');
  }
}
