"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { tailorResume, downloadBlob, ApiError } from "@/lib/api";

type Status = "idle" | "uploading" | "tailoring" | "done" | "error";

export default function TailorWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".docx")) {
      setErrorMsg("Please upload a .docx file. Other formats are not supported.");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStatus("idle");
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const handleTailor = async () => {
    if (!file) {
      setErrorMsg("Please upload your resume (.docx) first.");
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg("Please paste the job description.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setErrorMsg("Job description is too short. Paste the full posting for best results.");
      return;
    }

    setErrorMsg("");
    setStatus("tailoring");

    try {
      const blob = await tailorResume({ file, jobDescription, targetRole });
      downloadBlob(blob, "tailored_resume.docx");
      setStatus("done");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setJobDescription("");
    setTargetRole("");
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <section id="tailor" className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-label mb-3">The workspace</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Start tailoring
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Upload your base resume, paste the job description, and get a
            tailored DOCX back — format intact.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left column — upload + role */}
            <div className="flex flex-col gap-6">
              {/* Upload zone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Resume (DOCX)
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={`upload-zone relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer select-none transition-colors ${
                    isDragging
                      ? "border-brand-500 bg-brand-50"
                      : file
                      ? "border-success-500 bg-success-50"
                      : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    onChange={onFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center mb-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 break-all">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(0)} KB · Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                            stroke="#94a3b8"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M14 2v6h6M12 12v6M9 15l3-3 3 3"
                            stroke="#94a3b8"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Drop your resume here
                      </p>
                      <p className="text-xs text-slate-400">
                        or click to browse · .docx only
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Target role */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Target role{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="input-field"
                />
              </div>

              {/* What stays locked info */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 space-y-1.5">
                <p className="font-semibold text-slate-600 text-xs mb-2">
                  What Resumelee never touches
                </p>
                {[
                  "Your name, contact info, and links",
                  "Company names, dates, and locations",
                  "Education, degrees, and certifications",
                  "Section headings and document structure",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-1.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-brand-500 shrink-0 mt-0.5"
                    >
                      <path
                        d="M2 6l2.5 2.5L10 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </p>
                ))}
              </div>
            </div>

            {/* Right column — JD */}
            <div className="flex flex-col gap-6">
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Job description
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here. The more detail you include, the better the tailoring."
                  rows={14}
                  className="input-field resize-none flex-1 font-mono text-sm leading-relaxed"
                />
                {jobDescription.trim() && (
                  <p className="text-xs text-slate-400 mt-1.5 text-right">
                    {jobDescription.trim().split(/\s+/).length} words
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-fade-in">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="shrink-0 mt-0.5"
              >
                <path
                  d="M9 6v4M9 13h.01M2.25 9a6.75 6.75 0 1113.5 0 6.75 6.75 0 01-13.5 0z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success message */}
          {status === "done" && (
            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-success-50 border border-success-500/20 text-success-600 text-sm animate-fade-in">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                <path
                  d="M3.75 9l3.75 3.75L14.25 5.25"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-medium">
                Your tailored resume downloaded successfully.
              </span>
              <button
                onClick={reset}
                className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
              >
                Start over
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleTailor}
              disabled={status === "tailoring"}
              className="btn-primary w-full sm:w-auto text-base py-3.5 px-8"
            >
              {status === "tailoring" ? (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="animate-spin"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeOpacity="0.3"
                    />
                    <path
                      d="M9 2a7 7 0 017 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Tailoring your resume…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 3v12M3 9l6-6 6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Tailor Resume
                </>
              )}
            </button>

            {status === "tailoring" && (
              <p className="text-sm text-slate-500 animate-pulse">
                AI is reading your resume and applying targeted rewrites…
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
