export default function Footer() {
  return (
    <footer className="border-t border-slate-100 py-10 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 4h12M3 8h8M3 12h10M3 16h6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-bold text-slate-800 text-sm">Resumelee</span>
        </div>

        <p className="text-sm text-slate-400 text-center">
          Tailor your resume to any job without breaking your format.
        </p>

        <p className="text-xs text-slate-300">
          © {new Date().getFullYear()} Resumelee
        </p>
      </div>
    </footer>
  );
}
