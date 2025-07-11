import os
import re
import fitz
from pathlib import Path
from bs4 import BeautifulSoup
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from langchain_community.embeddings import SentenceTransformerEmbeddings
from dotenv import load_dotenv

load_dotenv()  # .env laden

PDF_DIR = "./app/data/pdfs"
HTML_DIR = "../ui/public/contracts"
FAISS_INDEX_PATH = "./app/data/vectorstore_index"

def pdf_to_html(html_title, pdf_path, html_path, out_dir):
    """
    Liest ein PDF mit PyMuPDF, erkennt anhand der font_size Überschriften vs. Fließtext
    und schreibt ein HTML-Dokument mit <h1>, <h2> und <p> Elementen.
    """
    doc = fitz.open(pdf_path)
    html = BeautifulSoup(
        f"<!DOCTYPE html><html><head>"
        f"<meta charset='utf-8'><title>{html_title}</title>"
        f"<meta name='viewport' content='width=device-width, initial-scale=1'>"
        f"<link rel='stylesheet' href='/static.css'>"
        "</head><body></body></html>",
        "html.parser"
    )    

    body = html.body

    text_container = html.new_tag("div", **{"class": "text-container"})

    # Header-Container
    header = html.new_tag("div", **{"class": "header"})
    # Logo-Link
    logo = html.new_tag("a", href="/", **{"class": "logo"})
    img = html.new_tag("img", src="/logo-colored.webp", alt="Logo", width="28", height="28")
    title = html.new_tag("div"); title.string = "Rahmenabkommen GPT"
    logo.append(img); logo.append(title)
    header.append(logo)

    # Help icon
    help = html.new_tag('a', href="/help", dataDiscover="true", **{"class": "help-button"})
    help_icon = html.new_tag('svg', xmlns="http://www.w3.org/2000/svg", width="26", height="26", fill="currentColor", viewBox="0 0 256 256")
    help_icon_path = html.new_tag('path', d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z")
    help_icon.append(help_icon_path)
    help.append(help_icon)
    header.append(help)

    ask_container = html.new_tag("div", **{"class": "ask-button-container"})
    ask_button = html.new_tag("a", href="/"); 
    ask_text = html.new_tag("div"); ask_text.string = "Stelle deine eigenen Fragen"
    ask_icon = html.new_tag('svg', xmlns="http://www.w3.org/2000/svg", width="26", height="26", fill="currentColor", viewBox="0 0 256 256")
    ask_icon_path = html.new_tag('path', d="M216,48H40A16,16,0,0,0,24,64V224a15.84,15.84,0,0,0,9.25,14.5A16.05,16.05,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H80a8,8,0,0,0-5.23,1.95L40,224V64H216Z")

    ask_icon.append(ask_icon_path)
    ask_button.append(ask_icon)
    ask_button.append(ask_text)
    ask_container.append(ask_button)
    body.append(ask_container)

    # Dark-Mode-Button
    #dm_btn = html.new_tag("button", **{"aria-label": "Toggle dark mode" })
    #dm_btn.append(BeautifulSoup(darkmode_svg, "html.parser"))
    #header.append(dm_btn)

    body.append(header)    
    body.append(text_container)    
    # ID-Counter für Referenzen
    counters = {"h1": 0, "h2": 0, "p": 0}

    for page_num, page in enumerate(doc, start=1):
        # Optional: Kapitel-Header pro Seite
        page_header = html.new_tag("h2")
        counters["h2"] += 1
        if not page_header.get('id'):
            page_header['id'] = f"h{counters['h2']}"
        text_container.append(page_header)

        # Textblöcke im „dict“-Format
        page_dict = page.get_text("dict")
        for block in page_dict["blocks"]:
            if block["type"] != 0: 
                continue  # nur Text-Blöcke

            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                    size = span["size"]
                    # Schwellen für Überschriften (anpassen!)
                    if size >= 16:
                        tag_name = "h1"
                    elif size >= 12:
                        tag_name = "h2"
                    else:
                        tag_name = "p"
                    tag = html.new_tag(tag_name)
                    tag.string = text
                    # ID hinzufügen, wenn nicht vorhanden
                    if not tag.get('id'):
                        counters[tag_name] += 1
                        tag['id'] = f"p{counters[tag_name]}"

                    text_container.append(tag)

    # Schreibe die Datei
    out_path = os.path.join(out_dir, html_path)
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(str(html))
    print(f"[HTML] {pdf_path} → {out_path}")
    return html

def extract_text_with_mapping(soup):
    text = ""
    mapping = []
    current_pos = 0

    for element in soup.find_all(['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        element_text = element.get_text()
        start = current_pos
        end = start + len(element_text)
        mapping.append((start, end, element['id']))
        text += element_text + "\n"
        current_pos = end + 1  # +1 für die neue Zeile
    return text, mapping

def get_chunk_positions(text, chunks, overlap=200):
    positions = []
    pos = 0
    for chunk in chunks:
        start = text.find(chunk, pos)
        if start == -1:
            start = text.find(chunk)  # Fallback, falls die Position nicht gefunden wird
        positions.append(start)
        pos = start + len(chunk) - overlap
        if pos < start:
            pos = start
    return positions

def make_html_path(filename):
    # Entferne Verzeichnispfade
    name = os.path.basename(filename)
    # Trenne Namen und Extension
    base, ext = os.path.splitext(name)
    # Grundsätzlich unerlaubte Zeichen entfernen
    base = re.sub(r'[\\/:"*?<>|]+', '', base)
    # Entferne alle Punkte und Kommas im Basisnamen
    base = base.replace('.', '').replace(',', '')
    # Spaces durch Unterstriche ersetzen
    base = re.sub(r'\s+', '_', base)
    # Optional: führende und folgende Unterstriche entfernen
    base = base.strip('_')
    return base + ".html"

def make_html_title(filename: str) -> str:
    name = os.path.basename(filename)
    base, ext = os.path.splitext(name)
    base = re.sub(r'[\\/:"*?<>|]+', '', base)
    base = base.strip('_')
    return base

def build_and_save_vectorstore(pdf_dir, html_dir, output_path):
    pdf_paths = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.endswith(".pdf")]
    print(f"PDFs gefunden: {len(pdf_paths)}")
    
    all_chunk_texts = []
    all_metadatas = []
    
    os.makedirs(html_dir, exist_ok=True)
    
    for pdf_path in pdf_paths:
        print(f"\n{'='*50}")
        print(f"Verarbeite PDF: {os.path.basename(pdf_path)}")
        print(f"{'='*50}\n")
        
        # HTML Dateiname und Titel erzeugen
        html_title = make_html_title(pdf_path)
        html_path = make_html_path(pdf_path)

        # PDF in HTML umwandeln
        soup = pdf_to_html(html_title, pdf_path, html_path, html_dir)
        
        # Text extrahieren und Mapping erstellen
        text, mapping = extract_text_with_mapping(soup)
        print(f"Länge des extrahierten Textes: {len(text)} Zeichen")
        
        # Text in Chunks aufteilen
        splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = splitter.split_text(text)
        print(f"Anzahl Chunks für dieses PDF: {len(chunks)}")
        
        # Startpositionen der Chunks ermitteln
        positions = get_chunk_positions(text, chunks)
        
        # Metadaten für jeden Chunk erstellen
        for chunk, start_pos in zip(chunks, positions):
            for map_start, map_end, element_id in mapping:
                if map_start <= start_pos < map_end:
                    metadata = {"source": f"/contracts/{html_path}#{element_id}"}
                    all_chunk_texts.append(chunk)
                    all_metadatas.append(metadata)
                    break
    
    print(f"\nAnzahl Chunks insgesamt: {len(all_chunk_texts)}")
    
    # Alle Chunks einbetten
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    all_embeddings = model.encode(all_chunk_texts, show_progress_bar=True, convert_to_numpy=True)
    
    # Vektorspeicher mit Metadaten erstellen und speichern
    vectorstore = FAISS.from_embeddings(
        list(zip(all_chunk_texts, all_embeddings)),
        embedding_model,
        metadatas=all_metadatas
    )
    vectorstore.save_local(output_path)
    print(f"✅ Vectorstore gespeichert unter: {output_path}")

if __name__ == "__main__":
    build_and_save_vectorstore(PDF_DIR, HTML_DIR, FAISS_INDEX_PATH)
