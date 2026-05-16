from datetime import datetime, timezone
from flask import Blueprint, jsonify
from app.models import Conversation, Message
from app import db
from sqlalchemy import func

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/stats', methods=['GET'])
def get_stats():
    total_questions = db.session.query(func.count(Message.id)).scalar() or 0
    total_conversations = db.session.query(func.count(Conversation.id)).scalar() or 0
    shared_conversations = db.session.query(func.count(Conversation.id)).filter(
        Conversation.shared.is_(True)
    ).scalar() or 0
    feed_conversations = db.session.query(func.count(Conversation.id)).filter(
        Conversation.posted_in_feed.is_(True)
    ).scalar() or 0

    daily_results = db.session.query(
        func.strftime('%Y-%m-%d', Message.timestamp).label('date'),
        func.count(Message.id).label('count')
    ).group_by('date').order_by('date').all()

    average_questions_per_conversation = 0
    if total_conversations > 0:
        average_questions_per_conversation = round(total_questions / total_conversations, 2)

    return jsonify({
        "schemaVersion": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalQuestions": total_questions,
        "totalConversations": total_conversations,
        "sharedConversations": shared_conversations,
        "feedConversations": feed_conversations,
        "averageQuestionsPerConversation": average_questions_per_conversation,
        "dailyQuestions": [
            {"date": date, "count": count} for date, count in daily_results
        ],
    }), 200
