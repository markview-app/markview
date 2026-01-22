// MarkView Code Block Copy Button Component
// Adds copy-to-clipboard buttons to all code blocks
import { logger } from '@utils/logger';

export class CodeCopy {
  private container: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.container = document.getElementById('markview-container');
    if (!this.container) {
      logger.error('[CodeCopy] Container not found');
      return;
    }

    this.addCopyButtons();
  }

  /**
   * Add copy buttons to all code blocks
   */
  private addCopyButtons(): void {
    if (!this.container) return;

    // Find all <pre> elements that contain <code>
    const codeBlocks = this.container.querySelectorAll('pre > code');

    codeBlocks.forEach(codeElement => {
      const preElement = codeElement.parentElement;
      if (!preElement) return;

      // Skip if button already exists
      if (preElement.querySelector('.markview-copy-button')) return;

      // Extract language from code element classes
      const language = this.extractLanguage(codeElement as HTMLElement);

      // Create wrapper div for positioning
      const wrapper = document.createElement('div');
      wrapper.className = 'markview-code-block-wrapper';

      // Wrap the pre element
      preElement.parentNode?.insertBefore(wrapper, preElement);
      wrapper.appendChild(preElement);

      // Add language label if available
      if (language) {
        const languageLabel = document.createElement('div');
        languageLabel.className = 'markview-language-label';
        languageLabel.textContent = language;
        wrapper.appendChild(languageLabel);
      }

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'markview-copy-button';
      copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 4.5h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.5 2.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="markview-copy-button-text">Copy</span>
      `;
      copyButton.title = 'Copy code to clipboard';
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');

      // Add click handler
      copyButton.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();
        await this.copyCode(codeElement as HTMLElement, copyButton);
      });

      // Add button to wrapper
      wrapper.appendChild(copyButton);
    });
  }

  /**
   * Extract language from code element class names
   */
  private extractLanguage(codeElement: HTMLElement): string | null {
    const classes = codeElement.className.split(' ');

    // Look for language- or hljs classes
    for (const className of classes) {
      if (className.startsWith('language-')) {
        const lang = className.replace('language-', '');
        // Skip 'text' and 'plaintext' as they're not useful labels
        if (lang && lang !== 'text' && lang !== 'plaintext') {
          return lang;
        }
      }
      // highlight.js adds language name as class
      if (className.startsWith('hljs-') || className === 'hljs') {
        continue; // Skip hljs utility classes
      }
    }

    // Check for data-language attribute (if markdown-it adds it)
    const dataLang = codeElement.getAttribute('data-language');
    if (dataLang && dataLang !== 'text' && dataLang !== 'plaintext') {
      return dataLang;
    }

    return null;
  }

  /**
   * Copy code to clipboard
   */
  private async copyCode(codeElement: HTMLElement, button: HTMLElement): Promise<void> {
    try {
      // Extract text content, preserving line breaks
      const code = codeElement.textContent || '';

      // Copy to clipboard
      await navigator.clipboard.writeText(code);

      // Show success feedback
      this.showCopiedFeedback(button);
    } catch (err) {
      logger.error('[CodeCopy] Failed to copy code:', err);
      this.showErrorFeedback(button);
    }
  }

  /**
   * Show "Copied!" feedback
   */
  private showCopiedFeedback(button: HTMLElement): void {
    const originalHTML = button.innerHTML;
    button.classList.add('copied');
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 4.5l-7 7-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="markview-copy-button-text">Copied!</span>
    `;

    // Reset after 2 seconds
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalHTML;
    }, 2000);
  }

  /**
   * Show error feedback
   */
  private showErrorFeedback(button: HTMLElement): void {
    const originalHTML = button.innerHTML;
    button.classList.add('error');
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="markview-copy-button-text">Failed</span>
    `;

    // Reset after 2 seconds
    setTimeout(() => {
      button.classList.remove('error');
      button.innerHTML = originalHTML;
    }, 2000);
  }

  /**
   * Refresh copy buttons (called when content changes)
   */
  public refresh(): void {
    this.container = document.getElementById('markview-container');
    if (this.container) {
      this.addCopyButtons();
    }
  }

  /**
   * Clean up
   */
  public destroy(): void {
    // Remove all copy buttons
    if (this.container) {
      const buttons = this.container.querySelectorAll('.markview-copy-button');
      buttons.forEach(button => button.remove());

      const wrappers = this.container.querySelectorAll('.markview-code-block-wrapper');
      wrappers.forEach(wrapper => {
        const pre = wrapper.querySelector('pre');
        if (pre && wrapper.parentNode) {
          wrapper.parentNode.insertBefore(pre, wrapper);
          wrapper.remove();
        }
      });
    }

    this.container = null;
  }
}
