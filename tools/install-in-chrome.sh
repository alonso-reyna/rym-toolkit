#!/bin/zsh
# Opens the script's install link (current commit, or the SHA you pass) in the Chrome window that has RYM.
# Only opens GitHub raw; makes no requests to rateyourmusic.com.
sha=${1:-$(git -C "${0:A:h}/.." rev-parse HEAD)}
url="https://raw.githubusercontent.com/alonso-reyna/rym-toolkit/$sha/rym-toolkit.user.js"
print -r -- "$url"
osascript - "$url" <<'OSA'
on run argv
	if application id "com.google.Chrome" is running then
		tell application id "com.google.Chrome"
			repeat with w in windows
				repeat with t in tabs of w
					if URL of t contains "rateyourmusic.com" then
						tell w to make new tab with properties {URL:(item 1 of argv)}
						set index of w to 1
						activate
						return "opened in the RYM window"
					end if
				end repeat
			end repeat
		end tell
	end if
	do shell script "open -b com.google.Chrome --args --profile-directory=Default " & quoted form of (item 1 of argv)
	return "opened in Chrome (Default profile)"
end run
OSA
