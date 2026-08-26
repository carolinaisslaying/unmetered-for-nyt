/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Blocks the requests that meter and gate articles on nytimes.com.

const blockedUrls = [
  '*://www.nytimes.com/svc/onsite-messaging/query*',
  '*://samizdat-graphql.nytimes.com/graphql/v2*',
  '*://www.nytimes.com/statsig/rgstr*',
  '*://meter-svc.nytimes.com/meter.js*'
];

// --- Synchronous state cache ---
// webRequest blocking handlers must decide synchronously, so the two pieces of
// state the handler consults are mirrored out of storage.
let _isEnabledCache = true;
let _hasNYTCookieCache = false;

function refreshCookieState() {
  return browser.cookies.get({ url: 'https://www.nytimes.com', name: 'nyt-s' })
    .then(cookie => { _hasNYTCookieCache = !!cookie; })
    .catch(() => { _hasNYTCookieCache = false; })
    .then(updateIcon);
}

function initializeState() {
  browser.storage.local.get(['isEnabled']).then(result => {
    if (result.isEnabled === undefined) {
      browser.storage.local.set({ isEnabled: true });
      _isEnabledCache = true;
    } else {
      _isEnabledCache = result.isEnabled;
    }
    return refreshCookieState();
  });
}

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.isEnabled) {
    _isEnabledCache = changes.isEnabled.newValue;
    updateIcon();
  }
});

browser.cookies.onChanged.addListener(changeInfo => {
  if (changeInfo.cookie.name === 'nyt-s' && changeInfo.cookie.domain.includes('nytimes.com')) {
    _hasNYTCookieCache = !changeInfo.removed;
    updateIcon();
  }
});

initializeState();

// --- Messaging ---
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    _isEnabledCache = !_isEnabledCache;
    browser.storage.local.set({ isEnabled: _isEnabledCache });
    sendResponse({ isEnabled: _isEnabledCache, hasCookie: _hasNYTCookieCache });
  } else if (request.action === 'getStatus') {
    sendResponse({ isEnabled: _isEnabledCache, hasCookie: _hasNYTCookieCache });
  }
});

// --- Toolbar badge ---
function updateIcon() {
  if (!_isEnabledCache) {
    browser.browserAction.setBadgeText({ text: 'OFF' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#888888' });
    browser.browserAction.setTitle({ title: 'Unmetered for NYT — disabled' });
    return;
  }

  if (_hasNYTCookieCache) {
    browser.browserAction.setBadgeText({ text: 'NYT' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#000000' });
    browser.browserAction.setTitle({ title: 'Signed in to the NYT — standing down' });
    return;
  }

  browser.browserAction.setBadgeText({ text: 'ON' });
  browser.browserAction.setBadgeBackgroundColor({ color: '#2196F3' });
  browser.browserAction.setTitle({ title: 'Unmetered for NYT — active' });
}

// --- Blocking ---
browser.webRequest.onBeforeRequest.addListener(
  () => {
    // Stand down when switched off, or when the reader has a real NYT session
    // and does not need us interfering with a subscription they pay for.
    if (!_isEnabledCache || _hasNYTCookieCache) return {};
    return { cancel: true };
  },
  { urls: blockedUrls },
  ['blocking']
);

browser.runtime.onInstalled.addListener(details => {
  browser.storage.local.set({ isEnabled: true });
  _isEnabledCache = true;
  updateIcon();
  if (details.reason === 'install') {
    browser.tabs.create({ url: 'welcome.html' });
  }
});
