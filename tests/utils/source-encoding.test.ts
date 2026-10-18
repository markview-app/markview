/**
 * Tests for recoverUtf8FromLegacyDecode (markview-app/support#59): a UTF-8 markdown file served without a charset is decoded by
 * the browser with the locale's legacy encoding; MarkView reverses that decode when it can do so losslessly and
 * leaves genuine legacy text alone.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

vi.mock('@utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { logger } from '@utils/logger';
import { recoverUtf8FromLegacyDecode } from '@utils/source-encoding';

/**
 * WHATWG windows-1252 for bytes 0x80–0x9F. Node (seen on 22.13) decodes windows-1252 as latin1, mapping these bytes
 * to C1 controls, while Chrome follows the WHATWG table: 0x9F is `Ÿ`, which is why the reporter saw `ðŸ›‘`. The
 * decoder below gives the tests the browser's behavior; every other label goes to Node's decoder unchanged.
 */
const WINDOWS_1252_C1 = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x008d, 0x017d, 0x008f, 0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];
const NodeTextDecoder = globalThis.TextDecoder;

class BrowserTextDecoder extends NodeTextDecoder {
  decode(input?: AllowSharedBufferSource, options?: TextDecodeOptions): string {
    // ArrayBuffer.isView, not instanceof: under jsdom, TextEncoder's Uint8Array comes from another realm.
    if (this.encoding !== 'windows-1252' || !ArrayBuffer.isView(input)) {
      return super.decode(input, options);
    }
    const bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    return Array.from(bytes, byte =>
      String.fromCharCode(byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_C1[byte - 0x80]! : byte)
    ).join('');
  }
}

/** What the browser puts in the page: the UTF-8 bytes of `text`, decoded with `characterSet`. */
function asBrowserDecoded(text: string, characterSet: string): string {
  return new TextDecoder(characterSet).decode(new TextEncoder().encode(text));
}

/** Bytes of a genuinely legacy-encoded document, built from the encoding's own decoder (TextEncoder is UTF-8 only). */
function legacyBytes(text: string, characterSet: string): Uint8Array {
  const decoder = new TextDecoder(characterSet);
  const byteForCharacter = new Map<string, number>();
  for (let byte = 0; byte < 256; byte++) {
    byteForCharacter.set(decoder.decode(Uint8Array.of(byte)), byte);
  }
  return Uint8Array.from([...text].map(character => byteForCharacter.get(character)!));
}

describe('recoverUtf8FromLegacyDecode', () => {
  beforeAll(() => {
    vi.stubGlobal('TextDecoder', BrowserTextDecoder);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.mocked(logger.warn).mockClear();
  });

  describe('recovers UTF-8 the browser decoded with a legacy encoding', () => {
    it("should recover the reporter's heading from windows-1252 (markview-app/support#59)", () => {
      const heading = '## 🛑 1. The Incident Context';
      const mojibake = asBrowserDecoded(heading, 'windows-1252');
      expect(mojibake).toBe('## ðŸ›‘ 1. The Incident Context');

      expect(recoverUtf8FromLegacyDecode(mojibake, 'windows-1252')).toBe(heading);
    });

    it('should keep the variation selector of an emoji presentation sequence', () => {
      const heading = '## 🛠️ 2. Resolution';
      const recovered = recoverUtf8FromLegacyDecode(
        asBrowserDecoded(heading, 'windows-1252'),
        'windows-1252'
      );
      expect(recovered).toBe(heading);
      expect(recovered).toContain('️');
    });

    it('should recover two-byte Latin text', () => {
      expect(recoverUtf8FromLegacyDecode('A cafÃ© on the corner.', 'windows-1252')).toBe(
        'A café on the corner.'
      );
    });

    it.each([
      ['windows-1258', 'Tiếng Việt có dấu 📆'],
      ['windows-1251', 'Привет, мир 🛑'],
      ['windows-1256', 'مرحبا بالعالم'],
      ['iso-8859-2', 'Zażółć gęślą jaźń'],
    ])('should recover from %s, another locale default', (characterSet, text) => {
      const mojibake = asBrowserDecoded(text, characterSet);
      expect(mojibake).not.toBe(text);
      expect(recoverUtf8FromLegacyDecode(mojibake, characterSet)).toBe(text);
    });

    it('should recover a large, mostly ASCII document', () => {
      const text = `${'Plain ASCII paragraph.\n'.repeat(100_000)}## 🛑 End\n`;
      expect(
        recoverUtf8FromLegacyDecode(asBrowserDecoded(text, 'windows-1252'), 'windows-1252')
      ).toBe(text);
    });
  });

  describe('leaves the text alone when no recovery applies', () => {
    it('should keep a genuine windows-1252 document, which is not valid UTF-8', () => {
      const legacy = new TextDecoder('windows-1252').decode(
        legacyBytes('café crème brûlée', 'windows-1252')
      );
      expect(legacy).toBe('café crème brûlée');

      expect(recoverUtf8FromLegacyDecode(legacy, 'windows-1252')).toBeNull();
    });

    it('should return null for ASCII text', () => {
      expect(recoverUtf8FromLegacyDecode('# Plain ASCII\n\nText.', 'windows-1252')).toBeNull();
    });

    it.each(['UTF-8', 'utf-8', 'UTF-16LE', 'UTF-16BE'])(
      'should return null when the browser already decoded as %s',
      characterSet => {
        expect(recoverUtf8FromLegacyDecode('## 🛑 Heading', characterSet)).toBeNull();
      }
    );

    it.each(['windows-1255', 'windows-1253', 'Shift_JIS', 'GBK'])(
      'should return null for %s, whose decode cannot be reversed losslessly',
      characterSet => {
        const mojibake = asBrowserDecoded('## 🛑 Heading', characterSet);
        expect(recoverUtf8FromLegacyDecode(mojibake, characterSet)).toBeNull();
      }
    );

    it('should return null when the text holds a character the encoding cannot produce', () => {
      expect(recoverUtf8FromLegacyDecode('ðŸ›‘ � heading', 'windows-1252')).toBeNull();
      expect(recoverUtf8FromLegacyDecode('ðŸ›‘ \uD800 heading', 'windows-1252')).toBeNull();
    });

    it('should return null and warn for a character set TextDecoder does not know', () => {
      expect(recoverUtf8FromLegacyDecode('ðŸ›‘ heading', 'x-not-an-encoding')).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('x-not-an-encoding'));
    });
  });
});
