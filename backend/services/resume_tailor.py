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


def _apply_patches(doc: Document, patch_map: dict[str, str]) -> None:
    """Apply patch_map to doc paragraphs, with is_locked as final safety check."""
    for i, para in enumerate(doc.paragraphs):
        block_id = f"p_{i}"
        if block_id in patch_map and not is_locked(para):
            replace_paragraph_text_keep_format(para, patch_map[block_id])


def tailor_resume_controlled(
    input_path: str,
    job_description: str,
    target_role: str,
    resume_map: dict,
    selected_client_indices: list[int],
    output_path: str,
) -> None:
    """
    Controlled two-call tailoring pipeline.

    selected_client_indices: 1-based list of client_index values to tailor.
                             Empty list means tailor ALL clients.
    """
    doc = Document(input_path)
    all_blocks = extract_blocks(doc)
    block_lookup = {b["block_id"]: b for b in all_blocks}

    sections = resume_map.get("sections", {})
    clients = sections.get("experience", {}).get("clients", [])
    global_locked = set(resume_map.get("locked_block_ids", []))

    # Resolve which clients are selected
    if not selected_client_indices:
        selected = clients
    else:
        selected = [c for c in clients if c.get("client_index") in selected_client_indices]

    selected_names = [c.get("client_name", "") for c in selected if c.get("client_name")]

    # Build the allowed-to-patch set — only these block IDs may receive patches
    allowed_ids: set[str] = set()

    # Selected client editable blocks
    for client in selected:
        for bid in client.get("editable_block_ids", []):
            if bid not in global_locked:
                allowed_ids.add(bid)

    # Summary blocks (light adjustment only — included but AI is instructed to be minimal)
    for bid in sections.get("summary", {}).get("block_ids", []):
        b = block_lookup.get(bid)
        if b and b["editable"] and bid not in global_locked:
            allowed_ids.add(bid)

    # Skills blocks (add missing relevant skills only)
    for bid in sections.get("skills", {}).get("block_ids", []):
        b = block_lookup.get(bid)
        if b and b["editable"] and bid not in global_locked:
            allowed_ids.add(bid)

    # Collect the actual block dicts to send to AI
    blocks_to_tailor = [
        b for b in all_blocks
        if b["block_id"] in allowed_ids and b["editable"]
    ]

    if not blocks_to_tailor:
        doc.save(output_path)
        return

    patches = get_patches(blocks_to_tailor, job_description, target_role, selected_names)

    # Build patch map with triple safety:
    # 1. block_id must be in allowed_ids
    # 2. block_id must not be globally locked
    # 3. is_locked() applied again at write time in _apply_patches
    patch_map: dict[str, str] = {}
    for patch in patches:
        bid = patch.get("block_id", "")
        text = patch.get("rewritten_text", "").strip()
        if bid and text and bid in allowed_ids and bid not in global_locked:
            patch_map[bid] = text

    _apply_patches(doc, patch_map)
    doc.save(output_path)
