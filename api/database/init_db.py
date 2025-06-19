from datetime import datetime
from main import app, db, Interaction  # make sure Interaction is imported

with app.app_context():
    db.create_all()  # optional, only if not already initialized

