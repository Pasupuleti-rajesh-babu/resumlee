const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TailorResumeParams {
  file: File;
  jobDescription: string;
  targetRole?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function tailorResume({
  file,
  jobDescription,
  targetRole,
}: TailorResumeParams): Promise<Blob> {
  const formData = new FormData();
  formData.append("resume_file", file);
  formData.append("job_description", jobDescription);
  if (targetRole?.trim()) {
    formData.append("target_role", targetRole.trim());
  }

  const response = await fetch(`${API_URL}/tailor-resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const json = await response.json();
      detail = json.detail || detail;
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, detail);
  }

  return response.blob();
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
