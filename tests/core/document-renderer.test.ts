import { describe, it, expect } from 'vitest';
import { extractFileNameFromUrl } from '@core/document-renderer';

describe('Document Renderer Module', () => {
  describe('extractFileNameFromUrl', () => {
    it('should extract filename from http URL', () => {
      const url = 'https://example.com/docs/README.md';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('README.md');
    });

    it('should extract filename from file:// URL', () => {
      const url = 'file:///home/user/documents/test.md';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('test.md');
    });

    it('should decode URL-encoded filename', () => {
      const url = 'https://example.com/docs/My%20Document.md';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('My Document.md');
    });

    it('should strip query parameters from filename', () => {
      const url = 'https://example.com/docs/README.md?version=1.0';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('README.md');
    });

    it('should handle URL ending with slash', () => {
      const url = 'https://example.com/docs/';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('docs');
    });

    it('should return null for empty pathname', () => {
      const url = 'https://example.com/';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBeNull();
    });

    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('not-a-valid-url');
    });

    it('should handle URLs with multiple slashes', () => {
      const url = 'https://example.com//docs//README.md';
      const filename = extractFileNameFromUrl(url);
      expect(filename).toBe('README.md');
    });
  });
});
