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

SYSTEM_PROMPT = """You are a professional resume tailoring engine.

Your ONLY job is to rewrite editable resume blocks to better match a job description.

Rules you MUST follow:
1. Return ONLY valid JSON — no markdown, no explanations, no preamble.
2. Never invent fake employers, dates, degrees, certifications, metrics, or projects.
3. Use job description keywords only where they fit the candidate's actual background.
4. Keep each rewritten block close to the original length so the page layout is preserved.
5. Preserve the professional tone of the original resume.
6. Do not change locked content — skip blocks you would otherwise leave unchanged.
7. Output must be ATS-friendly plain text inside each patch.
8. Only include blocks in the patches array that you are actually rewriting.

Output format (strict JSON, no other text):
{
  "patches": [
    {
      "block_id": "p_X",
      "rewritten_text": "Tailored paragraph text here"
    }
  ]
}"""


def get_patches(editable_blocks: list[dict], job_description: str, target_role: str = "") -> list[dict]:
    if not editable_blocks:
        return []

    role_line = f"\nTarget Role: {target_role}" if target_role.strip() else ""

    user_message = f"""Job Description:
{job_description.strip()}{role_line}

Editable resume blocks (JSON):
{json.dumps(editable_blocks, indent=2)}

Rewrite the blocks above to match the job description. Return only the JSON patches."""

    response = _get_client().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw = response.choices[0].message.content
    result = json.loads(raw)
    return result.get("patches", [])
