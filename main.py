from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import csv
from typing import Optional, Dict, Tuple
from uuid import uuid4
from datetime import datetime

from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Initialize global state
embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
#embedding_model = SentenceTransformerEmbeddings(model_name="/home/nicola/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf")
vectorstore = FAISS.load_local(
    "vectorstore_index",
    embedding_model,
    allow_dangerous_deserialization=True
)
llm = ChatOpenAI(model="gpt-4.1-mini")
sessions: Dict[str, ConversationalRetrievalChain] = {}

def log_to_csv(question, response):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("interactions.csv", mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([question, response, timestamp])

def get_or_create_chain(session_id: Optional[str]) -> Tuple[str, ConversationalRetrievalChain]:
    if not session_id:
        session_id = str(uuid4())
    if session_id not in sessions:
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
        )
        conv = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(),
            memory=memory
        )
        sessions[session_id] = conv
    return session_id, sessions[session_id]

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get("question")
    session_id = data.get("session_id")

    if not question:
        return jsonify({"error": "Bitte gib eine Frage an."}), 400

    session_id, conv = get_or_create_chain(session_id)
    resp = conv({"question": question})
    answer = resp.get("answer", "")
    log_to_csv(question, answer)

    return jsonify({
        "session_id": session_id,
        "answer": answer,
    })

if __name__ == '__main__':
    app.run(debug=True)

