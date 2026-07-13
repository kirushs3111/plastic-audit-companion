"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  return (
    <nav className="w-full bg-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
        <Link href="/" className="text-2xl font-bold text-green-700">
          🌿 Plastic Audit Companion
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/" className="hover:text-green-600 transition">
            Home
          </Link>

          <Link href="/learn" className="hover:text-green-600 transition">
            Learn
          </Link>

          <Link href="/about" className="hover:text-green-600 transition">
            About
          </Link>

          {!isLoading && user && (
            <Link href="/dashboard" className="hover:text-green-600 transition">
              Dashboard
            </Link>
          )}

          {!isLoading && user?.is_admin && (
            <Link href="/admin" className="hover:text-green-600 transition">
              Admin
            </Link>
          )}

          {!isLoading && user ? (
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              Log Out
            </button>
          ) : (
            !isLoading && (
              <Link href="/login" className="hover:text-green-600 transition">
                Log In
              </Link>
            )
          )}

          <Link
            href="/audit"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl transition"
          >
            Start Audit
          </Link>
        </div>
      </div>
    </nav>
  );
}
