#!/bin/bash
#
# Setup-Script für das API-Backend
#
# Dieses Script führt folgende Schritte aus:
# - Wechselt in das api-Verzeichnis
# - Prüft OS architektur und wählt die passende Python-Version und spezifische Pakete
# - Prüft, ob Python x.yz installiert ist, sonst Abbruch
# - Erstellt eine virtuelle Python-Umgebung, falls nicht vorhanden
# - Aktiviert die virtuelle Umgebung
# - Aktualisiert pip, wheel und setuptools
# - Installiert wichtige Core-Pakete explizit
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


cd "$(dirname "$0")/.."
set -e

echo "🔍 Detecting OS and architecture..."

OS_TYPE="$(uname -s)"
ARCH_TYPE="$(uname -m)"

echo "OS detected: $OS_TYPE"
echo "Architecture: $ARCH_TYPE"

# Default PYTHON_VERSION und faiss packages
PYTHON_VERSION="3.13"
SPECIFIC_PIP_PACKAGES="faiss-gpu"

if [ "$OS_TYPE" = "Darwin" ]; then
  # macOS
  if [ "$ARCH_TYPE" = "x86_64" ]; then
    echo "Detected macOS on Intel CPU"
    PYTHON_VERSION="3.11"
    SPECIFIC_PIP_PACKAGES="faiss-cpu numpy<2"
  elif [ "$ARCH_TYPE" = "arm64" ]; then
    echo "Detected macOS on Apple Silicon"
    PYTHON_VERSION="3.13"
    SPECIFIC_PIP_PACKAGES="faiss faiss-gpu"
  else
    echo "Warning: Unknown macOS architecture '$ARCH_TYPE', default settings used."
  fi
elif [ "$OS_TYPE" = "Linux" ]; then
  echo "Detected Linux"
  PYTHON_VERSION="3.13"
  SPECIFIC_PIP_PACKAGES="faiss faiss-gpu"
else
  echo "Warning: Unknown OS '$OS_TYPE', using default settings."
fi

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

echo "Using Python version: $PYTHON_VERSION"
echo "Specific packages to install: $SPECIFIC_PIP_PACKAGES"

# virtuelle Umgebung anlegen wenn nicht vorhanden
if [ ! -d "venv" ]; then
  $PYTHON_BIN -m venv venv
  echo "✅ Virtual environment created with Python ${PYTHON_BIN}."
fi

source venv/bin/activate
echo "✅ Virtual environment activated."

pip install --upgrade pip wheel setuptools

# Wichtige Core-Pakete explizit installieren
pip install flask flask-cors flask-sqlalchemy flask-migrate python-dotenv pymupdf gunicorn langdetect langchain langchain-community sentence_transformers openai

# Faiss, Numpy, etc. Installation je nach OS/Arch
pip install $SPECIFIC_PIP_PACKAGES

echo "✅ All requirements and core packages installed."

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
