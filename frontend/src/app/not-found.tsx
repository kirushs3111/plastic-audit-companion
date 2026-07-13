import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PrimaryButton from "@/components/common/PrimaryButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl">🔍</div>
          <h1 className="text-4xl font-bold text-gray-800 mt-6">Page not found</h1>
          <p className="text-gray-600 mt-3">
            Whatever you were looking for isn&apos;t here - maybe it got sorted into the
            wrong bin.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <PrimaryButton href="/">Back Home</PrimaryButton>
            <Link
              href="/learn"
              className="inline-flex items-center justify-center px-6 py-3 text-green-700 font-semibold hover:underline"
            >
              Explore Learn Hub
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
