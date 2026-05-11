import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="text-white">
              <path
                d="M3 4h12M3 8h8M3 12h10M3 16h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-bold text-slate-900 text-base tracking-tight">Resumelee</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>
      </div>
    </header>
  );
}
