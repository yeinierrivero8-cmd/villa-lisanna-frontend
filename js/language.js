// Language Manager for Villa Lisanna
let currentLanguage = localStorage.getItem('language') || 'en';
let translations = {};

// Load translations
async function loadTranslations() {
  try {
    const response = await fetch('/lang/translations.json');
    translations = await response.json();
    applyLanguage(currentLanguage);
  } catch (error) {
    console.error('Error loading translations:', error);
  }
}

// Apply language to page
function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const text = getTranslation(key);

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.placeholder = text;
    } else {
      element.textContent = text;
    }
  });

  // Update all elements with data-i18n-html attribute
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    const text = getTranslation(key);
    element.innerHTML = text;
  });

  // Update language switcher
  const langSwitcher = document.getElementById('languageSwitcher');
  if (langSwitcher) {
    const buttons = langSwitcher.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      }
    });
  }

  // Update page direction if needed
  document.documentElement.lang = lang;
}

// Get translation by key (supports nested keys like "header.nav_inicio")
function getTranslation(key) {
  const keys = key.split('.');
  let value = translations[currentLanguage];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  return value || key;
}

// Setup language switcher
function setupLanguageSwitcher() {
  const langSwitcher = document.getElementById('languageSwitcher');
  if (!langSwitcher) return;

  const buttons = langSwitcher.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      applyLanguage(lang);
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();
  setupLanguageSwitcher();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getTranslation, applyLanguage, currentLanguage };
}
