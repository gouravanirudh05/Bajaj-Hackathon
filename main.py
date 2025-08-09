import os
import faiss
import pickle
import requests
import tempfile
import PyPDF2
import dotenv
import google.generativeai as genai

from typing import List
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

dotenv.load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 500

app = FastAPI()
model = SentenceTransformer(EMBEDDING_MODEL)

genai.configure(api_key=GOOGLE_API_KEY)
gemini = genai.GenerativeModel("gemini-2.0-flash")

# ----------- Data Model ------------
class QueryRequest(BaseModel):
    documents: str  # URL to the PDF
    questions: List[str]

class QueryResponse(BaseModel):
    answers: List[str]

# ----------- Helper Functions -----------

def download_pdf(url: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to download PDF.")
    temp_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
    with open(temp_path, "wb") as f:
        f.write(response.content)
    return temp_path

def extract_chunks_from_pdf(path: str, chunk_size: int) -> List[str]:
    with open(path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        full_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    os.remove(path)
    chunks = []
    for i in range(0, len(full_text), chunk_size):
        chunk = full_text[i:i + chunk_size]
        if len(chunk.strip()) > 50:
            chunks.append(chunk.strip())
    return chunks

def embed_chunks(chunks: List[str]):
    return model.encode(chunks)

def search_faiss(query: str, index, chunks: List[str], top_k=3) -> List[str]:
    query_embedding = model.encode([query])
    D, I = index.search(query_embedding, k=top_k)
    return [chunks[i] for i in I[0]]

def get_gemini_answer(query: str, context_chunks: List[str]) -> str:
    context = "\n\n".join(context_chunks)
    prompt = f"""Answer the following question using the provided context:

Context:
{context}

Question: {query}

Answer:"""
    response = gemini.generate_content(prompt)
    return response.text.strip()

# ----------- Route Handler ------------

@app.post("/hackrx/run", response_model=QueryResponse)
def run_query(request: QueryRequest):
    # Step 1: Download and chunk PDF
    pdf_path = download_pdf(request.documents)
    chunks = extract_chunks_from_pdf(pdf_path, CHUNK_SIZE)

    # Step 2: Embed and index
    embeddings = embed_chunks(chunks)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    # Step 3: Answer questions
    answers = []
    for question in request.questions:
        top_chunks = search_faiss(question, index, chunks)
        answer = get_gemini_answer(question, top_chunks)
        answers.append(answer)

    return QueryResponse(answers=answers)
