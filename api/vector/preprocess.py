import os
import time
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
import tiktoken
from langchain_community.embeddings import SentenceTransformerEmbeddings

PDF_DIR = "./app/data/pdfs"
FAISS_INDEX_PATH = "./app/data/vectorstore_index"

def get_pdf_text(pdf_paths):
    text = ""
    for path in pdf_paths:
        print("\n" + "="*50)
        print(f"Starte Verarbeitung von PDF: {os.path.basename(path)}")
        print("="*50 + "\n")

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
    print(f"PDFs gefunden: {len(pdf_paths)}")
    
    raw_text = get_pdf_text(pdf_paths)
    print(f"Länge des Rohtexts: {len(raw_text)} Zeichen")
    
    chunks = get_text_chunks(raw_text)
    print(f"Anzahl Chunks insgesamt: {len(chunks)}")
    if len(chunks) > 0:
        print(f"Beispiel-Chunk: {chunks[0]}")
    
    batches = chunk_texts_by_token_limit(chunks, max_tokens=15000)
    print(f"Anzahl Batches: {len(batches)}")
    if len(batches) > 0:
        print(f"Beispiel-Batch Größe: {len(batches[0])} Chunks")
        print(f"Erster Chunk im Batch: {batches[0][0]}")
    
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")    
    
    all_texts, all_embeddings = [], []
    
    for i, batch in enumerate(batches):
        # print(batch)
        # A little clearer:
        print("\n" + "="*40)
        print(f"Batch {i+1} wird eingebettet ({len(batch)} Chunks)...")
        print("="*40)
        
        batch_embeddings = embed_with_sentence_transformers(model, batch)
        
        print(f"Beispiel Embedding Vektor (erste 5 Werte): {batch_embeddings[0][:5]}")
        
        all_texts.extend(batch)
        all_embeddings.extend(batch_embeddings)
        
        print(f"Gesamt bisher: {len(all_texts)} Texte, {len(all_embeddings)} Embeddings")
        time.sleep(1)  # small delay to avoid resource spikes
    
    print("\n" + "#"*60)
    print("Alle Batches eingebettet, erstelle finalen Vektorstore...")
    print("#"*60)
    
    vectorstore = FAISS.from_embeddings(zip(all_texts, all_embeddings), embedding_model)
    vectorstore.save_local(output_path)
    print(f"✅ Vectorstore gespeichert unter: {output_path}")

if __name__ == "__main__":
    build_and_save_vectorstore(PDF_DIR, FAISS_INDEX_PATH)

