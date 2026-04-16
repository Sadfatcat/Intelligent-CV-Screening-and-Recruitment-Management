# backend/app/services/ai_service.py

import fitz  # PyMuPDF
import torch
from sentence_transformers import util

from app.services.vectorizer import get_model, passage_to_vector, query_to_vector, vector_from_json

model = get_model()


def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def _normalize_vector(vector):
    if vector is None:
        return None
    if isinstance(vector, str):
        return vector_from_json(vector)
    return vector


def calculate_match_score_from_vectors(cv_vector, jd_vector):
    normalized_cv_vector = _normalize_vector(cv_vector)
    normalized_jd_vector = _normalize_vector(jd_vector)

    if not normalized_cv_vector or not normalized_jd_vector:
        return None

    cv_tensor = torch.tensor([normalized_cv_vector], dtype=torch.float32)
    jd_tensor = torch.tensor([normalized_jd_vector], dtype=torch.float32)

    score = util.cos_sim(cv_tensor, jd_tensor)
    return float(score[0][0]) * 100


def calculate_match_score(cv_text, jd_text):
    cv_vector = query_to_vector(cv_text)
    jd_vector = passage_to_vector(jd_text)
    return calculate_match_score_from_vectors(cv_vector, jd_vector)