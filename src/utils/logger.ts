/**
 * Logger utility for MarkView extension
 *
 * This utility provides environment-aware logging that can be easily
 * controlled for production vs development builds.
 *
 * Usage:
 *   import { logger } from '@utils/logger';
 *   logger.log('Debug message');
 *   logger.warn('Warning message');
 *   logger.error('Error message');
 */

// Detect if we're in production mode
// In webpack, this will be replaced with actual boolean during build
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Logger instance with environment-aware methods
 */
export const logger = {
  /**
   * Log debug information (hidden in production)
   */
  log: (...args: any[]): void => {
    if (!IS_PRODUCTION) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (hidden in production)
   */
  warn: (...args: any[]): void => {
    if (!IS_PRODUCTION) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (hidden in production)
   */
  error: (...args: any[]): void => {
    if (!IS_PRODUCTION) {
      console.error(...args);
    }
  },

  /**
   * Log informational messages (hidden in production)
   */
  info: (...args: any[]): void => {
    if (!IS_PRODUCTION) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (hidden in production)
   * Alias for log() for semantic clarity
   */
  debug: (...args: any[]): void => {
    if (!IS_PRODUCTION) {
      console.debug(...args);
    }
  },
};

/**
 * Example migration:
 *
 * Before:
 *   console.log('MarkView: Initializing...');
 *   console.warn('MarkView: No TOC found');
 *   console.error('MarkView: Failed to render');
 *
 * After:
 *   import { logger } from '@utils/logger';
 *   logger.log('MarkView: Initializing...');
 *   logger.warn('MarkView: No TOC found');
 *   logger.error('MarkView: Failed to render');
 *
 * Benefits:
 *   - All logs automatically hidden in production
 *   - Clean console for end users
 *   - No need to manually remove console statements
 *   - Easy to toggle logging during development
 */
