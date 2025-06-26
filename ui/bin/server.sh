#!/bin/sh
#
# Startet den lokalen Entwicklungsserver der UI mit Vite.
# Voraussetzung: Node.js, npm und alle Abhängigkeiten müssen installiert sein.
# Anwendung: ./start-ui.sh oder über ein übergeordnetes Setup-Skript
#

cd "$(dirname "$0")/.."

npm run dev
