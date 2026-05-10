import json
import os
import uuid
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

load_dotenv()

from docx import Document
from services.resume_parser import extract_blocks
from services.structure_analyzer import analyze_structure
from services.resume_tailor import tailor_resume_controlled

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
ACCESS_CODE = os.getenv("ACCESS_CODE", "").strip()


# ── Shared helpers ────────────────────────────────────────────────────────────

def _check_access(code: str) -> None:
    if ACCESS_CODE and code.strip() != ACCESS_CODE:
        raise HTTPException(
            status_code=401,
            detail="Invalid access code. Please check your code and try again.",
        )


def _check_docx(filename: str) -> None:
    if not (filename or "").lower().endswith(".docx"):
        raise HTTPException(
            status_code=400,
            detail="Only .docx files are accepted. Please upload a Word document.",
        )


async def _save_upload(upload: UploadFile, tag: str) -> str:
    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    path = os.path.join(
        tempfile.gettempdir(),
        f"{uuid.uuid4().hex}_{tag}.docx",
    )
    with open(path, "wb") as f:
        f.write(content)
    return path


# ── App setup ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app):
    yield


app = FastAPI(
    title="Resumelee API",
    description="Format-preserving AI resume tailoring — two-call structured pipeline",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze-resume")
async def analyze_resume_endpoint(
    resume_file: UploadFile = File(...),
    access_code: str = Form(default=""),
):
    """
    AI Call 1 — Structure analysis only.
    Returns a resume map JSON with detected clients and section block IDs.
    Does NOT rewrite any content.
    """
    _check_access(access_code)
    _check_docx(resume_file.filename or "")

    input_path = await _save_upload(resume_file, "analyze")
    try:
        doc = Document(input_path)
        all_blocks = extract_blocks(doc)

        if not all_blocks:
            raise HTTPException(
                status_code=400,
                detail="Could not read any text from the uploaded DOCX. Please check the file.",
            )

        resume_map = analyze_structure(all_blocks)

        clients = resume_map.get("sections", {}).get("experience", {}).get("clients", [])
        if not clients:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not detect any experience sections in this resume. "
                    "Make sure the DOCX contains a work experience section."
                ),
            )

        return JSONResponse({
            "resume_map": resume_map,
            "clients": [
                {
                    "client_index": c.get("client_index"),
                    "client_name": c.get("client_name", "Unknown"),
                    "role": c.get("role", ""),
                    "date_range": c.get("date_range", ""),
                }
                for c in clients
            ],
            "total_clients": len(clients),
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Structure analysis failed: {str(e)}")
    finally:
        try:
            os.unlink(input_path)
        except OSError:
            pass


@app.post("/tailor-resume")
async def tailor_resume_endpoint(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    target_role: str = Form(default=""),
    access_code: str = Form(default=""),
    resume_map: str = Form(...),
    selected_clients: str = Form(default="1,2"),
):
    """
    AI Call 2 — Controlled tailoring.
    Rewrites only selected client sections (+ minimal summary/skills adjustments).
    Returns the tailored DOCX file.
    """
    _check_access(access_code)
    _check_docx(resume_file.filename or "")

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")
    if len(job_description.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short. Paste the full posting for best results.",
        )

    # Parse resume map
    try:
        resume_map_dict = json.loads(resume_map)
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid resume map. Please re-analyze your resume first.",
        )

    # Parse selected client indices
    sc = selected_clients.strip().lower()
    if sc == "all" or sc == "":
        selected_indices: list[int] = []
    else:
        try:
            selected_indices = [int(x.strip()) for x in sc.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid client selection format.")

    input_path = await _save_upload(resume_file, "tailor_in")
    output_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4().hex}_tailored.docx")

    try:
        tailor_resume_controlled(
            input_path=input_path,
            job_description=job_description.strip(),
            target_role=target_role.strip(),
            resume_map=resume_map_dict,
            selected_client_indices=selected_indices,
            output_path=output_path,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailoring failed: {str(e)}")
    finally:
        try:
            os.unlink(input_path)
        except OSError:
            pass

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Output file was not generated.")

    return FileResponse(
        path=output_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="tailored_resume.docx",
        background=None,
    )
