# Films on RYM + bridge to Letterboxd (1.4)

## Why

Alonso also uses RYM for film. Today the picker only understands music: a film page has no panel, the film genre
page (`/film_genre/<Name>/`) lists in chronological order instead of giving a top, and on a film chart the panel
would break the URL (it doesn't recognize the `film` type). He also wants to jump between RYM and Letterboxd with one
click, just like his Spotify → RYM shortcut.

## Goals

1. **RYM → Letterboxd button** on a RYM film page: opens the same film on Letterboxd.
2. **Letterboxd → RYM button** on a Letterboxd film page: opens the same film on RYM.
3. **Panel on the film page**: the same panel as for records (Year · Primary · Secondary · Languages · Users) that
   builds a `/charts/top/film/…` chart.
4. **Film genre page**: a "Top chart" button (straight to `/charts/top/film/all-time/g:<slug>/`) **and** the full
   panel, with that genre preloaded, to combine it with year, other genres, etc.
5. **Film charts**: the panel runs and respects `film` and `separate:…` when rebuilding the URL.

## Non-goals

- No rating, syncing, or copying data between RYM and Letterboxd. Just opening links.
- Games and other RYM media: out.
- Lists (1.3) on film pages: out for now.

## Anti-goals

- **No requests to rateyourmusic.com** (neither from the script in the background nor from the agent). The buttons only
  open tabs on a user click.
- Don't break music: a music chart must keep generating exactly the same URL as today.

## Facts verified by Alonso (2026-10-26)

- Film chart: `/charts/top/film/{year|all-time}/g:<slug>/u:<users>/separate:live,archival,soundtrack/`.
- Film genre slug = lowercase name with hyphens: "Computer Animation" → `computer-animation`
  (RYM writes `computer%2danimation`; doesn't matter).
- Film genre page: `/film_genre/Computer+Animation/` (name with `+`, no ranking, chronological).
- Film page: title, "Directed by", "Release date" (with the year linked), "Runtime", "Language",
  "Genres" with primaries (top, bold) and secondaries (below, small). Id like `[Film6279]`.

## How (decided)

- Everything in `rym-toolkit.user.js` (a single file, as always). Add `@match` for RYM films,
  `/film_genre/*` and `https://letterboxd.com/film/*`.
- **Cross links via DuckDuckGo "I'm feeling ducky"** (the same trick as the `~/.local/bin/rym` shortcut):
  - RYM → Letterboxd: `https://duckduckgo.com/?q=` + `\site:letterboxd.com/film <title> <year>`.
  - Letterboxd → RYM: `https://duckduckgo.com/?q=` + `\site:rateyourmusic.com/film <title> <year>`.
  - Next to each button, a small fallback "search" link (normal DuckDuckGo search without `\`).
- The panel in film mode hides the "Music releases" table and Descriptors; the type segment is always `film`.
- On film charts, `separate:…` is kept as is (it already falls into `extraSegments`).
- URL logic (detect medium, film genre slug, DuckDuckGo URL, film chart) goes in the pure block
  with tests in `test/pure.test.js`.

## My decision (Claude) — to review

- In new film states, the type defaults from settings do **not** apply (always `film`); the language and
  user ones do, same as for records.
- I add `separate:live,archival,soundtrack` to a new film state, which is the default RYM put in
  Alonso's links.
- The Letterboxd button goes in the film header, next to the title.
- The year to search with comes from "Release date"; if there isn't one, search without a year.
- Letterboxd: title and year from `og:title` ("Monster House (2006)") or from the header. To be confirmed with saved HTML.

- Film genre slug (see "Saved HTML"): a name → slug map learned on film charts, seeded with
  Comedy → `comedy-1` and Satire → `satire-1`; if it's not in the map, `rymSlug(name)`.

## HTML saved by Alonso (2026-10-26, in `test/fixtures/film/`)

- Film: URL `/film/monster_house/`. Title `.film_title h1`. Table `table.film_info tr` with `th.info_hdr`
  (Directed by, Release date, Runtime, Language, Genres). Year: `a[href^="/charts/top/film/"]` inside Release
  date, or `meta[itemprop=dateCreated]`. Genres `.film_pri_genres a.film_genre` / `.film_sec_genres a.film_genre`,
  with `href="/film_genre/Computer+Animation/"` and `title="[Genre20040]"`. There's no descriptors row.
- **The film genre `href` doesn't carry the chart slug.** "Comedy" is `comedy-1` on the chart (plain `comedy` without
  a number is the music one). Film charts do carry the real slug: `.page_charts_section_charts_item_genres_*
  a.genre[href="/genre/comedy-1/"]` and a JSON with `genre_include: [{id, name, text}]`. The map comes from there.
- Film genre page: breadcrumb `.ui_breadcrumb_item_main span` with the name, `[Genre20040]` in
  `div.shortcut`; related genres link to `/genre/<slug>/` (useful for the map).
- Film chart accepts `g:`, `s:` and `d:` (`/charts/top/film/all-time/g:comedy%2d1/d:regional/s:cartoon/separate:…/`).
- Letterboxd: `meta[property="og:title"]` = "Monster House (2006)"; `og:url` = `https://letterboxd.com/film/monster-house/`.

## Film compatible users (requested by Alonso)

- RYM has a separate list: `/find_similar_users?user=<u>&scope=film` (verified by Alonso). Same markup as the
  music one (`li#page_user_compat_item_N`, `a.user`, `.page_user_compat_pct`); the HTML doesn't state the scope, it's told apart
  by the URL.
- Stored under the new key `rym_chart_picker_compat_film_v1`. Passive capture and "sync" (one fetch, fallback to
  opening the page) work the same as for music, using `&scope=film`.
- In film mode, the "compatible users" filter lets you pick the source: **Film** (default), **Music** or **Both**
  (Top N from each list, merged without duplicates; my decision). Top N, exclusions and minimum score are the same settings.
- My decision: the other defaults (language, following/followers/myself/other) apply to films the same as to records.

## To confirm with Alonso

- Nothing pending. Verified by Alonso (2026-10-26): on film charts `l:en`, decades (`2000s`),
  ranges (`2000-2010`) and `g:all,…` ("Must contain all genres") work. `s:comedy` was silently ignored: confirms that
  film Comedy is `comedy-1` and that a wrong slug doesn't error, it just drops out of the filter.

## Fixtures


Copies of the HTML saved by Alonso (RYM film, `/film_genre/Computer+Animation/`, film chart,
Letterboxd film) in `test/fixtures/film/`, trimmed to what's needed. No requests to RYM.
