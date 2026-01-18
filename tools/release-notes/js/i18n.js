window.translations = {};
window.currentLang = 'en';

function getNestedTranslation(obj, key) {
  return key.split('.').reduce((res, k) => (res && res[k] !== undefined ? res[k] : null), obj);
}

window.t = function(key) {
  return getNestedTranslation(window.translations, key) || key;
};

function setLanguage(lang) {
  window.currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = getNestedTranslation(window.translations, key) || key;
  });
}

function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  const shortLang = lang.split('-')[0];
  return ['en','nl','de','it','fr','es'].includes(shortLang) ? shortLang : 'en';
}

function loadTranslations(lang) {
  return fetch(`locales/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      window.translations = data;
      setLanguage(lang);
    })
    .catch(err => console.error("Error loading translations:", err));
}

const lang = detectBrowserLanguage();
window.i18nReady = loadTranslations(lang);