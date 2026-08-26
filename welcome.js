/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// The two links in the Editors' Note. Edit these in one place.
//
// ORIGINAL_LISTING addresses the upstream add-on by its extension ID rather
// than its slug, so it keeps resolving if the listing is renamed.
const ORIGINAL_LISTING = 'https://addons.mozilla.org/en-US/firefox/addon/nyt-unlocker/';
// A snapshot taken before this fork was published. The Editors' Note describes
// what that listing said, so the claim stays checkable if the listing changes.
const ARCHIVED_LISTING =
  'https://web.archive.org/web/20260826111744/https://addons.mozilla.org/en-US/firefox/addon/nyt-unlocker/';
const SOURCE_REPOSITORY = 'https://github.com/carolinaisslaying/unmetered-for-nyt';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  document.getElementById('link-original').href = ORIGINAL_LISTING;
  document.getElementById('link-archived').href = ARCHIVED_LISTING;
  document.getElementById('link-source').href = SOURCE_REPOSITORY;

  // Each struck quotation is content removed from the upstream release; cite
  // points at where it was published.
  document.querySelectorAll('del.struck').forEach(el => {
    el.setAttribute('cite', ARCHIVED_LISTING);
  });
});
