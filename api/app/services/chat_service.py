from typing import Optional, Dict, Tuple
from uuid import uuid4
from app.models import Interaction
from app.extensions import db
from app.chains.prompt_template import get_prompt_template
from app.services.embedding_loader import llm, vectorstore
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

sessions: Dict[str, ConversationalRetrievalChain] = {}

def save_to_db(question, answer, session_id):
    interaction = Interaction(
        question=question,
        answer=answer,
        session_id=session_id
    )
    db.session.add(interaction)
    db.session.commit()

def get_or_create_chain(session_id: Optional[str]) -> Tuple[str, ConversationalRetrievalChain]:
    if not session_id:
        session_id = str(uuid4())
    if session_id not in sessions:
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        prompt = get_prompt_template()
        conv = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 10}),
            memory=memory,
            combine_docs_chain_kwargs={"prompt": prompt}
        )
        sessions[session_id] = conv
    return session_id, sessions[session_id]

