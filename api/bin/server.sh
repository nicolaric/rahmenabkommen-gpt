#!/bin/sh
#
# Start-Script für den Produktionsserver mit Gunicorn
#
# Dieses Script:
# - Wechselt in das Projekt-Root-Verzeichnis
# - Setzt den PYTHONPATH auf das aktuelle Verzeichnis
# - Startet Gunicorn mit 4 Worker-Prozessen
# - Bindet den Server an alle Interfaces auf Port 8000
# - Lädt die Flask-App aus main:app
#
# Nutzung: Für den Produktionsbetrieb, um den Flask-Server performant zu starten.
#

cd ..

PYTHONPATH=$(pwd) gunicorn -w 4 -b 0.0.0.0:8000 main:app
