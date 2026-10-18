// MarkView Source Encoding
// Recovers UTF-8 markdown that the browser decoded with a legacy encoding.
import { logger } from '@utils/logger';

/**
 * Encodings the browser already decoded correctly for markdown: the source is Unicode text as-is.
 * `document.characterSet` reports these as 'UTF-8', 'UTF-16LE' and 'UTF-16BE'.
 */
const UNICODE_CHARACTER_SET = /^utf-(8|16)/i;

const BYTE_VALUES = 256;
const FIRST_NON_ASCII_CODE_UNIT = 0x80;
const REPLACEMENT_CHARACTER = '�';

/**
 * Undo the browser's legacy decode of a UTF-8 document and return the real text.
 *
 * A server that sends a markdown file as `text/plain` with no `charset` (and no BOM) makes Chromium decode it with
 * the locale's legacy encoding: `windows-1252` for English, `windows-1258` for Vietnamese, and so on. Each byte of a
 * multi-byte UTF-8 sequence becomes one character, so `🛑` (F0 9F 9B 91) reaches the page as `ðŸ›‘`
 * (markview-app/support#59).
 *
 * For a single-byte encoding whose decoder maps the 256 bytes to 256 distinct characters, that decode is
 * reversible: map each character back to its byte, then decode the bytes as UTF-8. Two guards keep genuine legacy
 * text untouched:
 * - the encoding must be such a bijection (multi-byte encodings and those with undefined bytes, such as
 *   `windows-1255` or `Shift_JIS`, lost information and are left alone);
 * - the recovered bytes must be valid UTF-8 under a strict decode. Real `windows-1252` prose almost never is:
 *   `é` followed by a space is the byte pair E9 20, an invalid UTF-8 sequence.
 *
 * @param text - The source text as the browser decoded it
 * @param characterSet - The encoding the browser used (`document.characterSet`)
 * @returns The recovered UTF-8 text, or null when no recovery applies and `text` should be used as-is
 */
export function recoverUtf8FromLegacyDecode(text: string, characterSet: string): string | null {
  if (UNICODE_CHARACTER_SET.test(characterSet)) {
    return null;
  }
  // ASCII is identical in every single-byte encoding the browser supports; there is nothing to recover.
  if (!containsNonAscii(text)) {
    return null;
  }

  const byteForCodeUnit = buildReverseTable(characterSet);
  if (!byteForCodeUnit) {
    return null;
  }

  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index++) {
    const byte = byteForCodeUnit.get(text.charCodeAt(index));
    // A character the encoding cannot produce (a surrogate, or the U+FFFD the HTML parser puts in place of NUL)
    // means the text is not a plain decode of bytes in this encoding.
    if (byte === undefined) {
      return null;
    }
    bytes[index] = byte;
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof TypeError) {
      // Not valid UTF-8: the document really is in the legacy encoding the browser used.
      return null;
    }
    throw error;
  }
}

function containsNonAscii(text: string): boolean {
  for (let index = 0; index < text.length; index++) {
    if (text.charCodeAt(index) >= FIRST_NON_ASCII_CODE_UNIT) {
      return true;
    }
  }
  return false;
}

/**
 * Map each character the encoding decodes a single byte to back to that byte, or return null when the encoding is
 * not a byte-to-character bijection and its decode therefore cannot be reversed.
 */
function buildReverseTable(characterSet: string): Map<number, number> | null {
  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(characterSet);
  } catch (error) {
    if (error instanceof RangeError) {
      logger.warn(
        `[SourceEncoding] The browser reported character set "${characterSet}", which TextDecoder does not ` +
          'support; keeping the source as decoded'
      );
      return null;
    }
    throw error;
  }

  const byteForCodeUnit = new Map<number, number>();
  for (let byte = 0; byte < BYTE_VALUES; byte++) {
    const decoded = decoder.decode(Uint8Array.of(byte));
    if (decoded.length !== 1 || decoded === REPLACEMENT_CHARACTER) {
      return null;
    }
    const codeUnit = decoded.charCodeAt(0);
    if (byteForCodeUnit.has(codeUnit)) {
      return null;
    }
    byteForCodeUnit.set(codeUnit, byte);
  }
  return byteForCodeUnit;
}
