# Films + Letterboxd (1.4.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chart panel for RYM films (film page, film genre page, film charts), film compatibles, and RYM ↔ Letterboxd buttons.

**Architecture:** Everything in `rym-toolkit.user.js`. Pure URL/parsing logic above the `if (typeof module …)` and exported in `PURE_API`; runtime below. The state gains `media: "music" | "film"`; film pages reuse the `PAGE === "release"` flow with a `MEDIA` constant. Letterboxd is a separate branch at the start of the runtime (different host).

**Tech Stack:** Plain userscript JS (Tampermonkey, `GM_*`), tests with `node test/pure.test.js` (assert), smoke test with `test/fixtures` + `python3 -m http.server`.

**Spec:** `docs/superpowers/specs/2026-10-26-films-letterboxd-design.md`

## Global Constraints

- **Zero requests to rateyourmusic.com from the agent** (no curl, no browser, no Playwright). Fixtures only.
- A single script file. UI in English; docs in Spanish.
- Existing storage keys untouched (`rym_chart_picker_settings_v16`, `rym_chart_picker_compat_v1`, …). New ones:
  `rym_chart_picker_compat_film_v1`, `rym_chart_picker_film_genres_v1`.
- Film chart: `/charts/{listing}/film/{year}/g:…/s:…/d:…/l:…/u:…/separate:live,archival,soundtrack/`.
- A new film state adds `separate:live,archival,soundtrack`.
- Film slug seed: `Comedy → comedy-1`, `Satire → satire-1`; if there's no data, `rymSlug(name)`.
- DuckDuckGo: `https://duckduckgo.com/?q=` + `encodeURIComponent("\\site:<host>/film <title> <year>")`; fallback without `\`.
- Film compatibles: `/find_similar_users?user=<u>&scope=film`. Source in film mode: `film` (default) | `music` | `both` (Top N from each, union without duplicates, case-insensitive).
- A music chart must produce exactly the same URL as in 1.3.2 (existing tests don't change).
- `@version 1.4.0`.

## Review Focus

1. Music chart opened with the new script: the rebuilt URL is identical to 1.3.2's → regression test in Task 1.
2. Film genre whose slug hasn't been learned and clashes with a music one (Comedy): must come out as `comedy-1`, not `comedy` → Task 2.
3. Learning slugs on a **music** page would pollute the film map (`/genre/comedy/`): only learn on film pages → Task 6 (runtime guard) and Task 2 (parser receives an already-scoped root).
4. Title with special characters on Letterboxd/RYM ("Amélie", "Lilo & Stitch", "8½"): the query must be encoded and have no year if there isn't one → Task 3.
5. Compatibles in `both` mode with a user repeated in both lists and exclusions: no duplicates, exclusions respected → Task 4.

---

### Task 1: "film" medium in chart parse/build

**Files:**
- Modify: `rym-toolkit.user.js` (`createState` ~476, `parseChartPath` ~501, `buildTypeSegment` ~595, `buildChartUrl` ~686, `PURE_API` ~1244)
- Test: `test/pure.test.js`

**Interfaces:**
- Produces: `state.media` (`"music"` default); `FILM_SEPARATE_SEGMENT = "separate:live,archival,soundtrack"`; `createFilmState() -> state` (media film, `extraSegments: [FILM_SEPARATE_SEGMENT]`); `parseChartPath` sets `media = "film"` when `parts[2] === "film"` and leaves `types` empty; `buildChartUrl` writes `film` as the type segment if `state.media === "film"`.

- [ ] **Step 1: Failing tests**

```js
// film charts
let fp = api.parseChartPath("/charts/top/film/all-time/g:comedy%2d1/d:regional/s:cartoon/separate:live,archival,soundtrack/");
assert.equal(fp.state.media, "film");
assert.equal(fp.state.types.size, 0);
assert.equal(api.buildChartUrl(fp.state, settings, ctx),
  "https://rateyourmusic.com/charts/top/film/all-time/g:comedy-1/d:regional/s:cartoon/separate:live,archival,soundtrack/");
fp = api.parseChartPath("/charts/top/film/2000-2010/g:all,animation,family/separate:live,archival,soundtrack/");
assert.equal(api.buildChartUrl(fp.state, settings, ctx),
  "https://rateyourmusic.com/charts/top/film/2000-2010/g:all,animation,family/separate:live,archival,soundtrack/");
