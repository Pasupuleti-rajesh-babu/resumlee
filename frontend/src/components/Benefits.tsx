const benefits = [
  {
    title: "Format perfectly preserved",
    description:
      "We never create a new document. The tailored file is your original DOCX with text patches applied — every margin, font, and bullet point intact.",
    color: "bg-brand-50 text-brand-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 8h8M7 11h5M7 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "ATS-optimized output",
    description:
      "Job description keywords are woven naturally into your existing bullet points, making the resume readable for both applicant tracking systems and humans.",
    color: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 11l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Nothing fabricated",
    description:
      "Resumelee never invents employers, projects, metrics, or skills. Every rewrite is grounded in your actual resume content.",
    color: "bg-amber-50 text-amber-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3l1.8 5.5h5.8l-4.7 3.4 1.8 5.5L11 14l-4.7 3.4 1.8-5.5L3.4 8.5h5.8L11 3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "One base, many jobs",
    description:
      "Keep one polished base resume. Tailor it instantly for each job application without manually editing the document every time.",
    color: "bg-violet-50 text-violet-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M4 6h14M4 10h10M4 14h12M4 18h8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Locked critical information",
    description:
      "Your name, contact details, employer names, education, and dates are never touched — even when you tell the AI to tailor aggressively.",
    color: "bg-rose-50 text-rose-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="5" y="10" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 10V7a3 3 0 116 0v3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="11" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Instant download",
    description:
      "No account required, no subscription. Upload, tailor, download. The process takes under two minutes from start to finish.",
    color: "bg-sky-50 text-sky-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 4v10M7 10l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 16v1a1 1 0 001 1h12a1 1 0 001-1v-1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function Benefits() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Why Resumelee</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Built the right way
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Most AI resume tools generate a brand new document and break your
            formatting. Resumelee does the opposite.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="card p-6 hover:shadow-md hover:border-slate-200 transition-all duration-200"
            >
              <div
                className={`w-10 h-10 rounded-xl ${b.color} flex items-center justify-center mb-4`}
              >
                {b.icon}
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
