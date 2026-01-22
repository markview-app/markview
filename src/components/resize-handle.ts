/**
 * ResizeHandle Component
 * Provides drag-to-resize functionality for sidebars and other resizable elements
 */

import { logger } from '@utils/logger';

export interface ResizeHandleOptions {
  /**
   * Position of the handle relative to the sidebar
   * 'left' = handle on left edge (for right-positioned elements)
   * 'right' = handle on right edge (for left-positioned elements)
   */
  position: 'left' | 'right';

  /**
   * Minimum allowed width in pixels
   */
  minWidth: number;

  /**
   * Maximum allowed width in pixels
   */
  maxWidth: number;

  /**
   * Initial width in pixels
   */
  initialWidth: number;

  /**
   * Callback fired during resize (every frame)
   * Use for real-time visual updates
   */
  onResize: (newWidth: number) => void;

  /**
   * Callback fired when resize ends
   * Use for persisting to storage
   */
  onResizeEnd: (finalWidth: number) => void;

  /**
   * Optional: Callback fired when resize starts
   */
  onResizeStart?: () => void;
}

/**
 * ResizeHandle class
 * Handles mouse and touch events for resizing
 */
export class ResizeHandle {
  private element: HTMLElement;
  private options: ResizeHandleOptions;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;

  // Bound methods for event listeners (allows proper cleanup)
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor(options: ResizeHandleOptions) {
    this.options = options;
    this.startWidth = options.initialWidth;

    // Create handle element
    this.element = this.createHandleElement();

    // Bind methods
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);

    // Attach event listeners
    this.setupEventListeners();

    logger.log('[ResizeHandle] Created with options:', options);
  }

  /**
   * Create the handle DOM element
   */
  private createHandleElement(): HTMLElement {
    const handle = document.createElement('div');
    handle.className = 'markview-resize-handle';
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-label', 'Resize sidebar');

    return handle;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.element.addEventListener('mousedown', this.boundMouseDown);

    // Touch events (passive: false to allow preventDefault)
    this.element.addEventListener('touchstart', this.boundTouchStart, { passive: false });

    // Debug: log when mouse enters handle
    this.element.addEventListener('mouseenter', () => {
      logger.log('[ResizeHandle] Mouse entered resize handle - cursor should be col-resize');
    });
  }

  /**
   * Handle mouse down - start resize
   */
  private onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.startResize(e.clientX);

    // Attach document-level listeners for smooth tracking
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);

    logger.log('[ResizeHandle] Resize started (mouse)');
  }

  /**
   * Handle mouse move - update width
   */
  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    e.preventDefault();
    this.updateResize(e.clientX);
  }

  /**
   * Handle mouse up - end resize
   */
  private onMouseUp(e: MouseEvent): void {
    if (!this.isDragging) return;

    e.preventDefault();
    this.endResize(e.clientX);

    // Remove document-level listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);

    logger.log('[ResizeHandle] Resize ended (mouse)');
  }

  /**
   * Handle touch start - start resize
   */
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault(); // Prevent scrolling during resize
    const touch = e.touches[0];
    if (!touch) return;

    this.startResize(touch.clientX);

    // Attach document-level listeners
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundTouchEnd);

    logger.log('[ResizeHandle] Resize started (touch)');
  }

  /**
   * Handle touch move - update width
   */
  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;

    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    if (!touch) return;

    this.updateResize(touch.clientX);
  }

  /**
   * Handle touch end - end resize
   */
  private onTouchEnd(e: TouchEvent): void {
    if (!this.isDragging) return;

    // Get final position from changedTouches (touches is empty on touchend)
    const touch = e.changedTouches[0];
    if (touch) {
      this.endResize(touch.clientX);
    }

    // Remove document-level listeners
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);

    logger.log('[ResizeHandle] Resize ended (touch)');
  }

  /**
   * Start resize operation
   */
  private startResize(clientX: number): void {
    this.isDragging = true;
    this.startX = clientX;

    // Add global state classes
    document.body.classList.add('markview-resizing');
    this.element.classList.add('markview-resize-handle--active');

    // Fire start callback
    this.options.onResizeStart?.();
  }

  /**
   * Update resize in progress
   */
  private updateResize(clientX: number): void {
    const deltaX = clientX - this.startX;

    // Calculate new width based on handle position
    let newWidth: number;
    if (this.options.position === 'right') {
      // Left sidebar: dragging right increases width
      newWidth = this.startWidth + deltaX;
    } else {
      // Right sidebar: dragging left increases width
      newWidth = this.startWidth - deltaX;
    }

    // Clamp to min/max bounds
    newWidth = Math.max(
      this.options.minWidth,
      Math.min(this.options.maxWidth, newWidth)
    );

    // Fire resize callback for real-time updates
    this.options.onResize(newWidth);
  }

  /**
   * End resize operation
   */
  private endResize(clientX: number): void {
    this.isDragging = false;

    // Remove global state classes
    document.body.classList.remove('markview-resizing');
    this.element.classList.remove('markview-resize-handle--active');

    // Calculate final width
    const deltaX = clientX - this.startX;
    let finalWidth: number;

    if (this.options.position === 'right') {
      finalWidth = this.startWidth + deltaX;
    } else {
      finalWidth = this.startWidth - deltaX;
    }

    // Clamp to bounds
    finalWidth = Math.max(
      this.options.minWidth,
      Math.min(this.options.maxWidth, finalWidth)
    );

    // Update start width for next resize
    this.startWidth = finalWidth;

    // Fire end callback for persistence
    this.options.onResizeEnd(finalWidth);
  }

  /**
   * Get the DOM element
   * Caller should append this to their container
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Update the current width
   * Useful when loading from storage
   */
  setWidth(width: number): void {
    this.startWidth = Math.max(
      this.options.minWidth,
      Math.min(this.options.maxWidth, width)
    );
    logger.log('[ResizeHandle] Width updated to:', this.startWidth);
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    // Remove element listeners
    this.element.removeEventListener('mousedown', this.boundMouseDown);
    this.element.removeEventListener('touchstart', this.boundTouchStart);

    // Remove document listeners (in case destroy is called during drag)
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);

    // Clean up global state
    document.body.classList.remove('markview-resizing');

    logger.log('[ResizeHandle] Destroyed');
  }
}