const fs0 = api.createFilmState();
assert.equal(api.buildChartUrl(fs0, settings, ctx), "https://rateyourmusic.com/charts/top/film/all-time/separate:live,archival,soundtrack/");
// music regression
assert.equal(api.parseChartPath("/charts/top/album/2010-2015/g:indie-folk/").state.media, "music");
```

Note: `g:comedy%2d1` is decoded in `parseChartPath` and written with a plain hyphen; the slug `comedy-1` must survive (today `labelFromSlug("comedy-1")` + `genreSlugs` keeps it; verify it).

- [ ] **Step 2:** `node test/pure.test.js` → fails (`createFilmState is not a function`).
- [ ] **Step 3:** Implement and export `createFilmState`, `FILM_SEPARATE_SEGMENT`.
- [ ] **Step 4:** `node test/pure.test.js` → everything passes, including the old music tests.
- [ ] **Step 5:** Commit `feat(film): medio film en parse/build de charts`.

### Task 2: Film genre slugs

**Files:** Modify `rym-toolkit.user.js` (pure block, next to `slugFromGenreHref`); Test `test/pure.test.js`.

**Interfaces:**
- Produces:
  - `FILM_GENRE_SLUG_SEED = { "comedy": "comedy-1", "satire": "satire-1" }` (key = lowercase name).
  - `filmGenreNameFromHref(href) -> string|null`: `/film_genre/Computer+Animation/` → `"Computer Animation"` (`+` → space, `decodeURIComponent`).
  - `filmGenreSlug(name, learned) -> string`: `learned[name.toLowerCase()]` → seed → `rymSlug(name)`. Keeps a `-` prefix.
  - `parseFilmGenreSlugs(root) -> Object<lowerName, slug>`: reads `a.genre[href^="/genre/"]` inside `root` (name = cleaned text, slug = `slugFromGenreHref`). The caller decides the root.
  - `mergeFilmGenreSlugs(stored, found) -> Object` (found wins).

- [ ] **Step 1: Failing tests**

```js
assert.equal(api.filmGenreNameFromHref("/film_genre/Computer+Animation/"), "Computer Animation");
assert.equal(api.filmGenreSlug("Comedy", {}), "comedy-1");
assert.equal(api.filmGenreSlug("Computer Animation", {}), "computer-animation");
assert.equal(api.filmGenreSlug("Horror Comedy", { "horror comedy": "horror-comedy-2" }), "horror-comedy-2");
assert.equal(api.filmGenreSlug("-Comedy", {}), "-comedy-1");
// parseFilmGenreSlugs without jsdom: use a minimal doc object like the existing list tests do
```

For `parseFilmGenreSlugs` follow the pattern the `parseListDocument` tests already use (fake doc with `querySelectorAll`). Case: `<a class="genre" href="/genre/comedy-1/">Comedy</a>` → `{ comedy: "comedy-1" }`.

- [ ] **Step 2:** run → fails.
- [ ] **Step 3:** implement and export the five symbols.
- [ ] **Step 4:** run → passes.
- [ ] **Step 5:** Commit `feat(film): slugs de género de cine (semilla + aprendidos)`.

### Task 3: DuckDuckGo links and Letterboxd title

**Files:** Modify pure block; Test `test/pure.test.js`.

**Interfaces:**
- Produces:
  - `buildDuckyUrl(site, title, year, lucky = true) -> string`. `site` is `"letterboxd.com/film"` or `"rateyourmusic.com/film"`.
  - `parseLetterboxdOgTitle(text) -> { title, year|null }`: `"Monster House (2006)"` → `{ title: "Monster House", year: 2006 }`; no year → `year: null`.

- [ ] **Step 1: Failing tests**

```js
assert.equal(api.buildDuckyUrl("letterboxd.com/film", "Monster House", 2006),
  "https://duckduckgo.com/?q=" + encodeURIComponent("\\site:letterboxd.com/film Monster House 2006"));
assert.equal(api.buildDuckyUrl("rateyourmusic.com/film", "Lilo & Stitch", null, false),
  "https://duckduckgo.com/?q=" + encodeURIComponent("site:rateyourmusic.com/film Lilo & Stitch"));
