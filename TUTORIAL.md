# Tutorial: RYM Toolkit

The panel lives in the top-right corner of every RYM release page and every RYM chart.
The idea: you take data from the record in front of you (genre, year, descriptors, language) and, with one click,
open the matching RYM chart. With the compatible-users filter, that chart turns into
a personal recommender.

## 1. The panel

| Button | What it does |
|---|---|
| **Chart Search: OFF / ON** | Turns on selection mode. With ON, the release's data becomes clickable. |
| ▾ / ▴ | Shows or hides what you've selected. |
| 🔍 | Opens the chart with what you have so far (shortcut for "Open chart"). |
| ⚙ | Settings. |

At the bottom of the panel you always see the **URL** that will open. If something looks off, that's where you'll see it.

## 2. Basic flow (from a release)

1. Click **Chart Search: OFF** → ON. The cursor turns into a crosshair over the things you can pick.
2. Click the data you want:
   - **Genre** (Alternative R&B, Art Pop…) → `g:` if it's on the first line, `s:` if it's on the second (influences).
   - **Year** in "Released" → cycles `2019` → `2010s` → *all time*. See §3.
   - **Descriptor** (ethereal, melancholic…) → `d:`.
   - **Language** → `l:`. The **Type** is picked in the panel's **Music releases** table (see §3b).
3. Each click is added as a chip in the panel. Click the chip to remove it.
4. **Open chart** → opens in a new tab.

