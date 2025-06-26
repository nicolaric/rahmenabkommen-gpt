from flask import Blueprint, request, jsonify
from app.services.chat_service import get_or_create_chain, save_to_db, format_with_footnotes

ask_bp = Blueprint('ask', __name__)

@ask_bp.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get("question")
    session_id = data.get("session_id")
    skip_storage = data.get("skip_storage", False)

    if not question:
        return jsonify({"error": "Bitte gib eine Frage an."}), 400

    session_id, conv = get_or_create_chain(session_id)
    resp = conv({"question": question})
    raw_answer = resp.get("answer", "")
    
    # Extract unique sources from documents
    source_docs = resp.get("source_documents", [])
    answer, sources = format_with_footnotes(raw_answer, source_docs)
   
    if skip_storage is False:
        # Save the question, answer, session_id, and sources to the database
        save_to_db(question, answer, session_id, sources)

    return jsonify({
        "session_id": session_id,
        "answer": answer,
        "sources": sources  # Add sources to response
    })
