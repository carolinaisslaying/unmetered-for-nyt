/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// The two links in the Editors' Note. Edit these in one place.
//
// ORIGINAL_LISTING addresses the upstream add-on by its extension ID rather
// than its slug, so it keeps resolving if the listing is renamed.
const ORIGINAL_LISTING =
  'https://addons.mozilla.org/en-US/firefox/addon/%7B49f6d1c7-8149-47dd-bc30-c79c2c2c6b86%7D/';
const SOURCE_REPOSITORY = 'https://github.com/REPLACE-ME/unmetered-for-nyt';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  document.getElementById('link-original').href = ORIGINAL_LISTING;
  document.getElementById('link-source').href = SOURCE_REPOSITORY;
});
