// Background script to block specific New York Times requests

// URLs to block
const blockedUrls = [
  '*://www.nytimes.com/svc/onsite-messaging/query*',
  '*://samizdat-graphql.nytimes.com/graphql/v2*',
  '*://www.nytimes.com/statsig/rgstr*',
  '*://meter-svc.nytimes.com/meter.js*'
];

const FREE_ARTICLE_LIMIT = 10; // Free articles per day

// --- Synchronous State Cache ---
// We need synchronous access to state for webRequest blocking
let _isEnabledCache = true;
let _isPremiumCache = false;
let _isLimitReachedCache = false;
let _hasNYTCookieCache = false;

// --- Initialization ---
function initializeState() {
  browser.storage.local.get([
    'isEnabled',
    'premium',
    'dailyArticleCount',
    'lastResetDate',
    'installTime'
  ]).then(function (result) {
    if (result.isEnabled === undefined) {
      browser.storage.local.set({ isEnabled: true });
      _isEnabledCache = true;
    } else {
      _isEnabledCache = result.isEnabled;
    }

    _isPremiumCache = !!result.premium;

    // Evaluate limit state on boot
    evaluateLimitState(result);

    // Initial cookie check
    browser.cookies.get({ url: 'https://www.nytimes.com', name: 'nyt-s' }).then(cookie => {
      _hasNYTCookieCache = !!cookie;
      updateIcon();
    }).catch(() => {
      _hasNYTCookieCache = false;
      updateIcon();
    });
  });
}

// Keep cache in sync with storage changes
browser.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'local') {
    let shouldUpdateIcon = false;

    if (changes.isEnabled) {
      _isEnabledCache = changes.isEnabled.newValue;
      shouldUpdateIcon = true;
    }
    if (changes.premium) {
      _isPremiumCache = !!changes.premium.newValue;
      shouldUpdateIcon = true;
    }

    // Re-evaluate limit if related fields change
    if (changes.dailyArticleCount || changes.lastResetDate || changes.installTime || changes.premium) {
      browser.storage.local.get([
        'premium', 'dailyArticleCount', 'lastResetDate', 'installTime'
      ]).then(evaluateLimitState);
    } else if (shouldUpdateIcon) {
      updateIcon();
    }
  }
});

// Keep NYT cookie cache in sync
browser.cookies.onChanged.addListener(function (changeInfo) {
  if (changeInfo.cookie.name === 'nyt-s' && changeInfo.cookie.domain.includes('nytimes.com')) {
    _hasNYTCookieCache = !changeInfo.removed;
    updateIcon();
  }
});

// Evaluate if the user has reached the free limit
function evaluateLimitState(data) {
  if (data.premium || _isPremiumCache) {
    _isLimitReachedCache = false;
    updateIcon();
    return;
  }

  // 3-Minute Free Trial
  const installTime = data.installTime || 0;
  const timeSinceInstall = Date.now() - installTime;
  const THREE_MINUTES = 3 * 60 * 1000;

  if (timeSinceInstall < THREE_MINUTES) {
    _isLimitReachedCache = false;
    updateIcon();
    return;
  }

  // Check count
  const today = new Date().toDateString();
  let count = data.dailyArticleCount || 0;

  if (data.lastResetDate !== today) {
    count = 0;
  }

  _isLimitReachedCache = count >= FREE_ARTICLE_LIMIT;
  updateIcon();
}

initializeState();

// --- Message Handling ---
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'toggle') {
    const newState = !_isEnabledCache;
    browser.storage.local.set({ isEnabled: newState });
    sendResponse({ isEnabled: newState, isLimitReached: _isLimitReachedCache, hasCookie: _hasNYTCookieCache });
  } else if (request.action === 'getStatus') {
    browser.storage.local.get(['blockedCount']).then(function (result) {
      sendResponse({
        isEnabled: _isEnabledCache,
        blockedCount: result.blockedCount || 0,
        isLimitReached: _isLimitReachedCache,
        hasCookie: _hasNYTCookieCache,
        isPremium: _isPremiumCache
      });
    });
    return true; // Keep channel open
  } else if (request.action === 'verifyEmail') {
    getDeviceId().then(deviceId => {
      return verifyUser({
        email: request.email,
        deviceId: deviceId,
        version: browser.runtime.getManifest().version
      });
    }).then(data => {
      if (data.premium) {
        browser.storage.local.set({ premium: true });
      }
      sendResponse({ success: true, premium: data.premium });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open
  }
});

