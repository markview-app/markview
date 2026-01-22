/**
 * Plugin Registry Tests
 * Tests for plugin registration and lookup functions
 */

import { describe, it, expect } from 'vitest';
import {
  PLUGIN_REGISTRY,
  getPlugin,
  getPluginsByCategory,
  getDefaultPlugins,
  getProPlugins,
  getAllPluginIds,
} from '@core/plugins/registry';

describe('Plugin Registry', () => {
  describe('PLUGIN_REGISTRY', () => {
    it('should contain all 14 plugins', () => {
      expect(PLUGIN_REGISTRY).toHaveLength(14);
    });

    it('should have plugins sorted by priority', () => {
      for (let i = 1; i < PLUGIN_REGISTRY.length; i++) {
        const prev = PLUGIN_REGISTRY[i - 1]!;
        const curr = PLUGIN_REGISTRY[i]!;
        expect(prev.priority).toBeLessThanOrEqual(curr.priority);
      }
    });

    it('should have unique plugin IDs', () => {
      const ids = PLUGIN_REGISTRY.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required plugin properties', () => {
      PLUGIN_REGISTRY.forEach(plugin => {
        expect(plugin.id).toBeTruthy();
        expect(plugin.name).toBeTruthy();
        expect(plugin.version).toBeTruthy();
        expect(plugin.description).toBeTruthy();
        expect(plugin.category).toBeTruthy();
        expect(typeof plugin.priority).toBe('number');
        expect(typeof plugin.enabledByDefault).toBe('boolean');
        expect(typeof plugin.requiresPro).toBe('boolean');
        expect(typeof plugin.install).toBe('function');
      });
    });
  });

  describe('getPlugin', () => {
    it('should return plugin by ID', () => {
      const plugin = getPlugin('tables');
      expect(plugin).toBeDefined();
      expect(plugin?.id).toBe('tables');
      expect(plugin?.name).toBe('Advanced Tables');
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });

    it('should find all expected plugins', () => {
      const expectedPlugins = [
        'tables',
        'taskLists',
        'katex',
        'mermaid',
        'emoji',
        'alerts',
        'footnote',
        'subscript',
        'superscript',
        'abbreviation',
        'insertion',
        'mark',
        'deflist',
        'container',
      ];

      expectedPlugins.forEach(id => {
        const plugin = getPlugin(id);
        expect(plugin).toBeDefined();
        expect(plugin?.id).toBe(id);
      });
    });
  });

  describe('getPluginsByCategory', () => {
    it('should return core plugins', () => {
      const corePlugins = getPluginsByCategory('core');
      expect(corePlugins.length).toBeGreaterThan(0);
      corePlugins.forEach(plugin => {
        expect(plugin.category).toBe('core');
      });
    });

    it('should return formatting plugins', () => {
      const formattingPlugins = getPluginsByCategory('formatting');
      expect(formattingPlugins.length).toBeGreaterThan(0);
      formattingPlugins.forEach(plugin => {
        expect(plugin.category).toBe('formatting');
      });
    });

    it('should return content plugins', () => {
      const contentPlugins = getPluginsByCategory('content');
      expect(contentPlugins.length).toBeGreaterThan(0);
      contentPlugins.forEach(plugin => {
        expect(plugin.category).toBe('content');
      });
    });

    it('should return extensions plugins', () => {
      const extensionPlugins = getPluginsByCategory('extensions');
      expect(extensionPlugins.length).toBeGreaterThan(0);
      extensionPlugins.forEach(plugin => {
        expect(plugin.category).toBe('extensions');
      });
    });

    it('should return empty array for non-existent category', () => {
      const plugins = getPluginsByCategory('non-existent' as any);
      expect(plugins).toEqual([]);
    });
  });

  describe('getDefaultPlugins', () => {
    it('should return all enabled-by-default plugins', () => {
      const defaultPlugins = getDefaultPlugins();
      expect(defaultPlugins.length).toBeGreaterThan(0);
      defaultPlugins.forEach(plugin => {
        expect(plugin.enabledByDefault).toBe(true);
      });
    });

    it('should include core plugins by default', () => {
      const defaultPlugins = getDefaultPlugins();
      const ids = defaultPlugins.map(p => p.id);
      expect(ids).toContain('tables');
      expect(ids).toContain('taskLists');
    });
  });

  describe('getProPlugins', () => {
    it('should return all PRO-only plugins', () => {
      const proPlugins = getProPlugins();
      proPlugins.forEach(plugin => {
        expect(plugin.requiresPro).toBe(true);
      });
    });

    it('should return empty array since no plugins require PRO', () => {
      const proPlugins = getProPlugins();
      expect(proPlugins).toHaveLength(0);
    });
  });

  describe('getAllPluginIds', () => {
    it('should return all plugin IDs', () => {
      const ids = getAllPluginIds();
      expect(ids).toHaveLength(14);
      expect(ids).toContain('tables');
      expect(ids).toContain('taskLists');
      expect(ids).toContain('katex');
      expect(ids).toContain('mermaid');
      expect(ids).toContain('deflist');
      expect(ids).toContain('container');
    });

    it('should return unique IDs', () => {
      const ids = getAllPluginIds();
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Plugin Priorities', () => {
    it('should have core plugins with priority 0-20', () => {
      const corePlugins = getPluginsByCategory('core');
      corePlugins.forEach(plugin => {
        expect(plugin.priority).toBeGreaterThanOrEqual(0);
        expect(plugin.priority).toBeLessThanOrEqual(20);
      });
    });

    it('should have content plugins with priority 20-40', () => {
      const contentPlugins = getPluginsByCategory('content');
      contentPlugins.forEach(plugin => {
        expect(plugin.priority).toBeGreaterThanOrEqual(20);
        expect(plugin.priority).toBeLessThanOrEqual(40);
      });
    });

    it('should have formatting plugins with priority 41-60', () => {
      const formattingPlugins = getPluginsByCategory('formatting');
      formattingPlugins.forEach(plugin => {
        expect(plugin.priority).toBeGreaterThanOrEqual(41);
        expect(plugin.priority).toBeLessThanOrEqual(60);
      });
    });

    it('should have extension plugins with priority 60-80', () => {
      const extensionPlugins = getPluginsByCategory('extensions');
      extensionPlugins.forEach(plugin => {
        expect(plugin.priority).toBeGreaterThanOrEqual(60);
        expect(plugin.priority).toBeLessThanOrEqual(80);
      });
    });
  });
});
