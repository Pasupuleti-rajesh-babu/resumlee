export default function CtaSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <div className="card p-10 sm:p-14 bg-slate-900 border-slate-800 relative overflow-hidden">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #6366f1 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-4">
              Start now — it&apos;s free
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
              Stop rewriting your resume
              <br className="hidden sm:block" /> for every job posting.
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Upload your base resume once. Resumelee handles the rest —
              tailored content, original format, every time.
            </p>
            <a
              href="/app"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all duration-150 active:scale-95 w-full sm:w-auto"
            >
              Tailor my resume now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
