from flask import Blueprint, jsonify
from app.models import Interaction

interactions_bp = Blueprint('interactions', __name__)

@interactions_bp.route('/interactions', methods=['GET'])
def get_interactions():
    all_interactions = Interaction.query.filter(Interaction.public == True).order_by(Interaction.timestamp.desc()).all()
    return jsonify([{
        "question": i.question,
        "answer": i.answer,
        "timestamp": i.timestamp.isoformat(),
        "session_id": i.session_id
    } for i in all_interactions])

