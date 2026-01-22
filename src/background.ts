// MarkView Background Service Worker
// Handles messages between popup, content scripts, and storage

import { logger } from '@utils/logger';

logger.log('MarkView: Background service worker started');

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.log('MarkView: Received message:', message);

  // Handle different message types
  switch (message.action) {
    case 'fetch':
      handleFetchMessage(message, sender, sendResponse);
      return true; // Indicates async response

    case 'fetchImage':
      handleImageFetchMessage(message, sendResponse);
      return true; // Indicates async response

    case 'openTab':
      handleOpenTabMessage(message, sendResponse);
      return true; // Indicates async response

    default:
      logger.warn('MarkView: Unknown message action:', message.action);
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

// Handle image fetch messages (for bypassing CORS/CSP restrictions)
async function handleImageFetchMessage(
  message: { url: string },
  sendResponse: (response?: any) => void
): Promise<void> {
  try {
    const { url } = message;
    if (!url) {
      logger.error('[MarkView Background] No URL provided for image fetch');
      sendResponse({ error: 'No URL provided' });
      return;
    }

    logger.log('[MarkView Background] Fetching image:', url);

    // Fetch the image - background script bypasses CORS!
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
    });

    if (!response.ok) {
      logger.error(
        '[MarkView Background] Image fetch failed:',
        response.status,
        response.statusText
      );
      sendResponse({
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
      return;
    }

    // Get content type from header
    const contentType = response.headers.get('content-type') || 'image/png';

    // Convert to array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert to base64 for message passing
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);

    logger.log('[MarkView Background] Image fetched successfully, size:', arrayBuffer.byteLength);
    sendResponse({
      success: true,
      data: base64,
      contentType: contentType,
    });
  } catch (error) {
    logger.error('[MarkView Background] Image fetch error:', error);
    sendResponse({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Handle fetch messages for auto-refresh
async function handleFetchMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<void> {
  try {
    const url = message.url || sender.url;
    if (!url) {
      logger.error('[MarkView Background] No URL provided for fetch');
      sendResponse({ error: 'No URL provided' });
      return;
    }

    logger.log('[MarkView Background] Fetching URL:', url);

    // Fetch the file with no-cache headers to get latest version
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      logger.error('[MarkView Background] Fetch failed:', response.status, response.statusText);
      sendResponse({
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
      return;
    }

    const htmlContent = await response.text();

    // Return the raw content
    // The content script will handle extraction if needed
    logger.log('[MarkView Background] Fetched content, length:', htmlContent.length);
    sendResponse({
      success: true,
      content: htmlContent,
      url: url,
    });
  } catch (error) {
    logger.error('[MarkView Background] Fetch error:', error);
    sendResponse({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Handle opening new tabs (for sandboxed contexts where window.open is blocked)
async function handleOpenTabMessage(
  message: { url: string },
  sendResponse: (response?: any) => void
): Promise<void> {
  try {
    const { url } = message;

    if (!url) {
      logger.error('[MarkView Background] Missing URL for openTab');
      sendResponse({ error: 'Missing required URL parameter' });
      return;
    }

    logger.log('[MarkView Background] Opening new tab:', url);

    // Use chrome.tabs API (only available in background/service worker)
    chrome.tabs.create({ url }, tab => {
      if (chrome.runtime.lastError) {
        logger.error('[MarkView Background] Failed to open tab:', chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        logger.log('[MarkView Background] Tab opened successfully:', {
          tabId: tab.id,
          url,
        });
        sendResponse({
          success: true,
          tabId: tab.id,
          url,
        });
      }
    });
  } catch (error) {
    logger.error('[MarkView Background] Error opening tab:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

logger.log('MarkView: Background service worker initialized');
