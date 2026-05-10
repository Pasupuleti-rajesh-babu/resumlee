from docx import Document
from .resume_parser import extract_blocks, is_locked
from .openai_service import get_patches


def replace_paragraph_text_keep_format(paragraph, new_text: str) -> None:
    """Replace paragraph text while preserving all run formatting."""
    if not paragraph.runs:
        paragraph.add_run(new_text)
        return
    first_run = paragraph.runs[0]
    for run in paragraph.runs:
        run.text = ""
    first_run.text = new_text


def tailor_resume(input_path: str, job_description: str, target_role: str, output_path: str) -> None:
    doc = Document(input_path)

    blocks = extract_blocks(doc)
    editable_blocks = [b for b in blocks if b["editable"]]

    patches = get_patches(editable_blocks, job_description, target_role)

    # Build a lookup: block_id → rewritten_text
    editable_ids = {b["block_id"] for b in editable_blocks}
    patch_map: dict[str, str] = {}
    for patch in patches:
        bid = patch.get("block_id", "")
        text = patch.get("rewritten_text", "").strip()
        if bid and text and bid in editable_ids:
            patch_map[bid] = text

    # Apply patches to the original document
    for i, para in enumerate(doc.paragraphs):
        block_id = f"p_{i}"
        if block_id in patch_map and not is_locked(para):
            replace_paragraph_text_keep_format(para, patch_map[block_id])

    doc.save(output_path)
