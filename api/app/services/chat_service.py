import re
from typing import Optional, Dict, Tuple, List
from uuid import uuid4
from datetime import datetime, timezone
from collections import OrderedDict

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

    def __init__(self, retriever: BaseRetriever):
        super().__init__(retriever=retriever)

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
            memory_key="chat_history",
            return_messages=True,
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

        # No inline 'Quelle' here; we will use footnotes
        document_prompt = PromptTemplate(
            input_variables=["page_content"],
            template="{page_content}"
        )

        final_prompt = PromptTemplate.from_template(
            """
                Beantworte die Frage so präzise wie möglich anhand des Kontextes.
                Verwende pro Quelle einen Index [1], [2], ... 
                Ergänze die Antwort niemals mit einer Fussnote. 

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


def format_with_footnotes(answer: str, source_docs: List[Document]) -> Tuple[str, List[str]]:
    """
    Post-process: baut Fußnoten, entfernt aber die [n]-Marker wieder
    aus dem Antworttext selbst.
    """
    # 1) Mapping URL -> Marker in Reihenfolge der source_docs
    url_to_marker: OrderedDict[str, str] = OrderedDict()
    for idx, doc in enumerate(source_docs, start=1):
        url = doc.metadata.get("source", "Keine Quelle verfügbar")
        url_to_marker[url] = f"[{idx}]"

    # 2) Ersetze in der Antwort alle vorkommenden URLs durch ihre Marker
    tmp = answer
    for url, marker in url_to_marker.items():
        if url != "Keine Quelle verfügbar":
            tmp = tmp.replace(url, marker)

    # 3) Extrahiere nur die Marker, die tatsächlich im Text landen
    seen_markers: List[str] = []
    for m in re.finditer(r"\[\d+\]", tmp):
        mark = m.group(0)
        if mark not in seen_markers:
            seen_markers.append(mark)

    # 4) Aufbau des sources-Arrays
    sources = []
    for marker in seen_markers:
        url = next(u for u, mk in url_to_marker.items() if mk == marker)
        # Marker ist "[n]", wir wandeln n in int um
        src_id = int(marker.strip("[]"))
        sources.append({"id": src_id, "url": url})

    # 5) Entferne alle Marker aus dem Antworttext
    cleaned_answer = tmp.strip()

    return cleaned_answer, sources
