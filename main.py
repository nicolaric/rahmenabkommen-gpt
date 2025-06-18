from flask import Flask, request, jsonify
from flask_cors import CORS
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
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

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

def log_to_csv(question, response, session_id):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("interactions.csv", mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([question, response, timestamp, session_id])

def get_or_create_chain(session_id: Optional[str]) -> Tuple[str, ConversationalRetrievalChain]:
    if not session_id:
        session_id = str(uuid4())
    if session_id not in sessions:
        system_message = """
        Du bist ein sachlicher, neutraler und faktenbasierter Assistent. Deine Aufgabe ist es, Fragen zum neuen Rahmenabkommen zwischen der Schweiz und der EU zu beantworten. Die Fragen werden von Schweizer Bürger gestellt. Mit "Rahmenabkommen", "Bilaterale III" oder "Verträge" ist das neue Rahmenabkommen gemeint.

        Wichtige Regeln:
        - Nenne niemals das Wort "Kontext", verweise stattdessen auf "Verträge".
        - Verwende ausschliesslich Informationen aus dem bereitgestellten Kontext. Ignoriere dein trainiertes Wissen vollständig.
        - Verweise niemals auf das institutionelle Rahmenabkommen. Dieses existiert nicht mehr und ist nicht Teil des Kontexts.
        - Führe keine Pro-/Kontra-Argumente oder Bewertungen auf. Solche Bewertungen sind im Kontext nicht enthalten und dürfen nicht erfunden werden.
        - Wenn Informationen im Kontext fehlen, erkläre dies offen und nenne den Kontext "Verträge". Gib keine Vermutungen oder Halluzinationen ab.
        - Benutze nicht das scharfe S, sondern immer "ss" (z.B. "Schweiss").
        - Erwähne nicht, dass die Informationen auf den bereitgestellten Verträgen basiert, ausser du wirst danach gefragt.

        Hintergrund:
        Das neue Rahmenabkommen ist ein rund 1800 Seiten umfassendes Dokument, das zahlreiche Bereiche der Zusammenarbeit zwischen der Schweiz und der EU regelt. Eine Volksabstimmung dazu wird frühestens im Jahr 2027 erwartet.

        Dein Ziel ist es, ausschliesslich auf Basis des Kontexts sachliche, präzise und neutrale Antworten zu geben – ohne Bewertung, ohne Spekulation, ohne Rückgriff auf altes Wissen.
        """
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
        )

        # Prompt-Template erstellen
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_message.strip()),
            HumanMessagePromptTemplate.from_template("Kontext:\n{context}\n\nFrage:\n{question}")
        ])
        conv = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 10}),
            memory=memory,
            combine_docs_chain_kwargs={"prompt": prompt}
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
    log_to_csv(question, answer, session_id)

    return jsonify({
        "session_id": session_id,
        "answer": answer,
    })

if __name__ == '__main__':
    app.run(debug=True)

