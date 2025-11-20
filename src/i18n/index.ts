import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import fr from './locales/fr/common.json';

const resources = {
  en: { common: en },
  fr: { common: fr },
};

function detectInitial() {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('wallet.lang.override');
    if (override && (override === 'fr' || override === 'en')) return override;
    const nav = navigator.language?.toLowerCase() || 'en';
    return nav.startsWith('fr') ? 'fr' : 'en';
  }
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitial(),
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;
