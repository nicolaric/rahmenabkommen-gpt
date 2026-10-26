from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from app.auth import require_internal_token
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
    ).order_by(Conversation.creation_date.desc()).all()
    
    return jsonify([{
        "id": conv.id,
        "creation_date": conv.creation_date.isoformat(),
        "messages": [{
            "question": msg.question,
            "answer": msg.answer,
            "timestamp": msg.timestamp.isoformat(),
            "sources": msg.sources if hasattr(msg, 'sources') else []
        } for msg in conv.messages]
    } for conv in conversations])

@conversations_bp.route('/conversations/<string:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    # Get a specific conversation with messages, sorted at database level
    conversation = Conversation.query.filter_by(id=conversation_id).options(
        db.joinedload(Conversation.messages)
    ).first()
    
    if not conversation or not conversation.shared:
        return jsonify({"error": "Conversation not found"}), 404
    
    return jsonify({
        "id": conversation.id,
        "creation_date": conversation.creation_date.isoformat(),
        "messages": [{
            "question": msg.question,
            "answer": msg.answer,
            "timestamp": msg.timestamp.isoformat(),
            "sources": msg.sources if hasattr(msg, 'sources') else []
        } for msg in conversation.messages]
    })

@conversations_bp.route('/conversations/sync', methods=['POST'])
@require_internal_token
def sync_conversation():
    # The UI server sends the full message list of a yeos conversation after
    # each answer; messages we already stored are skipped, so repeats are safe.
    data = request.get_json() or {}
    session_id = data.get("session_id")
    messages = data.get("messages")

    if not session_id or not isinstance(messages, list):
        return jsonify({"error": "session_id and messages are required"}), 400

    conversation = Conversation.query.filter_by(session_id=session_id).first()
    if not conversation:
        conversation = Conversation(
            session_id=session_id,
            creation_date=datetime.now(timezone.utc),
            shared=False,
            posted_in_feed=False,
        )
        db.session.add(conversation)
        db.session.flush()

    for msg in messages[len(conversation.messages):]:
        if not msg.get("question") or not msg.get("answer"):
            # An unfinished answer ends the list; it is stored on the next sync
            break
        db.session.add(Message(
            question=msg["question"],
            answer=msg["answer"],
            timestamp=_parse_timestamp(msg.get("timestamp")),
            sources=msg.get("sources") or [],
            conversation_id=conversation.id,
        ))

    db.session.commit()

    return jsonify({"id": conversation.id}), 200

def _parse_timestamp(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return datetime.now(timezone.utc)

@conversations_bp.route('/conversations/share', methods=['POST'])
@require_internal_token
def share_conversation():
    data = request.get_json()
    session_id = data.get("session_id")
    posted_in_feed = data.get("posted_in_feed", False)

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    # Update the conversation to be posted in feed
    conversation = Conversation.query.filter_by(session_id=session_id).first()
    
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    # Mark as shared and posted in feed
    conversation.shared = True
    conversation.posted_in_feed = posted_in_feed
    db.session.commit()
    
    return jsonify({
        "id": conversation.id,
        "shared": conversation.shared,
        "posted_in_feed": conversation.posted_in_feed,
    }), 200

@conversations_bp.route('/feed', methods=['GET'])
def get_feed():
    # Get conversations that are posted in feed
    conversations = Conversation.query.filter(
        Conversation.posted_in_feed == True
    ).order_by(Conversation.creation_date.desc()).all()
    
    return jsonify([{
        "id": conv.id,
        "creation_date": conv.creation_date.isoformat(),
        "messages": [{
            "question": msg.question,
            "answer": msg.answer,
            "timestamp": msg.timestamp.isoformat(),
            "sources": msg.sources if hasattr(msg, 'sources') else []
        } for msg in conv.messages]
    } for conv in conversations])


