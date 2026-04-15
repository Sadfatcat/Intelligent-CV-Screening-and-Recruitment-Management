# backend/app/services/ai_service.py

import fitz  # PyMuPDF
from sentence_transformers import util

from app.services.vectorizer import get_model, query_to_vector, passage_to_vector

model = get_model()

def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def calculate_match_score(cv_text, jd_text):
    # 2. Chuyển đổi sang vector
    embeddings = [query_to_vector(cv_text), passage_to_vector(jd_text)]
    
    # 3. Tính toán Cosine Similarity
    score = util.cos_sim(embeddings[0], embeddings[1])
    return float(score[0][0]) * 100  # Trả về thang điểm 100