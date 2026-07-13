"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewCard from "@/components/admin/ReviewCard";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import { useAuth } from "@/context/AuthContext";
import { assignPlasticType, getAdminOverview, listReviewQueue, type ApiAdminOverview } from "@/lib/adminApi";
import { ApiError } from "@/lib/apiClient";
import type { ApiPlasticEntry } from "@/types/api";

type Tab = "analytics" | "review";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("analytics");

  const [overview, setOverview] = useState<ApiAdminOverview | null>(null);
  const [queue, setQueue] = useState<ApiPlasticEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCount, setResolvedCount] = useState(0);

  const loadOverview = useCallback(() => {
    if (!token) return;
    getAdminOverview(token)
      .then(setOverview)
      .catch((err) => setError(errorText(err, "Could not load analytics.")));
  }, [token]);

  const loadQueue = useCallback(() => {
    if (!token) return;
    listReviewQueue(token)
      .then(setQueue)
      .catch((err) => setError(errorText(err, "Could not load the review queue.")));
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.is_admin) {
      router.push("/");
      return;
    }
    loadOverview();
    loadQueue();
  }, [authLoading, user, router, loadOverview, loadQueue]);

  async function handleAssign(entryId: string, plasticCode: number) {
    if (!token) return;
    await assignPlasticType(token, entryId, plasticCode);
    setQueue((prev) => prev?.filter((e) => e.id !== entryId) ?? null);
    setResolvedCount((c) => c + 1);
    loadOverview();
  }

  if (authLoading || (!user?.is_admin && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16">
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Admin</p>
        <h1 className="text-4xl font-bold text-gray-800 mt-2">Dashboard</h1>

        <div className="flex gap-2 mt-8 border-b border-gray-200">
          <button
            onClick={() => setTab("analytics")}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition ${
              tab === "analytics"
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab("review")}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition ${
              tab === "review"
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Photo Review
            {queue && queue.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5">
                {queue.length}
              </span>
            )}
          </button>
        </div>

        {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-6">{error}</p>}

        {tab === "analytics" && (
          <div className="mt-8">
            {!overview && !error && <p className="text-gray-400">Loading analytics...</p>}
            {overview && token && <AnalyticsOverview overview={overview} token={token} />}
          </div>
        )}

        {tab === "review" && (
          <div className="mt-8">
            <p className="text-gray-600 mb-6">
              Items logged without a known plastic type. Look at the photos and assign the
              real resin code.
            </p>

            {resolvedCount > 0 && (
              <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2 mb-6 inline-block">
                {resolvedCount} resolved this session
              </p>
            )}

            {!queue && !error && <p className="text-gray-400">Loading queue...</p>}

            {queue && queue.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-500">
                Nothing waiting for review right now.
              </div>
            )}

            <div className="space-y-5">
              {queue?.map((entry) => (
                <ReviewCard key={entry.id} entry={entry} onAssign={handleAssign} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return typeof err.detail === "string" ? err.detail : fallback;
  }
  return "Could not reach the server.";
}
