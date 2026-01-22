// MarkView Image Viewer Component
// Lightweight lightbox for viewing images in full screen
import { logger } from '@utils/logger';
import { lazyImageLoader } from '@utils/lazy-load-images';

interface Position {
  width: number;
  height: number;
  x: number;
  y: number;
  aspectRatio?: number;
}

type PositionFunc = (position: Position) => void;

export class ImageViewer {
  private modal: HTMLElement | null = null;
  private clonedImage: HTMLImageElement | null = null;
  private originalImage: HTMLImageElement | null = null;
  private setPosition: PositionFunc | null = null;
  private resizeHandler: (() => void) | null = null;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

  // Gallery navigation
  private allImages: HTMLImageElement[] = [];
  private currentIndex: number = 0;
  private prevButton: HTMLElement | null = null;
  private nextButton: HTMLElement | null = null;
  private counter: HTMLElement | null = null;

  // Lazy initialization flag
  private initialized: boolean = false;

  // Zoom state
  private currentZoom: number = 1;
  private basePosition: Position | null = null; // Base position from open/resize

  // Pan/drag state
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private panOffsetX: number = 0;
  private panOffsetY: number = 0;

  // Zoom controls
  private zoomControls: HTMLElement | null = null;

  // Zoom constants
  private readonly MIN_ZOOM = 0.5;
  private readonly MAX_ZOOM = 5;
  private readonly ZOOM_FACTOR = 1.2;

  constructor() {
    // Only set up the global click handler - don't create DOM elements yet
    this.setupImageClickHandler();
  }

  /**
   * Ensure the image viewer is initialized (lazy initialization)
   * Creates modal and navigation controls only when first needed
   */
  private ensureInitialized(): void {
    // Skip if already initialized
    if (this.initialized) return;

    logger.log('[ImageViewer] Lazy initializing modal and controls');

    // Create modal backdrop (singleton - created once, reused)
    this.modal = document.createElement('div');
    this.modal.id = 'markview-image-modal';
    this.modal.className = 'markview-image-modal';
    this.modal.style.display = 'none';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-label', 'Image viewer');
    this.modal.addEventListener('click', e => this.handleBackdropClick(e));
    document.body.appendChild(this.modal);

    // Create cloned image element (singleton - created once, reused)
    this.clonedImage = document.createElement('img');
    this.clonedImage.className = 'markview-zoom-image';
    this.clonedImage.style.display = 'none';
    this.clonedImage.draggable = false;
    this.clonedImage.addEventListener('click', e => e.stopPropagation());
    this.modal.appendChild(this.clonedImage);

    // Create navigation controls
    this.createNavigationControls();

    // Create zoom controls
    this.createZoomControls();

    // Mark as initialized
    this.initialized = true;
  }

  /**
   * Create previous/next buttons and image counter
   */
  private createNavigationControls(): void {
    if (!this.modal) return;

    // Previous button
    if (!this.prevButton) {
      this.prevButton = document.createElement('button');
      this.prevButton.className = 'markview-image-nav markview-image-prev';
      this.prevButton.innerHTML = '‹';
      this.prevButton.title = 'Previous image (←)';
      this.prevButton.setAttribute('aria-label', 'Previous image');
      this.prevButton.addEventListener('click', e => {
        e.stopPropagation();
        this.showPrevious();
      });
      this.modal.appendChild(this.prevButton);
    }

    // Next button
    if (!this.nextButton) {
      this.nextButton = document.createElement('button');
      this.nextButton.className = 'markview-image-nav markview-image-next';
      this.nextButton.innerHTML = '›';
      this.nextButton.title = 'Next image (→)';
      this.nextButton.setAttribute('aria-label', 'Next image');
      this.nextButton.addEventListener('click', e => {
        e.stopPropagation();
        this.showNext();
      });
      this.modal.appendChild(this.nextButton);
    }

    // Image counter
    if (!this.counter) {
      this.counter = document.createElement('div');
      this.counter.className = 'markview-image-counter';
      this.modal.appendChild(this.counter);
    }
  }

  /**
   * Handle backdrop click (only close if clicking backdrop, not nav buttons or image)
   */
  private handleBackdropClick(e: Event): void {
    if (e.target === this.modal) {
      this.close(e);
    }
  }

