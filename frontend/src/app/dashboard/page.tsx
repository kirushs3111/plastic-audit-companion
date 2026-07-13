"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PrimaryButton from "@/components/common/PrimaryButton";
import BadgeGrid from "@/components/dashboard/BadgeGrid";
import HuntList from "@/components/dashboard/HuntList";
import PassportChart from "@/components/dashboard/PassportChart";
import { useAuth } from "@/context/AuthContext";
import { listMyAuditSessions, listMyHouseholds } from "@/lib/auditApi";
import { getHouseholdPassport, getMyBadges, getMyHunts } from "@/lib/gamificationApi";
import type { ApiBadge, ApiHouseholdPassport, ApiHunt } from "@/lib/gamificationApi";
import { ApiError } from "@/lib/apiClient";
import type { ApiAuditSessionSummary, ApiHousehold } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Tab = "audits" | "progress" | "passport";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("audits");

  const [sessions, setSessions] = useState<ApiAuditSessionSummary[] | null>(null);
  const [badges, setBadges] = useState<ApiBadge[] | null>(null);
  const [hunts, setHunts] = useState<ApiHunt[] | null>(null);
  const [households, setHouseholds] = useState<ApiHousehold[] | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [passport, setPassport] = useState<ApiHouseholdPassport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.push("/login");
      return;
    }
    listMyAuditSessions(token)
      .then(setSessions)
      .catch((err) => setError(errorText(err, "Could not load your audits.")));
    listMyHouseholds(token)
      .then((hh) => {
        setHouseholds(hh);
        if (hh.length > 0) setSelectedHouseholdId(hh[0].id);
      })
      .catch(() => {});
  }, [authLoading, user, token, router]);

  const loadProgress = useCallback(() => {
    if (!token) return;
    getMyBadges(token)
      .then((res) => setBadges(res.badges))
      .catch((err) => setError(errorText(err, "Could not load badges.")));
    getMyHunts(token)
      .then((res) => setHunts(res.hunts))
      .catch((err) => setError(errorText(err, "Could not load hunts.")));
  }, [token]);

  useEffect(() => {
    if (tab === "progress" && !badges && !hunts) loadProgress();
  }, [tab, badges, hunts, loadProgress]);

  useEffect(() => {
    if (tab !== "passport" || !token || !selectedHouseholdId) return;
    getHouseholdPassport(token, selectedHouseholdId)
      .then(setPassport)
      .catch((err) => setError(errorText(err, "Could not load the passport.")));
  }, [tab, token, selectedHouseholdId]);

  const submitted = sessions?.filter((s) => s.submitted_at) ?? [];
  const inProgress = sessions?.filter((s) => !s.submitted_at) ?? [];
  const totalItemsLifetime = submitted.reduce((sum, s) => sum + s.total_items, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
          {user?.display_name || (user?.is_guest ? "Guest" : "Your")} Dashboard
        </p>
        <h1 className="text-4xl font-bold text-gray-800 mt-2">Your Audits</h1>

        {user?.is_guest && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 mt-4 inline-block">
            You&apos;re browsing as a guest. Create an account to keep this history across
            devices.
          </p>
        )}

        <div className="flex gap-2 mt-8 border-b border-gray-200">
          {(["audits", "progress", "passport"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition capitalize ${
                tab === t
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "progress" ? "Badges & Hunts" : t === "passport" ? "Plastic Passport" : t}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-6">{error}</p>}

        {tab === "audits" && (
          <div className="mt-8">
            {!sessions && !error && <p className="text-gray-400">Loading your audits...</p>}

            {sessions && sessions.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="text-gray-500">You haven&apos;t started an audit yet.</p>
                <div className="mt-5">
                  <PrimaryButton href="/audit">Start Your First Audit</PrimaryButton>
                </div>
              </div>
            )}

            {sessions && sessions.length > 0 && (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <p className="text-3xl font-bold text-green-700">{submitted.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Completed audits</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <p className="text-3xl font-bold text-blue-700">{inProgress.length}</p>
                    <p className="text-sm text-gray-500 mt-1">In progress</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <p className="text-3xl font-bold text-gray-800">{totalItemsLifetime}</p>
                    <p className="text-sm text-gray-500 mt-1">Items counted lifetime</p>
                  </div>
                </div>

                {inProgress.length > 0 && (
                  <div className="mt-10">
                    <h2 className="font-bold text-gray-800 mb-3">Continue an audit</h2>
                    <div className="space-y-3">
                      {inProgress.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-4"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {s.entry_count} {s.entry_count === 1 ? "item" : "items"} logged
                            </p>
                            <p className="text-sm text-gray-400">
                              Last updated {formatDate(s.updated_at)}
                            </p>
                          </div>
                          <Link
                            href={`/audit?session=${s.id}`}
                            className="text-sm font-semibold text-green-700 hover:text-green-800"
                          >
                            Continue →
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {submitted.length > 0 && (
                  <div className="mt-10">
                    <h2 className="font-bold text-gray-800 mb-3">Previous audits</h2>
                    <div className="space-y-3">
                      {submitted.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-4"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {s.total_items} items across {s.entry_count}{" "}
                              {s.entry_count === 1 ? "entry" : "entries"}
                            </p>
                            <p className="text-sm text-gray-400">
                              Submitted {s.submitted_at ? formatDate(s.submitted_at) : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-10">
                  <PrimaryButton href="/audit" variant="outline">
                    Start a New Audit
                  </PrimaryButton>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "progress" && (
          <div className="mt-8 space-y-10">
            <div>
              <h2 className="font-bold text-gray-800 mb-1">Plastic Detective Badges</h2>
              <p className="text-sm text-gray-500 mb-4">
                Earned automatically from your submitted audits.
              </p>
              {!badges && <p className="text-gray-400">Loading badges...</p>}
              {badges && <BadgeGrid badges={badges} />}
            </div>

            <div>
              <h2 className="font-bold text-gray-800 mb-1">Plastic Hunt</h2>
              <p className="text-sm text-gray-500 mb-4">
                Find and log 5 of each plastic type across all your audits.
              </p>
              {!hunts && <p className="text-gray-400">Loading hunts...</p>}
              {hunts && <HuntList hunts={hunts} />}
            </div>
          </div>
        )}

        {tab === "passport" && (
          <div className="mt-8">
            {households && households.length === 0 && (
              <p className="text-gray-400">
                Create a household by starting an audit to see its passport.
              </p>
            )}

            {households && households.length > 1 && (
              <select
                value={selectedHouseholdId ?? ""}
                onChange={(e) => {
                  setSelectedHouseholdId(e.target.value);
                  setPassport(null);
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 mb-6 text-sm"
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.household_name}
                  </option>
                ))}
              </select>
            )}

            {selectedHouseholdId && !passport && !error && (
              <p className="text-gray-400">Loading passport...</p>
            )}

            {passport && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <PassportChart passport={passport} />
              </div>
            )}
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
