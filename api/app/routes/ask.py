from flask import Blueprint, request, jsonify
from app.services.chat_service import get_or_create_chain, save_to_db

ask_bp = Blueprint('ask', __name__)

@ask_bp.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get("question")
    session_id = data.get("session_id")

    if not question:
        return jsonify({"error": "Bitte gib eine Frage an."}), 400

    session_id, conv = get_or_create_chain(session_id)
    resp = conv({"question": question})
    answer = resp.get("answer", "")
    save_to_db(question, answer, session_id)

    return jsonify({
        "session_id": session_id,
        "answer": answer,
    })

