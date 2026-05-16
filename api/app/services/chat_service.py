import re
from typing import Optional, Dict, Tuple, List
from uuid import uuid4
from datetime import datetime, timezone
from collections import OrderedDict
from langdetect import detect, LangDetectException

from app.models import Conversation, Message
from app.extensions import db
from app.chains.prompt_template import get_prompt_template
from app.services.embedding_loader import llm, vectorstore

from langchain.memory import ConversationBufferMemory
from langchain.chains import (
    ConversationalRetrievalChain,
    StuffDocumentsChain,
    LLMChain,
)
from langchain.prompts import PromptTemplate
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document

sessions: Dict[str, ConversationalRetrievalChain] = {}

class DefaultSourceRetriever(BaseRetriever):
    """Retriever wrapper that adds default 'source' metadata if missing"""
    retriever: BaseRetriever

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, retriever: BaseRetriever, **kwargs):
        super().__init__(retriever=retriever, **kwargs)

    def _get_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        docs = self.retriever.get_relevant_documents(query, **kwargs)
        return self._add_default_source(docs)

    async def _aget_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        docs = await self.retriever.aget_relevant_documents(query, **kwargs)
        return self._add_default_source(docs)

    def _add_default_source(self, docs: List[Document]) -> List[Document]:
        for doc in docs:
            if "source" not in doc.metadata:
                doc.metadata["source"] = "Keine Quelle verfügbar"
        return docs


def save_to_db(question: str, answer: str, session_id: str, sources: List[str]) -> Message:
    conversation = Conversation.query.filter_by(session_id=session_id).first()
    if not conversation:
        conversation = Conversation(
            session_id=session_id,
            creation_date=datetime.now(timezone.utc),
            shared=False,
            posted_in_feed=False
        )
        db.session.add(conversation)
        db.session.flush()

    message = Message(
        question=question,
        answer=answer,
        timestamp=datetime.now(timezone.utc),
        conversation_id=conversation.id,
        sources=sources if sources else [],
    )
    db.session.add(message)
    db.session.commit()
    return message


def get_or_create_chain(session_id: Optional[str]) -> Tuple[str, ConversationalRetrievalChain]:
    new_session = False
    if not session_id:
        session_id = str(uuid4())
        new_session = True

    if session_id not in sessions:
        memory = ConversationBufferMemory(
            return_messages=True,
            memory_key="chat_history",
            input_key="question",
            output_key="answer"
        )

        if not new_session:
            conv_obj = Conversation.query.filter_by(session_id=session_id).first()
            if conv_obj:
                msgs = Message.query.filter_by(
                    conversation_id=conv_obj.id
                ).order_by(Message.timestamp.asc()).all()
                for msg in msgs:
                    memory.chat_memory.add_user_message(msg.question)
                    memory.chat_memory.add_ai_message(msg.answer)

        document_prompt = PromptTemplate(
            input_variables=["page_content", "source"],
            template="Vertragstext:\n{page_content}\n\nQuelle: {source}"
        )

        final_prompt = PromptTemplate(
            input_variables=["language", "question", "context"],
            template="""
                Beantworte die Frage so präzise wie möglich anhand des Kontextes.
                Verwende pro Quelle einen Index und füge diese direkt nach der ersten Verwendung an in diesem Format: [1], [2], ... 
                Antworte zwingend in der angegebenen Sprache: {language}.
                Benutze nicht das scharfe S, sondern immer "ss" (z.B. "Schweiss").
                Füge niemals die Quellenangababe am Ende der Antwort an, sondern nur direkt im Text.

                Frage: {question}

                Kontext:
                {context}

                Antwort:
            """.strip()
        )
        final_llm_chain = LLMChain(llm=llm, prompt=final_prompt)

        combine_docs_chain = StuffDocumentsChain(
            llm_chain=final_llm_chain,
            document_prompt=document_prompt,
            document_variable_name="context",
        )

        question_generator = LLMChain(
            llm=llm,
            prompt=get_prompt_template()
        )

        base_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
        retriever = DefaultSourceRetriever(base_retriever)

        conv = ConversationalRetrievalChain(
            retriever=retriever,
            memory=memory,
            combine_docs_chain=combine_docs_chain,
            question_generator=question_generator,
            return_source_documents=True,
        )
        sessions[session_id] = conv
    return session_id, sessions[session_id]


def format_with_footnotes(answer: str, source_docs: List[Document]) -> Tuple[str, List[dict]]:
    """
    Formats the answer by renumbering footnote markers based on their order of first appearance in the text.
    The sources array is ordered according to the sequence in which the sources are first mentioned.
    
    Args:
        answer (str): The answer text containing markers like [1], [2], etc.
        source_docs (List[Document]): List of source documents retrieved for the answer.
    
    Returns:
        Tuple[str, List[dict]]: The modified answer text with renumbered markers and a list of source dictionaries with continuous IDs and URLs.
    """
    # Find all markers in the order they appear in the text
    markers = re.findall(r'\[\d+\]', answer)
    # Extract the marker numbers
    marker_nums = [int(m.strip('[]')) for m in markers]
    
    # Get unique marker numbers in the order they first appear
    unique_nums = []
    seen = set()
    for num in marker_nums:
        if num not in seen:
            unique_nums.append(num)
            seen.add(num)
    
    # Create a mapping from original marker number to new continuous ID based on first appearance
    mapping = {num: idx + 1 for idx, num in enumerate(unique_nums)}
    
    # Define a function to replace markers with new IDs
    def replace_marker(match):
        num = int(match.group(1))
        if num in mapping:
            return f'[{mapping[num]}]'
        else:
            return match.group(0)  # Leave unchanged if not in mapping
    
    # Replace markers in the answer text
    answer = re.sub(r'\[(\d+)\]', replace_marker, answer)
    
    # Build the sources list based on the order of first appearance
    sources = []
    for new_id in range(1, len(unique_nums) + 1):
        original_num = unique_nums[new_id - 1]
        if original_num <= len(source_docs):
            url = source_docs[original_num - 1].metadata.get("source", "Keine Quelle verfügbar")
        else:
            url = "Quelle nicht gefunden"
        sources.append({"id": new_id, "url": url})
    
    return answer, sources
def detect_language(text: str) -> str:
    """Erkennt die Sprache des Textes (de/fr/it/en)"""
    try:
        lang = detect(text)
        if lang in ['de', 'fr', 'it', 'en']:
            return lang
    except LangDetectException:
        pass
    return 'de'  # Default
