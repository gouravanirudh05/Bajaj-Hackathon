from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import os, tempfile, requests, shutil
import PyPDF2

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document

app = FastAPI()

# Load models once
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
embedding_fn = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

class QueryRequest(BaseModel):
    documents: str
    questions: List[str]

def download_pdf(url):
    response = requests.get(url, stream=True)
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    with open(tmp_file.name, 'wb') as f:
        shutil.copyfileobj(response.raw, f)
    return tmp_file.name

def extract_text_from_pdf(path):
    reader = PyPDF2.PdfReader(path)
    return "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])

def chunk_text(text):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    return splitter.split_text(text)

def build_vectorstore(chunks):
    documents = [Document(page_content=chunk) for chunk in chunks]
    # Use a temp writable directory
    persist_dir = tempfile.mkdtemp()
    db = Chroma.from_documents(documents, embedding=embedding_fn, persist_directory=persist_dir)
    db.persist()
    return db

def answer_question(db, query):
    docs = db.similarity_search(query, k=3)
    context = "\n".join([doc.page_content for doc in docs])
    prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer:"
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    outputs = model.generate(**inputs, max_new_tokens=128)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

@app.post("/hackrx/run")
async def hackrx_run(payload: QueryRequest):
    pdf_url = payload.documents
    questions = payload.questions

    if not pdf_url or not questions:
        return {"error": "Missing 'documents' URL or 'questions' list."}

    pdf_path = download_pdf(pdf_url)
    text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(text)
    db = build_vectorstore(chunks)

    answers = [answer_question(db, q) for q in questions]
    return {"answers": answers}
