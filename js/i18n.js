// Internationalization (i18n) System for Villa Lisanna

class I18n {
  constructor(translations) {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.translations = translations || {};
    this.init();
  }

  init() {
    this.applyLanguage(this.currentLanguage);
    this.setupLanguageSwitcher();
  }

  applyLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language ${lang} not found, falling back to English`);
      lang = 'en';
    }

    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;

    // Apply translations to all elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.getTranslation(key, lang);

      if (text) {
        // For elements with child elements (like buttons with icons), preserve HTML
        if (element.children.length > 0) {
          // Get the first child (usually an icon) and preserve it
          const firstChild = element.firstChild;
          if (firstChild.nodeType === Node.ELEMENT_NODE) {
            element.innerHTML = '';
            element.appendChild(firstChild.cloneNode(true));
            element.appendChild(document.createTextNode(' ' + text));
          } else {
            // Text node or mixed content
            let html = element.innerHTML;
            const iconRegex = /<i[^>]*><\/i>/;
            const icon = html.match(iconRegex)?.[0] || '';
            if (icon) {
              element.innerHTML = icon + ' ' + text;
            } else {
              element.textContent = text;
            }
          }
        } else {
          // Plain text element
          element.textContent = text;
        }
      }
    });

    // Update language switcher buttons
    this.updateLanguageSwitcher(lang);
  }

  getTranslation(key, lang) {
    const keys = key.split('.');
    let translation = this.translations[lang];

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        console.warn(`Translation key not found: ${key} (${lang})`);
        return key; // Return the key itself if translation not found
      }
    }

    return translation || key;
  }

  setupLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const lang = button.getAttribute('data-lang');
        this.applyLanguage(lang);
      });
    });
  }

  updateLanguageSwitcher(lang) {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
      if (button.getAttribute('data-lang') === lang) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  t(key) {
    return this.getTranslation(key, this.currentLanguage);
  }
}

// Initialize i18n when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n(window.translations);
  });
} else {
  window.i18n = new I18n(window.translations);
}
