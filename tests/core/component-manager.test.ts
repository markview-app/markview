import { describe, it, expect } from 'vitest';
import { createComponentInstances } from '@core/component-manager';

describe('Component Manager Module', () => {
  describe('createComponentInstances', () => {
    it('should create component instances container with all properties null', () => {
      const components = createComponentInstances();

      expect(components).toBeDefined();
      expect(components.tocSidebar).toBeNull();
      expect(components.tocToggleButton).toBeNull();
      expect(components.themeToggle).toBeNull();
      expect(components.centeredToggle).toBeNull();
      expect(components.rawToggle).toBeNull();
      expect(components.scrollTopButton).toBeNull();
      expect(components.codeCopy).toBeNull();
      expect(components.actionButtons).toBeNull();
    });

    it('should create independent component containers', () => {
      const components1 = createComponentInstances();
      const components2 = createComponentInstances();

      expect(components1).not.toBe(components2);
    });

    it('should have correct TypeScript interface', () => {
      const components = createComponentInstances();

      // Type check - these should compile without errors
      const tocSidebar: typeof components.tocSidebar = null;
      const themeToggle: typeof components.themeToggle = null;

      expect(tocSidebar).toBeNull();
      expect(themeToggle).toBeNull();
    });
  });
});
