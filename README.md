# Unmetered for NYT

A Firefox extension that removes the paywall and article meter on
[nytimes.com](https://www.nytimes.com). Free, with no limits, no accounts and no
payments.

## Why this fork exists

This is a fork of an add-on published on AMO under the Mozilla Public License 2.0.
That build removed the New York Times paywall and then added one of its own: three
minutes of unrestricted use on install, then a cap of ten articles per day, then a
payment to lift the cap.

The MPL requires that source be made available to anyone who receives the software
(§3.2). No source was published. This fork removes the metering, removes the
payment, and publishes the source that the licence always required.

The original listing is linked from the extension's own welcome page. The
developer is not named here and criticism is directed at the published build, not
at any person.

## What was removed

| Removed | Detail |
|---|---|
| Article metering | A 3-minute install trial, then a 10/day cap gated behind a payment |
| Remote verification | A POST on every install carrying a generated device ID, `navigator.platform` and the full user agent, returning the flag that decided whether you paid |
| Google Fonts | Both extension pages loaded remote webfonts on open; now system fonts, no network requests |
| jQuery + Bootstrap | 391 KB, including a 78 KB component bundle that was loaded on every popup and never called |
| Dead files | An unreferenced icon, a 454-line Visual Studio `.gitignore`, and the void upstream signature |

The package went from 882 KB to roughly 490 KB.

## What it does

Cancels four requests that implement the paywall and its metering:

```
*://www.nytimes.com/svc/onsite-messaging/query*
*://samizdat-graphql.nytimes.com/graphql/v2*
*://www.nytimes.com/statsig/rgstr*
*://meter-svc.nytimes.com/meter.js*
```

It stores a single value (`isEnabled`) and sends no telemetry of any kind. If you
are signed in to a real New York Times account it detects the session cookie and
stands down, so it never interferes with a subscription you pay for.

## Build

```sh
pnpm install
pnpm lint      # web-ext lint
pnpm start     # launch a temporary Firefox profile with the extension loaded
pnpm build     # produce an installable .xpi in web-ext-artifacts/
```

## Before you publish

- Set `SOURCE_REPOSITORY` in `welcome.js` to this repository's URL.
- `manifest.json` carries a freshly generated extension ID. Do not reuse the
  upstream one.

## Translations

The extension ships 52 locales. They are split deliberately, and the split
matters if you are sending a translation PR.

**Inherited from upstream — do not update these.** Four keys are *quotations*
of what the original release told its users:

| Key | What it says |
|---|---|
| `articleHeadline` | "You Have 3 Minutes of Unlimited Access." |
| `bodyP1` | The three-minute trial pitch |
| `bodyP2` | The daily article cap and the upsell |
| `feat2Desc` | "We do not track your history or sell your data." |

These are rendered struck through on the welcome page, in the reader's own
language, because they are evidence. They are meant to read exactly as they did
in the original build, including its errors — 49 of the 54 upstream locales
promised two free articles a day while the code allowed ten. Please do not
correct them.

**Inherited and still current.** The popup and setup strings — status text, the
ON/OFF labels, the steps, the feature headings — carry over unchanged and are
accurate.

**New, English only.** The Editors' Note, the "Also removed" list and the
replacement copy exist only in `en` and fall back through `default_locale`.

### Sending a translation

Translations of the new copy are very welcome. Two things to know:

The most useful single string is `struckLabel` ("Removed in this version"). It
is what explains the strikethrough, so translating it alone closes most of the
comprehension gap for a reader who does not read English.

The Editors' Note makes a factual claim about a real project's licence
compliance. A translation that overstates it is a problem in a language the
maintainer cannot check, so PRs touching `noteBody1` and `noteBody2` should come
from someone comfortable that the translation says exactly what the English
says, and no more.

### Regional English

`default_locale` is `en`, written in New Zealand English. Regional variants
(`en-NZ`, `en-AU`, `en-GB`, `en-US`) all resolve to it, so they do not need
directories of their own — earlier `en_GB` and `en_US` directories were removed
because they were duplicates that had already drifted stale.

## Licence

Mozilla Public License 2.0. See [LICENSE](LICENSE).

Bundled translations in `_locales/` are carried over from the upstream
MPL-licensed release. See [Translations](#translations) for how they are split.