**Clear** wipes the selection (it doesn't touch the users filter or the settings).

## 3. Year

Clicking the release's year cycles **year → decade → all time**. The chip shows which mode it's in. If you don't touch
anything, the chip says *all time* (clicking that chip also takes the record's year).

## 3b. Music releases

Same table as RYM's native filter on charts: Album / EP / Mixtape / DJ Mix / Single / Compilation /
Video / Unauthorized / Music video / Addl release. By default the type of the record you're on is turned on
(below it says *default: Same as release page (Mixtape)*); clicking a cell turns it on or off.
Shortcuts at the top right: **all** (everything), **main** (Album, EP, Mixtape, DJ Mix), **albums**, **singles**,
**clear** (goes back to the default).

## 4. "Must contain all"

Next to the **Primary genres**, **Secondary genres / influences** and **Descriptors** headings a
small **must contain all** switch appears as soon as you pick something from that row:

- Off → the record needs *any* of them (Cloud Rap **or** Ambient Pop).
- On → it needs *all* of them (Cloud Rap **and** Ambient Pop). In the URL it shows up as `s:all,…`.

Everything is **off by default** (include). If you want influences to always start on "must contain all", turn it on in ⚙ → Genre matching defaults.

## 5. Compatible users

RYM computes your 100 most compatible users in `find_similar_users`. The script uses them as the chart's `u:`
filter: instead of 100,000 votes, the ranking comes from 10–25 people who rate like you.

In the main panel, **Users** row:
- Check **Compatible users** and pick **top 5 / 10 / 25 / 50**. Done: the chip below says `10 compatible`.
- The first time, it syncs on its own. If RYM blocks the sync, the compatibility page opens in another
  tab and the list saves itself there (you'll see "saved 100 compatible users"). Go back and reload.

Fine-tuning in ⚙ → **Compatible users**: minimum score (off by default, relative to #1), include your
own ratings (off by default), and uncheck specific users. That's also where you combine it with
"I'm following", "Myself", etc.

It's remembered across charts and re-syncs on its own every 7 days.

## 6. Editing a chart (chart mode)

On any `/charts/...` page the panel says **"RYM Toolkit: edit this chart"**. Click → it loads the type, year,
genres, descriptors, languages and users from the current URL. Change whatever you want and:

- **Update chart** → reloads the same tab with the new chart.
- **Shift + click** on Update chart → opens it in a new tab (to compare two versions).

If the chart had users in its URL, the chip says `from URL (N users)` and that's respected until you touch the
users filter in settings.

### Random (1.5)

On any chart, under the blue bar there's a **Random [1] – [N] Roll** row. You set the range (e.g. 1 – 100),
hit **Roll** (or Enter in a field) and a number comes up: if it's on this page, the entry gets a yellow
border and the page scrolls down to it. If it lands on another page, you get a link `#55 → page 2`; when you open it, the entry
arrives highlighted. If the chart is shorter than the range, it says `chart ends at #N`. If the number lands on a RYM tie or gap,
it highlights the entry above: `#3 (shown as #2)`. The range is remembered across charts.

## 7. Recipes for lists

| You want | Do |
|---|---|
| More records like this one, according to people like you | primary genre + **Top 10 compatible** |
| The scene of that moment | genre + year cycled to its **decade** |
| Gems your circle underrates | **Esoteric** listing (settings) + compatible + a descriptor |
| What your people are listening to this year | compatible + current year, no genre |
| Narrow down a chart that came out too broad | open it → chart mode → add a descriptor or narrow the year → Update |

Listing (**Top / Popular / Esoteric / Diverse**) is picked in ⚙ and remembered.

## 8. Settings worth touching once

- **Default release type when none is selected**: "Same as release page" (default) uses the record's type.
  Set "All release types" if you want EPs and singles to always be included.
- **Minimum compatibility score**: off (0) by default. If you raise it, it trims the list *before* the top N, so
  "top 50" can give you fewer than 50.
- **Your username**: detected automatically from the header. If it says "Not detected", type it here and reload.
- **Panel behavior**: "Stay visible while scrolling" if you prefer the panel fixed.

## 9. Lists (1.3)

Three uses: look critically at the lists a record appears on, save the ones worth keeping, and find
lists by the people compatible with you.

**On a record's page.** RYM's lists section is replaced by a tabbed view
**Curated / Unrated / Logs & other / All** (the number in parentheses is how many there are). Curated are themed
lists; Logs are listening logs and the like; Unrated are the ones the script hasn't read (or whose reading expired, see below) and that neither the title nor a manual classification places; a title like "listening log" is marked `log?` until it's read. Each row has
cover art, title, author, chips (`♥ likes`, `N items`, `compat` if the author is on your compatible list), a
star and a classification selector. "Show RYM's view" brings back the original section; "Show RYM Toolkit view"
returns to the new one.

**"Rate N unrated (~Ns)" button.** Opens each unrated list, one by one with a pause, to read likes, items and
categories. It also counts the ones whose reading expired and the `log?` ones. While it runs, the button says "Rating N/M…" and next to it there's a "Stop". If RYM blocks (Cloudflare), the script warns "RYM blocked the fetch; open
lists manually, they get rated as you visit them": open the lists yourself and they save themselves when you visit them. That's
the safest way; the button is only worth it in small batches.

**Star and favorites.** The star (☆/★, "Star this list") saves the list. In the panel, **Lists** section,
"Starred" shows the 10 most recent (ordered by star date) (there's an option to see all of them) with an "x" to remove them ("Unstar"). Starred
lists move up in the order and aren't deleted from the cache. Likes/classification are kept for 30 days; after that the list goes back to Unrated (it keeps its star and manual classification).

**Manual classification.** Each row's selector (`auto / curated / log / other`) forces the classification when the
script gets it wrong. It's remembered, and `auto` sends it back to the normal calculation.

**Find lists on RYM.** In the panel (Lists section) it opens, in a new tab, a list search with the selected primary
genres (their names) plus the year chip (year, decade or range; left out if it's "all time"). It uses RYM's list
search type (`searchtype=s`, configurable as `List search type` in ⚙).

**Lists by compatible users.** Opens a window with your compatible users' lists (the ones in the settings' top N),
grouped into Curated / Unrated / Logs & other. "Rate N unrated" works the same as above; the button
says "Fetching N/M… · Stop" while it works. If RYM blocks on the **first** user, "Open <user>'s lists" appears so you can open their
index by hand. Each user's index is considered fresh for 7 days; each list's metadata, 30. Only users
who currently show up in your compatible selection (top N, exclusions) are shown.

**New settings (⚙, Lists block).**

- **List search type**: `searchtype` value for searching lists (`s` = Lists on RYM).
- **Delay between list fetches (ms)**: pause between lists (default 3000, minimum 1000).
- **Max lists per click**: cap per click (default 25, maximum 100).

What it doesn't do: it doesn't group "lists you keep running into" across several records (dropped).

## 10. Films and Letterboxd (1.4)

**On a film page** (`/film/...`): Search ON, click the year (cycles year → decade → *all time*) and the
genres (first line → `g:`, second → `s:`). Films don't have descriptors. **Open chart** opens the film chart.

**On a film genre page** (`/film_genre/...`): there's a **Top chart** button that opens that genre's chart.
With Search ON you can click a year in the list or the related genres to add them to the filter.

**On a film chart**: same as with music, "edit this chart" lets you change the filter in place.

**Film compatible users**: the source is picked in the panel's **Users** row, with the **Film / Music / Both** selector
(it only appears on film pages; **Film** by default). It's disabled while the compatible-users toggle
is off, so it doesn't wipe a chart's `u:`. **Sync now** syncs a single list per click depending on the source: Film
or Music syncs its own; with **Both**, the first one that's *stale*, starting with the film one, and if neither is,
the film one. The automatic sync on page
load refreshes at most one list: on film pages, the film one if the source uses it; the music one is refreshed on
music pages or with **Sync now**.

On film pages the settings don't show "Default release type" or the **Lists** section: those are music-only.

**Letterboxd ↔ RYM**: on a RYM film the **Letterboxd** button appears, and on Letterboxd the **RYM** button. They open the
first DuckDuckGo result (no requests from the script). The **search** link shows the list of results in case
the first one isn't the right one.

## 10b. Play on Spotify (1.7)

- On a music release there is a **Listen** row at the end of the info table with a green **▶ Spotify** button. On a
  music chart every entry gets a smaller **▶ Spotify** next to its rating.
- Click it: Spotify opens the album in a tab and presses play by itself (within ~20 s, once the player loads).
  Later clicks try to reuse that same Spotify tab.
- **Green** = RYM had the Spotify link, so it is the right album. **Outlined** = no link on the page: it searches
  "artist + title" on Spotify and plays the first album found, which can be the wrong one with odd titles.
- If Spotify opens but doesn't play, Chrome blocked autoplay for that tab: press play once and it usually works
  from then on.

## 11. If something goes wrong

- The chart opens the general ranking (OK Computer, To Pimp a Butterfly…): the filter wasn't applied. Look at the
  gray URL in the panel and send it to me.
- "Could not detect your username": settings → Your username.
- "No compatible users yet": Sync now.
- Lists say "RYM blocked the fetch": wait a few minutes, open the lists by hand and raise the delay in settings.
