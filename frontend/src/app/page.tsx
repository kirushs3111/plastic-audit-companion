import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Statistics from "@/components/home/Statistics";
import WhyAudit from "@/components/home/WhyAudit";
import HowItWorks from "@/components/home/HowItWorks";
import LearningPreview from "@/components/home/LearningPreview";
import Features from "@/components/home/Features";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <Hero />
      <Statistics />
      <WhyAudit />
      <HowItWorks />
      <LearningPreview />
      <Features />
      <FAQ />
      <Footer />
    </main>
  );
}
