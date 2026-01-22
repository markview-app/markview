/**
 * Plugin Definitions Tests
 * Tests for individual plugin definitions
 */

import { describe, it, expect } from 'vitest';
import { tablesPlugin } from '@core/plugins/definitions/tables.plugin';
import { taskListsPlugin } from '@core/plugins/definitions/task-lists.plugin';
import { katexPlugin } from '@core/plugins/definitions/katex.plugin';
import { mermaidPlugin } from '@core/plugins/definitions/mermaid.plugin';
import { emojiPlugin } from '@core/plugins/definitions/emoji.plugin';
import { alertsPlugin } from '@core/plugins/definitions/alerts.plugin';
import { footnotePlugin } from '@core/plugins/definitions/footnote.plugin';
import { subscriptPlugin } from '@core/plugins/definitions/subscript.plugin';
import { superscriptPlugin } from '@core/plugins/definitions/superscript.plugin';
import { abbreviationPlugin } from '@core/plugins/definitions/abbreviation.plugin';
import { insertionPlugin } from '@core/plugins/definitions/insertion.plugin';
import { markPlugin } from '@core/plugins/definitions/mark.plugin';
import { deflistPlugin } from '@core/plugins/definitions/deflist.plugin';
import { containerPlugin } from '@core/plugins/definitions/container.plugin';

