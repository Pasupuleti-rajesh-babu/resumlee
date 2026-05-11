import AppHeader from "@/components/AppHeader";
import TailorWorkspace from "@/components/TailorWorkspace";

export const metadata = {
  title: "Tailor your resume — Resumelee",
  description: "Upload your DOCX resume and paste a job description. Resumelee rewrites only what needs to change — your format stays exactly as is.",
};

export default function AppPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <TailorWorkspace />
      </main>
    </div>
  );
}
