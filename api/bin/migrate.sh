#!/bin/sh
#
# Datenbank-Migrationsskript für Flask-Projekte
# Führt zuerst ein Upgrade aus und erstellt dann
# eine neue Migration mit einem übergebenen Kommentar.
# 
# Verwendung:
#   ./migrate.sh "Kommentar zur Migration"
#

# Argument prüfen
if [ -z "$1" ]; then
  echo "❌ Fehler: Bitte gib einen Kommentar für die Migration an."
  echo "➡️  Beispiel: ./migrate.sh \"Neue Tabelle für Benutzer\""
  exit 1
fi

cd ..

# DB prüfen
#PYTHONPATH=. flask db current

# Upgrade der Datenbank (existierende Migrationen anwenden)
echo "🔄 Führe 'flask db upgrade' aus..."
PYTHONPATH=. flask db upgrade

# Neue Migration mit Kommentar erstellen
echo "📝 Erstelle Migration mit Kommentar: $1"
PYTHONPATH=. flask db migrate -m "$1"
