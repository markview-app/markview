/**
 * MarkView Content Script Entry Point
 * This file orchestrates the extension initialization
 */

// Import design system styles
import './styles/components.css';
import './styles/tokens.css';
import './styles/utilities.css';

// Import component-specific styles
import './styles/action-buttons.css';
import './styles/alerts.css';
import './styles/centered-toggle.css';
import './styles/notification.css';
import './styles/keyboard-shortcuts-help.css';
import './styles/quick-settings-modal.css';
import './styles/extension-info-modal.css';
import './styles/raw-toggle.css';
import './styles/scroll-top.css';
import './styles/theme-toggle.css';
import './styles/code-copy.css';
import './styles/image-viewer.css';
import './styles/tables.css';
import './styles/markdown-extended.css';
import './styles/custom-containers.css';
import './styles/main.css';
import './styles/syntax-highlighting.css';
import './styles/print.css';
import './styles/mermaid.css';
import './styles/mermaid-zoom.css';
import './styles/toc-sidebar.css';
import './styles/resize-handle.css';

// Inject KaTeX CSS with proper Chrome extension URLs
const katexCssUrl = chrome.runtime.getURL('node_modules/katex/dist/katex.min.css');
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = katexCssUrl;
document.head.appendChild(link);

// Import core functionality
import { createExtensionState, initializeExtension } from '@core/lifecycle';
import { handleNavigation, setupNavigationObservers } from '@core/event-handlers';

// Create extension state
const state = createExtensionState();

/**
 * Initialize extension on page load
 */
const initOnLoad = (): void => {
  initializeExtension(state);
};

/**
 * Handle navigation wrapper
 */
const handleNavigationWrapper = (): void => {
  handleNavigation(state.isExtensionActive, () => initializeExtension(state));
};

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnLoad);
} else {
  initOnLoad();
}

// Setup navigation observers
setupNavigationObservers(state.isExtensionActive, handleNavigationWrapper);
