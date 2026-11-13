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
   `~/.local/bin/rym-abrir`. It exists so the Automation permission belongs to a fixed
   app instead of whatever app is in front.
4. **`rym-abrir`**: if a Chrome window already has RYM, opens a tab there and brings it to the front. Otherwise it
   opens a new Chrome window (Default profile), waits for it to exist, moves it to the screen the mouse is on
   (centered, only if Chrome put it elsewhere) and brings it to the front.

Log of each run: `~/Library/Caches/rym/log` (`reuse:`, `window:`: `ok in place` / `ok moved` / `ok no-screen` / `no-window`).

## Simplified 2026-11-12

Alonso asked to drop the empty-desktop search (`rym-espacio-vacio.js` and the `rym-espacios` Swift helper: ⌃→,
Mission Control, moving the window between screens). It complicated everything; now it only opens the window.
`install.sh` deletes the old copies from `~/.local/bin`. They are in git history if they are ever needed.

Backup of the previous version: `~/.local/share/rym-backup-2026-10-27/`.
