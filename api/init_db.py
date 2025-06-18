import csv
from datetime import datetime
from main import app, db, Interaction  # make sure Interaction is imported

CSV_PATH = "interactions.csv"

with app.app_context():
    db.create_all()  # optional, only if not already initialized

    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if (len(row) <= 2):
                continue
            print(f"Processing row: {row}")
            timestamp = datetime.strptime(row[2], "%Y-%m-%d %H:%M:%S")
            interaction = Interaction(
                question=row[0],
                answer=row[1],
                timestamp=timestamp,
                session_id=row[3] if len(row) > 3 else None
            )
            db.session.add(interaction)

    db.session.commit()
    print("CSV data imported into database.")