assert.deepEqual(api.parseLetterboxdOgTitle("Monster House (2006)"), { title: "Monster House", year: 2006 });
assert.deepEqual(api.parseLetterboxdOgTitle("8½ (1963)"), { title: "8½", year: 1963 });
assert.deepEqual(api.parseLetterboxdOgTitle("Untitled"), { title: "Untitled", year: null });
```

- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5:** Commit `feat(letterboxd): URLs de DuckDuckGo y parseo de og:title`.

### Task 4: Film compatibles in the `u:` segment

**Files:** Modify `DEFAULT_SETTINGS` ~318, `normalizeSettings` ~830, `buildUserSegment` ~652, pure block; Test `test/pure.test.js`.

**Interfaces:**
- Consumes: existing `selectCompatUsers(compat, settings)`.
- Produces:
  - Setting `filmCompatSource: "film"` (values `film|music|both`; `normalizeSettings` corrects invalid ones to `"film"`).
  - `compatScopeFromSearch(search) -> "film"|"music"` (`?user=x&scope=film` → `"film"`).
  - `context.compatFilm` (same format as `context.compat`).
  - `compatNamesFor(state, settings, context) -> string[]`: if `state.media !== "film"` → same as today; if film → according to `filmCompatSource`, with `both` = Top N from each list, union without duplicates case-insensitive, film first. `buildUserSegment` uses it.

- [ ] **Step 1: Failing tests**

```js
const compatFilm = { users: [{ username: "phowbee", score: 100, rank: 1 }, { username: "kai7", score: 90, rank: 2 }] };
const fctx = { ...ctx, compatFilm };
const fstate = api.createFilmState(); fstate.urlUsers = null;
const fset = { ...settings, userFilters: ["compat"], compatTopN: 2 };
assert.equal(api.buildUserSegment(fstate, fset, fctx), "u:phowbee,kai7");
assert.equal(api.buildUserSegment(fstate, { ...fset, filmCompatSource: "music" }, fctx), "u:bnsaiboy,Kai7");
assert.equal(api.buildUserSegment(fstate, { ...fset, filmCompatSource: "both" }, fctx), "u:phowbee,kai7,bnsaiboy");
assert.equal(api.buildUserSegment(fstate, { ...fset, filmCompatSource: "both", compatExcluded: ["phowbee"] }, fctx), "u:kai7,bnsaiboy");
assert.equal(api.compatScopeFromSearch("?user=alonsoreyna&scope=film"), "film");
assert.equal(api.compatScopeFromSearch("?user=alonsoreyna"), "music");
assert.equal(api.normalizeSettings({ filmCompatSource: "x" }).filmCompatSource, "film");
// music unchanged: the existing buildUserSegment test with compat stays the same
```


- [ ] **Step 2–4:** fail, implement, pass.
- [ ] **Step 5:** Commit `feat(film): compatibles de cine (film/music/both)`.

### Task 5: Film fixtures

**Files:** Create `test/fixtures/film/monster_house/index.html`, `test/fixtures/film_genre/Computer+Animation/index.html`,
`test/fixtures/charts/top/film/all-time/g:comedy%2d1/d:regional/s:cartoon/separate:live,archival,soundtrack/index.html`,
`test/fixtures/find_similar_users/film.html`, `test/fixtures/letterboxd/film/monster-house/index.html`.

Source: `~/Downloads/` (saved by Alonso 2026-10-26; copies in `/tmp/filmhtml/`). Trim them to the pattern of the existing fixtures: remove external `<script>`s and trackers, keep `.film_title h1`, the full `table.film_info`, the breadcrumb and `div.shortcut` of the genre page with the related links, 3–5 chart items with their `a.genre`, 5 compatible users, and the `<head>` with Letterboxd's `og:title`/`og:url` plus the film title block. Add `<script src="/stub.js"></script><script src="/script.js"></script>` as in `test/fixtures/release/album/ecco2k/e/index.html`. The chart folder name with `:` and `%2d` must resolve with `python3 -m http.server`; if it doesn't, use `g:comedy-1`.

- [ ] **Step 1:** create fixtures.
- [ ] **Step 2:** `cd test/fixtures && python3 -m http.server 8765` and open each one: loads with no HTML 404.
- [ ] **Step 3:** Commit `test(film): fixtures de película, género, chart, compatibles y Letterboxd`.

### Task 6: RYM runtime — film, film genre, film chart

**Files:** Modify `rym-toolkit.user.js` (header `@match`, `PAGE` detection ~1267, `state` init ~1290, `captureCompatFromCurrentPage` ~1624, `loadCompat`/`saveCompat`, `syncCompat` ~2573, `detectReleaseYear`, `findRowsByLabel`, `infoRoot`, `refreshPageHighlights`, `classifyClick`, `render`, `renderTypes`, compat settings UI).

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: `MEDIA` (`"film"` if the path starts with `/film/`, `/film_genre/` or is a chart with `parts[2] === "film"`; otherwise `"music"`); new `PAGE` `"filmgenre"`; `/film/…` uses `PAGE = "release"`.

- [ ] **Step 1:** `@match` for `https://rateyourmusic.com/film/*`, `https://rateyourmusic.com/film_genre/*` and their `www.` variants.
- [ ] **Step 2: film.** `state = createFilmState()` when `MEDIA === "film"` and `PAGE === "release"`. `findRowsByLabel` and `infoRoot` accept `.film_info`. The year comes from the `"release date"` row (in addition to `"released"`). `classifyClick`: in the `genres` row, an `href` with `/film_genre/` → name via `filmGenreNameFromHref`, slug via `filmGenreSlug(name, learned)`, secondary if `closest(".film_sec_genres")`. `refreshPageHighlights` also marks `a[href*="/film_genre/"]`. In film mode the `rym-picker-types` and `rym-picker-desc` sections are hidden (on the film page; on film charts `d:` is kept and shown if it comes in the URL) and `renderReleaseLists` isn't called.
- [ ] **Step 3: film genre page** (`PAGE = "filmgenre"`): name from the breadcrumb `.ui_breadcrumb_item_main span`. "Top chart" button that opens `buildChartUrl` of a film state with only that genre (all-time). Full panel with that genre preloaded as primary. Learns slugs from the related links in `table.mbgen`.
- [ ] **Step 4: film chart.** Learns slugs with `parseFilmGenreSlugs` over `.page_charts_section_charts_item_genres_primary, …_secondary` and the parsed state (`genreSlugs`), and stores them in `rym_chart_picker_film_genres_v1` with `mergeFilmGenreSlugs`. Never learns if `MEDIA !== "film"`.
- [ ] **Step 5: film compatibles.** `captureCompatFromCurrentPage` stores in `rym_chart_picker_compat_film_v1` if `compatScopeFromSearch(location.search) === "film"`. Add `syncCompatFilm` (same flow as `syncCompat` with `&scope=film`: one fetch, and if it fails, open the page). `buildContext` adds `compatFilm`. In film mode, next to the compatibles toggle, a `<select id="rym-compat-source">` (Film / Music / Both) that writes `settings.filmCompatSource`.
- [ ] **Step 6: smoke test** (Task 5 fixtures): film → turn on Search, click "Computer Animation" and "Comedy" (secondary) → gray URL `…/charts/top/film/2006/g:computer-animation/s:comedy-1/separate:live,archival,soundtrack/` (if the year was added); genre → "Top chart" button with `g:computer-animation`; film chart → "Update chart" reproduces the URL; music release → same URL as before. `window.__errors` empty on all of them.
- [ ] **Step 7:** `node test/pure.test.js` passes. Commit `feat(film): panel en película, género de cine y charts de cine; compatibles de cine`.

