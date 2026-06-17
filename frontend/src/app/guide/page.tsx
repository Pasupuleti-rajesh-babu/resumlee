import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Build a $10K Website in Claude Code — Free Setup Guide | Resumelee",
  description:
    "The exact 4-step setup to go from blank terminal to a polished, production-ready site — using Claude Code as your developer.",
  openGraph: {
    title: "Build a $10K Website in Claude Code — Free Setup Guide",
    description:
      "Install Claude Code, add Framer Motion, wire up a design skill, and plug in 21st.dev components. The stack that turns AI output into agency-quality work.",
    type: "article",
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="mb-4">
      {label && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          {label}
        </p>
      )}
      <pre className="bg-slate-900 text-emerald-400 text-sm font-mono rounded-xl px-5 py-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function PromptBlock({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-brand-400 bg-brand-50 rounded-r-xl px-5 py-4 my-4">
      <p className="text-sm text-brand-800 italic leading-relaxed">{children}</p>
    </blockquote>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5 my-4">
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        className="shrink-0 mt-0.5 text-amber-500"
      >
        <path
          d="M9 2L1.5 15.5h15L9 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 7v4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="9" cy="13" r="0.75" fill="currentColor" />
      </svg>
      <p className="text-sm text-amber-800 leading-relaxed">{children}</p>
    </div>
  );
}

// ── Page data ──────────────────────────────────────────────────────────────────

const stackRows = [
  {
    layer: "Code generation",
    tool: "Claude Code",
    what: "Builds and edits your site locally",
  },
  { layer: "Animation", tool: "Framer Motion", what: "Adds polish and motion" },
  {
    layer: "Design system",
    tool: "Frontend Design Skill",
    what: "Teaches Claude design taste",
  },
  {
    layer: "Components",
    tool: "21st.dev",
    what: "Production-ready UI blocks",
  },
];

const costRows = [
  { route: "Hire a web designer", cost: "$5K–$15K", time: "4–8 weeks" },
  { route: "Hire an agency", cost: "$10K–$30K", time: "6–12 weeks" },
  {
    route: "Claude Code + this stack",
    cost: "$20/month",
    time: "1–3 days",
    highlight: true,
  },
];

const mistakes = [
  {
    title: "Skipping the design skill.",
    body: `Without it, you'll get a generic site that screams "AI-generated."`,
  },
  {
    title: "Vague prompts.",
    body: "Be specific about sections, animations, and content. Claude Code is only as good as your brief.",
  },
  {
    title: "Not iterating.",
    body: "First output is rarely the final output. Ask Claude Code to refine spacing, contrast, and motion.",
  },
  {
    title: "Forgetting performance.",
    body: "Always ask for lazy-loaded images, optimized fonts, and a Lighthouse audit at the end.",
  },
];

const starterPrompt = `Build a modern landing page for [YOUR PRODUCT/SERVICE].

Requirements:
- Use Next.js 14 with the App Router
- Tailwind CSS for styling
- Framer Motion for all animations (scroll reveals, hover states, page transitions)
- Pull hero, features, and pricing sections from 21st.dev components
- Follow the design tokens defined in our frontend design skill
- Add a sticky navbar, a hero with a headline + CTA, 3 feature cards,
  social proof section, pricing, FAQ, and footer
- Mobile-first, fully responsive
- Lighthouse score 90+ on performance

Start by setting up the project structure, then build section by section.
Show me each section before moving to the next.`;

// ── Step content (defined after sub-components) ────────────────────────────────

