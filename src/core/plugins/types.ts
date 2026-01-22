/**
 * Plugin System Types
 * Provides standard interfaces for markdown-it plugins
 */

import type MarkdownIt from 'markdown-it';

/**
 * Plugin category for organization and UI grouping
 */
export type PluginCategory =
  | 'core' // Essential rendering (tables, task lists)
  | 'formatting' // Text formatting (subscript, superscript, mark)
  | 'content' // Content types (math, diagrams, code)
  | 'extensions' // Extended features (footnotes, abbreviations)
  | 'advanced'; // Advanced/PRO features

/**
 * Plugin configuration interface
 * Defines the contract all plugins must follow
 */
export interface MarkdownPlugin {
  /** Unique identifier (e.g., 'tables', 'mermaid', 'katex') */
  id: string;

  /** Display name for UI (e.g., 'Advanced Tables', 'Mermaid Diagrams') */
  name: string;

  /** Plugin version (should match npm package version) */
  version: string;

  /** Plugin description for documentation */
  description: string;

  /** Category for grouping in settings UI */
  category: PluginCategory;

  /**
   * Priority determines installation order
   * Lower numbers = earlier installation
   * Range: 0-100 (0=first, 100=last)
   * Recommended ranges:
   * - 0-20: Core plugins (tables, task lists)
   * - 21-40: Content plugins (math, code, diagrams)
   * - 41-60: Formatting plugins (subscript, mark)
   * - 61-80: Extensions (footnotes, abbreviations)
   * - 81-100: Post-processing plugins
   */
  priority: number;

  /** Whether plugin is enabled by default */
  enabledByDefault: boolean;

  /** Whether this plugin requires PRO license */
  requiresPro: boolean;

  /**
   * Install the plugin into markdown-it instance
   * This is the main entry point for plugin registration
   */
  install(md: MarkdownIt): void;

  /**
   * Optional: Plugin dependencies (other plugin IDs)
   * The plugin manager will warn if dependencies are missing
   */
  dependencies?: string[];

  /**
   * Optional: Plugins that conflict with this one
   * The plugin manager will warn if conflicts are detected
   */
  conflicts?: string[];

  /**
   * Optional: Settings key in MarkViewSettings that controls this plugin
   * If undefined, plugin uses a generated key: `plugin_${id}`
   */
  settingsKey?: keyof import('@core/storage').MarkViewSettings;

  /**
   * Optional: Transform markdown before parsing
   * Useful for preprocessing (e.g., protecting certain syntax)
   */
  preprocess?(markdown: string): string;

  /**
   * Optional: Transform HTML after rendering
   * Useful for post-processing (e.g., adding classes, sanitization)
   */
  postprocess?(html: string): string;

  /**
   * Optional: Cleanup function called when renderer is destroyed
   * Useful for releasing resources or event listeners
   */
  cleanup?(): void;
}

/**
 * Plugin state tracked by PluginManager
 */
export interface PluginState {
  plugin: MarkdownPlugin;
  installed: boolean;
  enabled: boolean;
  error?: string;
}

/**
 * Options for plugin registration
 */
export interface PluginRegistrationOptions {
  /** Override default enabled state */
  enabled?: boolean;

  /** Additional configuration to pass to plugin */
  config?: Record<string, unknown>;
}

/**
 * Plugin manager events
 */
export type PluginManagerEvent =
  | { type: 'plugin:installed'; pluginId: string }
  | { type: 'plugin:enabled'; pluginId: string }
  | { type: 'plugin:disabled'; pluginId: string }
  | { type: 'plugin:error'; pluginId: string; error: string };
