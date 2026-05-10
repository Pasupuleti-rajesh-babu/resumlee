import os
import uuid
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from services.resume_tailor import tailor_resume

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# When ACCESS_CODE is set in the environment, every tailor request must supply it.
# Leave it unset (or empty) to disable the gate — useful for local development.
ACCESS_CODE = os.getenv("ACCESS_CODE", "").strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Resumelee API",
    description="Resume tailoring engine — patches content, preserves DOCX format",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/tailor-resume")
async def tailor_resume_endpoint(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    target_role: str = Form(default=""),
    access_code: str = Form(default=""),
):
    # Validate access code when the gate is active
    if ACCESS_CODE and access_code.strip() != ACCESS_CODE:
        raise HTTPException(status_code=401, detail="Invalid access code. Please check your code and try again.")

    # Validate file type
    filename = resume_file.filename or ""
    if not filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are accepted. Please upload a Word document.")

    # Validate job description
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    if len(job_description) < 50:
        raise HTTPException(status_code=400, detail="Job description is too short. Paste the full job posting for best results.")

    # Write uploaded file to a temp location
    suffix = f"_{uuid.uuid4().hex}"
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"{suffix}_input.docx") as tmp_in:
        content = await resume_file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        tmp_in.write(content)
        input_path = tmp_in.name

    output_path = os.path.join(tempfile.gettempdir(), f"{suffix}_tailored.docx")

    try:
        tailor_resume(input_path, job_description.strip(), target_role.strip(), output_path)
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
