/**
 * Lazy Loading for Images
 * Defers loading images until they're visible in the viewport
 */

import { logger } from '@utils/logger';

export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor() {
    this.init();
  }

  /**
   * Initialize the IntersectionObserver
   */
  private init(): void {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      logger.warn('[LazyLoad] IntersectionObserver not supported, loading all images immediately');
      return;
    }

    // Create observer with rootMargin to load images slightly before they enter viewport
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            // loadImage is now async, but we don't await to avoid blocking observer
            this.loadImage(img).catch(error => {
              logger.error('[LazyLoad] Error loading image:', error);
            });
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01, // Trigger when at least 1% is visible
      }
    );

    logger.log('[LazyLoad] Initialized with IntersectionObserver');
  }

  /**
   * Convert Git hosting platform blob URLs to raw/direct image URLs
   * Supports: GitHub, GitLab, Bitbucket, Gitea, Forgejo, and others
   */
  private convertBlobUrlToRaw(url: string): string {
    const originalUrl = url;

    // Skip if already a raw URL (check common patterns)
    if (url.includes('/raw/') || url.includes('raw.githubusercontent.com')) {
      return originalUrl;
    }

    // GitHub: github.com/user/repo/blob/branch/path → raw.githubusercontent.com/user/repo/branch/path
    // Pattern: https://github.com/user/repo/blob/branch/path/to/file.jpg
    if (url.includes('github.com') && url.includes('/blob/')) {
      url = url.replace(/github\.com/g, 'raw.githubusercontent.com').replace(/\/blob\//g, '/');
      logger.log('[LazyLoad] Converted GitHub blob URL to raw URL:', url);
      return url;
    }

    // GitLab: gitlab.com/user/repo/-/blob/branch/path → gitlab.com/user/repo/-/raw/branch/path
    // Pattern: https://gitlab.com/user/repo/-/blob/branch/path/to/file.jpg
    if (url.includes('gitlab.com') && url.includes('/-/blob/')) {
      url = url.replace(/\/-\/blob\//g, '/-/raw/');
      logger.log('[LazyLoad] Converted GitLab blob URL to raw URL:', url);
      return url;
    }

    // GitLab (alternative pattern): gitlab.com/user/repo/blob/branch/path → gitlab.com/user/repo/raw/branch/path
    // Some GitLab instances use this simpler pattern
    if (url.includes('gitlab.com') && url.includes('/blob/')) {
      url = url.replace(/\/blob\//g, '/raw/');
      logger.log('[LazyLoad] Converted GitLab blob URL to raw URL:', url);
      return url;
    }

    // Bitbucket: bitbucket.org/user/repo/src/branch/path → bitbucket.org/user/repo/raw/branch/path
    // Pattern: https://bitbucket.org/user/repo/src/branch/path/to/file.jpg
    if (url.includes('bitbucket.org') && url.includes('/src/')) {
      url = url.replace(/\/src\//g, '/raw/');
      logger.log('[LazyLoad] Converted Bitbucket src URL to raw URL:', url);
      return url;
    }

    // Gitea: Common patterns for self-hosted Gitea instances
    // Pattern: https://git.example.com/user/repo/src/branch/path/to/file.jpg
    // Gitea uses /src/ for blob view and /raw/ for raw files
    // Check for /src/branch/ or /src/commit/ patterns
    if (url.includes('/src/branch/') || url.includes('/src/commit/')) {
      url = url.replace(/\/src\/(branch|commit)\//g, '/raw/$1/');
      logger.log('[LazyLoad] Converted Gitea src URL to raw URL:', url);
      return url;
    }

    // Forgejo: Same as Gitea (Forgejo is a fork of Gitea)
    // Uses identical URL structure

    // Generic pattern for self-hosted Git platforms: /blob/ → /raw/
    // This catches most Git hosting platforms (Gogs, custom instances, etc.)
    // Only convert if we detect it's a blob view pattern
    if (
      url.includes('/blob/') &&
      (url.includes('/blob/branch/') ||
        url.includes('/blob/main/') ||
        url.includes('/blob/master/') ||
        url.match(/\/blob\/[a-f0-9]{7,40}\//))
    ) {
      url = url.replace(/\/blob\//g, '/raw/');
      logger.log('[LazyLoad] Converted generic blob URL to raw URL:', url);
      return url;
    }

    // No conversion needed
    return originalUrl;
  }

  /**
   * Load an image by setting its src from data-src
   * In sandboxed contexts (CSP blocks images), fetch via background script
   */
  private async loadImage(img: HTMLImageElement): Promise<void> {
    let dataSrc = img.getAttribute('data-src');
    if (!dataSrc) return;

    // Convert Git hosting blob URLs to raw/direct URLs
    dataSrc = this.convertBlobUrlToRaw(dataSrc);

    // Check if we're in a sandboxed context (CSP blocks images)
    const isSandboxed = document.contentType === 'text/plain';
    const isExternalImage = dataSrc.startsWith('http://') || dataSrc.startsWith('https://');

    // If sandboxed and external image, fetch via background script
    if (isSandboxed && isExternalImage) {
      try {
        logger.log('[LazyLoad] Fetching image via background script (CSP blocked):', dataSrc);

        const response = await new Promise<{
          success: boolean;
          data?: string;
          contentType?: string;
          error?: string;
        }>((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: 'fetchImage',
              url: dataSrc,
            },
            response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });

        if (response.success && response.data) {
          // Convert to data URL and set as src
          const contentType = response.contentType || 'image/png';
          const dataUrl = `data:${contentType};base64,${response.data}`;

          // Wait for image to actually load before showing it
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              img.onload = null;
              img.onerror = null;
              resolve();
            };
            img.onerror = () => {
              img.onload = null;
              img.onerror = null;
              reject(new Error('Image failed to load'));
            };
            img.src = dataUrl;
          });

          logger.log('[LazyLoad] Image loaded via background script');
        } else {
          logger.warn('[LazyLoad] Failed to fetch image:', response.error);
          // Fallback: try direct load anyway (will likely fail but worth trying)
          img.src = dataSrc;
        }
      } catch (error) {
        logger.error('[LazyLoad] Error fetching image via background script:', error);
        // Fallback: try direct load anyway
        img.src = dataSrc;
      }
    } else {
      // Normal loading for non-sandboxed contexts or data URLs
      // Wait for image to load
      await new Promise<void>(resolve => {
        img.onload = () => {
          img.onload = null;
          img.onerror = null;
          resolve();
        };
        img.onerror = () => {
          img.onload = null;
          img.onerror = null;
          resolve(); // Still resolve to clean up
        };
        img.src = dataSrc;
      });
    }

    // Remove data-src attribute
    img.removeAttribute('data-src');

    // Add loaded class for styling
    img.classList.add('lazy-loaded');

    // Stop observing this image
    if (this.observer) {
      this.observer.unobserve(img);
    }

    // Remove from tracked images
    this.images.delete(img);

    logger.log('[LazyLoad] Image loaded:', dataSrc);
  }

  /**
   * Apply lazy loading to all images in a container
   */
  public applyToContainer(container: HTMLElement): void {
    const images = container.querySelectorAll('img');

    if (images.length === 0) {
      return;
    }

    logger.log(`[LazyLoad] Processing ${images.length} images`);

    images.forEach(img => {
      // Skip if already processed (has data-src but no real src)
      if (
        img.hasAttribute('data-src') &&
        img.getAttribute('src')?.startsWith('data:image/svg+xml')
      ) {
        return;
      }

      // Skip if no IntersectionObserver support
      if (!this.observer) {
        // Load immediately - images already have src, no need to do anything
        return;
      }

      // Move src to data-src for lazy loading
      const currentSrc = img.getAttribute('src');

      // Skip lazy loading for data URLs - they're already inline and
      // CSP blocks programmatic loading of data URLs in sandboxed contexts
      if (currentSrc && currentSrc.startsWith('data:')) {
        logger.log('[LazyLoad] Skipping lazy loading for data URL image');
        return;
      }

      if (currentSrc && !img.hasAttribute('data-src')) {
        img.setAttribute('data-src', currentSrc);
        img.removeAttribute('src');
      }

      // Don't set any placeholder src to avoid CSP errors in sandboxed contexts
      // The CSS will handle the placeholder appearance via background-image

      // Add lazy class for styling
      img.classList.add('lazy-loading');

      // Observe the image
      this.observer.observe(img);
      this.images.add(img as HTMLImageElement);
    });

    logger.log(`[LazyLoad] Observing ${this.images.size} images`);
  }

  /**
   * Load a specific image immediately (useful for image viewer)
   */
  public async loadImageNow(img: HTMLImageElement): Promise<void> {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) {
      await this.loadImage(img);
    }
  }

  /**
   * Load all images immediately (useful for print or export)
   */
  public async loadAll(): Promise<void> {
    if (!this.observer) {
      return;
    }

    logger.log(`[LazyLoad] Loading all ${this.images.size} images immediately`);

    // Load all images in parallel
    const promises = Array.from(this.images).map(img => this.loadImage(img));
    await Promise.all(promises);
  }

  /**
   * Destroy the observer and clean up
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.images.clear();
    logger.log('[LazyLoad] Destroyed');
  }

  /**
   * Refresh - reprocess images in container (useful after content updates)
   */
  public refresh(container: HTMLElement): void {
    this.applyToContainer(container);
  }
}

// Export singleton instance
export const lazyImageLoader = new LazyImageLoader();
