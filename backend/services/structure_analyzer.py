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


STRUCTURE_SYSTEM_PROMPT = """You are a resume structure analyzer. Your ONLY job is to map the structure of a resume.

Do NOT rewrite, improve, summarize, or change any text whatsoever.
Only identify which blocks belong to which sections and assign roles to each block.

You receive blocks as: {"id": "p_X", "text": "...", "style": "DOCX style name"}

What to identify:
1. SUMMARY section — the professional summary/profile paragraph(s) near the top.
2. SKILLS section — technical skills, core competencies, tools list.
3. EXPERIENCE section — one entry per client/employer:
   - client_name: the company or client name
   - role: the job title
   - date_range: the employment dates
   - client_header_block_ids: company name, role title, date, location lines (LOCKED)
   - responsibility_block_ids: bullet point lines describing what was done (EDITABLE)
   - environment_block_ids: "Environment:", "Tools:", "Technologies:" lines (EDITABLE)
   - editable_block_ids = responsibility_block_ids + environment_block_ids
   - locked_block_ids = client_header_block_ids
4. EDUCATION section — degree, university, graduation year lines.
5. Global locked_block_ids — name, contact, email, phone, LinkedIn, GitHub, URLs, all section headings.

Locked block recognition patterns:
- Very first lines: candidate name (short, title-cased)
- Lines with @, phone digits, linkedin.com, github.com, http(s)://
- ALL CAPS short lines = section headings
- Short title-cased lines ≤4 words = company name or location
- Lines with year ranges like "2021 – Present" or "Jan 2020 – Mar 2022"
- Education lines: university, college, bachelor, master, phd, gpa, b.s., m.s., mba

Editable per client:
- Bullet point lines (typically start with • or are indented List Paragraph style)
- Environment / Tools / Technologies lines

Return this exact JSON (all keys required, arrays may be empty):
{
  "sections": {
    "summary": { "block_ids": [] },
    "skills": { "block_ids": [] },
    "experience": {
      "clients": [
        {
          "client_index": 1,
          "client_name": "Company Name",
          "role": "Job Title",
          "date_range": "Month Year – Month Year",
          "client_header_block_ids": [],
          "responsibility_block_ids": [],
          "environment_block_ids": [],
          "editable_block_ids": [],
          "locked_block_ids": []
        }
      ]
    },
    "education": { "block_ids": [] }
  },
  "locked_block_ids": [],
  "total_clients": 0
}"""


def analyze_structure(all_blocks: list[dict]) -> dict:
    """AI Call 1 — analyze resume structure. Returns resume map JSON. No content rewriting."""
    if not all_blocks:
        return {
            "sections": {
                "summary": {"block_ids": []},
                "skills": {"block_ids": []},
                "experience": {"clients": []},
                "education": {"block_ids": []},
            },
            "locked_block_ids": [],
            "total_clients": 0,
        }

    compact = [
        {"id": b["block_id"], "text": b["text"], "style": b.get("style", "")}
        for b in all_blocks
    ]

    user_message = (
        "Map the structure of this resume. Return only the JSON structure.\n\n"
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

    # Normalise: ensure total_clients matches the actual client list
    clients = result.get("sections", {}).get("experience", {}).get("clients", [])
    result["total_clients"] = len(clients)

    return result
