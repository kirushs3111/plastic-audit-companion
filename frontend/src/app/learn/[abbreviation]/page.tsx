import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RecyclingBadge from "@/components/common/RecyclingBadge";
import PlasticQuiz from "@/components/learn/PlasticQuiz";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import { LEARN_CONTENT } from "@/data/learnContent";

interface PageProps {
  params: Promise<{ abbreviation: string }>;
}

function findType(abbreviation: string) {
  return PLASTIC_TYPES.find((t) => t.abbreviation.toLowerCase() === abbreviation.toLowerCase());
}

export async function generateStaticParams() {
  return PLASTIC_TYPES.map((t) => ({ abbreviation: t.abbreviation.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { abbreviation } = await params;
  const type = findType(abbreviation);
  if (!type) return { title: "Not Found | Plastic Audit Companion" };
  return {
    title: `${type.abbreviation} | Learn | Plastic Audit Companion`,
    description: type.commonUses,
  };
}

export default async function PlasticDetailPage({ params }: PageProps) {
  const { abbreviation } = await params;
  const type = findType(abbreviation);
  if (!type) notFound();

  const content = LEARN_CONTENT[type.code];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <Link href="/learn" className="text-sm text-gray-500 hover:text-green-700 transition">
          ← Back to Learn Hub
        </Link>

        <div className={`rounded-2xl ${type.bgClass} p-8 flex items-center gap-6 mt-6`}>
          <RecyclingBadge number={type.code} colorClass={type.colorClass} size="lg" />
          <div>
            <h1 className={`text-3xl font-bold ${type.colorClass}`}>{type.abbreviation}</h1>
            <p className="text-gray-600">{type.fullName}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-3">Where you&apos;ll find it</h2>
            <ul className="space-y-2">
              {content.examples.map((example) => (
                <li key={example} className="flex items-center gap-2 text-gray-600">
                  <span className={type.colorClass}>●</span> {example}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-3">Recycling</h2>
            <p className="text-gray-600">{content.recyclingTip}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 p-6 mt-6 flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-bold text-amber-700">Fun Fact</p>
            <p className="text-gray-700 mt-1">{type.funFact}</p>
          </div>
        </div>

        <div className="mt-8">
          <PlasticQuiz quiz={content.quiz} />
        </div>

        <div className="flex items-center justify-between mt-10 text-sm">
          {(() => {
            const idx = PLASTIC_TYPES.findIndex((t) => t.code === type.code);
            const prev = PLASTIC_TYPES[idx - 1];
            const next = PLASTIC_TYPES[idx + 1];
            return (
              <>
                {prev ? (
                  <Link
                    href={`/learn/${prev.abbreviation.toLowerCase()}`}
                    className="text-gray-500 hover:text-green-700 transition"
                  >
                    ← {prev.abbreviation}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/learn/${next.abbreviation.toLowerCase()}`}
                    className="text-gray-500 hover:text-green-700 transition"
                  >
                    {next.abbreviation} →
                  </Link>
                ) : (
                  <span />
                )}
              </>
            );
          })()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
