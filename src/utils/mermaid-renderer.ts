import { logger } from '@utils/logger';
import mermaid from 'mermaid';
import { initMermaidZoom } from '@components/mermaid-zoom';

/**
 * Initialize Mermaid configuration
 * Using Mermaid v11's built-in themes without custom color manipulation
 */
export function initMermaid(): void {
  // Detect current theme from document
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('markview-dark');

  logger.log('[Mermaid] Initializing with theme:', isDark ? 'dark' : 'default');

  mermaid.initialize({
    theme: isDark ? 'dark' : 'default',
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
  });
}

/**
 * Render all Mermaid diagrams found in placeholders
 */
export async function renderMermaidDiagrams(): Promise<void> {
  const placeholders = document.querySelectorAll('.mermaid-placeholder');
  if (placeholders.length === 0) {
    return;
  }

  logger.log(`[Mermaid] Found ${placeholders.length} diagrams to render`);

  // Initialize configuration before rendering
  initMermaid();

  for (const placeholder of Array.from(placeholders)) {
    const id = placeholder.id;
    const code = placeholder.getAttribute('data-code');

    if (!id || !code) {
      logger.warn('[Mermaid] Invalid placeholder found', placeholder);
      continue;
    }

    try {
      // Use a distinct ID for the SVG to avoid conflict with the placeholder ID
      // Mermaid might try to find an element with the given ID
      const renderId = id + '-svg';

      // Render the diagram
      // mermaid.render returns an object with svg string and bindFunctions
      const renderResult = await mermaid.render(renderId, code);

      let svg: string;
      let bindFunctions: ((element: Element) => void) | undefined;

      if (typeof renderResult === 'string') {
        svg = renderResult;
      } else {
        svg = renderResult.svg;
        bindFunctions = renderResult.bindFunctions;
      }

      // Create the container structure
      const container = document.createElement('div');
      container.className = 'mermaid-container';
      // Store the original code for theme switching
      // Note: Browser automatically handles HTML escaping when setting attributes
      container.setAttribute('data-mermaid-code', code);
      container.innerHTML = svg;

      // Replace placeholder with rendered diagram
      if (placeholder.isConnected) {
        placeholder.replaceWith(container);

        // Bind interaction events (clicks, etc.) if applicable
        if (bindFunctions) {
          const svgElement = container.querySelector('svg');
          if (svgElement) {
            bindFunctions(svgElement);
          }
        }
      } else {
        logger.warn(`[Mermaid] Placeholder ${id} is no longer connected to DOM`);
      }
    } catch (err: any) {
      logger.error(`[Mermaid] Failed to render diagram ${id}`, err);

      // Show error message
      const errorContainer = document.createElement('div');
      errorContainer.className = 'mermaid-error';
      errorContainer.innerHTML = `<pre>${escapeHtml(
        err?.message || 'Failed to render Mermaid diagram'
      )}</pre>`;

      if (placeholder.isConnected) {
        placeholder.replaceWith(errorContainer);
      }
    }
  }

  logger.log('[Mermaid] Finished rendering diagrams');

  // Initialize zoom controls for all diagrams
  initMermaidZoom();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m: string) => map[m] || m);
}

/**
 * Re-render all Mermaid diagrams (e.g., when theme changes)
 * This preserves existing diagrams and re-renders them with the new theme
 */
export async function reRenderDiagrams(): Promise<void> {
  logger.log('[Mermaid] Re-rendering diagrams for theme change');

  // Find all rendered diagram containers
  const containers = document.querySelectorAll('.mermaid-container');

  if (containers.length === 0) {
    logger.log('[Mermaid] No diagrams to re-render');
    return;
  }

  // Re-initialize Mermaid with new theme
  initMermaid();

  // For each container, extract the original code and re-render
  for (const container of Array.from(containers)) {
    const svg = container.querySelector('svg');
    if (!svg) continue;

    // Get the original diagram ID (stored in SVG id attribute)
    const svgId = svg.id;
    if (!svgId) continue;

    // Extract original ID (remove '-svg' suffix if present)
    const id = svgId.replace(/-svg$/, '');

    // Get the original code from the container's data attribute
    const codeAttr = container.getAttribute('data-mermaid-code');
    if (!codeAttr) {
      logger.warn(`[Mermaid] Cannot re-render diagram ${id}: no code found`);
      continue;
    }

    try {
      // Code is HTML-escaped in data attribute, browser auto-unescapes when reading
      const code = codeAttr;
      const renderId = id + '-svg';

      // Render with new theme
      const renderResult = await mermaid.render(renderId, code);
      let newSvg: string;
      let bindFunctions: ((element: Element) => void) | undefined;

      if (typeof renderResult === 'string') {
        newSvg = renderResult;
      } else {
        newSvg = renderResult.svg;
        bindFunctions = renderResult.bindFunctions;
      }

      // Replace the SVG content directly in the container
      // First, remove action buttons if they exist to preserve them
      const actionButtons = container.querySelector('.mermaid-action-buttons');

      // Replace container content with new SVG
      container.innerHTML = newSvg;

      // Re-add action buttons if they existed
      if (actionButtons) {
        container.appendChild(actionButtons);
      }

      // Bind interaction events if applicable
      if (bindFunctions) {
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          bindFunctions(svgElement);
        }
      }

      logger.log(`[Mermaid] Re-rendered diagram ${id} with new theme`);
    } catch (err) {
      logger.error(`[Mermaid] Failed to re-render diagram ${id}:`, err);
    }
  }

  logger.log(`[Mermaid] Re-rendered ${containers.length} diagram(s)`);

  // Re-initialize zoom controls after re-rendering
  initMermaidZoom();
}
