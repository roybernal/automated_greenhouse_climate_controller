import { translations } from './translations.js';

export function initLanguage() {
    const savedLang = localStorage.getItem('appLang') || 'en';
    const selector = document.getElementById('language-selector');
    
    if (selector) {
        selector.value = savedLang;
        
        selector.addEventListener('change', (e) => {
            const newLang = e.target.value;
            localStorage.setItem('appLang', newLang);
            // 1. Aplicamos cambios (por si acaso)
            applyLanguage(newLang);
            // 2. ¡RECARGAMOS LA PÁGINA! (Esto arregla plantas.js y scripts)
            location.reload(); 
        });
    }

    applyLanguage(savedLang);
}

export function applyLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (t[key]) {
            if (elem.tagName === 'INPUT') elem.placeholder = t[key];
            else elem.innerText = t[key];
        }
    });
}

export function getText(key) {
    const lang = localStorage.getItem('appLang') || 'en';
    return translations[lang][key] || key;
}