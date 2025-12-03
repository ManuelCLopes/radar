import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/common.json';
import ptTranslation from './locales/pt/common.json';
import esTranslation from './locales/es/common.json';
import frTranslation from './locales/fr/common.json';
import deTranslation from './locales/de/common.json';

const resources = {
  en: { translation: enTranslation },
  pt: { translation: ptTranslation },
  es: { translation: esTranslation },
  fr: { translation: frTranslation },
  de: { translation: deTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
// Force re-bundle of translations
