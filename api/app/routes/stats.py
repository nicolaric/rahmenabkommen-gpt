from flask import Blueprint, jsonify
from app.models import Message
from app import db
from sqlalchemy import func

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/stats', methods=['GET'])
def get_stats():
    results = db.session.query(
        func.date(func.datetime(Message.timestamp)).label('date'),
        func.count().label('count')
    ).group_by('date').order_by(func.date(func.datetime(Message.timestamp)).asc()).all()

    return jsonify([{"date": date, "count": count} for date, count in results])

