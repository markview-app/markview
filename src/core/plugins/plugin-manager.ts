/**
 * Plugin Manager
 * Manages plugin lifecycle, installation, and state
 */

import type MarkdownIt from 'markdown-it';
import type { MarkdownPlugin, PluginState, PluginManagerEvent } from './types';
import { PLUGIN_REGISTRY } from './registry';
import { logger } from '@utils/logger';

export class PluginManager {
  private md: MarkdownIt;
  private pluginStates: Map<string, PluginState> = new Map();
  private eventListeners: ((event: PluginManagerEvent) => void)[] = [];

  constructor(md: MarkdownIt) {
    this.md = md;
  }

  /**
   * Install plugins based on enabled list
   * @param enabledPluginIds - Array of plugin IDs to enable, or undefined for defaults
   * @param disabledPluginIds - Array of plugin IDs to explicitly disable
   */
  installPlugins(enabledPluginIds?: string[], disabledPluginIds?: string[]): void {
    // All plugins available in open source version
    const isPro = true;

    // Determine which plugins to install
    const pluginsToInstall = PLUGIN_REGISTRY.filter(plugin => {
      // Check explicit disable list first
      if (disabledPluginIds?.includes(plugin.id)) {
        return false;
      }

      // If enabledPluginIds specified, only include those
      if (enabledPluginIds) {
        return enabledPluginIds.includes(plugin.id);
      }

      // Otherwise use default enabled state
      return plugin.enabledByDefault;
    });

    // Validate dependencies
    this.validateDependencies(pluginsToInstall);

    // Install each plugin
    for (const plugin of pluginsToInstall) {
      this.installPlugin(plugin, isPro);
    }

    logger.log(
      `[PluginManager] Installed ${this.pluginStates.size} plugins:`,
      Array.from(this.pluginStates.keys())
    );
  }

  /**
   * Install a single plugin
   */
  private installPlugin(plugin: MarkdownPlugin, isPro: boolean): void {
    // Check PRO requirement
    if (plugin.requiresPro && !isPro) {
      this.pluginStates.set(plugin.id, {
        plugin,
        installed: false,
        enabled: false,
        error: 'Requires PRO license',
      });
      logger.log(`[PluginManager] Skipped PRO plugin: ${plugin.id}`);
      return;
    }

    try {
      plugin.install(this.md);

      this.pluginStates.set(plugin.id, {
        plugin,
        installed: true,
        enabled: true,
      });

      this.emit({ type: 'plugin:installed', pluginId: plugin.id });
      logger.log(`[PluginManager] Installed: ${plugin.id} v${plugin.version}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.pluginStates.set(plugin.id, {
        plugin,
        installed: false,
        enabled: false,
        error: errorMessage,
      });

      this.emit({ type: 'plugin:error', pluginId: plugin.id, error: errorMessage });
      logger.error(`[PluginManager] Failed to install ${plugin.id}:`, error);
    }
  }

  /**
   * Validate plugin dependencies
   */
  private validateDependencies(plugins: MarkdownPlugin[]): void {
    const pluginIds = new Set(plugins.map(p => p.id));

    for (const plugin of plugins) {
      // Check dependencies
      if (plugin.dependencies) {
        const missing = plugin.dependencies.filter(dep => !pluginIds.has(dep));
        if (missing.length > 0) {
          logger.warn(
            `[PluginManager] Plugin "${plugin.id}" missing dependencies: ${missing.join(', ')}`
          );
        }
      }

      // Check conflicts
      if (plugin.conflicts) {
        const conflicts = plugin.conflicts.filter(c => pluginIds.has(c));
        if (conflicts.length > 0) {
          logger.warn(
            `[PluginManager] Plugin "${plugin.id}" conflicts with: ${conflicts.join(', ')}`
          );
        }
      }
    }
  }

  /**
   * Get state of a specific plugin
   */
  getPluginState(pluginId: string): PluginState | undefined {
    return this.pluginStates.get(pluginId);
  }

  /**
   * Get all plugin states
   */
  getAllPluginStates(): Map<string, PluginState> {
    return new Map(this.pluginStates);
  }

  /**
   * Check if a plugin is installed and enabled
   */
  isPluginActive(pluginId: string): boolean {
    const state = this.pluginStates.get(pluginId);
    return state?.installed === true && state?.enabled === true;
  }

  /**
   * Get list of active plugin IDs
   */
  getActivePluginIds(): string[] {
    return Array.from(this.pluginStates.entries())
      .filter(([, state]) => state.installed && state.enabled)
      .map(([id]) => id);
  }

  /**
   * Run preprocess hooks for all active plugins
   */
  preprocess(markdown: string): string {
    let result = markdown;

    for (const [, state] of this.pluginStates) {
      if (state.installed && state.enabled && state.plugin.preprocess) {
        try {
          result = state.plugin.preprocess(result);
        } catch (error) {
          logger.error(`[PluginManager] Preprocess error in ${state.plugin.id}:`, error);
        }
      }
    }

    return result;
  }

  /**
   * Run postprocess hooks for all active plugins
   */
  postprocess(html: string): string {
    let result = html;

    for (const [, state] of this.pluginStates) {
      if (state.installed && state.enabled && state.plugin.postprocess) {
        try {
          result = state.plugin.postprocess(result);
        } catch (error) {
          logger.error(`[PluginManager] Postprocess error in ${state.plugin.id}:`, error);
        }
      }
    }

    return result;
  }

  /**
   * Cleanup all plugins
   */
  cleanup(): void {
    for (const [, state] of this.pluginStates) {
      if (state.plugin.cleanup) {
        try {
          state.plugin.cleanup();
        } catch (error) {
          logger.error(`[PluginManager] Cleanup error in ${state.plugin.id}:`, error);
        }
      }
    }

    this.pluginStates.clear();
  }

  /**
   * Add event listener
   */
  on(listener: (event: PluginManagerEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: PluginManagerEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error('[PluginManager] Event listener error:', error);
      }
    }
  }
}
