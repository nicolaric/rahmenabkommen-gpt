import streamlit as st
import tiktoken
from dotenv import load_dotenv
import os
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from htmlTemplates import css, bot_template, user_template
from langchain.llms import HuggingFaceHub

# Lade Umgebungsvariablen (inkl. HUGGINGFACE_HUB_TOKEN)
load_dotenv()

# Optional: manuell setzen, falls nicht über .env
# os.environ["HUGGINGFACE_HUB_TOKEN"] = "dein_token"

def load_vectorstore(path="./vectorstore_index"):
    vectorstore = FAISS.load_local(
        path,
        st.session_state.embedding_model,
        allow_dangerous_deserialization=True
    )
    return vectorstore

def get_conversation_chain(vectorstore):
    llm = ChatOpenAI(model='gpt-4.1-mini')
    # Alternativ mit open-source Modell:
    # llm = HuggingFaceHub(repo_id="google/flan-t5-xxl", model_kwargs={"temperature": 0.5, "max_length": 512})

    memory = ConversationBufferMemory(
        memory_key='chat_history', return_messages=True)
    
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory
    )
    return conversation_chain

def handle_userinput(user_question):
    response = st.session_state.conversation({'question': user_question})
    st.session_state.chat_history = response['chat_history']

    for i, message in enumerate(st.session_state.chat_history):
        template = user_template if i % 2 == 0 else bot_template
        st.write(template.replace("{{MSG}}", message.content), unsafe_allow_html=True)

def main():
    st.set_page_config(page_title="Rahmenvertrag GPT", page_icon=":flag-ch:")
    st.write(css, unsafe_allow_html=True)

    if "embedding_model" not in st.session_state:
        st.session_state.embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    if "vectorstore" not in st.session_state:
        st.session_state.vectorstore = load_vectorstore("vectorstore_index")

    if "conversation" not in st.session_state:
        st.session_state.conversation = get_conversation_chain(st.session_state.vectorstore)

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = None

    st.header("Rahmenvertrag GPT :flag-ch::flag-eu:")
    user_question = st.text_input("Stelle deine Frage zum Rahmenvertrag:")
    if user_question:
        handle_userinput(user_question)

if __name__ == '__main__':
    main()

