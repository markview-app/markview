import en from '../_locales/en/messages.json';
import vi from '../_locales/vi/messages.json';
import ja from '../_locales/ja/messages.json';
import ko from '../_locales/ko/messages.json';
import zh_CN from '../_locales/zh_CN/messages.json';
import zh_TW from '../_locales/zh_TW/messages.json';
import es from '../_locales/es/messages.json';
import fr from '../_locales/fr/messages.json';
import pt_BR from '../_locales/pt_BR/messages.json';
import id from '../_locales/id/messages.json';
import de from '../_locales/de/messages.json';
import ru from '../_locales/ru/messages.json';

export type LocaleMessages = typeof en;

export const LOCALES = {
  en,
  vi,
  ja,
  ko,
  zh_CN,
  zh_TW,
  es,
  fr,
  pt_BR,
  id,
  de,
  ru,
} as const;

export type LocaleKey = keyof typeof LOCALES;

export const LOCALE_NAMES: Record<string, string> = {
  auto: 'Auto (Browser Default)',
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
  ko: '한국어',
  zh_CN: '简体中文',
  zh_TW: '繁體中文',
  es: 'Español',
  fr: 'Français',
  pt_BR: 'Português (Brasil)',
  id: 'Bahasa Indonesia',
  de: 'Deutsch',
  ru: 'Русский',
};
