import re
from docx import Document


CONTACT_PATTERNS = [
    r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}",
    r"\+?[\d\s\-\(\)\.]{7,20}",
    r"linkedin\.com",
    r"github\.com",
    r"https?://",
    r"www\.",
]

DATE_PATTERNS = [
    r"\b\d{4}\s*[-–—]\s*(\d{4}|Present|Current|Now)\b",
    r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b",
    r"\b(19|20)\d{2}\b",
]

EDUCATION_KEYWORDS = [
    "university", "college", "bachelor", "master", "phd", "ph.d",
    "gpa", "b.s.", "b.a.", "m.s.", "m.a.", "mba", "b.e.", "m.e.",
    "institute of technology", "school of", "magna cum laude",
    "summa cum laude", "cum laude",
]

LOCKED_STYLES = ["Heading", "Title", "Subtitle"]


def is_locked(paragraph) -> bool:
    text = paragraph.text.strip()

    if not text:
        return True

    style_name = paragraph.style.name if paragraph.style else ""

    if any(s in style_name for s in LOCKED_STYLES):
        return True

    for pattern in CONTACT_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True

    for pattern in DATE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            # Lines that are ONLY a date range (e.g. company duration) are locked
            # but if date appears in a longer line it may still be editable
            if len(text) < 60:
                return True

    text_lower = text.lower()
    if any(kw in text_lower for kw in EDUCATION_KEYWORDS):
        return True

    # All-caps short lines are section headings
    stripped_punct = re.sub(r"[^A-Za-z ]", "", text)
    if stripped_punct and stripped_punct.upper() == stripped_punct and len(text) < 60:
        return True

    # Very short lines (≤4 words, title-cased) are likely name or company lines
    words = text.split()
    if len(words) <= 4 and text.istitle() and len(text) < 50:
        return True

    return False


def extract_blocks(doc: Document) -> list[dict]:
    blocks = []
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if not text:
            continue
        blocks.append({
            "block_id": f"p_{i}",
            "text": text,
            "style": para.style.name if para.style else "",
            "editable": not is_locked(para),
        })
    return blocks
