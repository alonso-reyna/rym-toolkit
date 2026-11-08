#!/bin/zsh
# Copies the repo scripts to ~/.local/bin (the Shortcut runs them from there). Leaves "RYM Abrir.app" alone:
# recompiling it would drop the Accessibility/Automation permissions it already has.
set -e
cd "${0:a:h}"
mkdir -p ~/.local/bin
cp rym rym-abrir rym-espacio-vacio.js ~/.local/bin/
swiftc -O rym-espacios.swift -o ~/.local/bin/rym-espacios
chmod +x ~/.local/bin/rym ~/.local/bin/rym-abrir
echo "Installed to ~/.local/bin"
