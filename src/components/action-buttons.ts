// MarkView Action Buttons Component (Print & Actions)
import { logger } from '@utils/logger';
import { MESSAGES } from '@utils/messages';
import { showKeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { isSandboxed } from '@utils/sandbox-detection';

export class ActionButtons {
  private container: HTMLDivElement | null = null;
  private mainButton: HTMLButtonElement | null = null;
  private menu: HTMLDivElement | null = null;
  private isOpen: boolean = false;
  private menuItems: HTMLButtonElement[] = [];
  private isRawMode: boolean = false;

  constructor() {
    this.init();

    // Listen for language changes
    document.addEventListener('markview:languageChanged', async () => {
      await this.updateLanguage();
    });

    // Listen for RAW mode changes
    document.addEventListener('markview:rawViewEnabled', () => {
      this.isRawMode = true;
    });

    document.addEventListener('markview:rawViewDisabled', () => {
      this.isRawMode = false;
    });
  }

  private init(): void {
    this.createButton();
    this.setupListeners();
  }

  private createButton(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'markview-action-buttons';

    // Create main toggle button (lightning bolt icon)
    this.mainButton = document.createElement('button');
    this.mainButton.id = 'markview-actions-toggle';
    this.mainButton.className = 'btn btn-secondary btn-icon';
    this.mainButton.title = MESSAGES.actions.title;
    this.mainButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
      </svg>
    `;

    this.container.appendChild(this.mainButton);
    document.body.appendChild(this.container);
  }

  /**
   * Create menu with current font family settings
   */
  private async createMenu(): Promise<void> {
    // Get current font family setting
    const { getSettings } = await import('@core/storage');
    const { getFontFamily } = await import('@utils/fonts');
    const settings = await getSettings();
    const fontFamily = settings.fontFamily ? getFontFamily(settings.fontFamily) : 'inherit';

    // Remove existing menu if any
    if (this.menu) {
      this.menu.remove();
      this.menuItems = [];
    }

    // Create menu
    this.menu = document.createElement('div');
    this.menu.id = 'markview-actions-menu';
    this.menu.className = 'markview-actions-menu';
    this.menu.style.fontFamily = fontFamily; // Dynamic font family only

    // Check if we're in a sandboxed context
    const isInSandbox = isSandboxed();

    // Available menu items
    const otherMenuItems = [
      {
        id: 'print',
        label: MESSAGES.actions.print,
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
        </svg>`,
        action: () => this.print(),
        isPro: false,
        isSandboxRestricted: isInSandbox, // Disable in sandbox
      },
      {
        id: 'raw-toggle',
        label: MESSAGES.ui.toggleRaw,
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>`,
        action: () => this.toggleRawView(),
        isPro: false,
      },
      {
        id: 'quick-settings',
        label: MESSAGES.actions.quickSettings,
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v3M12 18v3M5.636 5.636l2.122 2.122M16.242 16.242l2.122 2.122M3 12h3M18 12h3M5.636 18.364l2.122-2.122M16.242 7.758l2.122-2.122"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>`,
        action: () => this.showQuickSettings(),
        isPro: false,
      },
      {
        id: 'keyboard-shortcuts',
        label: MESSAGES.actions.keyboardShortcuts,
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"></path>
        </svg>`,
        action: () => this.showKeyboardHelp(),
        isPro: false,
      },
      {
        id: 'extension-info',
        label: MESSAGES.actions.extensionInfo,
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>`,
        action: () => this.showExtensionInfo(),
        isPro: false,
      },
    ];

    // Menu items
    const menuItems = otherMenuItems;

    menuItems.forEach(item => {
      const menuItem = document.createElement('button');
      menuItem.className = 'markview-menu-item';

      // All items are accessible in open source version
      const isProItemAccessible = true;

      // Check if item is restricted due to sandbox
      const isSandboxRestricted = (item as any).isSandboxRestricted || false;

      // Check if item should be disabled in RAW mode
      const isRawModeRestricted = ((item as any).isRawModeRestricted) && this.isRawMode;

      // Use data-disabled for PRO items, sandbox-restricted items, or raw mode restricted items
      if (
        (item.isPro && !isProItemAccessible) ||
        isSandboxRestricted ||
        isRawModeRestricted
      ) {
        menuItem.setAttribute('data-disabled', 'true');
        if (item.isPro && !isProItemAccessible) {
          menuItem.title = 'This feature is available in PRO tier';
        } else if (isSandboxRestricted) {
          menuItem.title = MESSAGES.notification.sandboxRestriction;
        } else if (isRawModeRestricted) {
          menuItem.title = MESSAGES.ui.notAvailableInRawMode;
        }
      }

      // Add PRO badge only to locked PRO-tier items
      const proBadge =
        item.isPro && !isProItemAccessible ? ' <span class="pro-badge">PRO</span>' : '';
      menuItem.innerHTML = `${item.icon}<span class="markview-menu-item-label">${item.label}${proBadge}</span>`;

      menuItem.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();

        // Check if item is disabled due to RAW mode
        if (isRawModeRestricted) {
          this.showNotification(MESSAGES.ui.notAvailableInRawMode, 'info');
          this.closeMenu();
          return;
        }

        // Check sandbox restriction first
        if (isSandboxRestricted) {
          this.showNotification(MESSAGES.notification.sandboxRestriction, 'info');
          this.closeMenu();
          return;
        }

        item.action();
        this.closeMenu();
      });

      if (this.menu) {
        this.menu.appendChild(menuItem);
      }
      this.menuItems.push(menuItem);
    });

    if (this.container && this.menu) {
      this.container.appendChild(this.menu);
    }
  }

  private setupListeners(): void {
    if (!this.mainButton) return;

    // Toggle menu on button click
    this.mainButton.addEventListener('click', async e => {
      e.stopPropagation();
      await this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', e => {
      if (this.isOpen && this.container && !this.container.contains(e.target as Node)) {
        this.closeMenu();
      }
    });
  }

  private async toggleMenu(): Promise<void> {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      await this.openMenu();
    }
  }

  private async openMenu(): Promise<void> {
    // Recreate menu with current font settings
    await this.createMenu();

    if (!this.menu) return;
    this.isOpen = true;
    this.menu.classList.add('menu-open');
  }

  private closeMenu(): void {
    if (!this.menu) return;
    this.isOpen = false;
    this.menu.classList.remove('menu-open');
  }

  private print(): void {
    logger.log('[ActionButtons] Triggering print dialog');
    window.print();
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Use centralized notification system
    const { showNotification } = require('@utils/notification');
    showNotification(message, type, 3000);
  }

  private toggleRawView(): void {
    // Dispatch event to trigger raw view toggle
    document.dispatchEvent(new CustomEvent('markview:toggleRawView'));
    this.closeMenu();
  }

  private async showQuickSettings(): Promise<void> {
    // Show quick settings modal
    const { showQuickSettingsModal } = await import('./quick-settings-modal');
    await showQuickSettingsModal();
    this.closeMenu();
  }

  private async showKeyboardHelp(): Promise<void> {
    // Show keyboard shortcuts help modal
    await showKeyboardShortcutsHelp();
    this.closeMenu();
  }

  private async showExtensionInfo(): Promise<void> {
    // Show extension info modal
    const { showExtensionInfoModal } = await import('./extension-info-modal');
    await showExtensionInfoModal();
    this.closeMenu();
  }

  /**
   * Update language for button and menu items
   * Recreates menu to ensure all labels (including PRO badges) are updated
   */
  private async updateLanguage(): Promise<void> {
    logger.log('[ActionButtons] Updating language');
    if (this.mainButton) {
      this.mainButton.title = MESSAGES.actions.title;
    }

    // Recreate menu if it exists to update all labels and badges with new language
    if (this.menu) {
      // Store current open state
      const wasOpen = this.isOpen;

      // Close and recreate menu with new language
      this.closeMenu();
      await this.createMenu();

      // Restore open state if it was open
      if (wasOpen) {
        this.menu?.classList.add('menu-open');
        this.isOpen = true;
      }
    }
  }

  public destroy(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}
