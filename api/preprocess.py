import os
import time
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
import tiktoken
from langchain_community.embeddings import SentenceTransformerEmbeddings

PDF_DIR = "./pdfs"
FAISS_INDEX_PATH = "vectorstore_index"

def get_pdf_text(pdf_paths):
    text = ""
    for path in pdf_paths:
        reader = PdfReader(path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def get_text_chunks(text):
    splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    return splitter.split_text(text)

def chunk_texts_by_token_limit(texts, max_tokens=300000, encoding_name="cl100k_base"):
    encoding = tiktoken.get_encoding(encoding_name)
    batches, current_batch, current_tokens = [], [], 0
    for text in texts:
        tokens = len(encoding.encode(text))
        if current_tokens + tokens > max_tokens:
            batches.append(current_batch)
            current_batch, current_tokens = [text], tokens
        else:
            current_batch.append(text)
            current_tokens += tokens
    if current_batch:
        batches.append(current_batch)
    return batches

def embed_with_sentence_transformers(model, texts):
    # Returns list of embeddings (list of lists)
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    return embeddings

def build_and_save_vectorstore(pdf_dir, output_path):
    pdf_paths = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.endswith(".pdf")]
    raw_text = get_pdf_text(pdf_paths)
    chunks = get_text_chunks(raw_text)

    model = SentenceTransformer('all-MiniLM-L6-v2')  # Fast, good quality small model

    batches = chunk_texts_by_token_limit(chunks, max_tokens=15000)

    embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")    
    all_texts, all_embeddings = [], []
    for i, batch in enumerate(batches):
        print(batch)
        batch_embeddings = embed_with_sentence_transformers(model, batch)
        all_texts.extend(batch)
        all_embeddings.extend(batch_embeddings)
        print(f"Embedded batch {i+1}/{len(batches)}")
        time.sleep(1)  # small delay to avoid resource spikes

        vectorstore = FAISS.from_embeddings(zip(all_texts, all_embeddings), embedding_model)
        vectorstore.save_local(output_path)  
        print(f"✅ Vectorstore saved to {output_path}")

if __name__ == "__main__":
    build_and_save_vectorstore(PDF_DIR, FAISS_INDEX_PATH)

