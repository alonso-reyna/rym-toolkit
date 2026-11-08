# RYM Chart Picker 1.1: Brainstorm / Discovery Notes
Date: 2026-10-20 · Goal: Pin down the exact scope of version 1.1 of the userscript (bugs, year picker, compatible users) before writing code.

## Prior context (from the conversation)
- Base script: RYM Music Chart Picker 1.0.2 (Lin808), runs in Tampermonkey on `/release/*`.
- Triggering bug: `rymSlug` turns `&` into `and` → `g:alternative-r-and-b` doesn't exist on RYM.
- Bugs found: release types via URL (comp/djmix/musicvideo/unauth fall back to "all"), username picked by on-screen position, year/genre highlighting across the whole page, `render()` performance.
- What the user wants: fix the bugs, a year picker, integrate `find_similar_users?user=alonsoreyna` as a `u:` filter, all inside the picker panel.

## Summary / key decisions
- Own fork ("RYM Chart Picker+", own namespace, v1.1.0). Same settings key `rym_chart_picker_settings_v16` so no configuration is lost.
- Runs on `/release/*` and `/charts/*` (on charts: parses the URL → editable state).
- Year picker: clicking cycles year → decade → all-time; from/to; ±N button (default 2). The chip always shows the mode.
- Compatible users: sync from `find_similar_users` (manual + auto if >7 days old), Top N + 70 % threshold, "include me" default NO, persistent exclusions.
- User filter visible as a chip in the main panel, combinable with Following/Followers/etc. "Clear" doesn't reset it.
- Open chart: release → new tab; chart → same tab (Shift+click = new tab).
- URL preview at the bottom of the panel (click selects all). No Copy button.
- 1.2: presets, persistent basket, Shift+click exclusion, keyboard shortcuts, artist/genre pages.

### 1.1 scope (closed)
Bug fixes · URL preview · year picker · compatible users · chart mode · users chip.

## Q&A log
### Q1 — Fork vs contribution
- Asked: Own fork or a PR to Lin808's script?
- Captured: Own fork. Keep the same settings key. Maybe a PR to Lin808 with just the bug fixes, later.
- Flags: none

### Q2 — Page scope
- Asked: Where does the script run?
- Captured: Releases + chart pages (`/charts/*`). On charts the panel parses the current URL, loads it as state, and lets you edit filters and reopen. Artist/genre are left for 1.2.
- Flags: none

### Q3 — Year picker
- Asked: What controls does the year picker have?
- Captured: Clicking the year cycles year → decade → all-time. In the panel, from/to fields. ±N button around the release year (N in settings, default 2). User's condition: "make it intuitive" → the year chip clearly shows the current mode ("2015", "2010s", "2013–2017", "all time") and the range is edited in one place.
- Flags: none

### Q4 — Selecting compatible users
- Asked: How are the users for the `u:` filter selected?
- Captured: Settings with Top N (5/10/25/50) and a minimum compatibility threshold (default 70 %); the more restrictive one applies. "Include me" toggle **default: NO**. Chip `u: N compatibles` in the panel; clicking it shows a checkbox list to exclude individual users (persistent exclusions). Manual sync with a button + auto if the list is >7 days old.
- Flags: none

### Q5 — Integration with existing user filters
- Asked: How does "compatibles" coexist with All/Following/Followers/Myself/Other?
- Captured: "Compatibles" is one more option in the same checklist, combinable (flat list in `u:`). The user filter moves up to the main panel as a visible chip ("Users: everyone" / "Users: 12 compatibles + following"). It's remembered across charts; "Clear" doesn't reset it.
- Flags: none

### Q6 — Navigation when opening a chart
- Asked: Does Open chart replace the tab or open a new one?
- Captured: On a release → new tab. On a chart → replaces the current tab; Shift+click (or a small button) opens a new tab to branch off.
- Flags: none

### Q7 — Scope cut
- Asked: What's left out of 1.1? What is the URL copy for?
- Captured: 1.1 closed as above. URL preview yes (gray line at the bottom, click selects), Copy button no. Keyboard shortcuts go to 1.2.
- Flags: verify on real RYM: structure of `find_similar_users`, `u:` syntax with several users, year range `2010-2015` → me (in the browser)

## Verified on RYM (2026-10-20, Chrome with a logged-in session)
- `find_similar_users?user=X`: `ul.page_user_compat_list > li#page_user_compat_item_N`; `a.user[href="/~name"]`; `.page_user_compat_pct` with `style="width:P%"` = relative score (rank 1 = 100 %, rank 100 ≈ 50 %) and text = rank. 100 users, no pagination. There's no absolute % → the design's threshold uses this relative score.
- Real slug for Alternative R&B: `/genre/alternative-randb/` (neither `r-and-b` nor `r-b`). Confirms: read the slug from the href.
- `charts/top/album/all-time/u:a,b,c/` → 200, "Custom chart". `u:followed_by:me,a` also works.
- `charts/top/album/2010-2015/g:indie-folk/` → "Best Indie Folk albums between 2010 and 2015". Plain hyphens work.
- Repeated fetches from the page trigger Cloudflare (403 "Verification"). The sync must be 1 fetch with a fallback: open the page and capture from there (the script also matches `find_similar_users`).
- Release page: `.album_info tr` with `th` = Artist/Type/Released/Recorded/Genres/Descriptors/Language. Genres in `.release_pri_genres a.genre` and `.release_sec_genres a.genre`. Own username: `a.header_profile_main[href^="/~"]`.

## Status (2026-10-20)
- 1.1.0 implemented in `rym-toolkit.user.js`. Pure-function tests in `test/pure.test.js` (passing). Browser smoke test with fixtures: release, chart, and compatibles capture with no errors.
- Pending: test on real RYM (install in Tampermonkey).

## Open flags (pending input)
- Verify on real RYM that `s:` filters secondary genres and that `l:` accepts ISO codes → Alonso while using it
