// Table of Contents Sidebar Component
// Auto-generates clickable navigation from h1-h3 headings

import { getSettings, updateSetting } from '@core/storage';
import { applyLayoutSettings, clearContentMargin, setContentMargin } from '@utils/dom';
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';
import { keyboardManager } from '@utils/keyboard-shortcuts';
import { ResizeHandle } from './resize-handle';

export interface TocHeading {
  id: string;
  level: number; // 1-3
  text: string;
  element: HTMLElement;
}

export interface TocSidebarOptions {
  position?: 'left' | 'right';
  width?: number;
  collapsible?: boolean;
}

/**
 * Table of Contents Sidebar
 * Shows document outline with clickable navigation
 */
export class TocSidebar {
  private container: HTMLElement | null = null;
  private options: Required<TocSidebarOptions>;
  private headings: TocHeading[] = [];
  private activeHeadingId: string | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private isScrollingProgrammatically: boolean = false;
  private scrollTimeout: number | null = null;
  private tocItemsCache: Map<string, Element> = new Map();
  private rafId: number | null = null;
  private headerButtonsCache: {
    close?: HTMLElement;
    title?: HTMLElement;
  } = {};
  private resizeHandle: ResizeHandle | null = null;
  private currentWidth: number;
  private targetHeadingId: string | null = null; // Track heading we're scrolling to

  constructor(options: TocSidebarOptions = {}) {
    this.options = {
      position: options.position || 'right',
      width: options.width || 250,
      collapsible: options.collapsible !== false,
    };

    // Initialize current width
    this.currentWidth = this.options.width;

    // Listen for language changes
    document.addEventListener('markview:languageChanged', () => {
      this.updateLanguage();
    });
  }

  /**
   * Initialize the TOC sidebar
   */
  async initialize(): Promise<void> {
    logger.log('[TocSidebar] Initializing...');

    // Extract headings from the rendered markdown
    this.extractHeadings();

    if (this.headings.length === 0) {
      logger.log('[TocSidebar] No headings found, not showing TOC');
      return;
    }

    // Create and inject sidebar
    this.createSidebar();
    this.render();
    this.setupScrollSpy();
    this.setupRawViewListeners();
    this.setupKeyboardShortcut();

    // Set content margin to make room for the sidebar
    this.adjustContentMargin(true);

    logger.log('[TocSidebar] Initialized with', this.headings.length, 'headings');
  }

  /**
   * Extract all headings from the rendered markdown content
   */
  private extractHeadings(): void {
    const container = document.getElementById('markview-container');
    if (!container) {
      logger.warn('[TocSidebar] No markview container found');
      return;
    }

    // Support only H1-H3 heading levels
    const maxTocLevels = 3;

    const headingElements = container.querySelectorAll('h1, h2, h3');

    // Track used IDs to ensure uniqueness
    const usedIds = new Set<string>();

    this.headings = Array.from(headingElements)
      .map((element, index) => {
        const htmlElement = element as HTMLElement;
        const level = parseInt(element.tagName.substring(1)); // h1 -> 1, h2 -> 2, etc.
        const text = htmlElement.textContent || '';

        // Ensure heading has an ID for anchor linking
        let id = htmlElement.id;
        if (!id) {
          id = this.generateHeadingId(text, index);

          // If ID already exists, append a counter to make it unique
          let uniqueId = id;
          let counter = 1;
          while (usedIds.has(uniqueId)) {
            uniqueId = `${id}-${counter}`;
            counter++;
          }
          id = uniqueId;
          htmlElement.id = id;
        }

        // Track this ID
        usedIds.add(id);

        return {
          id,
          level,
          text,
          element: htmlElement,
        };
      })
      .filter(heading => heading.level <= maxTocLevels); // Only headings H1-H3

    logger.log(
      '[TocSidebar] Extracted',
      this.headings.length,
      'headings (max level:',
      maxTocLevels,
      ')'
    );
  }

