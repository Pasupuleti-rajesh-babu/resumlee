# Resumelee

**Tailor your resume to any job. Without breaking your format.**

Resumelee rewrites only the words — not the document. Your original DOCX structure, bullets, fonts, spacing, and layout stay exactly as they are.

---

## How it works

### The problem with other AI resume tools

Most tools extract text, ask AI to write a full resume, then generate a brand-new DOCX. This destroys your original formatting, spacing, bullets, fonts, and ATS-friendly structure.

### The Resumelee approach

```
DOCX template → extract paragraph IDs → AI returns text patches → replace same paragraphs → save DOCX
```

1. The original DOCX is used as a template — never recreated
2. Each paragraph is assigned a stable `block_id` (e.g. `p_0`, `p_1`)
3. Locked blocks (name, contact, education, employer names, dates, headings) are never sent to AI
4. AI returns JSON patches only — targeted rewrites for bullet points, summary, and skills
5. Patches are applied to the original paragraphs in place
6. The output DOCX looks identical to the input, with tailored content

---

## Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | Next.js 14, Tailwind CSS           |
| Backend  | Python FastAPI, python-docx        |
| AI       | OpenAI GPT-4o (JSON mode)          |
| Deploy   | Vercel (frontend), Railway/Render (backend) |

---

## Project structure

```
resumlee/
├── backend/
│   ├── main.py                  # FastAPI app, /tailor-resume endpoint
│   ├── requirements.txt
│   ├── .env.example
│   └── services/
│       ├── resume_parser.py     # DOCX block extraction + lock detection
│       ├── openai_service.py    # OpenAI JSON patch generation
│       └── resume_tailor.py     # Patch application + file save
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   ├── components/          # UI components
│   │   └── lib/api.ts           # API client
│   ├── package.json
│   └── .env.example
├── vercel.json                  # Vercel deployment config
├── .env.example
└── README.md
```

---

## Local development

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key

### Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be running at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variable
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000 (already set)

# Run the dev server
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## Environment variables

### Backend (`.env` in `/backend`)

| Variable          | Required | Description                                        |
|-------------------|----------|----------------------------------------------------|
| `OPENAI_API_KEY`  | Yes      | Your OpenAI API key                                |
| `ALLOWED_ORIGINS` | No       | Comma-separated CORS origins (default: `*`)        |

### Frontend (`.env.local` in `/frontend`)

| Variable                | Required | Description                          |
|-------------------------|----------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`   | Yes      | URL of the FastAPI backend           |

---

## API documentation

### `GET /health`

Returns `{"status": "ok"}`. Use this to verify the backend is running.

---

### `POST /tailor-resume`

Tailors a resume DOCX to match a job description.

**Content-Type:** `multipart/form-data`

| Field             | Type   | Required | Description                          |
|-------------------|--------|----------|--------------------------------------|
| `resume_file`     | File   | Yes      | The base resume (.docx only)         |
| `job_description` | string | Yes      | Full job posting text (min 50 chars) |
| `target_role`     | string | No       | Target job title hint for the AI     |

**Success response:** `200 OK` — Binary DOCX file download (`tailored_resume.docx`)

**Error responses:**

| Status | Reason                                      |
|--------|---------------------------------------------|
| 400    | File is not .docx / JD empty or too short   |
| 500    | Internal error (AI failure, parsing error)  |

---

## Vercel deployment

### Frontend (Vercel)

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend` (or leave as-is if using `vercel.json`)
4. Add environment variable: `NEXT_PUBLIC_API_URL` → your backend URL
5. Deploy

### Backend (Railway or Render)

#### Railway

```bash
# In the Railway dashboard:
# 1. New project → Deploy from GitHub repo
# 2. Set root directory to: backend
# 3. Add environment variable: OPENAI_API_KEY
# 4. Add environment variable: ALLOWED_ORIGINS=https://your-app.vercel.app
# 5. Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Render

```bash
# In the Render dashboard:
# 1. New Web Service → Connect GitHub repo
# 2. Root directory: backend
# 3. Build command: pip install -r requirements.txt
# 4. Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
# 5. Add env vars: OPENAI_API_KEY, ALLOWED_ORIGINS
```

After deploying the backend, update `NEXT_PUBLIC_API_URL` in Vercel to point to your backend URL. Also update `vercel.json` to replace `https://your-backend-url.com` with the actual backend URL.

---

## Testing

### Manual test

1. Start both backend and frontend locally
2. Open `http://localhost:3000`
3. Upload a real `.docx` resume
4. Paste a real job description (at least 50 words)
5. Click "Tailor Resume"
6. Open the downloaded `tailored_resume.docx` and verify:
   - The document looks identical to the original (fonts, bullets, margins)
   - The content has been updated to include relevant keywords
   - Name, contact info, education, and company names are unchanged

### API test with curl

```bash
curl -X POST http://localhost:8000/tailor-resume \
  -F "resume_file=@/path/to/resume.docx" \
  -F "job_description=We are looking for a Senior Software Engineer with experience in Python, FastAPI, and AWS cloud services..." \
  -F "target_role=Senior Software Engineer" \
  --output tailored_resume.docx
```

---

## What is locked (never changed)

- Candidate name
- Email, phone, LinkedIn, GitHub, portfolio links
- Company names and client names
- Job dates and locations
- Education, degrees, university names
- Certifications
- Section headings

## What gets tailored

- Professional summary
- Technical skills section
- Experience bullet points
- Project descriptions
- Tools and environment lines
- Achievement wording and keyword alignment
