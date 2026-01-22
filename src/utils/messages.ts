import { getMessage } from './i18n';

export const MESSAGES = {
  notification: {
    get noMarkdownFound() {
      return getMessage('notification_noMarkdownFound');
    },
    get renderFailed() {
      return getMessage('notification_renderFailed');
    },
    get loadedSuccess() {
      return getMessage('notification_loadedSuccess');
    },
    get loadedWithFilename() {
      return getMessage('notification_loadedWithFilename');
    },
    get renderError() {
      return getMessage('notification_renderError');
    },
    get contentUpdated() {
      return getMessage('notification_contentUpdated');
    },
    get autoRefreshUnavailable() {
      return getMessage('notification_autoRefreshUnavailable');
    },
    get autoRefreshPaused() {
      return getMessage('notification_autoRefreshPaused');
    },
    get extensionUpdated() {
      return getMessage('notification_extensionUpdated');
    },
    get sandboxRestriction() {
      return getMessage('notification_sandboxRestriction');
    },
  },
  ui: {
    get toggleRaw() {
      return getMessage('ui_toggleRaw');
    },
    get rawView() {
      return getMessage('ui_rawView');
    },
    get renderedView() {
      return getMessage('ui_renderedView');
    },
    get scrollTopTitle() {
      return getMessage('ui_scrollTopTitle');
    },
    get scrolledTop() {
      return getMessage('ui_scrolledTop');
    },
    get notAvailableInRawMode() {
      return getMessage('notAvailableInRawMode');
    },
  },
  popup: {
    get settingsSaved() {
      return getMessage('popup_settingsSaved');
    },
    get resetTitle() {
      return getMessage('popup_resetTitle');
    },
    get resetText() {
      return getMessage('popup_resetText');
    },
    get cancel() {
      return getMessage('popup_cancel');
    },
    get reset() {
      return getMessage('popup_reset');
    },
  },
  toc: {
    get title() {
      return getMessage('toc_title');
    },
    get close() {
      return getMessage('toc_close');
    },
    get noHeadings() {
      return getMessage('toc_noHeadings');
    },
    get rawModeTitle() {
      return getMessage('toc_rawModeTitle');
    },
    get rawModeMessage() {
      return getMessage('toc_rawModeMessage');
    },
    get toggleButtonTitle() {
      return getMessage('toc_toggleButtonTitle');
    },
  },
  theme: {
    get toggleButtonTitle() {
      return getMessage('theme_toggleButtonTitle');
    },
    get light() {
      return getMessage('theme_light');
    },
    get dark() {
      return getMessage('theme_dark');
    },
    get auto() {
      return getMessage('theme_auto');
    },
  },
  centered: {
    get toggleButtonTitle() {
      return getMessage('centered_toggleButtonTitle');
    },
    get centered() {
      return getMessage('centered_centered');
    },
    get fullWidth() {
      return getMessage('centered_fullWidth');
    },
  },
  actions: {
    get title() {
      return getMessage('actions');
    },
    get print() {
      return getMessage('print');
    },
    get keyboardShortcuts() {
      return getMessage('actions_keyboardShortcuts');
    },
    get quickSettings() {
      return getMessage('actions_quickSettings');
    },
    get quickSettingsSubtitle() {
      return getMessage('actions_quickSettingsSubtitle');
    },
    get extensionInfo() {
      return getMessage('actions_extensionInfo');
    },
  },
  keyboardHelp: {
    get title() {
      return getMessage('keyboardHelp_title');
    },
    get subtitle() {
      return getMessage('keyboardHelp_subtitle');
    },
    get viewToggles() {
      return getMessage('keyboardHelp_viewToggles');
    },
    get toggleTheme() {
      return getMessage('keyboardHelp_toggleTheme');
    },
    get toggleRaw() {
      return getMessage('keyboardHelp_toggleRaw');
    },
    get toggleLayout() {
      return getMessage('keyboardHelp_toggleLayout');
    },
    get toggleToc() {
      return getMessage('keyboardHelp_toggleToc');
    },
    get openQuickSettings() {
      return getMessage('keyboardHelp_openQuickSettings');
    },
    get navigation() {
      return getMessage('keyboardHelp_navigation');
    },
    get scrollTop() {
      return getMessage('keyboardHelp_scrollTop');
    },
    get closeModal() {
      return getMessage('keyboardHelp_closeModal');
    },
    get imageGallery() {
      return getMessage('keyboardHelp_imageGallery');
    },
    get previousImage() {
      return getMessage('keyboardHelp_previousImage');
    },
    get nextImage() {
      return getMessage('keyboardHelp_nextImage');
    },
    get closeViewer() {
      return getMessage('keyboardHelp_closeViewer');
    },
    get macNote() {
      return getMessage('keyboardHelp_macNote');
    },
    get windowsNote() {
      return getMessage('keyboardHelp_windowsNote');
    },
  },
  common: {
    get close() {
      return getMessage('common_close');
    },
    get cancel() {
      return getMessage('common_cancel');
    },
    get confirm() {
      return getMessage('common_confirm');
    },
  },
  extensionInfo: {
    get quickLinks() {
      return getMessage('extensionInfo_quickLinks');
    },
    get about() {
      return getMessage('extensionInfo_about');
    },
    get description() {
      return getMessage('extensionInfo_description');
    },
    get website() {
      return getMessage('extensionInfo_website');
    },
    get rateExtension() {
      return getMessage('extensionInfo_rateExtension');
    },
    get madeWith() {
      return getMessage('extensionInfo_madeWith');
    },
    get forDevelopers() {
      return getMessage('extensionInfo_forDevelopers');
    },
    get allRightsReserved() {
      return getMessage('extensionInfo_allRightsReserved');
    },
  },
  get appDescription() {
    return getMessage('appDescription');
  },
  get watchDemo() {
    return getMessage('watchDemo');
  },
  get whatsNew() {
    return getMessage('whatsNew');
  },
  get reportIssue() {
    return getMessage('reportIssue');
  },
  quickSettings: {
    get resetDefaults() {
      return getMessage('resetToDefaults');
    },
  },
  settings: {
    get autoRefresh() {
      return getMessage('autoRefresh');
    },
    get autoRefreshDescription() {
      return getMessage('autoRefreshDescription');
    },
    get codeBlockDisplay() {
      return getMessage('codeBlockDisplay');
    },
    get codeBlockDisplayDescription() {
      return getMessage('codeBlockDisplayDescription');
    },
    get codeBlockDisplayScroll() {
      return getMessage('codeBlockDisplayScroll');
    },
    get codeBlockDisplayWrap() {
      return getMessage('codeBlockDisplayWrap');
    },
    get fontFamily() {
      return getMessage('fontFamily');
    },
    get fontDefault() {
      return getMessage('fontDefault');
    },
    get language() {
      return getMessage('language');
    },
  },
};
