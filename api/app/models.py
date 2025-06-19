from datetime import datetime, timezone
from app.extensions import db

class Interaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    session_id = db.Column(db.String(36), nullable=True)
