"use client";

import {
  useState,
  useRef,
  useCallback,
  DragEvent,
  ChangeEvent,
} from "react";
import {
  analyzeResume,
  tailorResume,
  downloadBlob,
  ApiError,
  ClientInfo,
} from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step =
  | "form"        // initial form
  | "analyzing"   // AI Call 1 in progress
  | "select"      // clients detected, user picks
  | "tailoring"   // AI Call 2 in progress
  | "done"        // download ready
  | "error";      // any unrecoverable error

const PRESET_LABELS: Record<string, string> = {
  "1": "First 1",
  "2": "First 2",
  "3": "First 3",
  "4": "First 4",
  all: "All",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
      {label}
    </span>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-fade-in">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
        <path
          d="M9 6v4M9 13h.01M2.25 9a6.75 6.75 0 1113.5 0 6.75 6.75 0 01-13.5 0z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="animate-spin text-brand-500">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" />
        <path d="M20 4a16 16 0 0116 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TailorWorkspace() {
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline state
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  // Analysis results
  const [clients, setClients] = useState<ClientInfo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeMap, setResumeMap] = useState<Record<string, any>>({});

  // Selection state
  const [preset, setPreset] = useState<string>("2"); // "1"|"2"|"3"|"4"|"all"|"custom"
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set([1, 2]));

  // ── File handling ────────────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".docx")) {
      setErrorMsg("Please upload a .docx file. Other formats are not supported.");
      setStep("error");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStep("form");
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

  // ── Preset / checkbox sync ───────────────────────────────────────────────

  const applyPreset = (p: string, clientList: ClientInfo[]) => {
    setPreset(p);
    if (p === "all") {
      setCheckedIndices(new Set(clientList.map((c) => c.client_index)));
    } else {
      const count = parseInt(p, 10);
      setCheckedIndices(
        new Set(clientList.slice(0, count).map((c) => c.client_index))
      );
    }
  };

  const toggleClient = (idx: number) => {
    setCheckedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      // Update preset label if it now matches a preset count
      const sorted = Array.from(next).sort((a, b) => a - b);
      const isFirstN = clients
        .slice(0, sorted.length)
        .every((c) => next.has(c.client_index));
      if (next.size === clients.length) {
        setPreset("all");
      } else if (isFirstN && Object.keys(PRESET_LABELS).includes(String(next.size))) {
        setPreset(String(next.size));
      } else {
        setPreset("custom");
      }
      return next;
    });
  };

  // ── Step 1: Analyze ──────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file) {
      setErrorMsg("Please upload your resume (.docx) first.");
      return;
    }
    if (!accessCode.trim()) {
      setErrorMsg("Please enter your access code.");
      return;
    }

    setErrorMsg("");
    setStep("analyzing");

    try {
      const result = await analyzeResume({ file, accessCode });
      setClients(result.clients);
      setResumeMap(result.resume_map);

      // Default: first 2 clients (or all if fewer than 2)
      const defaultPreset = result.total_clients <= 2 ? "all" : "2";
      applyPreset(defaultPreset, result.clients);

      setStep("select");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not analyze the resume. Please check the file and try again.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  // ── Step 2: Tailor ───────────────────────────────────────────────────────

  const handleTailor = async () => {
    if (!file) return;
    if (!jobDescription.trim()) {
      setErrorMsg("Please paste the job description.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setErrorMsg("Job description is too short. Paste the full posting for best results.");
      return;
    }
    if (checkedIndices.size === 0) {
      setErrorMsg("Please select at least one experience section to tailor.");
      return;
    }

    setErrorMsg("");
    setStep("tailoring");

    const selectedClients =
      checkedIndices.size === clients.length
        ? "all"
        : Array.from(checkedIndices).sort((a, b) => a - b).join(",");

    try {
      const blob = await tailorResume({
        file,
        jobDescription,
        targetRole,
        accessCode,
        resumeMap,
        selectedClients,
      });
      downloadBlob(blob, "tailored_resume.docx");
      setStep("done");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Tailoring failed. Please try again.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = () => {
    setFile(null);
    setJobDescription("");
    setTargetRole("");
    setErrorMsg("");
    setClients([]);
    setResumeMap({});
    setPreset("2");
    setCheckedIndices(new Set([1, 2]));
    setStep("form");
  };

  const backToForm = () => {
    setErrorMsg("");
    setStep("form");
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section id="tailor" className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-label mb-3">The workspace</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Start tailoring
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Upload your base resume, paste the job description, and choose which
            experience sections to tailor. Everything else stays untouched.
          </p>
        </div>

        {/* ── STEP: Analyzing ── */}
        {step === "analyzing" && (
          <div className="card p-8">
            <StatusBadge label="Step 1 of 2 — Analyzing resume structure" />
            <Spinner label="Reading your resume and detecting experience sections…" />
          </div>
        )}

        {/* ── STEP: Tailoring ── */}
        {step === "tailoring" && (
          <div className="card p-8">
            <StatusBadge label="Step 2 of 2 — Tailoring selected sections" />
            <Spinner label="Rewriting selected experience sections to match the job description…" />
          </div>
        )}

        {/* ── STEP: Done ── */}
        {step === "done" && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 16l6 6L26 8"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Your tailored resume is ready
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              The file has already downloaded. Open it and confirm the selected
              sections were updated while the rest of your resume stayed intact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={reset} className="btn-primary px-6 py-2.5 text-sm">
                Tailor another resume
              </button>
              <button onClick={() => setStep("select")} className="btn-secondary px-6 py-2.5 text-sm">
                Change selection &amp; re-tailor
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Error (unrecoverable) ── */}
        {step === "error" && (
          <div className="card p-8">
            <ErrorBanner message={errorMsg} />
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button onClick={backToForm} className="btn-primary px-6 py-2.5 text-sm">
                Go back and fix
              </button>
              <button onClick={reset} className="btn-secondary px-6 py-2.5 text-sm">
                Start over
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Form (Step 1) ── */}
        {(step === "form" || step === "select") && (
          <div className="space-y-6">
            {/* Main form card */}
            <div className="card p-6 sm:p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                  {/* Access code */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Access code <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Enter your access code"
                        autoComplete="off"
                        className="input-field pr-10"
                        disabled={step === "select"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Upload zone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Resume (DOCX) <span className="text-red-400">*</span>
                    </label>
                    <div
                      onClick={() => step !== "select" && fileInputRef.current?.click()}
                      onDrop={step !== "select" ? onDrop : undefined}
                      onDragOver={step !== "select" ? onDragOver : undefined}
                      onDragLeave={step !== "select" ? onDragLeave : undefined}
                      className={`upload-zone border-2 border-dashed rounded-xl p-6 text-center select-none transition-colors ${
                        step === "select"
                          ? "opacity-60 cursor-default"
                          : "cursor-pointer"
                      } ${
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
                        <div className="flex flex-col items-center gap-1.5">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-800 break-all">{file.name}</p>
                          {step !== "select" && (
                            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                              stroke="#94a3b8" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M14 2v6h6M12 12v6M9 15l3-3 3 3"
                              stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-700">Drop your resume here</p>
                          <p className="text-xs text-slate-400">or click to browse · .docx only</p>
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

                  {/* What stays locked */}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 space-y-1.5">
                    <p className="font-semibold text-slate-600 mb-2">What Resumelee never touches</p>
                    {[
                      "Name, contact info, and links",
                      "Company names, job titles, dates, locations",
                      "Education, degrees, and certifications",
                      "Unselected client sections",
                    ].map((item) => (
                      <p key={item} className="flex items-start gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-brand-500 shrink-0 mt-0.5">
                          <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Right column — JD */}
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Job description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here. The more detail you include, the better the tailoring."
                    rows={step === "select" ? 10 : 18}
                    className="input-field resize-none flex-1 font-mono text-sm leading-relaxed"
                  />
                  {jobDescription.trim() && (
                    <p className="text-xs text-slate-400 text-right">
                      {jobDescription.trim().split(/\s+/).length} words
                    </p>
                  )}
                </div>
              </div>

              {/* Inline error (form step) */}
              {errorMsg && step === "form" && (
                <div className="mt-6">
                  <ErrorBanner message={errorMsg} />
                </div>
              )}

              {/* Analyze button */}
              {step === "form" && (
                <div className="mt-6">
                  <button onClick={handleAnalyze} className="btn-primary text-base py-3.5 px-8 w-full sm:w-auto">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2a7 7 0 100 14A7 7 0 009 2zM9 5v4l3 3"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Analyze resume structure
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    Resumelee will read your resume and detect all experience sections before tailoring.
                  </p>
                </div>
              )}
            </div>

            {/* ── Client selection panel (shown after analysis) ── */}
            {step === "select" && (
              <div className="card p-6 sm:p-8 animate-slide-up">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Choose experience sections to tailor
                    </h3>
                    <p className="text-sm text-slate-500 max-w-xl">
                      Resumelee will only rewrite the selected sections. Unselected clients,
                      education, contact info, dates, and company names stay unchanged.
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-50 text-success-600 text-xs font-semibold">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {clients.length} {clients.length === 1 ? "section" : "sections"} detected
                  </span>
                </div>

                {/* Quick preset buttons */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick select</p>
                  <div className="flex flex-wrap gap-2">
                    {(["1", "2", "3", "4", "all"] as const)
                      .filter((p) => p === "all" || parseInt(p) <= clients.length)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => applyPreset(p, clients)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                            preset === p
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                          }`}
                        >
                          {PRESET_LABELS[p]}
                          {p === "2" && clients.length >= 2 && (
                            <span className="ml-1.5 text-xs opacity-70">(default)</span>
                          )}
                        </button>
                      ))}
                    {preset === "custom" && (
                      <span className="px-4 py-1.5 rounded-lg text-sm font-semibold border bg-brand-50 text-brand-600 border-brand-200">
                        Custom
                      </span>
                    )}
                  </div>
                </div>

                {/* Client checklist */}
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Or pick specific sections
                  </p>
                  {clients.map((client) => {
                    const checked = checkedIndices.has(client.client_index);
                    return (
                      <label
                        key={client.client_index}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                          checked
                            ? "border-brand-200 bg-brand-50"
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-brand-600 border-brand-600" : "border-slate-300"
                        }`}>
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClient(client.client_index)}
                          className="sr-only"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${checked ? "text-brand-700" : "text-slate-800"}`}>
                              {client.client_name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              checked ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-500"
                            }`}>
                              #{client.client_index}
                            </span>
                          </div>
                          {(client.role || client.date_range) && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {[client.role, client.date_range].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium shrink-0 mt-0.5 ${checked ? "text-brand-600" : "text-slate-300"}`}>
                          {checked ? "Will tailor" : "Skip"}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Summary of what will happen */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 mb-6">
                  <p className="font-semibold text-slate-700 mb-1.5">What will happen when you tailor</p>
                  <ul className="space-y-1">
                    <li>✦ Selected sections: bullet points and tools lines will be rewritten</li>
                    <li>✦ Summary: 1–2 phrase adjustments only — not fully rewritten</li>
                    <li>✦ Skills: missing JD-relevant skills added — nothing removed</li>
                    <li>✦ Everything else: untouched</li>
                  </ul>
                </div>

                {/* Inline error (select step) */}
                {errorMsg && <div className="mb-4"><ErrorBanner message={errorMsg} /></div>}

                {/* Tailor button */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <button
                    onClick={handleTailor}
                    disabled={checkedIndices.size === 0}
                    className="btn-primary text-base py-3.5 px-8"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 3v12M3 9l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Tailor {checkedIndices.size === clients.length
                      ? "all"
                      : checkedIndices.size}{" "}
                    {checkedIndices.size === 1 ? "section" : "sections"}
                  </button>
                  <button onClick={backToForm} className="btn-secondary text-sm py-2.5 px-5">
                    ← Back to edit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