  private setupImageClickHandler(): void {
    // Use event delegation for better performance
    document.addEventListener(
      'click',
      e => {
        const target = e.target as HTMLElement;

        // Check if clicked element is an image
        if (target.tagName.toLowerCase() === 'img') {
          // Skip if this is the cloned image in the modal (prevent re-opening)
          if (target.classList.contains('markview-zoom-image')) {
            return;
          }

          // Check if image is inside a link - if so, don't open viewer
          let parent = target.parentElement;
          while (parent) {
            if (parent.tagName === 'A') {
              return; // Preserve link behavior
            }
            parent = parent.parentElement;
          }

          // Open image viewer
          e.preventDefault();
          this.open(target as HTMLImageElement);
        }
      },
      true
    ); // Use capture phase
  }

  /**
   * Open image viewer with smooth animation
   */
  open(image: HTMLImageElement): void {
    // Lazy initialize on first use
    this.ensureInitialized();

    if (!this.modal || !this.clonedImage) return;

    this.originalImage = image;

    // Collect all standalone images (not in links) from the page
    this.collectImages();

    // Find index of clicked image
    this.currentIndex = this.allImages.indexOf(image);
    if (this.currentIndex === -1) {
      this.currentIndex = 0;
    }

    // Update navigation visibility
    this.updateNavigationState();

    // Calculate initial position (where image currently is)
    const initialPos = this.calculateInitialPosition(image);

    // Set up position function for this image
    this.setPosition = (pos: Position) => this.applyPosition(pos);

    // Set initial position
    this.setPosition(initialPos);

    // Check if image is already loaded
    if (image.complete && image.naturalWidth > 0) {
      this.showImage(image);
    } else {
      // Show loading state
      this.showLoading();

      // Wait for image to load
      const loadHandler = () => {
        this.showImage(image);
        image.removeEventListener('load', loadHandler);
        image.removeEventListener('error', errorHandler);
      };

      const errorHandler = () => {
        this.showError();
        image.removeEventListener('load', loadHandler);
        image.removeEventListener('error', errorHandler);
      };

      image.addEventListener('load', loadHandler);
      image.addEventListener('error', errorHandler);
    }

    // Set image source and alt text
    this.clonedImage.src = image.src;
    this.clonedImage.alt = image.alt || 'Zoomed image';

    // Show modal and cloned image
    this.clonedImage.style.display = 'block';
    this.modal.style.display = 'block';

    // Reset zoom state for new image
    this.resetZoom();

    // Animate to final position after next paint
    requestAnimationFrame(() => {
      if (!this.originalImage || !this.clonedImage || !this.modal) return;

      const finalPos = this.calculateFinalPosition(
        this.originalImage.naturalWidth,
        this.originalImage.naturalHeight
      );

      this.setPosition!(finalPos);

      // Hide original image and add opened class for CSS transitions
      this.originalImage.style.visibility = 'hidden';
      this.modal.classList.add('opened');

      // Set up zoom events after modal is opened
      this.setupZoomEvents();
    });

    // Set up resize handler
    this.resizeHandler = this.debounce(() => {
      if (!this.originalImage || !this.setPosition) return;
      const newPos = this.calculateFinalPosition(
        this.originalImage.naturalWidth,
        this.originalImage.naturalHeight
      );
      this.setPosition(newPos);
    }, 100);

    window.addEventListener('resize', this.resizeHandler);

    // Set up keyboard handler (ESC to close, arrows to navigate)
    this.keyboardHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close(e);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.showPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.showNext();
      }
    };
    document.addEventListener('keydown', this.keyboardHandler);
  }

  /**
   * Show the image with animation
   */
  private showImage(image: HTMLImageElement): void {
    if (!this.clonedImage || !this.setPosition) return;

    const finalPos = this.calculateFinalPosition(image.naturalWidth, image.naturalHeight);

    this.setPosition(finalPos);
  }

  /**
   * Show loading indicator
   */
  private showLoading(): void {
    if (!this.clonedImage) return;
    // You could add a loading spinner here if desired
    logger.log('[ImageViewer] Loading image...');
  }

  /**
   * Show error message
   */
  private showError(): void {
    logger.error('[ImageViewer] Failed to load image');
    this.close(new Event('error'));
  }

  /**
   * Collect all standalone images (not in links) from the page
   */
  private collectImages(): void {
    const container = document.getElementById('markview-container');
    if (!container) return;

    const allImgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];

    // Filter out images that are inside links
    this.allImages = allImgs.filter(img => {
      let parent = img.parentElement;
      while (parent && parent !== container) {
        if (parent.tagName === 'A') {
          return false; // Skip images in links
        }
        parent = parent.parentElement;
      }
      return true; // Include standalone images
    });
  }

  /**
   * Show previous image in gallery
   */
  private showPrevious(): void {
    if (this.allImages.length <= 1) return;

    this.currentIndex = (this.currentIndex - 1 + this.allImages.length) % this.allImages.length;
    const image = this.allImages[this.currentIndex];
    if (image) {
      this.switchToImage(image);
    }
  }

  /**
   * Show next image in gallery
   */
  private showNext(): void {
    if (this.allImages.length <= 1) return;

    this.currentIndex = (this.currentIndex + 1) % this.allImages.length;
    const image = this.allImages[this.currentIndex];
    if (image) {
      this.switchToImage(image);
    }
  }

  /**
   * Switch to a different image in the gallery
   */
  private switchToImage(image: HTMLImageElement): void {
    if (!this.modal || !this.clonedImage || !this.setPosition) return;

    // Reset zoom when switching images
    this.resetZoom();

    // Restore previous image visibility
    if (this.originalImage) {
      this.originalImage.style.visibility = '';
    }

    // Update to new image
    this.originalImage = image;

    // Get the actual image URL (either from src or data-src for lazy loaded)
    let imageUrl = image.src;
    if (image.hasAttribute('data-src')) {
      imageUrl = image.getAttribute('data-src') || image.src;
      lazyImageLoader.loadImageNow(image);
    }

    // Update cloned image source with the real URL
    this.clonedImage.src = imageUrl;
    this.clonedImage.alt = image.alt || 'Zoomed image';

    // Hide new original image
    image.style.visibility = 'hidden';

    // Calculate and apply new position when image loads
    const applyPosition = () => {
      if (!this.clonedImage || !this.setPosition) return;
      if (this.clonedImage.complete && this.clonedImage.naturalWidth > 0) {
        const finalPos = this.calculateFinalPosition(
          this.clonedImage.naturalWidth,
          this.clonedImage.naturalHeight
        );
        this.setPosition(finalPos);
      }
    };

    if (this.clonedImage.complete && this.clonedImage.naturalWidth > 0) {
      applyPosition();
    } else {
      // Wait for cloned image to load
      const loadHandler = () => {
        applyPosition();
        this.clonedImage!.removeEventListener('load', loadHandler);
      };
      this.clonedImage.addEventListener('load', loadHandler);
    }

    // Update navigation state
    this.updateNavigationState();
  }

  /**
   * Update navigation button visibility and counter
   */
  private updateNavigationState(): void {
    const hasMultipleImages = this.allImages.length > 1;

    // Update button visibility
    if (this.prevButton) {
      this.prevButton.style.display = hasMultipleImages ? 'flex' : 'none';
    }
    if (this.nextButton) {
      this.nextButton.style.display = hasMultipleImages ? 'flex' : 'none';
    }

    // Update counter
    if (this.counter) {
      if (hasMultipleImages) {
        this.counter.textContent = `${this.currentIndex + 1} / ${this.allImages.length}`;
        this.counter.style.display = 'block';
      } else {
        this.counter.style.display = 'none';
      }
    }
  }

  /**
   * Close image viewer with animation
   */
  close(e: Event): void {
    e.stopPropagation();
    e.preventDefault();

    if (!this.modal || !this.modal.classList.contains('opened')) return;

    // Store reference to original image before any cleanup
    const originalImageToRestore = this.originalImage;

    // Restore original image visibility immediately (no delay)
    if (originalImageToRestore) {
      originalImageToRestore.style.visibility = '';
    }

    // Clean up zoom events first
    this.cleanupZoomEvents();

    // Reset zoom before animating back
    this.resetZoom();
    if (this.clonedImage) {
      this.clonedImage.style.transition = 'transform 0.3s ease, width 0.3s ease, height 0.3s ease';
    }

    // Animate back to original position
    if (originalImageToRestore && this.setPosition) {
      const initialPos = this.calculateInitialPosition(originalImageToRestore);
      this.setPosition(initialPos);
    }

    // Remove opened class to trigger close animation
    this.modal.classList.remove('opened');

    // Wait for transition to complete before hiding modal
    let transitionHandled = false;
    const handleTransitionEnd = () => {
      if (transitionHandled) return;
      transitionHandled = true;

      if (!this.modal || !this.clonedImage) return;

      // Hide modal and cloned image
      this.modal.style.display = 'none';
      this.clonedImage.style.display = 'none';
      this.clonedImage.src = ''; // Free memory

      // Clean up event listener
      this.modal.removeEventListener('transitionend', handleTransitionEnd);
    };

    this.modal.addEventListener('transitionend', handleTransitionEnd, { once: true });

    // Fallback timeout in case transitionend doesn't fire
    setTimeout(() => {
      if (!transitionHandled) {
        handleTransitionEnd();
      }
    }, 400);

    // Clean up resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Clean up keyboard handler
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }

    return;
  }

  /**
   * Calculate initial position (where image currently is on page)
   * Uses getBoundingClientRect for accurate viewport-relative positioning
   */
  private calculateInitialPosition(image: HTMLImageElement): Position {
    const rect = image.getBoundingClientRect();

    return {
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
    };
  }

  /**
   * Calculate final position (centered and scaled to fit viewport)
   */
  private calculateFinalPosition(naturalWidth: number, naturalHeight: number): Position {
    const aspectRatio = naturalWidth / naturalHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let width = naturalWidth;
    let height = naturalHeight;

    // Scale down if image is larger than viewport
    if (width > screenWidth || height > screenHeight) {
      // Try scaling by width first
      width = screenWidth;
      height = width / aspectRatio;

      // If height still exceeds viewport, scale by height instead
      if (height > screenHeight) {
        height = screenHeight;
        width = height * aspectRatio;
      }
    }

    // Center the image in viewport
    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2;

    return {
      width,
      height,
      x,
      y,
      aspectRatio,
    };
  }

  /**
   * Apply position to cloned image with CSS transform
   */
  private applyPosition(position: Position): void {
    if (!this.clonedImage) return;

    // Store base position for zoom calculations
    this.basePosition = position;

    Object.assign(this.clonedImage.style, {
      width: position.width + 'px',
      height: position.height + 'px',
      transform: `translate(${position.x}px, ${position.y}px)`,
      transformOrigin: 'center center',
    });
  }

  /**
   * Apply zoom transform on top of base position (including pan offset)
   */
  private applyZoomTransform(withTransition: boolean = false): void {
    if (!this.clonedImage || !this.basePosition) return;

    this.clonedImage.style.transition = withTransition ? 'transform 0.2s ease-out' : 'none';

    const x = this.basePosition.x + this.panOffsetX;
    const y = this.basePosition.y + this.panOffsetY;

    this.clonedImage.style.transform = `translate(${x}px, ${y}px) scale(${this.currentZoom})`;

    // Update cursor based on zoom level
    this.updatePanCursor();
  }

  /**
   * Reset zoom state and pan offset
   */
  private resetZoom(): void {
    this.currentZoom = 1;
    this.resetPan();
  }

  /**
   * Zoom in by zoom factor
   */
  private zoomIn(): void {
    this.currentZoom = Math.min(this.currentZoom * this.ZOOM_FACTOR, this.MAX_ZOOM);
    this.applyZoomTransform(true);
    this.updateZoomControlsState();
  }

  /**
   * Zoom out by zoom factor
   */
  private zoomOut(): void {
    this.currentZoom = Math.max(this.currentZoom / this.ZOOM_FACTOR, this.MIN_ZOOM);
    this.applyZoomTransform(true);
    this.updateZoomControlsState();
  }

  /**
   * Reset zoom to fit-to-screen (1:1 base scale)
   */
  private resetToFit(): void {
    this.resetZoom();
    this.applyZoomTransform(true);
    this.updateZoomControlsState();
  }

  /**
   * Handle mouse wheel for zoom
   */
  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    if (e.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  };

  /**
   * Handle mouse down for pan/drag start
   */
  private handleMouseDown = (e: MouseEvent): void => {
    // Only left mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    this.isDragging = true;
    this.dragStartX = e.clientX - this.panOffsetX;
    this.dragStartY = e.clientY - this.panOffsetY;

    // Update cursor
    if (this.clonedImage) {
      this.clonedImage.style.cursor = 'grabbing';
    }
  };

  /**
   * Handle mouse move for panning
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    e.preventDefault();
    this.panOffsetX = e.clientX - this.dragStartX;
    this.panOffsetY = e.clientY - this.dragStartY;

    // Apply transform without transition for smooth dragging
    this.applyZoomTransform(false);
  };

  /**
   * Handle mouse up for pan/drag end
   */
  private handleMouseUp = (): void => {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Update cursor back to grab
    this.updatePanCursor();
  };

  /**
   * Update cursor based on drag state
   */
  private updatePanCursor(): void {
    if (!this.clonedImage) return;

    this.clonedImage.style.cursor = this.isDragging ? 'grabbing' : 'grab';
  }

  /**
   * Reset pan offset
   */
  private resetPan(): void {
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.isDragging = false;
  }

  /**
   * Create zoom control buttons
   */
  private createZoomControls(): void {
    if (!this.modal || this.zoomControls) return;

    this.zoomControls = document.createElement('div');
    this.zoomControls.className = 'markview-image-zoom-controls';

    // Zoom in button
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'markview-image-zoom-btn';
    zoomInBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>`;
    zoomInBtn.title = 'Zoom in';
    zoomInBtn.setAttribute('aria-label', 'Zoom in');
    zoomInBtn.setAttribute('data-action', 'zoom-in');
    zoomInBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.zoomIn();
    });

    // Zoom out button
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'markview-image-zoom-btn';
    zoomOutBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>`;
    zoomOutBtn.title = 'Zoom out';
    zoomOutBtn.setAttribute('aria-label', 'Zoom out');
    zoomOutBtn.setAttribute('data-action', 'zoom-out');
    zoomOutBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.zoomOut();
    });

    // Reset button (fit to screen)
    const resetBtn = document.createElement('button');
    resetBtn.className = 'markview-image-zoom-btn';
    resetBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>`;
    resetBtn.title = 'Fit to screen';
    resetBtn.setAttribute('aria-label', 'Fit to screen');
    resetBtn.setAttribute('data-action', 'reset');
    resetBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.resetToFit();
    });

    this.zoomControls.appendChild(zoomInBtn);
    this.zoomControls.appendChild(zoomOutBtn);
    this.zoomControls.appendChild(resetBtn);

    this.modal.appendChild(this.zoomControls);
  }

  /**
   * Update zoom controls state (enable/disable buttons at limits)
   */
  private updateZoomControlsState(): void {
    if (!this.zoomControls) return;

    const zoomInBtn = this.zoomControls.querySelector(
      '[data-action="zoom-in"]'
    ) as HTMLButtonElement;
    const zoomOutBtn = this.zoomControls.querySelector(
      '[data-action="zoom-out"]'
    ) as HTMLButtonElement;

    if (zoomInBtn) {
      zoomInBtn.disabled = this.currentZoom >= this.MAX_ZOOM;
    }
    if (zoomOutBtn) {
      zoomOutBtn.disabled = this.currentZoom <= this.MIN_ZOOM;
    }
  }

  /**
   * Set up zoom and pan event listeners
   */
  private setupZoomEvents(): void {
    if (!this.modal || !this.clonedImage) return;

    // Wheel zoom on modal
    this.modal.addEventListener('wheel', this.handleWheel, { passive: false });

    // Pan/drag events on cloned image
    this.clonedImage.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    // Set initial grab cursor
    this.clonedImage.style.cursor = 'grab';

    // Show zoom controls
    if (this.zoomControls) {
      this.zoomControls.style.display = 'flex';
    }
  }

  /**
   * Remove zoom and pan event listeners
   */
  private cleanupZoomEvents(): void {
    if (this.modal) {
      this.modal.removeEventListener('wheel', this.handleWheel);
    }

    // Remove pan/drag events
    if (this.clonedImage) {
      this.clonedImage.removeEventListener('mousedown', this.handleMouseDown);
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    // Reset drag state
    this.isDragging = false;

    // Hide zoom controls
    if (this.zoomControls) {
      this.zoomControls.style.display = 'none';
    }
  }

  /**
   * Debounce utility for resize events
   */
  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;

    return (...args: Parameters<T>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }

      timeout = window.setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    };
  }

  /**
   * Cleanup and destroy image viewer
   */
  destroy(): void {
    // Clean up zoom events
    this.cleanupZoomEvents();

    // Remove event handlers
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    // Remove DOM elements
    this.modal?.remove();

    // Reset state
    this.modal = null;
    this.clonedImage = null;
    this.originalImage = null;
    this.setPosition = null;
    this.resizeHandler = null;
    this.keyboardHandler = null;
    this.prevButton = null;
    this.nextButton = null;
    this.counter = null;
    this.zoomControls = null;
    this.basePosition = null;
    this.resetZoom();
    this.initialized = false; // Allow re-initialization if needed
  }
}

// Export singleton instance
export const imageViewer = new ImageViewer();
