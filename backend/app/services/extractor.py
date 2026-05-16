import io
import fitz
import pytesseract
from PIL import Image
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        for page in pdf_doc:
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text)
    finally:
        pdf_doc.close()
    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    lines = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(lines).strip()


def extract_text_from_image(file_bytes: bytes) -> str:
    # ocr đọc ảnh, hỗ trợ tiếng việt + anh
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image, lang="vie+eng").strip()


def extract_text(file_bytes: bytes, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    elif name.endswith((".jpg", ".jpeg", ".png")):
        return extract_text_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file format: {filename}")
