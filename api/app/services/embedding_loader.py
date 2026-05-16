from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.chat_models import ChatOpenAI

embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

vectorstore = FAISS.load_local(
    "./app/data/vectorstore_index",
    embedding_model,
    allow_dangerous_deserialization=True
)

llm = ChatOpenAI(model="gpt-4.1-mini", temperature=1)

