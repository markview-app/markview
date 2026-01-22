import { logger } from '@utils/logger';

/**
 * Mermaid Diagram Download Component
 * Provides download functionality for Mermaid diagrams
 */

/**
 * Download a file using a blob
 */
function downloadFile(blob: Blob, filename: string, _mimeType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Show download options modal
 */
function showDownloadModal(svg: SVGElement, filename: string = 'mermaid-diagram'): void {
  logger.log('[MermaidDownload] Showing download options modal');

  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'modal modal-sm';

  // Modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h3 class="modal-title">Download Diagram</h3>
    <button class="btn btn-ghost btn-icon btn-sm mermaid-download-modal-close" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Modal body with options
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = `
    <div class="flex flex-col gap-3 mb-3">
      <label for="download-format" class="text-sm font-medium">Format</label>
      <select id="download-format" class="mermaid-download-select">
        <option value="png">PNG</option>
        <option value="svg">SVG</option>
        <option value="jpeg">JPEG</option>
      </select>
    </div>
    <div class="flex flex-col gap-3">
      <label for="download-scale" class="text-sm font-medium">Scale</label>
      <select id="download-scale" class="mermaid-download-select">
        <option value="1">1x (Original)</option>
        <option value="2" selected>2x (High Quality)</option>
        <option value="3">3x (Very High Quality)</option>
        <option value="4">4x (Ultra Quality)</option>
      </select>
    </div>
  `;

  // Modal footer with actions
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="btn btn-ghost btn-sm mermaid-download-cancel-btn">Cancel</button>
    <button class="btn btn-primary btn-sm mermaid-download-confirm-btn">Download</button>
  `;

  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close modal function
  const closeModal = () => {
    modal.remove();
  };

  // Event listeners
  modal.querySelector('.mermaid-download-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.mermaid-download-cancel-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // Download button handler
  modal.querySelector('.mermaid-download-confirm-btn')?.addEventListener('click', () => {
    const format = (document.getElementById('download-format') as HTMLSelectElement).value;
    const scale = parseInt((document.getElementById('download-scale') as HTMLSelectElement).value);

    closeModal();
    downloadDiagram(svg, filename, format, scale);
  });
}

/**
 * Download diagram in specified format and scale
 */
function downloadDiagram(svg: SVGElement, filename: string, format: string, scale: number): void {
  logger.log(`[MermaidDownload] Downloading diagram as ${format.toUpperCase()} at ${scale}x scale`);

  try {
    // Clone SVG to avoid modifying original
    const svgClone = svg.cloneNode(true) as SVGElement;

    // Get SVG dimensions
    const bbox = svg.getBoundingClientRect();
    const width = bbox.width || 800;
    const height = bbox.height || 600;

    if (format === 'svg') {
      // Direct SVG download using sandbox-safe utility
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      downloadFile(svgBlob, `${filename}.svg`, 'image/svg+xml')
        .then(() => {
          logger.log('[MermaidDownload] SVG download complete');
        })
        .catch(error => {
          logger.error('[MermaidDownload] SVG download failed:', error);
        });
      return;
    }

    // For PNG/JPEG, convert via canvas
    const svgData = new XMLSerializer().serializeToString(svgClone);

    // Use data URL instead of blob URL to avoid CORS taint issues
    // Encode SVG as base64 to prevent special character issues
    const base64Data = btoa(encodeURIComponent(svgData).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
    const svgDataUrl = `data:image/svg+xml;base64,${base64Data}`;

    const img = new Image();

    // IMPORTANT: Set crossOrigin before setting src to prevent canvas taint
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        logger.error('[MermaidDownload] Failed to get canvas context');
        return;
      }

      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw SVG to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpeg' ? 0.95 : undefined;

      canvas.toBlob(
        blob => {
          if (!blob) {
            logger.error('[MermaidDownload] Failed to create blob');
            return;
          }

          // Use sandbox-safe download utility
          downloadFile(blob, `${filename}.${format}`, mimeType)
            .then(() => {
              logger.log(`[MermaidDownload] ${format.toUpperCase()} download complete`);
            })
            .catch(error => {
              logger.error(`[MermaidDownload] ${format.toUpperCase()} download failed:`, error);
            });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      logger.error('[MermaidDownload] Failed to load SVG for conversion');
    };

    img.src = svgDataUrl;
  } catch (error) {
    logger.error('[MermaidDownload] Error downloading diagram:', error);
  }
}

/**
 * Initialize download buttons for all Mermaid diagrams
 */
export function initMermaidZoom(): void {
  const containers = document.querySelectorAll('.mermaid-container');

  logger.log(`[MermaidDownload] Initializing download buttons for ${containers.length} diagrams`);

  containers.forEach((container, index) => {
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Remove existing action buttons to recreate them with fresh event listeners
    const existingBtnContainer = container.querySelector('.mermaid-action-buttons');
    if (existingBtnContainer) {
      existingBtnContainer.remove();
    }

    // Create button container
    const btnContainer = document.createElement('div');
    btnContainer.className = 'mermaid-action-buttons';

    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'mermaid-download-btn';
    downloadBtn.title = 'Download Diagram';
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    `;

    // Add download click handler
    downloadBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      // Generate filename from diagram index
      const filename = `mermaid-diagram-${index + 1}`;

      // Show download options modal
      showDownloadModal(svg, filename);
    });

    // Add button to container
    btnContainer.appendChild(downloadBtn);
    container.appendChild(btnContainer);
  });

  logger.log('[MermaidDownload] Initialization complete');
}
