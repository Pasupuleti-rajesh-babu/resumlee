const steps = [
  {
    number: "01",
    title: "Upload your base resume",
    description:
      "Upload the .docx resume you already have. Resumelee reads the document structure — every paragraph, bullet, and style — without altering a thing.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6M12 12v6M9 15l3-3 3 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Paste the job description",
    description:
      "Copy the full job posting. Resumelee identifies which parts of your resume to tailor, and which to leave completely untouched.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h4M12 16h4M8 12h.01M8 16h.01"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "AI rewrites only the right parts",
    description:
      "GPT-4o patches your bullet points, summary, and skills to match the job. Names, dates, companies, education — all locked. Nothing invented.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Download your tailored resume",
    description:
      "Get back the exact same DOCX file — same fonts, margins, bullets, and layout — with content tailored to the job. Ready for ATS and human reviewers.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 15l-3-3m0 0l3-3m-3 3h12M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-label mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Four steps, two minutes
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Resumelee is fast. Upload once, tailor for every job you apply to.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-slate-100 z-0 -translate-y-px" />
              )}

              <div className="card p-6 h-full flex flex-col gap-4 hover:shadow-md hover:border-brand-100 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-300 tabular-nums">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
