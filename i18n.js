/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Substitutes localised strings into [data-i18n] elements.
//
// Everything is assigned as textContent. A few upstream translations carry
// inline markup (<strong> in bodyP1, in all 54 languages); those are decoded to
// their text rather than assigned as HTML, so no string from a locale file ever
// reaches an innerHTML sink.
function localisedText(message) {
  if (!message.includes('<') && !message.includes('&')) return message;
  return new DOMParser().parseFromString(message, 'text/html').body.textContent;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const message = browser.i18n.getMessage(element.getAttribute('data-i18n'));
    if (!message) return;

    const text = localisedText(message);
    if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
      element.setAttribute('placeholder', text);
    } else {
      element.textContent = text;
    }
  });
});
