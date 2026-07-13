import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PrimaryButton from "@/components/common/PrimaryButton";

export const metadata: Metadata = {
  title: "About | Plastic Audit Companion",
  description: "Why Plastic Audit Companion exists and how the data is used.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">About</p>
        <h1 className="text-4xl font-bold text-gray-800 mt-2">Why we built this</h1>

        <div className="prose prose-gray mt-8 space-y-5 text-gray-600">
          <p>
            National recycling statistics are mostly estimates - nobody actually counts
            what&apos;s sitting in people&apos;s kitchens, garages, and bathrooms. Plastic Audit
            Companion replaces that estimate with a real count, one household at a time,
            while teaching the person doing the counting what they&apos;re looking at.
          </p>
          <p>
            The seven resin codes stamped on nearly every plastic item are the first thing
            most people never learn to read. Once you can, sorting a shopping bag from a
            yogurt tub becomes obvious - and audits turn into research data instead of a
            chore.
          </p>
          <p>
            When someone doesn&apos;t recognize a plastic, we don&apos;t guess. They photograph it,
            and a human reviewer identifies it later. No AI model claims a confidence score
            it can&apos;t back up.
          </p>
          <p>
            Every submitted audit becomes part of a household-level dataset that researchers
            and recycling planners can actually use - not just another survey nobody reads.
          </p>
        </div>

        <div className="mt-10">
          <PrimaryButton href="/audit">Start Your Own Audit</PrimaryButton>
        </div>
      </main>

      <Footer />
    </div>
  );
}