  /**
   * Generate a unique ID for a heading
   */
  private generateHeadingId(text: string, index: number): string {
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens

    return slug || `heading-${index}`;
  }

  /**
   * Create the sidebar container
   */
  private createSidebar(): void {
    this.container = document.createElement('div');
    this.container.id = 'markview-toc-sidebar';
    this.container.className = `markview-toc-sidebar markview-toc-sidebar--${this.options.position}`;
    this.container.style.width = `${this.currentWidth}px`;

    logger.log('[TocSidebar] Creating resize handle...', {
      position: this.options.position,
      handlePosition: this.options.position === 'left' ? 'right' : 'left',
      currentWidth: this.currentWidth,
    });

    // Create and attach resize handle
    this.resizeHandle = new ResizeHandle({
      position: this.options.position === 'left' ? 'right' : 'left',
      minWidth: 180,
      maxWidth: 400,
      initialWidth: this.currentWidth,
      onResize: newWidth => this.handleResize(newWidth),
      onResizeEnd: finalWidth => this.handleResizeEnd(finalWidth),
    });

    const handleElement = this.resizeHandle.getElement();
    logger.log('[TocSidebar] Resize handle element created:', handleElement);
    logger.log('[TocSidebar] Handle classes:', handleElement.className);
    logger.log('[TocSidebar] Handle style:', handleElement.getAttribute('style'));

    this.container.appendChild(handleElement);

    logger.log('[TocSidebar] Resize handle attached to sidebar');

    document.body.appendChild(this.container);
  }

  /**
   * Render the TOC sidebar content
   */
  private render(): void {
    if (!this.container) {
      logger.warn('[TocSidebar] Cannot render: container is null');
      return;
    }

    logger.log('[TocSidebar] Rendering TOC...');

    // Preserve visibility state before clearing
    const isHidden = this.container.style.display === 'none';

    logger.log('[TocSidebar] Is hidden:', isHidden);

    // IMPORTANT: Save resize handle before clearing
    const resizeHandleElement = this.resizeHandle?.getElement();
    if (resizeHandleElement && resizeHandleElement.parentNode === this.container) {
      this.container.removeChild(resizeHandleElement);
      logger.log('[TocSidebar] Temporarily removed resize handle before re-render');
    }

    // Clear content
    this.container.innerHTML = '';
    this.tocItemsCache.clear(); // Clear cache on re-render

    // Create header
    const header = this.createHeader();
    if (header) {
      this.container.appendChild(header);
      logger.log('[TocSidebar] Header appended');
    } else {
      logger.error('[TocSidebar] Failed to create header');
    }

    // Create TOC content
    const content = this.createContent();
    if (content) {
      this.container.appendChild(content);
      logger.log('[TocSidebar] Content appended');
    } else {
      logger.error('[TocSidebar] Failed to create content');
    }

    // IMPORTANT: Re-append resize handle after content
    if (resizeHandleElement) {
      this.container.appendChild(resizeHandleElement);
      logger.log('[TocSidebar] Re-appended resize handle after re-render');
    }

    // Restore visibility state after rendering
    // Only set display: none if it was hidden, otherwise let CSS handle it
    if (isHidden) {
      this.container.style.display = 'none';
    } else {
      // Clear inline display to let CSS flex layout work
      this.container.style.display = '';
    }

    logger.log('[TocSidebar] Final display:', this.container.style.display);
    logger.log('[TocSidebar] Container children:', this.container.children.length);

    // Build cache after rendering
    this.buildTocItemsCache();
  }

