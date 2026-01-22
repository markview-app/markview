/**
 * Plugin Registry
 * Central registry of all available markdown-it plugins
 */

import type { MarkdownPlugin } from './types';
import {
  tablesPlugin,
  taskListsPlugin,
  katexPlugin,
  mermaidPlugin,
  emojiPlugin,
  alertsPlugin,
  footnotePlugin,
  subscriptPlugin,
  superscriptPlugin,
  abbreviationPlugin,
  insertionPlugin,
  markPlugin,
  deflistPlugin,
  containerPlugin,
} from './definitions';

/**
 * All available plugins, sorted by priority
 * To add a new plugin:
 * 1. Create a plugin definition file in ./definitions/
 * 2. Export it from ./definitions/index.ts
 * 3. Import and add it to this array
 */
export const PLUGIN_REGISTRY: MarkdownPlugin[] = [
  tablesPlugin,
  taskListsPlugin,
  katexPlugin,
  mermaidPlugin,
  emojiPlugin,
  alertsPlugin,
  footnotePlugin,
  subscriptPlugin,
  superscriptPlugin,
  abbreviationPlugin,
  insertionPlugin,
  markPlugin,
  deflistPlugin,
  containerPlugin,
].sort((a, b) => a.priority - b.priority);

/**
 * Get plugin by ID
 */
export function getPlugin(id: string): MarkdownPlugin | undefined {
  return PLUGIN_REGISTRY.find(p => p.id === id);
}

/**
 * Get all plugins in a category
 */
export function getPluginsByCategory(category: MarkdownPlugin['category']): MarkdownPlugin[] {
  return PLUGIN_REGISTRY.filter(p => p.category === category);
}

/**
 * Get all enabled-by-default plugins
 */
export function getDefaultPlugins(): MarkdownPlugin[] {
  return PLUGIN_REGISTRY.filter(p => p.enabledByDefault);
}

/**
 * Get all PRO-only plugins
 */
export function getProPlugins(): MarkdownPlugin[] {
  return PLUGIN_REGISTRY.filter(p => p.requiresPro);
}

/**
 * Get list of all plugin IDs
 */
export function getAllPluginIds(): string[] {
  return PLUGIN_REGISTRY.map(p => p.id);
}
