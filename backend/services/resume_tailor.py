from docx import Document
from .resume_parser import extract_blocks, is_locked
from .openai_service import get_patches


# ── Format-preserving write ───────────────────────────────────────────────────

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
    """Apply patch_map to doc. is_locked() is the final safety gate on every write."""
    for i, para in enumerate(doc.paragraphs):
        block_id = f"p_{i}"
        if block_id in patch_map and not is_locked(para):
            replace_paragraph_text_keep_format(para, patch_map[block_id])


# ── Range-based block resolution ─────────────────────────────────────────────

def _block_idx(bid: str) -> int:
    """Extract integer from 'p_42' → 42. Returns -1 on parse failure."""
    try:
        return int(bid.split("_")[1])
    except (ValueError, IndexError, AttributeError):
        return -1


def _blocks_in_range(start_id: str, end_id: str, all_blocks: list[dict]) -> list[dict]:
    """
    Return all blocks whose paragraph index falls within [start, end] inclusive.
    Works even if the AI slightly mis-identifies the boundary (off-by-one is fine).
    """
    s = _block_idx(start_id)
    e = _block_idx(end_id)
    if s < 0 or e < 0 or s > e:
        return []
    return [b for b in all_blocks if s <= _block_idx(b["block_id"]) <= e]


# ── Main tailoring function ───────────────────────────────────────────────────

def tailor_resume_controlled(
    input_path: str,
    job_description: str,
    target_role: str,
    resume_map: dict,
    selected_client_indices: list[int],
    output_path: str,
) -> None:
    """
    Two-call controlled tailoring pipeline.

    AI Call 1 (already done, result is resume_map) identified section boundaries.
    This function resolves editable blocks using is_locked() — NOT the AI's block lists —
    then calls AI Call 2 with only those blocks.

    selected_client_indices: 1-based. Empty list = tailor all clients.
    """
    doc = Document(input_path)
    all_blocks = extract_blocks(doc)

    sections = resume_map.get("sections", {})
    clients = sections.get("experience", {}).get("clients", [])

    # ── Resolve selected clients (type-safe: compare as str so "1" == 1) ──────
    selected_set = {str(i) for i in selected_client_indices}

    if not selected_client_indices:
        selected = clients
    else:
        selected = [
            c for c in clients
            if str(c.get("client_index", "")) in selected_set
        ]

    selected_names = [c.get("client_name", "") for c in selected if c.get("client_name")]

    # ── Build allowed_ids via range lookup + rule-based is_locked() ───────────
    # This is the key fix: we use the AI's start/end boundaries but apply
    # our own rule-based is_locked() to decide what's editable within that range.
    # We do NOT trust the AI's individual block ID lists (which are unreliable).

    allowed_ids: set[str] = set()

    # Selected client sections
    for client in selected:
        start_id = client.get("start_block_id", "")
        end_id = client.get("end_block_id", "")
        for b in _blocks_in_range(start_id, end_id, all_blocks):
            if b["editable"]:
                allowed_ids.add(b["block_id"])

    # Summary section (light adjustment only)
    summary = sections.get("summary", {})
    for b in _blocks_in_range(summary.get("start_block_id", ""), summary.get("end_block_id", ""), all_blocks):
        if b["editable"]:
            allowed_ids.add(b["block_id"])

    # Skills section (add missing relevant skills only)
    skills = sections.get("skills", {})
    for b in _blocks_in_range(skills.get("start_block_id", ""), skills.get("end_block_id", ""), all_blocks):
        if b["editable"]:
            allowed_ids.add(b["block_id"])

    # ── Build list of blocks to send to AI ───────────────────────────────────
    blocks_to_tailor = [b for b in all_blocks if b["block_id"] in allowed_ids]

    if not blocks_to_tailor:
        raise RuntimeError(
            "No editable blocks found for the selected sections. "
            "The resume structure may not have been detected correctly. "
            "Try re-analyzing the resume."
        )

    # ── AI Call 2: targeted tailoring ────────────────────────────────────────
    patches = get_patches(blocks_to_tailor, job_description, target_role, selected_names)

    patch_map: dict[str, str] = {}
    for patch in patches:
        bid = patch.get("block_id", "")
        text = patch.get("rewritten_text", "").strip()
        # Triple safety: must be in allowed_ids AND pass is_locked() at write time
        if bid and text and bid in allowed_ids:
            patch_map[bid] = text

    if not patch_map:
        raise RuntimeError(
            "The AI did not return any changes for the selected sections. "
            "Try re-analyzing with a more detailed job description."
        )

    _apply_patches(doc, patch_map)
    doc.save(output_path)
