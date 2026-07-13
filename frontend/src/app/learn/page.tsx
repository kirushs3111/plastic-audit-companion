import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RecyclingBadge from "@/components/common/RecyclingBadge";
import { PLASTIC_TYPES } from "@/data/plasticTypes";

export const metadata: Metadata = {
  title: "Learn | Plastic Audit Companion",
  description: "An interactive encyclopedia of the 7 plastic resin types.",
};

export default function LearnPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16">
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
          Learn Hub
        </p>
        <h1 className="text-4xl font-bold text-gray-800 mt-2">
          Every plastic is stamped with a number
        </h1>
        <p className="text-gray-600 mt-4 max-w-2xl">
          Tap a type to see what it&apos;s used for, how to recycle it, a fun fact,
          and a quick quiz to check what stuck.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-12">
          {PLASTIC_TYPES.map((type) => (
            <Link
              key={type.code}
              href={`/learn/${type.abbreviation.toLowerCase()}`}
              className={`rounded-2xl ${type.bgClass} p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition`}
            >
              <RecyclingBadge number={type.code} colorClass={type.colorClass} />
              <h2 className={`font-bold mt-3 ${type.colorClass}`}>{type.abbreviation}</h2>
              <p className="text-xs text-gray-500 mt-1">{type.fullName}</p>
            </Link>
          ))}
        </div>
        <div className="mt-14 rounded-2xl bg-blue-50 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Curious what happens next?</h2>
            <p className="text-gray-600 mt-1">
              Follow a single bottle&apos;s journey from your recycling bin to becoming a
              t-shirt.
            </p>
          </div>
          <Link
            href="/journey"
            className="shrink-0 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            See the Plastic Journey →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
