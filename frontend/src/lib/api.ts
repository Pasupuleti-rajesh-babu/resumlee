const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/_/backend"
    : "http://localhost:8000");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientInfo {
  client_index: number;
  client_name: string;
  role: string;
  date_range: string;
}

export interface AnalyzeResumeResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resume_map: Record<string, any>;
  clients: ClientInfo[];
  total_clients: number;
}

export interface TailorResumeParams {
  file: File;
  jobDescription: string;
  targetRole?: string;
  accessCode?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resumeMap: Record<string, any>;
  selectedClients: string; // "1,2" | "all"
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function analyzeResume({
  file,
  accessCode,
}: {
  file: File;
  accessCode?: string;
}): Promise<AnalyzeResumeResult> {
  const fd = new FormData();
  fd.append("resume_file", file);
  if (accessCode?.trim()) fd.append("access_code", accessCode.trim());

  const res = await fetch(`${API_URL}/analyze-resume`, { method: "POST", body: fd });
  return handleResponse<AnalyzeResumeResult>(res);
}

export async function tailorResume({
  file,
  jobDescription,
  targetRole,
  accessCode,
  resumeMap,
  selectedClients,
}: TailorResumeParams): Promise<Blob> {
  const fd = new FormData();
  fd.append("resume_file", file);
  fd.append("job_description", jobDescription);
  fd.append("resume_map", JSON.stringify(resumeMap));
  fd.append("selected_clients", selectedClients);
  if (targetRole?.trim()) fd.append("target_role", targetRole.trim());
  if (accessCode?.trim()) fd.append("access_code", accessCode.trim());

  const res = await fetch(`${API_URL}/tailor-resume`, { method: "POST", body: fd });

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }

  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
