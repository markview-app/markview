// MarkView Popup Script
// Import design system styles
import { logger } from '@utils/logger';
import { getExtensionManagementUrl } from '@utils/browser-detection';
import '../styles/components.css';
import '../styles/tokens.css';
import '../styles/utilities.css';

// Import popup-specific styles
import { applyTranslations, initI18n } from '@utils/i18n';
import { SettingsTab } from './settings-tab';
import { RecentTab } from './recent-tab';
import './popup-utilities.css'; // Shared popup utilities
import './popup.css';
import './recent-tab.css';
import './settings-tab.css';

logger.log('MarkView: Popup script loaded');

// Check if file URL permission is granted
async function checkFileUrlPermission(): Promise<boolean> {
  return new Promise(resolve => {
    if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
      chrome.extension.isAllowedFileSchemeAccess(isAllowed => {
        resolve(isAllowed);
      });
    } else {
      // Fallback: assume allowed if API not available
      resolve(true);
    }
  });
}

// Tab instances
let settingsTab: SettingsTab | null = null;
let recentTab: RecentTab | null = null;

// Initialize popup
async function init(): Promise<void> {
  logger.log('Initializing popup...');

  await initI18n();
  applyTranslations();

  // Set version from manifest
  const manifest = chrome.runtime.getManifest();
  const versionElement = document.querySelector('.header-version');
  if (versionElement) {
    versionElement.textContent = `Version ${manifest.version}`;
  }

  // Initialize tab components
  const settingsContainer = document.getElementById('tab-settings');
  const recentContainer = document.getElementById('tab-recent');

  if (settingsContainer) {
    settingsTab = new SettingsTab(settingsContainer);
    await settingsTab.initialize();
  }

  if (recentContainer) {
    recentTab = new RecentTab(recentContainer);
    await recentTab.initialize();
  }

  setupTabNavigation();

  // Check file URL permission and show permission tab if not granted
  const hasPermission = await checkFileUrlPermission();
  logger.log('File URL permission:', hasPermission);

  if (!hasPermission) {
    // Show permission tab and make it active
    const permissionTab = document.getElementById('permission-tab-btn');
    const permissionPanel = document.getElementById('tab-permission');
    const recentTabBtn = document.querySelector('[data-tab="recent"]');
    const recentPanel = document.getElementById('tab-recent');

    if (permissionTab && permissionPanel && recentTabBtn && recentPanel) {
      // Show and activate permission tab
      permissionTab.classList.remove('hidden');
      permissionTab.classList.add('active');
      permissionPanel.style.display = 'block';

      // Deactivate recent tab
      recentTabBtn.classList.remove('active');
      recentPanel.style.display = 'none';

      // Update extension management URL in the permission instructions
      const extensionUrlElement = document.getElementById('extension-management-url');
      if (extensionUrlElement) {
        extensionUrlElement.textContent = getExtensionManagementUrl();
      }

      // Setup button click handler
      const settingsBtn = document.getElementById('open-extension-settings-tab');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: getExtensionManagementUrl() });
        });
      }
    }
  }

  logger.log('Popup initialized');
}

// Tab Navigation
function setupTabNavigation(): void {
  const tabs = document.querySelectorAll('.popup-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update tab active states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update panel visibility
      panels.forEach(panel => {
        panel.classList.remove('active');
        (panel as HTMLElement).style.display = 'none';
      });

      const targetPanel = document.getElementById(`tab-${targetTab}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.style.display = 'block';
      }

      // Load recent files when switching to recent tab
      if (targetTab === 'recent' && recentTab) {
        recentTab.loadRecentFiles();
      }
    });
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
