#!/bin/zsh
# Copies the repo scripts to ~/.local/bin (the Shortcut runs them from there). Leaves "RYM Abrir.app" alone:
# recompiling it would drop the Automation permission it already has.
set -e
cd "${0:a:h}"
mkdir -p ~/.local/bin
cp rym rym-abrir ~/.local/bin/
chmod +x ~/.local/bin/rym ~/.local/bin/rym-abrir
# The empty-desktop search was removed on 2026-11-12
rm -f ~/.local/bin/rym-espacio-vacio.js ~/.local/bin/rym-espacios
echo "Installed to ~/.local/bin"
