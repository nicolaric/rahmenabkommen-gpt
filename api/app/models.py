from datetime import datetime, timezone
from app.extensions import db

class Conversation(db.Model):
    __tablename__ = "conversation"

    id = db.Column(db.Integer, primary_key=True)
    shared = db.Column(db.Boolean, default=False)
    posted_in_feed = db.Column(db.Boolean, default=False)
    session_id = db.Column(db.String(36), nullable=True)
    messages = db.relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    creation_date = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False)

class Message(db.Model):
    __tablename__ = "message"

    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False)

    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"))
    conversation = db.relationship("Conversation", back_populates="messages")
