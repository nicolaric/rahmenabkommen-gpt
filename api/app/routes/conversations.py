from flask import Blueprint, jsonify
from app.models import Conversation, Message
from app import db

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route('/conversations', methods=['GET'])
def get_conversations():
    # Get conversations with messages, sorted at database level
    conversations = Conversation.query.filter(
        Conversation.posted_in_feed == True
    ).options(
        db.joinedload(Conversation.messages).order_by(Message.timestamp)
    ).order_by(Conversation.creation_date.desc()).all()
    
    return jsonify([{
        "id": conv.id,
        "creation_date": conv.creation_date.isoformat(),
        "messages": [{
            "question": msg.question,
            "answer": msg.answer,
            "timestamp": msg.timestamp.isoformat()
        } for msg in conv.messages]
    } for conv in conversations])
