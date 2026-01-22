import { describe, it, expect } from 'vitest';
import { createExtensionState } from '@core/lifecycle';

describe('Lifecycle Module', () => {
  describe('createExtensionState', () => {
    it('should create initial extension state with correct structure', () => {
      const state = createExtensionState();

      expect(state).toBeDefined();
      expect(state.components).toBeDefined();
      expect(state.cachedMarkdownSource).toEqual({ value: null });
      expect(state.tocState).toEqual({ userClosed: false });
      expect(state.markdownSourceType).toEqual({ value: 'unknown' });
      expect(state.isExtensionActive).toEqual({ value: false });
      expect(state.currentDocument).toEqual({ url: '', title: '' });
    });

    it('should create state with all component slots initialized to null', () => {
      const state = createExtensionState();

      expect(state.components.tocSidebar).toBeNull();
      expect(state.components.tocToggleButton).toBeNull();
      expect(state.components.themeToggle).toBeNull();
      expect(state.components.centeredToggle).toBeNull();
      expect(state.components.rawToggle).toBeNull();
      expect(state.components.scrollTopButton).toBeNull();
      expect(state.components.codeCopy).toBeNull();
      expect(state.components.actionButtons).toBeNull();
    });

    it('should create independent state instances', () => {
      const state1 = createExtensionState();
      const state2 = createExtensionState();

      expect(state1).not.toBe(state2);
      expect(state1.components).not.toBe(state2.components);
      expect(state1.cachedMarkdownSource).not.toBe(state2.cachedMarkdownSource);
    });
  });
});
