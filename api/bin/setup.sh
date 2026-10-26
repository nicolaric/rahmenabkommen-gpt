#!/bin/bash
#
# Setup-Script für das API-Backend
#
# Dieses Script führt folgende Schritte aus:
# - Wechselt in das api-Verzeichnis
# - Sucht einen passenden Python-Interpreter, sonst Abbruch
# - Erstellt eine virtuelle Python-Umgebung, falls nicht vorhanden
# - Aktiviert die virtuelle Umgebung
# - Aktualisiert pip, wheel und setuptools
# - Installiert alle Python-Abhängigkeiten aus requirements.txt
# - Setzt die FLASK_APP Umgebungsvariable auf main.py
# - Führt Datenbank-Migrationen aus (init, migrate, upgrade) oder aktualisiert bestehende Migrationen
# - Gibt Statusmeldungen für jeden Schritt aus
#
# Nutzung: einfach im Projekt-Root das Script ausführen, es kümmert sich um Setup & Migration.
#
# Die Antworten kommen von yeos; das API speichert nur Konversationen
# (Teilen, Statistiken, Sitemap) und braucht daher nur Flask-Pakete.
#


cd "$(dirname "$0")/.."
set -e

PYTHON_VERSION="3.13"

if command -v python${PYTHON_VERSION} >/dev/null 2>&1; then
  PYTHON_BIN=python${PYTHON_VERSION}
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN=python
else
  echo "❌ No suitable python interpreter found."
  exit 1
fi

# virtuelle Umgebung anlegen wenn nicht vorhanden
if [ ! -d "venv" ]; then
  $PYTHON_BIN -m venv venv
  echo "✅ Virtual environment created with Python ${PYTHON_BIN}."
fi

source venv/bin/activate
echo "✅ Virtual environment activated."

pip install --upgrade pip wheel setuptools

pip install -r requirements.txt

echo "✅ All requirements installed."

export FLASK_APP=main.py

# Migrationen ausführen oder initialisieren
if [ -f "migrations/env.py" ]; then
  echo "✅ Existing migrations detected, upgrading DB schema..."
  flask db upgrade
else
  echo "⚠️ No migrations found, initializing new migration..."
  flask db init
  flask db migrate -m "Initial migration"
  flask db upgrade
  echo "✅ Database migration completed."
fi

echo "🎉 Setup completed successfully!"
