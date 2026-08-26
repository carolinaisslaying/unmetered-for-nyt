document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = browser.i18n.getMessage(key);
    if (message) {
      if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
        element.setAttribute('placeholder', message);
      } else {
        element.innerHTML = message;
      }
    }
  });
});