### Task 7: RYM ↔ Letterboxd buttons

**Files:** Modify `rym-toolkit.user.js` (header, start of the runtime).

**Interfaces:** Consumes `buildDuckyUrl`, `parseLetterboxdOgTitle` (Task 3).

- [ ] **Step 1:** `@match https://letterboxd.com/film/*`. At the start of the runtime, if `location.hostname` ends in `letterboxd.com`: read `meta[property="og:title"]`, insert next to the title (the film's `h1`; if there isn't one, floating at the top right) a "RYM" link → `buildDuckyUrl("rateyourmusic.com/film", title, year)` and a small "search" link → same with `lucky=false`. Both `target="_blank" rel="noopener"`. `return` without touching anything else.
- [ ] **Step 2:** On a RYM film, next to `.film_title h1`: "Letterboxd" link → `buildDuckyUrl("letterboxd.com/film", h1, year)` and "search". Use the year from `meta[itemprop=dateCreated]` or from the Release date row.
- [ ] **Step 3: smoke test** with the film and Letterboxd fixtures: the `href`s match those in the Task 3 tests; `window.__errors` empty.
- [ ] **Step 4:** Commit `feat(letterboxd): botones RYM ↔ Letterboxd`.

### Task 8: Version and docs

**Files:** Modify `rym-toolkit.user.js` (`@version 1.4.0`, `@description` mentions films and Letterboxd), `TUTORIAL.md` (Films and Letterboxd section), `CLAUDE.md` (verified facts 2026-10-26: film URL, `.film_info`, `/film_genre/`, `comedy-1`, `scope=film`, `l:`/ranges/`all,` on film; new keys; `filmCompatSource`).

- [ ] **Step 1:** edit.
- [ ] **Step 2:** `node test/pure.test.js` passes; delete `test/fixtures/script.js`.
- [ ] **Step 3:** Commit `1.4.0: películas (panel, género, charts, compatibles de cine) y puente Letterboxd`. Don't push unless Alonso asks.
