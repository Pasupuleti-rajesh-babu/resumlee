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
  | "form"
  | "analyzing"
  | "select"
  | "tailoring"
  | "done"
  | "error";

const PRESET_LABELS: Record<string, string> = {
  "1": "First 1",
  "2": "First 2",
  "3": "First 3",
  "4": "First 4",
  all: "All",
};

// ── Step progress indicator ───────────────────────────────────────────────────

function StepBar({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[
        { n: 1, label: "Analyze" },
        { n: 2, label: "Tailor" },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-2">
          {i > 0 && (
            <div className={`h-px w-8 sm:w-12 transition-colors ${current >= n ? "bg-brand-500" : "bg-slate-200"}`} />
          )}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
              current > n
                ? "bg-brand-500 text-white"
                : current === n
                ? "bg-brand-600 text-white ring-4 ring-brand-100"
                : "bg-slate-100 text-slate-400"
            }`}>
              {current > n ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l2.5 2.5L9.5 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : n}
            </div>
            <span className={`text-sm font-semibold hidden sm:block transition-colors ${current === n ? "text-slate-900" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
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

function LoadingScreen({ step, label }: { step: 1 | 2; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 animate-spin text-brand-100" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
        </svg>
        <svg className="w-16 h-16 animate-spin text-brand-600 absolute inset-0" style={{ animationDuration: "0.9s" }} viewBox="0 0 64 64" fill="none">
          <path d="M32 4a28 28 0 0128 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-600">
          {step}/2
        </span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">{label}</p>
        <p className="text-sm text-slate-400 mt-1">This may take 15–30 seconds</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TailorWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const [clients, setClients] = useState<ClientInfo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeMap, setResumeMap] = useState<Record<string, any>>({});

  const [preset, setPreset] = useState<string>("2");
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
      const isFirstN = clients
        .slice(0, next.size)
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
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      setErrorMsg("Paste the full job description (at least 50 characters).");
      return;
    }

    setErrorMsg("");
    setStep("analyzing");

    try {
      const result = await analyzeResume({ file, accessCode });
      setClients(result.clients);
      setResumeMap(result.resume_map);

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* ── LOADING: Analyzing ── */}
      {step === "analyzing" && (
        <LoadingScreen step={1} label="Analyzing your resume structure…" />
      )}

      {/* ── LOADING: Tailoring ── */}
      {step === "tailoring" && (
        <LoadingScreen step={2} label="Rewriting selected sections to match the job…" />
      )}

      {/* ── DONE ── */}
      {step === "done" && (
        <div className="flex flex-col items-center text-center py-16 gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M7 18l7 7L29 9" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your tailored resume is ready</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
              The file downloaded automatically. Open it to confirm the selected sections
              were updated while everything else stayed exactly as you had it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={reset} className="btn-primary py-3 px-8">
              Tailor another resume
            </button>
            <button onClick={() => setStep("select")} className="btn-secondary py-3 px-6">
              Change selection &amp; re-tailor
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {step === "error" && (
        <div className="py-8">
          <ErrorBanner message={errorMsg} />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={backToForm} className="btn-primary py-3 px-6">
              Go back and fix
            </button>
            <button onClick={reset} className="btn-secondary py-3 px-6">
              Start over
            </button>
          </div>
        </div>
      )}

      {/* ── FORM (step 1) ── */}
      {step === "form" && (
        <div>
          <StepBar current={1} />

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            Set up your tailoring job
          </h1>
          <p className="text-slate-500 mb-8 text-sm sm:text-base">
            Upload your base resume, paste the job posting, and we&apos;ll detect which sections to tailor.
          </p>

          <div className="space-y-5">
            {/* Access code */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Resume <span className="text-slate-400 font-normal">.docx</span> <span className="text-red-400">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`upload-zone border-2 border-dashed rounded-xl p-6 text-center cursor-pointer select-none transition-all ${
                  isDragging
                    ? "border-brand-500 bg-brand-50 scale-[1.01]"
                    : file
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
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
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10l4 4L16 6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 break-all">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#94a3b8" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M14 2v6h6M12 12v6M9 15l3-3 3 3" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Drop your resume here</p>
                      <p className="text-xs text-slate-400 mt-0.5">or tap to browse · .docx only</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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

            {/* Job description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Job description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting here. The more detail, the better the tailoring."
                rows={10}
                className="input-field resize-none font-mono text-sm leading-relaxed"
              />
              {jobDescription.trim() && (
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {jobDescription.trim().split(/\s+/).length} words
                </p>
              )}
            </div>

            {/* What we never touch */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700 mb-2">We never touch</p>
              {[
                "Name, email, phone, and links",
                "Company names, job titles, dates",
                "Education, degrees, certifications",
                "Unselected experience sections",
              ].map((item) => (
                <p key={item} className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-brand-500 shrink-0">
                    <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </p>
              ))}
            </div>

            {errorMsg && <ErrorBanner message={errorMsg} />}

            <button
              onClick={handleAnalyze}
              className="btn-primary w-full py-4 text-base"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Analyze resume structure
            </button>
          </div>
        </div>
      )}

      {/* ── SELECT (step 2) ── */}
      {step === "select" && (
        <div>
          <StepBar current={2} />

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            Choose sections to tailor
          </h1>
          <p className="text-slate-500 mb-8 text-sm sm:text-base">
            Only selected sections get rewritten. Everything else stays exactly as is.
          </p>

          {/* Detected badge */}
          <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-500 shrink-0">
              <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-semibold text-emerald-700">
              {clients.length} experience {clients.length === 1 ? "section" : "sections"} detected
            </p>
          </div>

          {/* Preset quick-select */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {(["1", "2", "3", "4", "all"] as const)
                .filter((p) => p === "all" || parseInt(p) <= clients.length)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p, clients)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all min-h-[44px] ${
                      preset === p
                        ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                    }`}
                  >
                    {PRESET_LABELS[p]}
                    {p === "2" && clients.length >= 2 && preset === "2" && (
                      <span className="ml-1.5 text-xs opacity-70">✓</span>
                    )}
                  </button>
                ))}
              {preset === "custom" && (
                <span className="px-4 py-2 rounded-lg text-sm font-semibold border bg-brand-50 text-brand-600 border-brand-200 min-h-[44px] flex items-center">
                  Custom
                </span>
              )}
            </div>
          </div>

          {/* Client checklist */}
          <div className="space-y-2 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Or pick specific sections</p>
            {clients.map((client) => {
              const checked = checkedIndices.has(client.client_index);
              return (
                <label
                  key={client.client_index}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none min-h-[64px] ${
                    checked
                      ? "border-brand-200 bg-brand-50"
                      : "border-slate-100 bg-white hover:border-slate-200 active:bg-slate-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "bg-brand-600 border-brand-600" : "border-slate-300 bg-white"
                  }`}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5l2.5 2.5L9 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${checked ? "text-brand-700" : "text-slate-800"}`}>
                        {client.client_name}
                      </span>
                    </div>
                    {(client.role || client.date_range) && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {[client.role, client.date_range].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${checked ? "text-brand-500" : "text-slate-300"}`}>
                    {checked ? "Tailor" : "Skip"}
                  </span>
                </label>
              );
            })}
          </div>

          {/* What will happen */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 mb-6 space-y-1.5">
            <p className="font-semibold text-slate-700 mb-2">What happens when you tailor</p>
            <p className="flex items-center gap-2"><span className="text-brand-500 font-bold">→</span> Selected sections: bullet points and tool lines rewritten</p>
            <p className="flex items-center gap-2"><span className="text-brand-500 font-bold">→</span> Summary: 1–2 phrases adjusted only</p>
            <p className="flex items-center gap-2"><span className="text-brand-500 font-bold">→</span> Skills: missing JD keywords added — nothing removed</p>
            <p className="flex items-center gap-2"><span className="text-brand-500 font-bold">→</span> Everything else: completely untouched</p>
          </div>

          {errorMsg && <div className="mb-5"><ErrorBanner message={errorMsg} /></div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleTailor}
              disabled={checkedIndices.size === 0}
              className="btn-primary py-4 px-8 text-base flex-1 sm:flex-none"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tailor {checkedIndices.size === clients.length ? "all" : checkedIndices.size}{" "}
              {checkedIndices.size === 1 ? "section" : "sections"}
            </button>
            <button onClick={backToForm} className="btn-secondary py-3 px-5 text-sm">
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
