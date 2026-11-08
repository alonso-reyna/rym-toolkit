# RYM Toolkit

Tampermonkey userscript for rateyourmusic.com. In Tampermonkey it shows up as "RYM Chart Picker+".
It started as a fork of [RYM Music Chart Picker](https://github.com/Lin-808/rym-music-chart-picker) by Lin808 and uses
the same settings key, so replacing the original script keeps your configuration.

What it does:

- Pick genres, descriptors, year, type and language from a release or film page and open the matching chart.
- Edit any `/charts/...` URL in place.
- Filter charts by your most compatible users (music or film).
- Find, rate and star lists for a release; capture lists you visit.
- Random pick on chart pages.
- Jump between RYM and Letterboxd.

How to use it: [TUTORIAL.md](TUTORIAL.md). Context for picking development back up: [CLAUDE.md](CLAUDE.md).

## Install

With Tampermonkey installed, open this link and click **Install**:

https://raw.githubusercontent.com/alonso-reyna/rym-toolkit/main/rym-toolkit.user.js

The script has an `@updateURL`, so Tampermonkey updates it on its own after each push to `main`
(Dashboard → Settings → Script Update → Check Interval; or "Check for userscript updates" to force it).
Disable "RYM Music Chart Picker 1.0.2" if you had it.

For local development: open `file:///<path to this folder>/rym-toolkit.user.js` (needs
"Allow access to file URLs" in Tampermonkey) and bump `@version` after each change.

## Tests

```bash
node test/pure.test.js
```

`test/fixtures/` has fake pages with `GM_*` stubs for testing in a browser (see CLAUDE.md).

## Also in this repo

`atajo-rymsearch/`: the "RYMsearch" macOS Shortcut that opens the album playing in Spotify on RYM. See its README.