// --- UI Updates ---
function updateIcon() {
  if (!_isEnabledCache) {
    browser.browserAction.setBadgeText({ text: 'OFF' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#888888' });
    browser.browserAction.setTitle({ title: 'New York Times Unlocker - Disabled' });
    return;
  }

  if (_hasNYTCookieCache) {
    browser.browserAction.setBadgeText({ text: 'NYT' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#000000' });
    browser.browserAction.setTitle({ title: 'Logged into New York Times - Extension idle' });
    return;
  }

  if (_isPremiumCache) {
    browser.browserAction.setBadgeText({ text: 'PRO' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#4CAF50' });
    browser.browserAction.setTitle({ title: 'New York Times Unlocker - Premium' });
  } else if (_isLimitReachedCache) {
    browser.browserAction.setBadgeText({ text: 'MAX' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#FF9800' }); // Orange
    browser.browserAction.setTitle({ title: 'New York Times Unlocker - Daily Limit Reached' });
  } else {
    browser.browserAction.setBadgeText({ text: 'FREE' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#2196F3' });
    browser.browserAction.setTitle({ title: 'New York Times Unlocker - Active' });
  }
}

// --- Request Blocking (Core Logic) ---
browser.webRequest.onBeforeRequest.addListener(
  function (details) {
    // Graceful degradation:
    // If disabled, user has NYT sub, or limit is reached, DO NOT block.
    // The native NYT paywall will take over normally if limit is reached.
    if (!_isEnabledCache || _hasNYTCookieCache || (_isLimitReachedCache && !_isPremiumCache)) {
      return {}; // Allow the request
    }

    // Otherwise, block the paywall scripts
    console.log('Blocked request:', details.url);

    // Increment blocked count in storage
    browser.storage.local.get(['blockedCount']).then(function (result) {
      browser.storage.local.set({ blockedCount: (result.blockedCount || 0) + 1 });
    });

    return { cancel: true };
  },
  {
    urls: blockedUrls
  },
  ["blocking"]
);

// Reset session counter when navigating
browser.webNavigation.onBeforeNavigate.addListener(function (details) {
  if (details.frameId === 0) {
    browser.storage.local.set({ blockedCount: 0 });
  }
});

// --- Paywall Counting Logic ---

// Check article limit on navigation
browser.webNavigation.onCommitted.addListener(function (details) {
  // Only track main frame and New York Times articles (simple heuristic)
  if (details.frameId === 0 && details.url.includes('nytimes.com/') && details.url.length > 25) {
    incrementArticleCount();
  }
});

async function incrementArticleCount() {
  // 0. Subscribers don't get counted
  if (_hasNYTCookieCache) return;
  // 1. Premium users don't get counted
  if (_isPremiumCache) return;

  const data = await browser.storage.local.get(['dailyArticleCount', 'lastResetDate', 'installTime']);

  // Check 3-Minute Free Trial
  const installTime = data.installTime || 0;
  if (Date.now() - installTime < 3 * 60 * 1000) return;

  const today = new Date().toDateString();
  let count = data.dailyArticleCount || 0;

  if (data.lastResetDate !== today) count = 0;

  // Only increment if under limit (no network spam or redirect here!)
  if (count < FREE_ARTICLE_LIMIT) {
    const newCount = count + 1;
    browser.storage.local.set({ dailyArticleCount: newCount, lastResetDate: today });
    console.log(`Article count: ${newCount}/${FREE_ARTICLE_LIMIT}`);
  }
}

// --- Extension Install & API Integration ---

browser.runtime.onInstalled.addListener(function (details) {
  console.log('New York Times Unlocker installed');
  browser.storage.local.set({
    isEnabled: true,
    installTime: Date.now() // Store install time for trial
  });
  _isEnabledCache = true;
  updateIcon();

  if (details.reason === 'install') {
    browser.tabs.create({ url: 'welcome.html' });
  }

  getDeviceId().then(deviceId => {
    return verifyUser({
      deviceId: deviceId,
      version: browser.runtime.getManifest().version
    });
  }).then(data => {
    browser.storage.local.set({
      userToken: data.token,
      premium: data.premium
    });
  }).catch(console.error);
});

const API_BASE_URL = 'https://api.tuhocvangioi.com/api/v2';
const EXTENSION_ID = 'nyt-unlock';

async function getDeviceId() {
  const result = await browser.storage.local.get(['deviceId']);
  if (result.deviceId) return result.deviceId;
  const newId = 'device-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  await browser.storage.local.set({ deviceId: newId });
  return newId;
}

async function verifyUser({ token, email, deviceId, version }) {
  const endpoint = `${API_BASE_URL}/verify`;
  const payload = {
    extension: EXTENSION_ID,
    device_id: deviceId,
    device_type: 'firefox',
    platform: navigator.platform,
    browser_version: navigator.userAgent,
    extension_version: version,
  };

  if (token) payload.token = token;
  if (email) payload.email = email;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Verification failed');

    const storageData = {
      userToken: data.token,
      premium: data.premium,
      configs: data.configs || {}
    };

    if (data.configs && data.configs.SUBSCRIPTION_URL) {
      storageData.subscriptionUrl = data.configs.SUBSCRIPTION_URL;
    }

    browser.storage.local.set(storageData);
    return data;
  } catch (error) {
    console.error('Verification API Error:', error);
    throw error;
  }
}
