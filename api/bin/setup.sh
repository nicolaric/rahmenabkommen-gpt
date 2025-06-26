#!/bin/sh
#
# Setup-Script für das API-Backend
#
# Dieses Script führt folgende Schritte aus:
# - Wechselt in das api-Verzeichnis
# - Prüft, ob Python x.yz installiert ist, sonst Abbruch
# - Erstellt eine virtuelle Python-Umgebung, falls nicht vorhanden
# - Aktiviert die virtuelle Umgebung
# - Aktualisiert pip, wheel und setuptools
# - Installiert alle Python-Abhängigkeiten aus requirements.txt
# - Installiert wichtige Flask-Core-Pakete explizit, falls diese fehlen
# - Setzt die FLASK_APP Umgebungsvariable auf main.py
# - Führt Datenbank-Migrationen aus (init, migrate, upgrade) oder aktualisiert bestehende Migrationen
# - Gibt Statusmeldungen für jeden Schritt aus
#
# Nutzung: einfach im Projekt-Root das Script ausführen, es kümmert sich um Setup & Migration.
#
# Voraussetzung:
# - Python x.yz muss installiert sein (Siehe variable PYTHON_VERSION)
# - Git, falls Aktualisierungen vom Repository notwendig sind
#
# Wichtig:
# - Nicht getestet, sondern rekonstruiert aufgrund der manuellen Schritte, die notwendig waren!
#


PYTHON_VERSION=3.11


cd "$(dirname "$0")/.."

set -e

cd api

if ! command -v python${PYTHON_VERSION} >/dev/null 2>&1; then
  echo "❌ Python ${PYTHON_VERSION} is not installed. Please install it first."
  exit 1
fi

if [ ! -d "venv" ]; then
  python${PYTHON_VERSION} -m venv venv
  echo "✅ Virtual environment created with Python ${PYTHON_VERSION}."
fi

. venv/bin/activate
echo "✅ Virtual environment activated."

pip install --upgrade pip wheel setuptools

# Install requirements from requirements.txt
pip install -r requirements.txt

# Optional explicit installs if missing from requirements.txt:
pip install flask flask-cors flask-sqlalchemy flask-migrate python-dotenv pymupdf

echo "✅ All requirements and core packages installed."

# Set FLASK_APP env variable for flask commands
export FLASK_APP=main.py

# DB Migration setup
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