  /**
   * Create sidebar header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'markview-toc-header';

    // Top row with title and controls
    const topRow = document.createElement('div');
    topRow.className = 'markview-toc-header-row';

    const title = document.createElement('h3');
    title.textContent = MESSAGES.toc.title;
    title.className = 'markview-toc-title';
    topRow.appendChild(title);
    this.headerButtonsCache.title = title;

    if (this.options.collapsible) {
      // Close button
      const controls = document.createElement('div');
      controls.className = 'markview-toc-controls';

      const closeBtn = this.createIconButton(
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        MESSAGES.toc.close,
        () => {
          this.hide();
        }
      );
      controls.appendChild(closeBtn);
      this.headerButtonsCache.close = closeBtn;

      topRow.appendChild(controls);
    }

    header.appendChild(topRow);

    // Add info banner for FREE tier heading level limitation
    // No PRO banner needed in open source version
    return header;
  }

  /**
   * Create icon button helper
   */
  private createIconButton(icon: string, tooltip: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = 'btn btn-ghost btn-icon btn-sm';
    button.innerHTML = icon;
    button.title = tooltip;
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Create TOC content
   */
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'markview-toc-content';

    const nav = document.createElement('nav');
    nav.className = 'markview-toc-nav';

    if (this.headings.length > 0) {
      const list = this.createTocList();
      nav.appendChild(list);
    } else {
      // Show empty state message
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'markview-toc-empty';
      emptyMessage.textContent = MESSAGES.toc.noHeadings;
      nav.appendChild(emptyMessage);
    }

    content.appendChild(nav);
    return content;
  }

  /**
   * Create nested TOC list
   */
  private createTocList(): HTMLElement {
    const ul = document.createElement('ul');
    ul.className = 'markview-toc-list';

    let currentLevel = 0;
    let currentList: HTMLElement = ul;
    const listStack: HTMLElement[] = [ul];

    this.headings.forEach(heading => {
      // Handle nesting
      if (heading.level > currentLevel) {
        // Go deeper - create nested list
        while (heading.level > currentLevel) {
          const nestedUl = document.createElement('ul');
          nestedUl.className = 'markview-toc-list markview-toc-list--nested';

          // Append to last item in current list or to current list
          const lastItem = currentList.lastElementChild;
          if (lastItem) {
            lastItem.appendChild(nestedUl);
            // Mark parent as having children
            lastItem.classList.add('markview-toc-item--has-children');
          } else {
            currentList.appendChild(nestedUl);
          }

          listStack.push(nestedUl);
          currentList = nestedUl;
          currentLevel++;
        }
      } else if (heading.level < currentLevel) {
        // Go shallower
        while (heading.level < currentLevel && listStack.length > 1) {
          listStack.pop();
          const lastList = listStack[listStack.length - 1];
          if (lastList) {
            currentList = lastList;
          }
          currentLevel--;
        }
      }

      // Create list item
      const li = this.createTocItem(heading);
      currentList.appendChild(li);
    });

    return ul;
  }

  /**
   * Create a TOC item
   */
  private createTocItem(heading: TocHeading): HTMLElement {
    const li = document.createElement('li');
    li.className = 'markview-toc-item';
    li.dataset.headingId = heading.id;
    li.dataset.level = heading.level.toString();

    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.className = 'markview-toc-link';
    link.textContent = heading.text;
    link.title = heading.text; // Show full text on hover

    // Smooth scroll on click
    link.addEventListener('click', e => {
      e.preventDefault();
      this.scrollToHeading(heading);
    });

    li.appendChild(link);
    return li;
  }

  /**
   * Build cache of TOC items for fast lookup
   */
  private buildTocItemsCache(): void {
    if (!this.container) return;

    const items = this.container.querySelectorAll('[data-heading-id]');
    items.forEach(item => {
      const headingId = (item as HTMLElement).dataset.headingId;
      if (headingId) {
        this.tocItemsCache.set(headingId, item);
      }
    });
  }

