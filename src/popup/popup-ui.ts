/**
 * Popup UI Component
 * Handles rendering of dynamic UI elements in the popup
 */

export class PopupUI {
  /**
   * Create save notification element
   */
  static createSaveNotification(): HTMLElement {
    const div = document.createElement('div');
    div.id = 'save-notification';
    div.className = 'badge badge-success hidden';
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.zIndex = '1000';
    div.setAttribute('data-i18n', 'popup_settingsSaved');

    return div;
  }

  /**
   * Create confirm dialog element
   */
  static createConfirmDialog(): HTMLElement {
    const div = document.createElement('div');
    div.id = 'confirm-dialog';
    div.className = 'modal-overlay hidden';

    div.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-header">
          <svg class="icon-base mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 class="modal-title" data-i18n="popup_resetTitle"></h3>
        </div>
        <div class="modal-body">
          <p class="text-muted" data-i18n="popup_resetText"></p>
        </div>
        <div class="modal-footer">
          <button id="confirm-cancel" class="btn btn-secondary" data-i18n="popup_cancel"></button>
          <button id="confirm-reset" class="btn btn-primary" data-i18n="popup_reset"></button>
        </div>
      </div>
    `;

    return div;
  }

  /**
   * Create clear cache confirm dialog element
   */
  static createClearCacheDialog(): HTMLElement {
    const div = document.createElement('div');
    div.id = 'clear-cache-dialog';
    div.className = 'modal-overlay hidden';

    div.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-header">
          <svg class="icon-base mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 class="modal-title" data-i18n="popup_clearCacheTitle"></h3>
        </div>
        <div class="modal-body">
          <p class="text-muted" data-i18n="clearCacheHint"></p>
        </div>
        <div class="modal-footer">
          <button id="clear-cache-cancel" class="btn btn-secondary" data-i18n="popup_cancel"></button>
          <button id="clear-cache-confirm" class="btn btn-primary" data-i18n="popup_clearCache"></button>
        </div>
      </div>
    `;

    return div;
  }

  /**
   * Create clear history confirm dialog element
   */
  static createClearHistoryDialog(): HTMLElement {
    const div = document.createElement('div');
    div.id = 'clear-history-dialog';
    div.className = 'modal-overlay hidden';

    div.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-header">
          <svg class="icon-base mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 class="modal-title" data-i18n="recent_clearConfirm"></h3>
        </div>
        <div class="modal-body">
          <p class="text-muted" data-i18n="recent_clearConfirmMessage"></p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary clear-history-cancel" data-i18n="cancel"></button>
          <button class="btn btn-primary clear-history-confirm" data-i18n="recent_clearAll"></button>
        </div>
      </div>
    `;

    return div;
  }

}