interface Step {
  number: string;
  badge: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

function buildSteps(): Step[] {
  return [
    {
      number: "01",
      badge: "Terminal",
      title: "Install Claude Code",
      description:
        "Claude Code runs locally through your terminal. One command and you're in.",
      content: (
        <>
          <p className="text-slate-600 leading-relaxed mb-4">
            Claude Code runs locally on your machine through your terminal. One
            command and you're in.
          </p>
          <CodeBlock
            label="Install command"
            code="npm install -g @anthropic-ai/claude-code"
          />
          <CodeBlock label="Then run" code="claude" />
          <Callout>
            <strong>Requirements:</strong> Node.js 18+ installed. Sign in with
            your Anthropic account when prompted.
          </Callout>
          <p className="text-slate-600 leading-relaxed mt-4">
            Claude Code can read your full project, edit multiple files at once,
            run commands, and iterate — that's what makes it different from
            copy-pasting code from a chat window.
          </p>
        </>
      ),
    },
    {
      number: "02",
      badge: "Framer Motion",
      title: "Add Animation Support",
      description:
        "Default AI-generated sites look static and lifeless. Animation is the #1 thing that makes a site feel premium.",
      content: (
        <>
          <p className="text-slate-600 leading-relaxed mb-4">
            Default AI-generated sites look static and lifeless. Animation is
            the #1 thing that makes a site feel premium.
          </p>
          <CodeBlock
            label="Install Framer Motion"
            code="npm install framer-motion"
          />
          <p className="text-slate-600 leading-relaxed mb-3">
            Then tell Claude Code in your project context:
          </p>
          <PromptBlock>
            "Use Framer Motion for all animations. Apply scroll-triggered fades,
            staggered reveals, and smooth hover transitions on interactive
            elements."
          </PromptBlock>
          <p className="text-slate-600 leading-relaxed mt-4">
            Hero sections breathe. Cards slide in on scroll. Buttons feel alive.
            This single addition is what separates "AI website" from "agency
            website."
          </p>
        </>
      ),
    },
    {
      number: "03",
      badge: "Design System",
      title: "Add a Design-Focused Skill",
      description:
        "Claude Code Skills are reusable instruction sets that teach Claude taste — spacing, hierarchy, typography, color systems, and layout principles.",
      content: (
        <>
          <p className="text-slate-600 leading-relaxed mb-4">
            Claude Code supports <strong>Skills</strong> — reusable instruction
            sets that guide how Claude approaches a task. A frontend design skill
            teaches Claude <em>taste</em>: spacing, hierarchy, typography, color
            systems, and layout principles.
          </p>
          <h4 className="font-semibold text-slate-800 mb-3">How to add it:</h4>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-5 ml-1">
            <li>
              Create a{" "}
              <code className="bg-slate-100 text-brand-700 text-xs font-mono px-1.5 py-0.5 rounded">
                .claude/skills/
              </code>{" "}
              folder in your project root
            </li>
            <li>
              Add a{" "}
              <code className="bg-slate-100 text-brand-700 text-xs font-mono px-1.5 py-0.5 rounded">
                SKILL.md
              </code>{" "}
              file with design rules (or use the public frontend-design skill)
            </li>
            <li>
              Claude Code will automatically reference it when building UI
            </li>
          </ol>
          <h4 className="font-semibold text-slate-800 mb-3">
            What to include in the skill:
          </h4>
          <ul className="space-y-2 text-slate-600 mb-5">
            {[
              "Typography scale (use a real type system — not random font sizes)",
              "Spacing system (8px base grid)",
              "Color tokens (primary, neutral, accent — no random hex codes)",
              "Component patterns (button states, card structure, form layouts)",
              '"Avoid generic AI aesthetic" instructions',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1 w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1.5 4l1.5 1.5 3.5-3"
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Callout>
            Without a design skill, Claude Code defaults to generic Tailwind
            patterns. With one, every component follows a consistent design
            system — the kind agencies charge $10K to build.
          </Callout>
        </>
      ),
    },
    {
      number: "04",
      badge: "21st.dev",
      title: "Integrate a Component Library",
      description:
        "Production-ready, beautifully designed components you can drop straight into your project — designed by professionals, adapted by Claude.",
      content: (
        <>
          <p className="text-slate-600 leading-relaxed mb-4">
            Don't reinvent the wheel.{" "}
            <span className="font-medium text-slate-800">21st.dev</span> is a
            library of production-ready, beautifully designed components you can
            drop straight into your project.
          </p>
          <h4 className="font-semibold text-slate-800 mb-3">How to use it:</h4>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-5 ml-1">
            <li>Visit 21st.dev and browse components</li>
            <li>
              Copy a component (heroes, pricing, testimonials, navbars, footers)
            </li>
            <li>
              Paste into your project and prompt Claude Code to integrate it
            </li>
          </ol>
          <PromptBlock>
            "Integrate this 21st.dev component into our landing page. Match it
            to our design tokens, replace the placeholder content with our copy,
            and add Framer Motion entrance animations."
          </PromptBlock>
          <p className="text-slate-600 leading-relaxed mt-4">
            Every component is already designed by professionals. Claude Code
            adapts it to your brand. You skip 80% of the design work and end up
            with a site that <em>looks</em> expensive.
          </p>
        </>
      ),
    },
  ];
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function ClaudeCodeSetupGuide() {
  const steps = buildSteps();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative pt-32 pb-16 px-4 sm:px-6 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-100 rounded-full opacity-30 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Free Setup Guide
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
              Build a $10K Website
              <br />
              <span className="text-brand-600">in Claude Code</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              The exact 4-step setup to go from blank terminal to a polished,
              production-ready site — using Claude Code as your developer.
            </p>
          </div>
        </section>

        {/* Why this works */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 sm:px-8 py-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-3">
              Why this works
            </p>
            <p className="text-slate-700 leading-relaxed">
              You don't need a designer. You don't need a dev team. You need the
              right setup <em>before</em> you start prompting — because Claude
              Code is only as good as the environment, animations, design taste,
              and components you give it access to.
            </p>
            <p className="text-slate-700 leading-relaxed mt-3">
              This guide is the exact stack that turns Claude Code from a generic
              code generator into a senior-level web designer.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
          {steps.map((step, idx) => (
            <article key={step.number} className="card p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-5">
                <span className="text-3xl font-black text-brand-100 leading-none select-none shrink-0">
                  {step.number}
                </span>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Step {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold border border-brand-100">
                      {step.badge}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {step.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-5">{step.content}</div>
            </article>
          ))}
        </section>

        {/* Stack at a Glance */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            The Full Stack at a Glance
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 w-1/4">
                    Layer
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 w-1/3">
                    Tool
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">
                    What it does
                  </th>
                </tr>
              </thead>
              <tbody>
                {stackRows.map((row, i) => (
                  <tr
                    key={row.layer}
                    className={
                      i < stackRows.length - 1 ? "border-b border-slate-50" : ""
                    }
                  >
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      {row.layer}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {row.tool}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{row.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Starter Prompt */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Starter Prompt to Use After Setup
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            Once all 4 layers are in place, drop this into Claude Code to kick
            off your site:
          </p>
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-700/60">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-slate-400 font-mono">
                Claude Code
              </span>
            </div>
            <pre className="text-slate-300 text-sm font-mono px-5 py-5 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              <code>{starterPrompt}</code>
            </pre>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            Common Mistakes to Avoid
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {mistakes.map((m) => (
              <div key={m.title} className="card p-5 flex gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 1.5l6 6M7.5 1.5l-6 6"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">
                    {m.title}
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cost comparison */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            What You Just Saved
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">
                    Route
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">
                    Cost
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {costRows.map((row, i) => (
                  <tr
                    key={row.route}
                    className={[
                      i < costRows.length - 1 ? "border-b border-slate-50" : "",
                      row.highlight ? "bg-brand-50" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <td
                      className={`px-5 py-3.5 font-medium ${
                        row.highlight ? "text-brand-700" : "text-slate-500"
                      }`}
                    >
                      {row.route}
                    </td>
                    <td
                      className={`px-5 py-3.5 font-semibold ${
                        row.highlight ? "text-brand-700" : "text-slate-800"
                      }`}
                    >
                      {row.cost}
                    </td>
                    <td
                      className={`px-5 py-3.5 ${
                        row.highlight
                          ? "text-brand-600 font-semibold"
                          : "text-slate-500"
                      }`}
                    >
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
          <div className="relative overflow-hidden bg-brand-600 rounded-2xl px-6 sm:px-10 py-10 text-center">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <h2 className="relative text-2xl font-bold text-white mb-3">
              Ready to build?
            </h2>
            <p className="relative text-brand-200 mb-7 max-w-md mx-auto">
              Install Claude Code, set up the stack, and ship your first site
              this week.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://claude.ai/code"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-sm"
              >
                Get Claude Code
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7h8M7 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="/app"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-900 transition-colors text-sm border border-brand-500"
              >
                Try Resumelee free
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
