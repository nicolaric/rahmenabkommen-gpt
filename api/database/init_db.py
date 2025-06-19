from app.models import Message, Conversation
from app import db
from main import app 

with app.app_context():
    db.create_all()  # optional, only if not already initialized

