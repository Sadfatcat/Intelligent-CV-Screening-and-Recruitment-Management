"""Các hàm tiện ích xử lý văn bản thô cho bộ so khớp.

Toàn bộ hàm ở đây là hàm thuần (pure function): nhận chuỗi/text vào,
trả ra chuỗi hoặc danh sách đã chuẩn hóa. Không phụ thuộc cấu hình,
không đọc file, nên dễ test và ít khi bị hỏi khi bảo vệ đồ án.
"""

import re
from typing import List


def clean_text(text: str) -> str:
    """Gộp mọi khoảng trắng thừa về 1 dấu cách và chuyển về chữ thường."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.replace("\r", "\n")).strip().lower()


def _normalize_token(text: str) -> str:
    """Chuẩn hóa 1 token: chữ thường, bỏ khoảng trắng thừa và ký tự thừa ở đầu/cuối."""
    return re.sub(r"\s+", " ", (text or "").strip().lower()).strip(" .,:;()[]{}")


def _humanize_item(item: str) -> str:
    """Đổi token đã chuẩn hóa về dạng hiển thị đẹp (vd 'sql' -> 'SQL')."""
    item = _normalize_token(item)
    known = {
        "sql": "SQL",
        "rest api": "REST API",
        "fastapi": "FastAPI",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "postgresql": "PostgreSQL",
        "mysql": "MySQL",
        "mongodb": "MongoDB",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "aws": "AWS",
        "gcp": "GCP",
        "jpa": "JPA",
        "rdbms": "RDBMS",
        "websquare": "WebSquare",
        "ci/cd": "CI/CD",
        "c++": "C++",
        "c#": "C#",
    }
    if item in known:
        return known[item]
    return item[:1].upper() + item[1:] if item else item


def _clamp_score(value: float, low: float = 0.0, high: float = 100.0) -> float:
    """Kẹp điểm về khoảng [low, high]."""
    return max(low, min(high, float(value)))


def _score100(value: float) -> float:
    """Đổi điểm 0-1 sang thang 0-100 và làm tròn."""
    return round(_clamp_score(value * 100.0), 3)


def _line_blocks(text: str) -> List[str]:
    """Tách text thành danh sách các dòng (đã bỏ gạch đầu dòng, bullet)."""
    lines = []
    for raw_line in (text or "").replace("\r", "\n").split("\n"):
        line = raw_line.strip(" \t-•*")
        if line:
            lines.append(line)
    return lines


def _list_blocks(text: str) -> List[str]:
    """Tách text thành danh sách các mục nhỏ, cắt theo dấu ; | • và xuống dòng."""
    blocks = []
    for line in _line_blocks(text):
        blocks.extend(item.strip() for item in re.split(r"[;\n•|]", line) if item.strip())
    return blocks


def _dedupe(items: List[str]) -> List[str]:
    """Loại trùng (theo dạng đã chuẩn hóa) nhưng vẫn giữ nguyên thứ tự xuất hiện."""
    out = []
    seen = set()
    for item in items:
        normalized = _normalize_token(item)
        if not normalized or normalized in seen:
            continue
        out.append(normalized)
        seen.add(normalized)
    return out
