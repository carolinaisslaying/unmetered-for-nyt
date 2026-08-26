/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-button');
  const statusText = document.getElementById('status-text');
  const statusSub = document.getElementById('status-sub');

  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  const msg = key => browser.i18n.getMessage(key);

  function render(response) {
    if (!response) return;
    const on = response.isEnabled !== false;

    toggle.textContent = on ? msg('btnOn') : msg('btnOff');
    toggle.classList.toggle('active', on);
    toggle.setAttribute('aria-pressed', String(on));

    if (response.hasCookie) {
      statusText.textContent = msg('statusSignedIn');
      statusSub.textContent = msg('statusSignedInSub');
    } else {
      statusText.textContent = on ? msg('statusActive') : msg('statusDisabled');
      statusSub.textContent = on ? msg('statusSub') : msg('statusDisabledSub');
    }
  }

  toggle.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'toggle' }).then(render);
  });

  // The welcome page is an extension page; open it as a real tab rather than
  // navigating the popup, which would just close it.
  document.getElementById('note-link').addEventListener('click', event => {
    event.preventDefault();
    browser.tabs.create({ url: browser.runtime.getURL('welcome.html') });
    window.close();
  });

  browser.runtime.sendMessage({ action: 'getStatus' }).then(render);
});
