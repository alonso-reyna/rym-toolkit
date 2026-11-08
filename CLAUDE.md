# RYM Toolkit

Tampermonkey userscript for rateyourmusic.com. Fork of "RYM Music Chart Picker" by Lin808 (formerly "RYM Chart Picker+").
All the code lives in `rym-toolkit.user.js`; it is a single file on purpose.

## Files

- `rym-toolkit.user.js`: the script. Pure functions block at the top (exported under node), runtime/DOM below.
- `test/pure.test.js`: tests for the pure functions. Run `node test/pure.test.js` before any delivery.
- `test/fixtures/`: fake pages (release, chart, find_similar_users) + `stub.js` with fake `GM_*`, for a browser smoke test.
- `TUTORIAL.md`: how to use it (for Alonso). Update it when the UI changes.
- `atajo-rymsearch/`: the "RYMsearch" macOS Shortcut (Spotify → RYM): `rym`, `rym-abrir`, `rym-espacio-vacio.js`.
  They run from `~/.local/bin` (install with `./install.sh`); the Shortcut only calls `~/.local/bin/rym`. See its README.
  The file names are Spanish on purpose: they are installed binaries the Shortcut calls; renaming them breaks it.
- `tools/install-in-chrome.sh`: opens the install link (current commit) in the Chrome window that has RYM.
- `brainstorms/`: design decisions and findings verified on RYM. Read the latest one before proposing features.

## How to test

1. `node test/pure.test.js`.
2. Smoke test: `cd test/fixtures && cp ../../rym-toolkit.user.js script.js && python3 -m http.server 8765`,
   open `http://localhost:8765/release/album/ecco2k/e/`, turn on the panel and check `window.__errors` and the panel's
   gray URL. Delete `script.js` when done (not versioned).
3. On real RYM: Tampermonkey installs from GitHub raw (`@updateURL` in the header, repo `alonso-reyna/rym-toolkit`,
   branch `main`). After editing, **bump `@version`** (otherwise Tampermonkey does not update), commit, push; then
   "Check for userscript updates" and F5 on RYM.
4. **After every push, run `tools/install-in-chrome.sh`** (Alonso asked on 2026-10-30): it opens the install link with
   the commit SHA in the Chrome where he has RYM (chat links open in Safari for him). Also put the link in the reply.
   The SHA is used because `/main/` and `/refs/heads/main/` can serve a stale version for several minutes.

## Verified RYM facts (2026-10-20)

Cache them: each one cost a live test and RYM changes them without notice.

- Genre slug: take it from the `href` (`/genre/<slug>/`), never from the text. `&` gets glued: "R&B" → `randb`.
- Chart URL: `/charts/{top|popular|esoteric|diverse}/{types,}/{year|2010s|2010-2015|all-time}/g:…/d:…/s:…/l:…/u:…/`.
  Plain hyphens work (RYM writes `%2d`, no difference).
- "Must contain all" = `all` token at the start of the list: `s:all,cloud-rap,ambient-pop`. Same for `g:` and `d:`.
- `u:` accepts a flat list of usernames and `followed_by:x`, `followers_of:x` tokens.
- `find_similar_users?user=X`: `li#page_user_compat_item_N` → `a.user[href="/~name"]`; `.page_user_compat_pct`
  has `style="width:P%"` = relative score (rank 1 = 100 %). 100 users, no pagination, no absolute %.
- Repeated `fetch` from the page triggers Cloudflare (403 "Verification"). One fetch per sync, with a fallback of
  opening the page, where this same script captures the list.
- Release: `.album_info tr` with `th` Artist/Type/Released/Recorded/Genres/Descriptors/Language.
  Genres in `.release_pri_genres a.genre` and `.release_sec_genres a.genre`. Own username: `a.header_profile_main`.

## Verified RYM facts (2026-10-21, lists)

Captured from the real site except where marked unverified.

- List page `/list/<user>/<slug>/`: title in `#content h1`; author `a.user[href^="/~"]`; categories
  `Categories:` → `a.genre[href^="/list_classifier/<Name>/"]`; id as `[List<id>]` inside a `<p>`; likes in
  `span[id^="favtext_"]` as `+N`; items = the max number in `#nav_bottom .navlinkcurrent` ("369 - 345") or, without
  pagination, the count of `table#user_list td.number`.
- A user's list index `/list/<user>/`: `table.mbgen` with `a.listpage_list` rows and `.smallgray`
  "Created: … | Updated: … | N items".
- `/list_classifier/<Name>/` is flat, paginated and unranked (no likes, no genre/year filter): useless for discovery.
- List search: `searchtype=s` (verified 2026-10-22 by reading `RYMsearch.types` on the search page; `l` =
  releases, `a` artists, `z` songs, `b` labels, `h` genres, `u` users). A saved `l` setting is migrated to `s`.
