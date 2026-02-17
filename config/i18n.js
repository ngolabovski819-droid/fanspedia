/**
 * i18n - Lightweight vanilla JS translation system
 * No dependencies, works with static HTML
 */

let translations = {};
let currentLanguage = 'en';
const supportedLanguages = ['en', 'es'];
const defaultLanguage = 'en';

/**
 * Initialize i18n - load all language files
 */
async function initI18n() {
  try {
    // Load EN
    const enRes = await fetch('/config/translations/en.json?v=20260217-1');
    translations.en = await enRes.json();
    
    // Load ES
    const esRes = await fetch('/config/translations/es.json?v=20260217-1');
    translations.es = await esRes.json();
    
    // Load saved language preference from localStorage
    currentLanguage = localStorage.getItem('fanspedia_lang') || defaultLanguage;
    
    console.log('[i18n] Initialized. Supported: ' + supportedLanguages.join(', ') + ', Current: ' + currentLanguage);
  } catch (err) {
    console.error('[i18n] Failed to load translations:', err);
    translations = { en: {}, es: {} };
  }
}

/**
 * Translate a key
 * @param {string} key - Translation key
 * @param {string} lang - Language (optional, uses current)
 * @returns {string} Translated string or key if not found
 */
function t(key, lang = null) {
  const targetLang = lang || currentLanguage;
  
  // Try target language
  if (translations[targetLang] && translations[targetLang][key]) {
    return translations[targetLang][key];
  }
  
  // Fallback to English
  if (translations.en && translations.en[key]) {
    return translations.en[key];
  }
  
  // Return key as last resort
  console.warn(`[i18n] Missing translation: ${key} (${targetLang})`);
  return key;
}

/**
 * Get current language
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set language and save to localStorage
 */
function setLanguage(lang) {
  if (supportedLanguages.includes(lang)) {
    currentLanguage = lang;
    localStorage.setItem('fanspedia_lang', lang);
    return true;
  }
  return false;
}

/**
 * Apply translations to all elements with data-i18n-key
 */
function applyTranslations() {
  const lang = getCurrentLanguage();
  
  // Translate text content
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.dataset.i18nKey;
    el.textContent = t(key, lang);
  });
  
  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key, lang);
  });
  
  // Translate alt text
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.dataset.i18nAlt;
    el.alt = t(key, lang);
  });
  
  // Translate title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key, lang);
  });
  
  // Set HTML lang attribute
  document.documentElement.lang = lang;
  
  // Set direction for RTL languages (if needed)
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
}

/**
 * Toggle language (EN <-> ES)
 */
function toggleLanguage() {
  const newLang = currentLanguage === 'en' ? 'es' : 'en';
  setLanguage(newLang);
  applyTranslations();
  return newLang;
}

/**
 * Export for use in pages
 */
window.i18n = {
  init: initI18n,
  t,
  getCurrentLanguage,
  setLanguage,
  applyTranslations,
  toggleLanguage,
  supportedLanguages,
  defaultLanguage
};

// Initialize but DO NOT auto-apply translations
// This allows toggleLanguage() to work, but respects the page's language
// based on URL structure (/en/ vs /es/)
initI18n().catch(err => {
  console.error('[i18n] Initialization failed:', err);
});
