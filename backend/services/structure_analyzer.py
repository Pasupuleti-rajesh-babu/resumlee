import json
import os
from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set.")
        _client = OpenAI(api_key=api_key)
    return _client


STRUCTURE_SYSTEM_PROMPT = """You are a resume structure analyzer. Your ONLY job is to identify WHERE each section starts and ends in the resume.

Do NOT rewrite, improve, summarize, or modify any text.
Do NOT list every individual block ID — only return the START and END block ID for each section.

You receive blocks as a JSON array: {"id": "p_X", "text": "...", "style": "..."}
Use the EXACT "id" values from the input when returning start_block_id and end_block_id.

Identify these sections and return their boundary block IDs:
1. SUMMARY — professional summary / profile paragraph(s). Usually near the top, before skills.
2. SKILLS — technical skills, core competencies, tools. Usually a comma-separated list or short lines.
3. EXPERIENCE — all client/company sections combined. For each individual client/employer:
   - client_name: the company or employer name
   - role: the job title
   - date_range: the date range (e.g. "February 2024 – Present")
   - start_block_id: the first block of this client's section (typically the company name line)
   - end_block_id: the last block of this client's section (before the next client starts)
4. EDUCATION — degree, university lines.

Return ONLY this JSON structure (all keys required, use empty string "" for sections not found):
{
  "sections": {
    "summary": {
      "start_block_id": "p_X",
      "end_block_id": "p_X"
    },
    "skills": {
      "start_block_id": "p_X",
      "end_block_id": "p_X"
    },
    "experience": {
      "clients": [
        {
          "client_index": 1,
          "client_name": "Company Name",
          "role": "Job Title",
          "date_range": "Month Year – Month Year",
          "start_block_id": "p_X",
          "end_block_id": "p_X"
        }
      ]
    },
    "education": {
      "start_block_id": "p_X",
      "end_block_id": "p_X"
    }
  },
  "total_clients": 0
}"""


def analyze_structure(all_blocks: list[dict]) -> dict:
    """
    AI Call 1 — detect resume section boundaries only.
    Returns start/end block IDs per section.
    The backend resolves editable blocks within those ranges using is_locked().
    """
    if not all_blocks:
        return {
            "sections": {
                "summary": {"start_block_id": "", "end_block_id": ""},
                "skills": {"start_block_id": "", "end_block_id": ""},
                "experience": {"clients": []},
                "education": {"start_block_id": "", "end_block_id": ""},
            },
            "total_clients": 0,
        }

    compact = [
        {"id": b["block_id"], "text": b["text"], "style": b.get("style", "")}
        for b in all_blocks
    ]

    user_message = (
        "Identify the section boundaries in this resume. "
        "Return only start_block_id and end_block_id for each section using the exact 'id' values from the input.\n\n"
        f"Resume blocks:\n{json.dumps(compact, ensure_ascii=False)}"
    )

    response = _get_client().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": STRUCTURE_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    result = json.loads(response.choices[0].message.content)

    clients = result.get("sections", {}).get("experience", {}).get("clients", [])
    result["total_clients"] = len(clients)

    return result
