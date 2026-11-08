# RYM Chart Picker+ 1.3: Lists (design)

Date: 2026-10-21 · Status: design approved in conversation, pending plan and implementation.
Read `2026-10-20-rym-chart-picker-1-1.md` first (script context, verified RYM facts, Cloudflare).

## Intent

On a release page, RYM shows "lists this album is on". Most are personal diaries
("listening log 2026", "2024 : LOG", "*") and there's no way to tell the curated lists apart without opening them one by one.
Alonso wants to find curated lists: starting from the record he's looking at, and also starting from people with
taste similar to his. RYM's classifier (`/list_classifier/`) is the source of truth for what a list is,
but it's only visible on each list's page.

## RYM facts verified in this session (2026-10-21, Alonso's screenshots)

- List page (`/list/<user>/<slug>/`): title, "A list by <user>", `Categories: <links to the classifier>`,
  `[List<id>]`, likes as `♡ +N`, pagination with the total item count (e.g. "369 - 345" on the first page),
  "Suggest an addition" button. Example: `listening log 2026` → Categories: Listener's Diary, 1 like, 369 items.
- Classifier page (`/list_classifier/<Encoded%20name>/`, e.g. `Listener%27s+Diary`): flat, paginated
  listing (1,260 pages for Listener's Diary), each entry with title, description, "Author: <user>; N items".
  **No likes, no popularity sort, no genre or year filter.** Internally it's a descriptor
  (`[Descriptor27287]`). Useless for ranking or searching; only as a dictionary of categories.
- Classifier taxonomy (Music branch and cross-cutting ones; pasted by Alonso): Best Of, Chart Position,
  Music Genres (Pop, Rock…), Music Scenes, Time Periods → All Time / Century / Decade (1870s–2020s) / Year
  (1950–2026), Underrated, Obscure, Worst Of, Influences, Record Labels, Discographies, Artist, Composers,
  Producers, Instruments, Length, Live Performance, Radio, Samples, Scores & Soundtracks, Songs (Homemade
  Playlists, Lyrics…), Releases (Release Attributes, Release Titles, Cover Song Versions, Music Videos),
  Lists From Other Publications (1001 Albums…), Galleries → Cover Art Themes (many subcategories),
  RYM → Autobiographical (Listener's Diary, Gamer's Diary, Viewer's Diary, My Life on RYM), Users, Poll Results,
  Lists of Lists, Projects, Shopping List, Wishlists, Upcoming, Reviews, Humor, Guide, Regions, Miscellaneous.
- Lists section on the release page: card with cover, title (truncated) and author. **Nothing else**: no
  likes, no category, no size. DOM selectors still to be verified (see "To verify").

## Decisions (Alonso's)

1. **Tabs in the release's lists section** (option B in the mockup): Curated · Unrated · Logs · All.
   Replaces the flat view; the good stuff by default, the noise one click away.
2. **Lists by compatible users**: discover curated lists where the current record isn't necessarily on,
   by going through the lists of the `find_similar_users` users we already have cached.
3. **Search lists with the picker's filters**: shortcut to RYM's list search with genre + year from the current
   state.
4. **Support on the list page**: the panel shows up on `/list/*`, shows the list's rating and lets you
   star it; starred lists become quick links in the panel.

Rejected by Alonso (don't build): "Lists you keep running into" (aggregating lists across
visited releases). Browsing via the classifier page (it doesn't rank).

## Goals / Non-goals / Anti-goals

- Goal: on a release, see curated lists first with category, likes and size; hide diaries.
- Goal: from the panel, reach curated lists by compatible people and RYM's list search.
- Goal: from a list, save it as a favorite and see it from any page.
- Non-goal: rank the entire classifier, index RYM, or replicate its search engine.
- Non-goal: change anything in the existing charts flow (1.2.0 semantics intact).
- Anti-goal: **triggering Cloudflare**. A 403 on real RYM is a design failure, not a detail. No automatic
  background fetch; every fetch is explicit, sequential, paced, and stops at the first error.
- Anti-goal: breaking the native lists section (RYM's listeners, re-render). If the script fails, the original
  section must stay visible and intact.

## Constraints

- A single file `rym-toolkit.user.js`; pure functions above `module.exports`, with tests in
  `test/pure.test.js`. All classification, scoring, document parsing and URL building logic is
  pure and tested against fixtures.
- Settings stay in `rym_chart_picker_settings_v16`. New keys: `rym_chart_picker_lists_v1` (list
  metadata cache) and `rym_chart_picker_starred_lists_v1` (favorites). Compatibles: `rym_chart_picker_compat_v1`.
- New `@match`: `https://rateyourmusic.com/list/*` (and `www.`). Possibly `/~*/lists*` if the
  "open the page and capture" fallback is used for user lists (see F2).
- UI in English. Bump `@version` to 1.3.0.

## Data model

### Classifying a list

Three classes: `curated`, `log`, `other`, plus `unknown` when there's no data.

- By **classifier category** (source of truth, when the list is already cached). The list page
  only shows the leaf ("Listener's Diary", "Shoegaze", "1994"), without the path to the root, so the tree is **not**
  embedded: two short sets are kept and the default is `curated` (designer's call: what Alonso
  is looking for are genre/year/region/scene lists, which are exactly the leaves that would be impossible to enumerate).
  - `log` (closed set): Listener's Diary, Gamer's Diary, Viewer's Diary, My Life on RYM, Autobiographical,
    Wishlists, Shopping List, Upcoming, User Stats, Favorite Users or Friends, RYM Users in Real Life, Fans Of…,
    Users.
  - `other` (closed set): Galleries, Artist Galleries, Cover Art Themes and its leaves pasted by Alonso
    (Animals, Architecture & Edifices, Business & Finance, Clothing & Accessories, Colors, Culture & Ethnicity,
    Drugs & Alcohol, Fine Arts, Food & Drink, Graphic Design, Health & Medicine, History, Housewares, Media &
    Communication, People, Men, Women, Plants, Religion & Mythology, Science & Nature, Spoofs & Similarities,
    Sports & Games, Symbols, The Human Body, Transportation, Travel & Geography), Release Attributes, Release
    Titles, Cover Song Versions, Music Videos, Humor, Lists of Lists, Projects, Miscellaneous, Reviews, Front Page
    Reviews, Radio, Memoriam, Lost Media, Other Databases, Subculture, Fandom, Television, Anime, Videos, Books,
    Comics, Magazines, Awards, Games, Free and Legal, Films and its whole branch, Video Games and its whole branch, RYM, RYM25.
  - Any other category → `curated`.
  - Several categories: `log` beats everything; then `other`; then `curated`.
  - Page read with no categories: `curated` if likes ≥ 3, otherwise `other` (designer's call).
- By **title** (provisional, when there's no cache): case-insensitive pattern on the title:
  `log`, `diary`, `journal`, `listening`, `listened`, `first listens?`, `\b20\d\d\s*:`, `^\W*$` (symbols only,
  like "*"), `w\.?i\.?p`, `to listen`, `backlog` → provisional `log`. Everything else → `unknown`.
  A provisional `log` is shown in the Logs tab with a "guessed from title" indicator; the real data
  replaces it as soon as it exists.
- **Manual override**: on any row, a menu with "Mark as curated / log / other / reset". Stored in the cache
  with `override: true` and it beats category and title.

### Scoring within Curated

`score = log10(likes + 1) * 10 + (compat ? 5 : 0) + (starred ? 100 : 0)`. Descending order; ties broken by
likes, then title. `compat` = the author is in the selected compatibles list (`selectCompatUsers`),
not in the full list of 100. This formula is the designer's call; the builder can tweak it if the tests
show something odd, without changing the priority order (starred > likes > compat).

### List cache (`rym_chart_picker_lists_v1`)

```
{ version: 1,
  lists: { "<listId>": { id, url, title, author, categories: [..], likes, items,
                         fetchedAt, override?: "curated"|"log"|"other" } } }
```

- `listId` is the number from `[List<id>]`. If the release section doesn't expose the id (only the URL), the key
  is the normalized path `/list/<user>/<slug>/` and the id is filled in when the page is read.
- Expires after 30 days (`fetchedAt`); an override doesn't expire. Cap of 3,000 entries; when exceeded, the
  oldest ones without override or star are dropped.
- Filled in three ways: passive (every time Alonso opens a list page, the script parses and stores it),
  on demand ("Rate" button, F1), and when going through compatibles' lists (F2).

### Favorites (`rym_chart_picker_starred_lists_v1`)

`{ version: 1, lists: [ { id, url, title, author, starredAt } ] }`, sorted by `starredAt` desc. No hard cap.

## Features

### F1 · Tabs in the release's lists section

- When a release loads, the script reads the native lists section and builds its own view **next to it**
  (it doesn't replace the native `innerHTML`; the original section is hidden with CSS and can be restored with a
  "Show RYM's view" button). If parsing fails or the section doesn't exist, nothing happens.
- Header: `Lists · 13` + tabs `Curated (4) · Unrated (6) · Logs & other (3) · All` + button
  `Rate 6 unrated (~20 s)`. (Designer's call: the `other` class shares a tab with `log`, in its own sub-block
  below the logs; it doesn't clutter Curated and doesn't deserve its own tab.)
- Unrated = class `unknown` = list not read yet (no cache or expired). That's what the Rate button counts.
- Default tab: Curated if it has ≥1; otherwise Unrated; if there's nothing in any, All. All = original order.
- Row: cover, full title (not truncated, wrapping), author, and on the right: category chip (first
  recognized category; "Diary" in red, curated in green, others in gray), `♥ N`, `N items`, `compat` chip if
  applicable, star (toggle, F4), override menu. Unrated shows "unrated" and, if it's a provisional log, "log?".
- **Rate** button: goes through the lists with no cache (or expired), one at a time, `fetch` with `credentials: include`,
  3 s pause between fetches (constant `LIST_FETCH_DELAY_MS`), at most 25 per click. Progress on the button
  ("Rating 3/6…"), "Stop" button. At the first status ≠ 200 (or HTML without the `[List` marker) it stops and shows
  "RYM blocked the fetch; open lists manually, they get rated as you visit them". Each rated list
  moves tabs live.
- Rows keep the native links; a normal click opens the list (same tab, like RYM). Visiting the
  list rates it via the passive path.

### F2 · Lists by compatible users

- In the panel, a new **Lists** section (below Users). Button `Lists by compatible users`.
- On click: takes the users from `selectCompatUsers` (the same N as the `u:` filter), goes through `/~<user>/lists`
  (**URL to be verified**) sequentially with the same policy as F1 (3 s, stop at the first error, at most 10
  users per click, Stop button), parses each user's lists and stores them in a per-user cache
  (`compatLists: { "<user>": { fetchedAt, lists: [ {url,title, items?, categories?} ] } }` inside
  `rym_chart_picker_lists_v1`, 7 days).
- Result: "Lists by compatible users" panel/modal with lists grouped by class (Curated first,
  then Unrated, Logs collapsed), each with author, chips as in F1, star. If the user's lists page
  carries categories or size, they're used; otherwise, title classification and a "Rate" button as in F1.
- Cloudflare fallback: if the fetch fails on the first user, the button changes to "Open <user>'s lists" and the
  script (with `@match` on `/~*/lists*`) captures the page when it opens, just like today with `find_similar_users`.

### F3 · Search lists with the picker's filters

- In the panel's Lists section, a `Find lists on RYM` button. Opens RYM's list search in a new tab
  with the term built from the current state: labels of the selected primary genres + year label
  (`2015`, `2010s`; nothing if all time). Example: `cloud rap 2010s`.
- URL **to be verified**: `https://rateyourmusic.com/search?searchterm=<term>&searchtype=l`. Pure function
  `buildListSearchUrl(state)`; if the term ends up empty, the button is disabled.
- No further smarts: it's a shortcut, not discovery.

### F4 · List page and favorites

- `@match /list/*`. The script parses the page (`parseListDocument(doc)` → id, url, title, author, categories
  (text and href), likes, items) and stores it in the cache (passive path).
- The panel shows up on the list page with the Lists section at the top: title, chips (category, likes, items,
  class), star toggle, override. The rest of the panel (genres, year…) does **not** apply on lists: it's hidden;
  "Open chart" isn't shown.
- **Starred lists**: on every page (release, chart, list), the panel's Lists section shows the
  favorites as links (title · author · ♥), with "unstar" on hover. At most 10 visible and "show all".
- Star also available on F1 and F2 rows.

### Anti-Cloudflare policy (applies to F1 and F2)

- Pause and cap are settings (`listFetchDelayMs`, default 3000; `listFetchMax`, default 25 lists / 10 users),
  not constants, so we can back off without rebuilding.
- Back-off order if the loop triggers 403 on real RYM even with the pause: 1) raise the pause to 6–8 s and lower the cap to 10;
  2) if it keeps failing, F1 keeps only the passive path + manual override and the Rate button is hidden; 3) F2 becomes
  only "Open <user>'s lists" with capture on open (the fallback becomes the main path).
- Investment in progress/Stop UI: minimal (text on the button + Stop button); no bars or queues.
- After a 403, normal browsing keeps working (based on the 1.1 experience: the open-the-page fallback
  worked right after the 403). If the opposite is observed in 1.3, the per-click cap drops to 5.

## To verify on real RYM (Alonso, logged in, before or during implementation)

Each one needs the real HTML saved as a fixture in `test/fixtures/`:

1. Release: selector for the lists section and for each card (list href, title, author, cover).
   Is there a "more lists" link or pagination for that section? Fixture: `test/fixtures/release/.../` (a release
   page already exists; the real lists section needs to be included).
2. List page: selectors for `Categories` (links to `/list_classifier/...`), likes (`♡ +N`), total items
   (pagination or counter), `[List<id>]`. Fixture: `test/fixtures/list/`.
3. A user's lists: exact URL (`/~user/lists`?) and what each entry carries (title, categories, size,
   likes). Fixture: `test/fixtures/user_lists/`.
4. List search: the real `searchtype` parameter for lists.
5. That a `fetch` with `credentials: include` of a list page returns full HTML with the session (same
   as `find_similar_users`).

## What's left to the builder

- Exact DOM structure of the new section and the F2 modal, following the current panel's style
  (`.rym-picker-*`, RYM theme variables).
- Where exactly the Lists section goes inside the panel and how it collapses.
- Status and error text (in English).
- Pure function for parsing the HTML of the lists section and of the list page, with tests against the
  real fixtures.
- Suggested implementation order: F4 (list parser + cache + star) → F1 → F3 → F2.
- Update `TUTORIAL.md` and `CLAUDE.md` (verified facts, new keys, Cloudflare semantics).

## Status (2026-10-21)

Implemented in 1.3.0 (branch `lists-1.3`): list page and user index parser, cache with 7-day freshness
and pruning (starred or overridden lists are kept), passive capture when visiting a list, star and
favorites, Curated/Unrated/Logs tabs on the release with "Rate N unrated", Find lists on RYM button,
Lists by compatible users window, classification overrides and settings (`List search type`, delay, cap).

To verify on real RYM:

- Markup of the release page's lists section (the fixture is a guess; the parser works by anchors).
- The correct `searchtype` value for lists (`l` returned records).
- Cloudflare behavior with the default 3 s delay in batches of 25.

