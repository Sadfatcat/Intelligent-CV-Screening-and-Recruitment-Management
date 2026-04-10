import json
from sentence_transformers import SentenceTransformer

_model = None


def get_model() -> SentenceTransformer:
    # lazy load, chỉ tải lần đầu dùng
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def text_to_vector(text: str) -> list[float]:
    model = get_model()
    return model.encode(text, convert_to_numpy=True).tolist()


def text_to_vector_json(text: str) -> str:
    # lưu vector dưới dạng json string để nhét vào db
    return json.dumps(text_to_vector(text))


def vector_from_json(json_str: str) -> list[float]:
    return json.loads(json_str)
