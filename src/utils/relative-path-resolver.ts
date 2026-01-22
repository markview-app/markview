/**
 * Relative Path Resolver
 * Resolves relative image paths for external/remote files
 * NOTE: Local file system support has been removed in the open source version
 */

import { logger } from './logger';

// Cache for resolved blob URLs to avoid recreating them
const blobUrlCache = new Map<string, string>();

/**
 * Set the current file's path (relative to root directory)
 * This should be called whenever a new file is loaded
 * @param filePath - Path like "Core Concepts/01-caching.md"
 * NOTE: This is a no-op in the open source version
 */
export function setCurrentFilePath(filePath: string | null): void {
  logger.log('[RelativePathResolver] Current file path set (no-op):', filePath || 'null');
}


/**
 * Resolve a relative path from the current file's directory
 * NOTE: Local file resolution has been removed in the open source version
 * Returns null for local files
 */
export async function resolveRelativePath(_relativePath: string): Promise<string | null> {
  // Local file system support has been removed
  logger.log('[RelativePathResolver] Local file resolution not available in open source version');
  return null;
}



/**
 * Resolve relative URLs based on a base URL (for external/remote files)
 * @param baseUrl - The base URL like "https://raw.githubusercontent.com/.../file.md"
 * @param relativePath - Relative path like "../assets/image.jpg"
 * @returns Absolute URL or null if invalid
 */
function resolveRelativeUrl(baseUrl: string, relativePath: string): string | null {
  try {
    // Use URL constructor to resolve relative paths
    const resolved = new URL(relativePath, baseUrl);
    return resolved.href;
  } catch (err) {
    logger.warn('[RelativePathResolver] Invalid URL resolution:', baseUrl, relativePath, err);
    return null;
  }
}

/**
 * Resolve all relative image paths in the rendered HTML
 * Replaces <img src="relative/path.png"> with <img src="blob:..."> (for local files)
 * or <img src="https://..."> (for external URLs)
 */
export async function resolveImagesInHTML(container: HTMLElement): Promise<void> {
  // Check if we're loading an external file (browser-rendered)
  const documentUrl = window.location.href;
  const isExternalFile = documentUrl.startsWith('http://') || documentUrl.startsWith('https://');

  // For external files, resolve relative paths using URL resolution
  if (isExternalFile) {
    logger.log('[RelativePathResolver] Resolving images for external file:', documentUrl);
    const images = container.querySelectorAll('img');
    logger.log('[RelativePathResolver] Found', images.length, 'images to check');

    for (const img of Array.from(images)) {
      // Check for data-src first (set by markdown renderer for relative paths)
      let src = img.getAttribute('data-src');
      const isDeferred = !!src;

      // Fall back to src attribute if no data-src
      if (!src) {
        src = img.getAttribute('src');
      }

      if (!src) continue;

      // Skip absolute URLs (http://, https://, file://, blob:, data:)
      if (
        src.startsWith('http://') ||
        src.startsWith('https://') ||
        src.startsWith('file://') ||
        src.startsWith('blob:') ||
        src.startsWith('data:')
      ) {
        continue;
      }

      // This is a relative path, resolve it against the document URL
      logger.log('[RelativePathResolver] Resolving relative image URL:', src);
      const absoluteUrl = resolveRelativeUrl(documentUrl, src);

      if (absoluteUrl) {
        if (isDeferred) {
          img.setAttribute('data-src', absoluteUrl);
        } else {
          img.setAttribute('src', absoluteUrl);
        }
        img.setAttribute('data-original-src', src); // Keep original for reference
        logger.log('[RelativePathResolver] Image URL resolved:', src, '→', absoluteUrl);
      } else {
        logger.warn('[RelativePathResolver] Could not resolve image URL:', src);
      }
    }
    return;
  }

  // Local file system support has been removed in the open source version
  logger.log('[RelativePathResolver] Local file resolution not available');
}

/**
 * Clear the blob URL cache
 * Should be called when switching files to free memory
 */
export function clearBlobCache(): void {
  // Revoke all blob URLs to free memory
  for (const blobUrl of blobUrlCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  blobUrlCache.clear();
  logger.log('[RelativePathResolver] Blob cache cleared');
}
