# RYMsearch Shortcut (Spotify → RYM)

Opens on Rate Your Music the album playing in Spotify (desktop app). This is the versioned copy; what actually
runs lives in `~/.local/bin`. After editing: `./install.sh`.

The file names are Spanish on purpose: they are the installed commands the Shortcut and the applet call.

## Chain

1. **"RYMsearch" Shortcut** (Shortcuts app, Quick Action with an assigned key): a single
   *Run Shell Script* action → `~/.local/bin/rym` (zsh, input to stdin). It can't be exported from the terminal.
2. **`rym`**: asks Spotify for artist/album, strips suffixes (Deluxe, Remaster…), builds the URL
   (DuckDuckGo `\` → first `rateyourmusic.com/release` result; `rym search` = RYM's own search),
   writes it to `~/Library/Caches/rym/url` and opens `~/Applications/RYM Abrir.app`.
3. **`RYM Abrir.app`** (AppleScript applet, source in `RYM Abrir.applescript`): only runs
   `~/.local/bin/rym-abrir`. It exists so the Accessibility/Automation permissions belong to a fixed
   app instead of whatever app is in front.
4. **`rym-abrir`**: if a Chrome window already has RYM, opens a tab there. Otherwise it calls
   `rym-espacio-vacio.js`, opens a new Chrome window (Default profile), waits for it to exist,
   places it on the right screen and brings it to the front.
5. **`rym-espacio-vacio.js`**: if the desktop you are on is already empty, opens there without moving. Otherwise,
   with ⌃→ it checks only to the right (+1, +2, …; the left side is almost always full). If it reaches
   the last one without finding an empty desktop, it creates a new one (Mission Control → "+", Esc) and switches
   to it; if that fails, it goes back to the original. It knows which desktop it is on through `rym-espacios`
   (a Swift helper, `rym-espacios.swift`, compiled by `install.sh`).

Log of each run: `~/Library/Caches/rym/log` (`reuse:`, `space:` — `here` / `ok` / `new` / `none` / `lost` / `no-info` —, `window:`).
Entries from before 2026-11-08 use the old Spanish labels (`reuso:`, `espacio:`, `aqui`, `nuevo`, `ninguno`, `perdido`, `ventana:`).

## Fix 2026-10-27 (empty desktop without the tab, with and without a monitor)

- The current desktop was read from the `.plist`, which macOS writes late (also via `defaults`:
  tested; it moved right, didn't notice and went back). Now it asks live with `rym-espacios`
  and each key press is confirmed by waiting until the desktop really changes.
- With "Displays have separate Spaces" the script always checked the main screen, even when the
  keys moved the other one: now the first key press detects which screen moved and uses that one.
- "Empty" only looked at the top-left corner of each window: now it uses real intersection and
  confirms with two reads.
- Chrome was activated at 0.7 s, before the window existed, and macOS jumped to another desktop
  with Chrome. Now it waits for the new window (up to 10 s) and, if Chrome opened it on the other screen,
  moves it into the area of the screen you are on.

Backup of the previous version: `~/.local/share/rym-backup-2026-10-27/`.
