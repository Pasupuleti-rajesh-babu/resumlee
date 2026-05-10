import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TailorWorkspace from "@/components/TailorWorkspace";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TailorWorkspace />
      <HowItWorks />
      <Benefits />
      <CtaSection />
      <Footer />
    </main>
  );
}
