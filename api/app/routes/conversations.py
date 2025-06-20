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
        db.joinedload(Conversation.messages)
    ).all()
    
    return jsonify([{
        "id": conv.id,
        "creation_date": conv.creation_date.isoformat(),
        "messages": [{
            "question": msg.question,
            "answer": msg.answer,
            "timestamp": msg.timestamp.isoformat()
        } for msg in conv.messages]
    } for conv in conversations])

@conversations_bp.route('/conversations/<string:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    # Get a specific conversation with messages, sorted at database level
    conversation = Conversation.query.filter_by(id=conversation_id).options(
        db.joinedload(Conversation.messages).order_by(Message.timestamp)
    ).first()
    
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    return jsonify({
        "id": conversation.id,
        "creation_date": conversation.creation_date.isoformat(),
        "messages": [{
            "question": msg.question,
            "answer": msg.answer,
            "timestamp": msg.timestamp.isoformat()
        } for msg in conversation.messages]
    })