- **NO requests to rateyourmusic.com from the agent** (T3 browser, Playwright, WebFetch, curl, anything): it shares
  Alonso's IP and the firewall blocked it (2026-10-22, 13 fetches in ~10 s → "IP blocked"). Alonso asked for this
  explicitly on 2026-10-26: not even "a single one to verify". Anything that needs live checking is done by Alonso, who
  sends a screenshot or saved HTML; the agent works with fixtures in `test/fixtures/`.
- The markup of the lists section on the release page is **not verified** (Cloudflare blocked the capture).
  The parser relies on `/list/<user>/<slug>/` anchors; the fixture block is a guess.
- Repeated `fetch` from the page triggers Cloudflare (403/503) with lists too. See the policy below.

## Verified RYM facts (2026-10-26, films)

- Film: `/film/<slug>/` (e.g. `/film/monster_house/`); title `.film_title h1`; `table.film_info tr` with `th.info_hdr`
  (Directed by, Release date, Runtime, Language, Genres); year in `meta[itemprop=dateCreated]` or
  `a[href^="/charts/top/film/<year>/"]`; genres `.film_pri_genres`/`.film_sec_genres a.film_genre` with
  `href="/film_genre/Computer+Animation/"` and `title="[GenreN]"`; no descriptors.
- Film chart: `/charts/top/film/{year|2000s|2000-2010|all-time}/g:…/s:…/d:…/l:…/u:…/separate:live,archival,soundtrack/`;
  verified `l:en`, decades, ranges, `g:all,…`, `s:`, `d:`.
- The film genre slug does not come from the film's href: film "Comedy" is `comedy-1` (`comedy` is the music one);
  a wrong slug is silently ignored. The script learns name→slug on film charts
  (`.page_charts_section_charts_item_genres_* a.genre`) and on the genre page; seeded Comedy→comedy-1, Satire→satire-1.
- Accents are dropped in the slug: "Cinéma Vérité" → `cinema-verite` (verified by Alonso, `g:all,cinema%2dverite`).
- `/film_genre/<Name>/`: chronological, unranked; breadcrumb `.ui_breadcrumb_item_main`, `[GenreN]` in `div.shortcut`.
- Film compatibles: `/find_similar_users?user=<u>&scope=film`, same markup as music.
- Letterboxd: `og:title` "Monster House (2006)", `og:url` `/film/monster-house/`.
- New conventions (1.4): keys `rym_chart_picker_compat_film_v1`, `rym_chart_picker_film_genres_v1`; setting
  `filmCompatSource` (film|music|both, default film); cross links via DuckDuckGo `\` (I'm feeling ducky), no requests.
- Film fixtures in `test/fixtures/` (film, film_genre, charts, find_similar_users, letterboxd) for the smoke test.

## Conventions

- Settings under the key `rym_chart_picker_settings_v16` (shared with the original script; do not change it).
  Compatible users list under `rym_chart_picker_compat_v1`. Storage keys keep the old `rym_chart_picker_` prefix on
  purpose: renaming them would lose saved data.
- Lists (1.3): cache and `compatLists` under `rym_chart_picker_lists_v1`; starred lists under
  `rym_chart_picker_starred_lists_v1`. New settings: `listSearchType`, `listFetchDelayMs` (default 3000), `listFetchMax` (default 25).
- All URL logic (parse/build) is pure and goes above `if (typeof module !== "undefined")`. If you touch
  that logic, add the case to the test.
- Everything in the repo is in English: UI (like RYM), docs, code comments and commit messages (since 1.6.0, asked by
  Alonso 2026-11-08). Conversation with Alonso stays in Spanish.
- What the user dropped: year range fields and the ±N button (removed in 1.1.1, do not bring them back); the
  "lists you keep running into" aggregation (lists repeated across several records, 1.3; do not propose it).
- Panel order (1.1.2, asked by Alonso): Year · Primary · Secondary · Descriptors · Music releases · Languages · Users.
  Year and languages without explanatory text ("all time" as a chip, "none"). The Music releases table mimics RYM's
  native filter; `TYPE_PRESETS.albums`/`singles` are assumed (album / single), not verified against RYM.
- The panel footer with links to Lin808's GitHub and RYM profile was removed in 1.5.2 (asked by Alonso).

## Naming (1.6.0)

- The repo is `alonso-reyna/rym-toolkit` (formerly `rym-chart-picker-plus`, renamed 2026-11-08); the file is
  `rym-toolkit.user.js` and the UI says "RYM Toolkit".
- `@name` stays "RYM Chart Picker+" and `@namespace` keeps the old repo URL **on purpose**: Tampermonkey identifies a
  script by name + namespace, and its `GM_*` storage is per script. Changing either installs a second script with empty
  settings, compatible users and caches.
- Installs from before 1.6.0 point `@updateURL` at the old file path, which no longer exists; reinstalling from the new
  link updates the same script in place (same name + namespace) and keeps its data.

## Semantics not to break (1.2.0)

- `state.fromUrl` (chart mode): the URL is reproduced as is; settings defaults (type, language, users) only apply to
  new release page states. `state.urlUsers`: `null` = use settings, `[]` = the URL had no `u:`.
- `selectCompatUsers`: top N counts distinct, non-excluded users; `compatMinScore` is optional (default 0) and the
  `compatMinScoreV2` flag marks already-migrated settings (old ones came with 70 and cut the top N).
- `@namespace` changed to `alonso-reyna` in 1.1.2; an old install (`alonsoreyna`) lives on as a separate script.
- GPT review 2026-10-20, still to address (low impact): restoring `innerHTML` when turning Search off loses RYM's
  listeners; no observer for when RYM re-renders a row; the fallback `window.open` can be blocked as a popup.

## Anti-Cloudflare policy for lists (1.3)

- List fetches only happen on click ("Rate N unrated", "Lists by compatible users"): sequential, with a delay
  (`listFetchDelayMs`) and a cap (`listFetchMax`), stopping at the first error.
- If RYM blocks, the script says so and sends you to open the lists by hand; passive capture when visiting a list
  page is the safe path. Do not add automatic or parallel fetches.
- Lists 1.3: `parseReleaseListsSection` fails closed (returns `null` if the container is not bounded: body/#content,
  >=60 % of the links, >4 links per list). Automatic fetches only on release/chart. Cache/starred writes are merged
  with what is stored (`mergeListCaches`/`mergeStarred`). Entries read more than 30 days ago are treated as unread.

## Random pick on charts (1.5)

- Row `#rym-random-row` under the header, only on `PAGE === "chart"`. Entries = `div#pos<N>` (verified on the film
  chart capture; the number comes from a CSS counter, the `id` is the rank). Range saved in `rym_chart_picker_random_v1`.
