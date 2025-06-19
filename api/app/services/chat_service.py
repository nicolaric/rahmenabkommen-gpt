from typing import Optional, Dict, Tuple
from uuid import uuid4
from datetime import datetime, timezone
from app.models import Conversation, Message  # Updated models
from app.extensions import db
from app.chains.prompt_template import get_prompt_template
from app.services.embedding_loader import llm, vectorstore
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

sessions: Dict[str, ConversationalRetrievalChain] = {}

def save_to_db(question: str, answer: str, session_id: str) -> Message:
    # Get or create conversation
    conversation = Conversation.query.filter_by(session_id=session_id).first()
    
    if not conversation:
        conversation = Conversation(
            session_id=session_id,
            creation_date=datetime.now(timezone.utc),  # Set to first message time
            shared=False,
            posted_in_feed=False
        )
        db.session.add(conversation)
        db.session.flush()  # Get ID before commit

    # Create message linked to conversation
    message = Message(
        question=question,
        answer=answer,
        timestamp=datetime.now(timezone.utc),
        conversation_id=conversation.id
    )
    db.session.add(message)
    db.session.commit()
    return message

def get_or_create_chain(session_id: Optional[str]) -> Tuple[str, ConversationalRetrievalChain]:
    # Generate new session ID if none provided
    new_session = False
    if not session_id:
        session_id = str(uuid4())
        new_session = True

    # Create new chain if needed
    if session_id not in sessions:
        # Load existing conversation history if available
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Only load history for existing sessions (not brand new)
        if not new_session:
            conversation = Conversation.query.filter_by(session_id=session_id).first()
            if conversation:
                messages = Message.query.filter_by(
                    conversation_id=conversation.id
                ).order_by(Message.timestamp.asc()).all()
                
                # Load history into memory
                for msg in messages:
                    memory.chat_memory.add_user_message(msg.question)
                    memory.chat_memory.add_ai_message(msg.answer)

        # Create new chain with memory
        prompt = get_prompt_template()
        conv = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 10}),
            memory=memory,
            combine_docs_chain_kwargs={"prompt": prompt}
        )
        sessions[session_id] = conv
        
    return session_id, sessions[session_id]