  /**
   * Scroll to heading with smooth animation
   */
  private scrollToHeading(heading: TocHeading): void {
    // Disable scroll spy temporarily during programmatic scroll
    this.isScrollingProgrammatically = true;
    this.targetHeadingId = heading.id;

    // Clear any existing timeout
    if (this.scrollTimeout !== null) {
      window.clearTimeout(this.scrollTimeout);
    }

    // Update active state immediately
    this.setActiveHeading(heading.id);

    // Scroll to the heading
    heading.element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    // Re-enable scroll spy after scroll completes
    // Use longer timeout to ensure scroll completes and intersection observer settles
    this.scrollTimeout = window.setTimeout(() => {
      this.isScrollingProgrammatically = false;

      // Re-validate active heading after scroll completes
      // This ensures the correct heading stays active
      if (this.targetHeadingId) {
        this.setActiveHeading(this.targetHeadingId);
      }

      this.targetHeadingId = null;
      this.scrollTimeout = null;
    }, 1500);
  }

  /**
   * Disable scroll spy to prevent IntersectionObserver interference
   * Used before programmatic scrolling (e.g., URL fragment navigation)
   */
  disableScrollSpy(): void {
    this.isScrollingProgrammatically = true;
    logger.log('[TocSidebar] Scroll spy disabled');
  }