describe('Plugin Definitions', () => {
  describe('Tables Plugin', () => {
    it('should have correct metadata', () => {
      expect(tablesPlugin.id).toBe('tables');
      expect(tablesPlugin.name).toBe('Advanced Tables');
      expect(tablesPlugin.category).toBe('core');
      expect(tablesPlugin.enabledByDefault).toBe(true);
      expect(tablesPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof tablesPlugin.install).toBe('function');
    });

    it('should have settingsKey mapped', () => {
      expect(tablesPlugin.settingsKey).toBe('tables');
    });
  });

  describe('Task Lists Plugin', () => {
    it('should have correct metadata', () => {
      expect(taskListsPlugin.id).toBe('taskLists');
      expect(taskListsPlugin.name).toBe('Task Lists');
      expect(taskListsPlugin.category).toBe('core');
      expect(taskListsPlugin.enabledByDefault).toBe(true);
      expect(taskListsPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof taskListsPlugin.install).toBe('function');
    });

    it('should have settingsKey mapped', () => {
      expect(taskListsPlugin.settingsKey).toBe('taskLists');
    });
  });

  describe('KaTeX Plugin', () => {
    it('should have correct metadata', () => {
      expect(katexPlugin.id).toBe('katex');
      expect(katexPlugin.name).toBe('Math Equations');
      expect(katexPlugin.category).toBe('content');
      expect(katexPlugin.enabledByDefault).toBe(true);
      expect(katexPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof katexPlugin.install).toBe('function');
    });
  });

  describe('Mermaid Plugin', () => {
    it('should have correct metadata', () => {
      expect(mermaidPlugin.id).toBe('mermaid');
      expect(mermaidPlugin.name).toBe('Mermaid Diagrams');
      expect(mermaidPlugin.category).toBe('content');
      expect(mermaidPlugin.enabledByDefault).toBe(true);
      expect(mermaidPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof mermaidPlugin.install).toBe('function');
    });
  });

  describe('Emoji Plugin', () => {
    it('should have correct metadata', () => {
      expect(emojiPlugin.id).toBe('emoji');
      expect(emojiPlugin.name).toBe('Emoji');
      expect(emojiPlugin.category).toBe('formatting');
      expect(emojiPlugin.enabledByDefault).toBe(true);
      expect(emojiPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof emojiPlugin.install).toBe('function');
    });
  });

  describe('Alerts Plugin', () => {
    it('should have correct metadata', () => {
      expect(alertsPlugin.id).toBe('alerts');
      expect(alertsPlugin.name).toBe('GitHub Alerts');
      expect(alertsPlugin.category).toBe('content');
      expect(alertsPlugin.enabledByDefault).toBe(true);
      expect(alertsPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof alertsPlugin.install).toBe('function');
    });
  });

  describe('Footnote Plugin', () => {
    it('should have correct metadata', () => {
      expect(footnotePlugin.id).toBe('footnote');
      expect(footnotePlugin.name).toBe('Footnotes');
      expect(footnotePlugin.category).toBe('extensions');
      expect(footnotePlugin.enabledByDefault).toBe(true);
      expect(footnotePlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof footnotePlugin.install).toBe('function');
    });
  });

  describe('Subscript Plugin', () => {
    it('should have correct metadata', () => {
      expect(subscriptPlugin.id).toBe('subscript');
      expect(subscriptPlugin.name).toBe('Subscript');
      expect(subscriptPlugin.category).toBe('formatting');
      expect(subscriptPlugin.enabledByDefault).toBe(true);
      expect(subscriptPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof subscriptPlugin.install).toBe('function');
    });
  });

  describe('Superscript Plugin', () => {
    it('should have correct metadata', () => {
      expect(superscriptPlugin.id).toBe('superscript');
      expect(superscriptPlugin.name).toBe('Superscript');
      expect(superscriptPlugin.category).toBe('formatting');
      expect(superscriptPlugin.enabledByDefault).toBe(true);
      expect(superscriptPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof superscriptPlugin.install).toBe('function');
    });
  });

  describe('Abbreviation Plugin', () => {
    it('should have correct metadata', () => {
      expect(abbreviationPlugin.id).toBe('abbreviation');
      expect(abbreviationPlugin.name).toBe('Abbreviations');
      expect(abbreviationPlugin.category).toBe('extensions');
      expect(abbreviationPlugin.enabledByDefault).toBe(true);
      expect(abbreviationPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof abbreviationPlugin.install).toBe('function');
    });
  });

  describe('Insertion Plugin', () => {
    it('should have correct metadata', () => {
      expect(insertionPlugin.id).toBe('insertion');
      expect(insertionPlugin.name).toBe('Insertion');
      expect(insertionPlugin.category).toBe('formatting');
      expect(insertionPlugin.enabledByDefault).toBe(true);
      expect(insertionPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof insertionPlugin.install).toBe('function');
    });
  });

  describe('Mark Plugin', () => {
    it('should have correct metadata', () => {
      expect(markPlugin.id).toBe('mark');
      expect(markPlugin.name).toBe('Highlight');
      expect(markPlugin.category).toBe('formatting');
      expect(markPlugin.enabledByDefault).toBe(true);
      expect(markPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof markPlugin.install).toBe('function');
    });
  });

  describe('Plugin Priority Ordering', () => {
    const allPlugins = [
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
    ];

    it('should have valid priority values', () => {
      allPlugins.forEach(plugin => {
        expect(plugin.priority).toBeGreaterThanOrEqual(0);
        expect(plugin.priority).toBeLessThanOrEqual(100);
      });
    });

    it('should have core plugins with lower priorities', () => {
      const corePlugins = allPlugins.filter(p => p.category === 'core');
      const otherPlugins = allPlugins.filter(p => p.category !== 'core');

      corePlugins.forEach(core => {
        otherPlugins.forEach(other => {
          if (other.category !== 'content' || other.priority > 20) {
            // Content plugins can have priority 20-40, so skip comparison with them
            expect(core.priority).toBeLessThanOrEqual(other.priority);
          }
        });
      });
    });
  });

  describe('Plugin Categories', () => {
    it('should have correct category distribution', () => {
      const categories = [
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
      ].map(p => p.category);

      expect(categories).toContain('core');
      expect(categories).toContain('content');
      expect(categories).toContain('formatting');
      expect(categories).toContain('extensions');
    });
  });

  describe('Version Information', () => {
    it('should have semantic version numbers', () => {
      const allPlugins = [
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
      ];

      allPlugins.forEach(plugin => {
        expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });
  });

  describe('Definition List Plugin', () => {
    it('should have correct metadata', () => {
      expect(deflistPlugin.id).toBe('deflist');
      expect(deflistPlugin.name).toBe('Definition Lists');
      expect(deflistPlugin.category).toBe('extensions');
      expect(deflistPlugin.priority).toBe(66);
      expect(deflistPlugin.enabledByDefault).toBe(true);
      expect(deflistPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof deflistPlugin.install).toBe('function');
    });
  });

  describe('Custom Container Plugin', () => {
    it('should have correct metadata', () => {
      expect(containerPlugin.id).toBe('container');
      expect(containerPlugin.name).toBe('Custom Containers');
      expect(containerPlugin.category).toBe('extensions');
      expect(containerPlugin.priority).toBe(67);
      expect(containerPlugin.enabledByDefault).toBe(true);
      expect(containerPlugin.requiresPro).toBe(false);
    });

    it('should have install function', () => {
      expect(typeof containerPlugin.install).toBe('function');
    });
  });
});
