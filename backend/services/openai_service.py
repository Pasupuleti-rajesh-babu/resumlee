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


TAILORING_SYSTEM_PROMPT = """You are a professional resume tailoring engine. You practice CONTROLLED, TARGETED tailoring.

You will receive a carefully filtered set of resume blocks to rewrite, plus a job description.
You will also know which client/company sections were selected for tailoring.

Strict rules:
1. Return ONLY valid JSON — no markdown, no explanations, no preamble.
2. Only include a block in patches if you are actually changing it. Skip blocks that don't need changes.
3. Never invent fake employers, metrics, dates, degrees, certifications, or projects.
4. Never change company/client names, job titles, dates, or locations — those were already excluded.
5. Use JD keywords naturally. Do not keyword-stuff.
6. Keep each rewritten block close to the original length. Preserve the same number of bullet points.
7. Make output ATS-friendly and truthful.

Per block type:
- RESPONSIBILITY BULLETS: rewrite to naturally align with JD. Same sentence count. Same approximate length.
- ENVIRONMENT/TOOLS lines: update to reflect relevant tools from the JD that fit the candidate's background.
- SUMMARY blocks: make MINIMAL adjustments only — adjust 1-2 phrases. Do NOT fully rewrite. If it already aligns, skip it.
- SKILLS blocks: ONLY add or lightly adjust to include JD-relevant skills missing from the resume. Do NOT remove existing skills. Keep the same format.

Output format (strict JSON):
{
  "patches": [
    {
      "block_id": "p_X",
      "rewritten_text": "The tailored text here",
      "reason": "One short sentence explaining this specific change"
    }
  ]
}"""


def get_patches(
    editable_blocks: list[dict],
    job_description: str,
    target_role: str = "",
    selected_client_names: list[str] | None = None,
) -> list[dict]:
    """AI Call 2 — targeted tailoring. Only rewrites the provided editable blocks."""
    if not editable_blocks:
        return []

    role_line = f"\nTarget Role: {target_role.strip()}" if target_role.strip() else ""
    clients_line = (
        f"\nSelected experience sections being tailored: {', '.join(selected_client_names)}"
        if selected_client_names
        else ""
    )

    user_message = (
        f"Job Description:\n{job_description.strip()}{role_line}{clients_line}\n\n"
        f"Editable resume blocks (tailor these only):\n"
        f"{json.dumps(editable_blocks, indent=2)}\n\n"
        "Return only the JSON patches for blocks you are actually changing."
    )

    response = _get_client().chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": TAILORING_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    result = json.loads(response.choices[0].message.content)
    return result.get("patches", [])
