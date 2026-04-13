# backend/app/services/ai_service.py

import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer, util

# 1. Load model (nên load một lần khi khởi động app)
model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def calculate_match_score(cv_text, jd_text):
    # 2. Chuyển đổi sang vector
    embeddings = model.encode([cv_text, jd_text])
    
    # 3. Tính toán Cosine Similarity
    score = util.cos_sim(embeddings[0], embeddings[1])
    return float(score[0][0]) * 100  # Trả về thang điểm 100