- **Unverified**: 40 entries per page (`CHART_PAGE_SIZE`) and pagination as `/charts/.../<page>/` (`splitChartPage`
  only accepts 1–3 digits so it does not mistake a year). If they are wrong, the link to another page 404s; nothing else breaks.
- 1.5.1 (asked by Alonso): on charts the panel is anchored to the left of RYM's "Share" button (found by text,
  markup not captured), so it does not cover "Go to Recommendations". Without Share, it stays in the default spot (118px / 22px).

## Spotify button (1.7)

- "▶ Spotify" on music release pages (a "Listen" row appended to `table.album_info`) and on each music chart item.
  Asked by Alonso 2026-11-08.
- **Verified (saved Crybaby release, 2026-11-08)**: `#media_link_button_container_top[data-links]` holds
  `{"spotify":{"<id>":{"default":true,"type":"album"},"<id2>":{"for":["CA","US"],"type":"album"}},...}` and RYM also
  renders `a.ui_media_link_btn_spotify[href^="https://open.spotify.com/album/"]`. `findSpotifyTarget` reads both.
- **Unverified**: music chart row markup. 1.7.0 found no rows on Alonso's chart; 1.7.1 also takes `div#pos<N>`,
  `a[href^="/release/"]`/`a[href^="/artist/"]` and a MutationObserver. Rows may lack a Spotify link: then the button
  searches `artist title` (`/search/<q>/albums`).
- The play signal travels as `?rym_play=1` on the Spotify URL. A GM value set on RYM did **not** reach the new
  Spotify tab (1.7.0 opened but did not play). Spotify keeps the query string but drops `#hash`.
- On open.spotify.com (verified 2026-11-08): the album play button is
  `[data-testid="action-bar-row"] [data-testid="play-button"]` (`aria-label` "Play"/"Pause"); a programmatic click
  plays even without user activation in that tab. Search page: first `/album/` link outside nav/aside/player bar.
  The script logs `[RYM Toolkit] Spotify: …` to the console and strips `rym_play` after playing.
- Smoke test: `/spotify/...` fixtures stand in for Spotify on localhost.

## Roadmap 1.2 (agreed, not started)

Saved presets · basket that persists across records · exclusion with Shift+click (`-slug`) · keyboard shortcuts ·
support on artist/genre pages. Details in `brainstorms/2026-10-20-rym-chart-picker-1-1.md`.
