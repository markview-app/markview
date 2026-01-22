/**
 * Unified Notification System
 * Provides consistent notification UI across global and scoped contexts
 */

import { logger } from '@utils/logger';

/**
 * Notification types with corresponding styles
 */
export type NotificationType = 'success' | 'error' | 'info' | 'action';

/**
 * Notification options
 */
export interface NotificationOptions {
  /** Notification type - determines color and style */
  type?: NotificationType;
  /** Duration in milliseconds before auto-hide */
  duration?: number;
  /**
   * Scope: 'global' attaches to document.body with fixed position,
   * or pass an HTMLElement for scoped (absolute) positioning
   */
  scope?: 'global' | HTMLElement;
  /** Position for scoped notifications */
  position?: 'top-right' | 'top-left' | 'top-center';
  /** Use badge style (smaller, rounded) for compact contexts */
  badge?: boolean;
}

/**
 * Track active notifications per container to support replace behavior
 */
const activeNotifications = new WeakMap<
  HTMLElement,
  {
    element: HTMLElement;
    timeout: NodeJS.Timeout | null;
  }
>();

// Track global notification separately (WeakMap requires object keys)
let globalNotificationData: { element: HTMLElement; timeout: NodeJS.Timeout | null } | null = null;

/**
 * Show a notification
 *
 * @param message - The message to display
 * @param optionsOrType - Options object or legacy type string for backward compatibility
 * @param legacyDuration - Legacy duration parameter for backward compatibility
 *
 * @example
 * // New API with options
 * showNotification('Settings saved!', { type: 'success', scope: modalElement, badge: true });
 *
 * @example
 * // Legacy API (backward compatible)
 * showNotification('Theme changed', 'action', 2000);
 */
export function showNotification(
  message: string,
  optionsOrType: NotificationOptions | NotificationType = 'info',
  legacyDuration?: number
): void {
  // Normalize options (support legacy API)
  const options: NotificationOptions =
    typeof optionsOrType === 'string'
      ? { type: optionsOrType, duration: legacyDuration }
      : optionsOrType;

  const {
    type = 'info',
    duration = 3000,
    scope = 'global',
    position = 'top-right',
    badge = false,
  } = options;

  const isGlobal = scope === 'global';
  const container = isGlobal ? document.body : scope;

  // Clean up any orphaned global notifications first (safety measure)
  if (isGlobal) {
    const orphanedNotifications = document.querySelectorAll(
      'body > .markview-notification:not(.markview-notification--scoped)'
    );
    orphanedNotifications.forEach(el => el.remove());
  }

  // Get or clear existing notification in this container
  const existingData = isGlobal ? globalNotificationData : activeNotifications.get(container);
  const isReplacing = !!existingData;

  if (existingData) {
    // Clear existing timeout
    if (existingData.timeout) {
      clearTimeout(existingData.timeout);
    }
    // Remove existing notification element immediately
    existingData.element.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  // Add 'instant' class when replacing to skip animation
  notification.className = buildClassName(type, isGlobal, badge, position, isReplacing);
  notification.textContent = message;

  // Append to container
  container.appendChild(notification);

  // Trigger show animation
  // All notification types now use transition-based animation via .show class
  if (isReplacing) {
    // Instant show - no animation needed
    notification.classList.add('show');
  } else {
    // Animate in using requestAnimationFrame to ensure transition triggers
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
  }

  // Setup auto-hide timeout
  const timeout = setTimeout(() => {
    hideNotification(notification, isGlobal, container);
  }, duration);

  // Track this notification
  const notificationData = { element: notification, timeout };
  if (isGlobal) {
    globalNotificationData = notificationData;
  } else {
    activeNotifications.set(container, notificationData);
  }

  logger.log(`[Notification] Showing ${type} notification: "${message}"`);
}

/**
 * Build CSS class name based on options
 */
function buildClassName(
  type: NotificationType,
  isGlobal: boolean,
  badge: boolean,
  position: string,
  isReplacing: boolean = false
): string {
  const classes = ['markview-notification', `markview-notification-${type}`];

  if (!isGlobal) {
    classes.push('markview-notification--scoped');
    classes.push(`markview-notification--${position}`);
  }

  if (badge) {
    classes.push('markview-notification--badge');
  }

  // Skip animation when replacing an existing notification
  if (isReplacing) {
    classes.push('markview-notification--instant');
  }

  return classes.join(' ');
}

/**
 * Hide notification with animation
 */
function hideNotification(
  notification: HTMLElement,
  isGlobal: boolean,
  container: HTMLElement
): void {
  notification.classList.remove('show');
  notification.classList.add('fade-out');

  setTimeout(() => {
    notification.remove();

    // Clear tracking
    if (isGlobal) {
      globalNotificationData = null;
    } else {
      activeNotifications.delete(container);
    }
  }, 300);
}

/**
 * Manually hide any active notification in a container
 */
export function hideActiveNotification(scope: 'global' | HTMLElement = 'global'): void {
  const isGlobal = scope === 'global';
  const container = isGlobal ? document.body : scope;
  const data = isGlobal ? globalNotificationData : activeNotifications.get(container);

  if (data) {
    if (data.timeout) {
      clearTimeout(data.timeout);
    }
    hideNotification(data.element, isGlobal, container);
  }
}
