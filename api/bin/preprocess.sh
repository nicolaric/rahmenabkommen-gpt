#!/bin/sh
#
# Preprocessing-Skript für Vektorisierung
#
# Dieses Skript ruft das Python-Skript `vector/preprocess.py` auf,
# das die folgenden Aufgaben übernimmt:
# - Extraktion und Zerlegung von Text aus den PDF-Vertragsdokumenten
# - Vorverarbeitung und Speicherung der Text-Chunks für die spätere Einbettung
#
# Voraussetzung:
# - Die Python Virtual Environment muss bereits aktiviert sein (siehe `activate.sh`)
# - Alle benötigten Abhängigkeiten müssen installiert sein
#
# Nutzung:
#   ./bin/preprocess.sh
#
# Typischerweise wird dieses Skript im Rahmen des Setup-Prozesses oder bei neuen Dokumenten ausgeführt.
#

cd "$(dirname "$0")/.."

python vector/preprocess.py
