#!/bin/sh
#
# Aktiviert die Python 3.11 Virtual Environment aus dem Projektstammverzeichnis.
# Hinweis: Dieses Skript **muss** mit `source` oder `.` ausgeführt werden, damit die Aktivierung im aktuellen Terminal wirksam ist.
#
# Verwendung:
#   source api/bin/activate.sh
#   . api/bin/activate.sh
#

# Warnung, falls das Skript direkt ausgeführt wird:
if [ "$0" = "$BASH_SOURCE" ] || [ "$(basename -- "$0")" = "activate.sh" ]; then
  echo "❌ Dieses Skript muss mit 'source api/bin/activate.sh' oder '. api/bin/activate.sh' ausgeführt werden."
  echo "💡 Andernfalls wirkt die Aktivierung der virtuellen Umgebung nicht im aktuellen Terminal."
  exit 1
fi

cd ..
source venv/bin/activate
