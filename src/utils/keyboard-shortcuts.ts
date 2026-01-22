/**
 * MarkView Centralized Keyboard Shortcut Manager
 * Single source of truth for all keyboard shortcuts
 * Provides conflict detection, dynamic registration, and documentation generation
 */

import { logger } from './logger';

export interface ShortcutConfig {
  key: string; // The actual key (e.g., 'D', 'R', 'B', 'Home', 'Escape', 'ArrowLeft')
  ctrl?: boolean; // Ctrl key (Windows/Linux) or Cmd key (macOS)
  shift?: boolean; // Shift key
  alt?: boolean; // Alt key
  meta?: boolean; // Meta key (explicit if needed)
  description: string; // Human-readable description
  action: (e: KeyboardEvent) => void; // Action to execute
  enabled?: boolean; // Whether shortcut is currently active
  ignoreInInputs?: boolean; // Whether to ignore in input fields (default: true)
}

interface RegisteredShortcut extends ShortcutConfig {
  id: string;
  handler: (e: KeyboardEvent) => void;
}

/**
 * Keyboard Shortcut Manager
 * Centralized handler for all keyboard shortcuts
 */
class KeyboardShortcutManager {
  private shortcuts: Map<string, RegisteredShortcut> = new Map();
  private globalHandler: ((e: KeyboardEvent) => void) | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the keyboard shortcut manager
   * Sets up the global keyboard event listener
   */
  initialize(): void {
    if (this.initialized) {
      logger.warn('[KeyboardManager] Already initialized');
      return;
    }

    this.globalHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.globalHandler);
    this.initialized = true;

    logger.log('[KeyboardManager] Initialized');
  }

  /**
   * Register a keyboard shortcut
   * @param id Unique identifier for the shortcut
   * @param config Shortcut configuration
   */
  register(id: string, config: ShortcutConfig): void {
    // Check for existing shortcut with same ID
    if (this.shortcuts.has(id)) {
      logger.warn(`[KeyboardManager] Shortcut "${id}" already registered, overwriting`);
    }

    // Check for conflicts with other shortcuts
    const conflict = this.findConflict(config);
    if (conflict) {
      logger.warn(
        `[KeyboardManager] Shortcut conflict detected: "${id}" (${this.formatShortcut(config)}) conflicts with "${conflict.id}" (${this.formatShortcut(conflict)})`
      );
    }

    // Create handler function
    const handler = (e: KeyboardEvent) => {
      // Check if shortcut is enabled
      if (config.enabled === false) return;

      // Check if we should ignore this event (e.g., in input fields)
      if (this.shouldIgnoreEvent(e, config)) return;

      // Check if key matches
      if (!this.matchesShortcut(e, config)) return;

      // Prevent default browser behavior
      e.preventDefault();

      // Execute action
      try {
        config.action(e);
        logger.log(`[KeyboardManager] Executed shortcut: ${id} (${this.formatShortcut(config)})`);
      } catch (error) {
        logger.error(`[KeyboardManager] Error executing shortcut "${id}":`, error);
      }
    };

    // Store shortcut
    this.shortcuts.set(id, {
      ...config,
      id,
      handler,
    });

    logger.log(`[KeyboardManager] Registered shortcut: ${id} (${this.formatShortcut(config)})`);
  }

  /**
   * Unregister a keyboard shortcut
   * @param id Unique identifier of the shortcut to remove
   */
  unregister(id: string): void {
    if (!this.shortcuts.has(id)) {
      logger.warn(`[KeyboardManager] Shortcut "${id}" not found`);
      return;
    }

    this.shortcuts.delete(id);
    logger.log(`[KeyboardManager] Unregistered shortcut: ${id}`);
  }

  /**
   * Enable a keyboard shortcut
   * @param id Unique identifier of the shortcut
   */
  enable(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      logger.warn(`[KeyboardManager] Shortcut "${id}" not found`);
      return;
    }

    shortcut.enabled = true;
    logger.log(`[KeyboardManager] Enabled shortcut: ${id}`);
  }

  /**
   * Disable a keyboard shortcut
   * @param id Unique identifier of the shortcut
   */
  disable(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      logger.warn(`[KeyboardManager] Shortcut "${id}" not found`);
      return;
    }

    shortcut.enabled = false;
    logger.log(`[KeyboardManager] Disabled shortcut: ${id}`);
  }

  /**
   * Get all registered shortcuts
   * Useful for documentation or help dialog
   */
  getShortcuts(): Array<{ id: string; config: ShortcutConfig }> {
    return Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({
      id,
      config: {
        key: shortcut.key,
        ctrl: shortcut.ctrl,
        shift: shortcut.shift,
        alt: shortcut.alt,
        meta: shortcut.meta,
        description: shortcut.description,
        action: shortcut.action,
        enabled: shortcut.enabled,
        ignoreInInputs: shortcut.ignoreInInputs,
      },
    }));
  }

  /**
   * Handle global keydown event
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Execute all matching shortcuts
    for (const shortcut of this.shortcuts.values()) {
      shortcut.handler(e);
    }
  }

  /**
   * Check if event matches shortcut configuration
   */
  private matchesShortcut(e: KeyboardEvent, config: ShortcutConfig): boolean {
    // Check key (case-insensitive)
    if (e.key.toLowerCase() !== config.key.toLowerCase()) return false;

    // Check modifiers (ctrl/cmd)
    const hasCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (config.ctrl && !hasCtrlOrCmd) return false;
    if (!config.ctrl && hasCtrlOrCmd) return false;

    // Check shift
    if (config.shift && !e.shiftKey) return false;
    if (!config.shift && e.shiftKey) return false;

    // Check alt
    if (config.alt && !e.altKey) return false;
    if (!config.alt && e.altKey) return false;

    return true;
  }

  /**
   * Check if event should be ignored (e.g., in input fields)
   */
  private shouldIgnoreEvent(e: KeyboardEvent, config: ShortcutConfig): boolean {
    // By default, ignore events in input fields unless explicitly allowed
    const ignoreInInputs = config.ignoreInInputs !== false;

    if (ignoreInInputs) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find conflicting shortcut
   */
  private findConflict(config: ShortcutConfig): RegisteredShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (
        shortcut.key.toLowerCase() === config.key.toLowerCase() &&
        !!shortcut.ctrl === !!config.ctrl &&
        !!shortcut.shift === !!config.shift &&
        !!shortcut.alt === !!config.alt
      ) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * Format shortcut for display
   */
  private formatShortcut(config: ShortcutConfig): string {
    const parts: string[] = [];

    if (config.ctrl) parts.push('Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');
    parts.push(config.key);

    return parts.join('+');
  }

  /**
   * Clean up and destroy the manager
   */
  destroy(): void {
    if (this.globalHandler) {
      document.removeEventListener('keydown', this.globalHandler);
      this.globalHandler = null;
    }

    this.shortcuts.clear();
    this.initialized = false;

    logger.log('[KeyboardManager] Destroyed');
  }
}

// Export singleton instance
export const keyboardManager = new KeyboardShortcutManager();