  /**
   * Sync active heading from external source (e.g., URL fragment)
   * Disables scroll spy temporarily to prevent interference
   */
  syncActiveHeading(headingId: string): void {
    logger.log('[TocSidebar] Syncing active heading from external source:', headingId);

    // Skip if already active
    if (this.activeHeadingId === headingId) return;

    // Disable scroll spy temporarily (may already be disabled)
    this.isScrollingProgrammatically = true;
    this.targetHeadingId = headingId;

    // Set active state
    this.setActiveHeading(headingId);

    // Re-enable scroll spy after scroll animation settles
    if (this.scrollTimeout !== null) {
      window.clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = window.setTimeout(() => {
      this.isScrollingProgrammatically = false;
      this.targetHeadingId = null;
      this.scrollTimeout = null;
      logger.log('[TocSidebar] Scroll spy re-enabled');
    }, 1500);
  }

  /**
   * Set active heading
   */
  private setActiveHeading(id: string): void {
    if (this.activeHeadingId === id) return;

    // Remove previous active (use cache for fast lookup)
    if (this.activeHeadingId) {
      const prevItem = this.tocItemsCache.get(this.activeHeadingId);
      if (prevItem) {
        prevItem.classList.remove('markview-toc-item--active');
      }
    }

    // Set new active (use cache for fast lookup)
    this.activeHeadingId = id;
    const newItem = this.tocItemsCache.get(id);
    if (newItem) {
      newItem.classList.add('markview-toc-item--active');

      // Only scroll into view if item is not visible (avoid nested smooth scrolling lag)
      const containerRect = this.container?.getBoundingClientRect();
      const itemRect = newItem.getBoundingClientRect();

      if (
        containerRect &&
        (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom)
      ) {
        // Item is outside viewport, scroll it into view (instant, not smooth)
        newItem.scrollIntoView({
          behavior: 'auto', // Changed from 'smooth' to 'auto' for instant scroll
          block: 'nearest',
        });
      }
    }
  }

  /**
   * Setup scroll spy to highlight current section
   */
  private setupScrollSpy(): void {
    const options = {
      rootMargin: '-80px 0px -80% 0px',
      threshold: [0, 0.1, 0.5, 1],
    };

    this.intersectionObserver = new IntersectionObserver(entries => {
      // Skip if we're programmatically scrolling
      if (this.isScrollingProgrammatically) {
        return;
      }

      // Cancel any pending update
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }

      // Batch DOM updates using requestAnimationFrame for better performance
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;

        // Find the most visible heading
        const visibleEntries = entries.filter(entry => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Find entry with highest intersection ratio
          const mostVisibleEntry = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );

          const id = (mostVisibleEntry.target as HTMLElement).id;
          this.setActiveHeading(id);
        }
      });
    }, options);

    // Observe all headings
    this.headings.forEach(heading => {
      this.intersectionObserver?.observe(heading.element);
    });
  }

  /**
   * Setup keyboard shortcut (Ctrl+Shift+L or Cmd+Shift+L)
   * L for List/sidenav
   * Changed from Ctrl+Shift+T to avoid conflict with browser's "Reopen closed tab"
   * Changed from Ctrl+Shift+O to avoid conflict with browser's "Open Bookmark Manager"
   */
  private setupKeyboardShortcut(): void {
    keyboardManager.register('toc-sidebar', {
      key: 'L',
      ctrl: true,
      shift: true,
      description: MESSAGES.toc.title,
      action: () => {
        if (this.container?.style.display === 'none') {
          this.show();
        } else {
          this.hide();
        }
      },
    });

    logger.log('[TocSidebar] Keyboard shortcut registered: Ctrl+Shift+L / Cmd+Shift+L');
  }

  /**
   * Show the sidebar
   */
  show(): void {
    if (this.container) {
      // Remove display style to let CSS handle it (display: flex from CSS)
      this.container.style.display = '';
      this.adjustContentMargin(true);

      // Update storage to sync with popup
      updateSetting('tocVisible', true);

      // Dispatch event to hide toggle button
      document.dispatchEvent(new CustomEvent('markview:tocShown'));
    }
  }

  /**
   * Hide the sidebar
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.adjustContentMargin(false);

      // Update storage to sync with popup
      updateSetting('tocVisible', false);

      // Dispatch event to show toggle button
      document.dispatchEvent(new CustomEvent('markview:tocHidden'));
    }
  }

  /**
   * Setup listeners for raw view mode changes
   */
  private setupRawViewListeners(): void {
    // When raw view is enabled, show "not supported" message
    document.addEventListener('markview:rawViewEnabled', () => {
      logger.log('[TocSidebar] Received markview:rawViewEnabled event');
      this.showRawViewMessage();
    });

    // When raw view is disabled, restore TOC functionality
    document.addEventListener('markview:rawViewDisabled', () => {
      logger.log('[TocSidebar] Received markview:rawViewDisabled event');
      this.updateContent();
    });
  }

  /**
   * Show message that TOC is not supported in raw view
   */
  private showRawViewMessage(): void {
    logger.log('[TocSidebar] Showing raw view message');
    if (!this.container) {
      logger.warn('[TocSidebar] Cannot show raw view message: container is null');
      return;
    }

    // IMPORTANT: Save resize handle before clearing
    const resizeHandleElement = this.resizeHandle?.getElement();
    if (resizeHandleElement && resizeHandleElement.parentNode === this.container) {
      this.container.removeChild(resizeHandleElement);
      logger.log('[TocSidebar] Temporarily removed resize handle before showing raw message');
    }

    // Clear current content
    this.container.innerHTML = '';

    // Create header
    const header = this.createHeader();
    this.container.appendChild(header);

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'markview-toc-raw-message-container';

    const icon = document.createElement('div');
    icon.className = 'markview-toc-raw-icon';
    icon.textContent = '📝';

    const title = document.createElement('h3');
    title.className = 'markview-toc-raw-title';
    title.textContent = MESSAGES.toc.rawModeTitle;

    const message = document.createElement('p');
    message.className = 'markview-toc-raw-message';
    message.textContent = MESSAGES.toc.rawModeMessage;

    messageContainer.appendChild(icon);
    messageContainer.appendChild(title);
    messageContainer.appendChild(message);

    this.container.appendChild(messageContainer);

    // IMPORTANT: Re-append resize handle after content
    if (resizeHandleElement) {
      this.container.appendChild(resizeHandleElement);
      logger.log('[TocSidebar] Re-appended resize handle after showing raw message');
    }
  }

  /**
   * Handle resize in progress
   * Called on every frame during drag
   */
  private handleResize(newWidth: number): void {
    // Update current width
    this.currentWidth = newWidth;

    // Update sidebar visual width
    if (this.container) {
      this.container.style.width = `${newWidth}px`;
    }

    // Update content margin in real-time
    this.adjustContentMargin(true);

    logger.log('[TocSidebar] Resizing to:', newWidth);
  }

  /**
   * Handle resize end
   * Called once when drag completes
   */
  private async handleResizeEnd(finalWidth: number): Promise<void> {
    // Update current width
    this.currentWidth = finalWidth;

    // Persist to storage
    await updateSetting('tocWidth', finalWidth);

    logger.log('[TocSidebar] Width saved:', finalWidth);
  }

  /**
   * Adjust content margin to make room for sidebar
   */
  private adjustContentMargin(visible: boolean): void {
    const side = this.options.position === 'left' ? 'left' : 'right';

    if (visible) {
      // Add extra spacing: sidebar width + gap (10px)
      const margin = this.currentWidth + 10;
      setContentMargin(side, margin);
    } else {
      // When sidebar is hidden, clear the margin completely
      clearContentMargin(side);
    }

    // Reapply layout settings to update container width/margins based on new sidebar state
    getSettings().then(settings => {
      applyLayoutSettings({
        centered: settings.centered,
        maxWidth: settings.maxWidth,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        fontFamily: settings.fontFamily,
      });
    });
  }

  /**
   * Update TOC when content changes
   */
  updateContent(): void {
    logger.log('[TocSidebar] Updating content...');

    // Disconnect observer
    this.intersectionObserver?.disconnect();

    // Re-extract headings
    this.extractHeadings();

    // Always render (even if no headings, to show header)
    this.render();

    // Setup scroll spy only if we have headings
    if (this.headings.length > 0) {
      this.setupScrollSpy();
    } else {
      logger.log('[TocSidebar] No headings found in document');
    }
  }

  /**
   * Update language for all UI text
   */
  private updateLanguage(): void {
    logger.log('[TocSidebar] Updating language');

    // Update header title and buttons
    if (this.headerButtonsCache.title) {
      this.headerButtonsCache.title.textContent = MESSAGES.toc.title;
    }
    if (this.headerButtonsCache.close) {
      this.headerButtonsCache.close.title = MESSAGES.toc.close;
    }

    // Update empty state message if visible
    const emptyMessage = this.container?.querySelector('.markview-toc-empty');
    if (emptyMessage) {
      emptyMessage.textContent = MESSAGES.toc.noHeadings;
    }

    // Update raw mode message if visible
    const rawTitle = this.container?.querySelector('.markview-toc-raw-title');
    if (rawTitle) {
      rawTitle.textContent = MESSAGES.toc.rawModeTitle;
    }
    const rawMessage = this.container?.querySelector('.markview-toc-raw-message');
    if (rawMessage) {
      rawMessage.textContent = MESSAGES.toc.rawModeMessage;
    }

    // Update info banner if visible
    // No PRO banner in open source version
  }

  /**
   * Destroy the sidebar
   */
  destroy(): void {
    // Clear any pending timeout
    if (this.scrollTimeout !== null) {
      window.clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    // Cancel any pending animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Disconnect observer
    this.intersectionObserver?.disconnect();

    // Clear cache
    this.tocItemsCache.clear();

    // Clean up resize handle
    if (this.resizeHandle) {
      this.resizeHandle.destroy();
      this.resizeHandle = null;
    }

    // Unregister keyboard shortcut
    keyboardManager.unregister('toc-sidebar');

    // Remove container
    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    // Reset content margin
    this.adjustContentMargin(false);
  }
}

/**
 * Factory function to create TOC sidebar
 */
export async function createTocSidebar(options: TocSidebarOptions = {}): Promise<TocSidebar> {
  // Load saved width from settings
  const settings = await getSettings();
  const mergedOptions = {
    ...options,
    width: options.width ?? settings.tocWidth ?? 250,
  };

  const sidebar = new TocSidebar(mergedOptions);
  await sidebar.initialize();
  return sidebar;
}
