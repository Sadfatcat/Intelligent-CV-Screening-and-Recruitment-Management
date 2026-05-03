import json
import os

_model = None
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-base")
_HAVE_ST = None


def _add_prefix(text: str, prefix: str) -> str:
    cleaned_text = text.strip()
    return f"{prefix} {cleaned_text}" if cleaned_text else prefix


def get_model():
    # lazy load, chỉ tải lần đầu dùng
    global _model
    global _HAVE_ST
    if _HAVE_ST is None:
        try:
            # import here to avoid hard dependency at module import time
            from sentence_transformers import SentenceTransformer as _ST
            _HAVE_ST = True
        except Exception:
            _HAVE_ST = False
    if not _HAVE_ST:
        raise ImportError("sentence-transformers not available in environment")
    if _model is None:
        from sentence_transformers import SentenceTransformer as _ST

        _model = _ST(EMBEDDING_MODEL_NAME)
    return _model


def text_to_vector(text: str) -> list[float]:
    return passage_to_vector(text)


def passage_to_vector(text: str) -> list[float]:
    model = get_model()
    prepared_text = _add_prefix(text, "passage:")
    return model.encode(prepared_text, convert_to_numpy=True).tolist()


def query_to_vector(text: str) -> list[float]:
    model = get_model()
    prepared_text = _add_prefix(text, "query:")
    return model.encode(prepared_text, convert_to_numpy=True).tolist()


def text_to_vector_json(text: str) -> str:
    # lưu vector dưới dạng json string để nhét vào db
    return json.dumps(text_to_vector(text))


def passage_to_vector_json(text: str) -> str:
    return json.dumps(passage_to_vector(text))


def query_to_vector_json(text: str) -> str:
    return json.dumps(query_to_vector(text))


def vector_from_json(json_str: str) -> list[float]:
    return json.loads(json_str)
