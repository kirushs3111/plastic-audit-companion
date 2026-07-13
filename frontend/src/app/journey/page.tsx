import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PrimaryButton from "@/components/common/PrimaryButton";
import PlasticJourneyDiagram from "@/components/learn/PlasticJourneyDiagram";

export const metadata: Metadata = {
  title: "The Plastic Journey | Plastic Audit Companion",
  description: "Follow a single PET bottle from the recycling bin to becoming a t-shirt.",
};

export default function JourneyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16">
        <Link href="/learn" className="text-sm text-gray-500 hover:text-green-700 transition">
          ← Back to Learn Hub
        </Link>

        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mt-6">
          The Plastic Journey
        </p>
        <h1 className="text-4xl font-bold text-gray-800 mt-2">
          From bottle to t-shirt
        </h1>
        <p className="text-gray-600 mt-4 max-w-2xl">
          Recycling a bottle doesn&apos;t make it disappear - it turns into something new.
          Here&apos;s exactly what happens to a PET bottle after it leaves your recycling bin.
        </p>

        <div className="mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <PlasticJourneyDiagram />
        </div>

        <div className="rounded-2xl bg-green-50 p-6 mt-10 flex items-start gap-3">
          <span className="text-2xl">♻️</span>
          <p className="text-gray-700">
            It takes roughly <strong>10 to 12 plastic bottles</strong> to make one t-shirt&apos;s
            worth of fabric - which is exactly why counting what&apos;s in your recycling bin,
            not just tossing it in, actually matters.
          </p>
        </div>

        <div className="mt-10 flex gap-4">
          <PrimaryButton href="/audit">Start Your Audit</PrimaryButton>
          <PrimaryButton href="/learn" variant="outline">
            Explore Plastic Types
          </PrimaryButton>
        </div>
      </main>

      <Footer />
    </div>
  );
}
