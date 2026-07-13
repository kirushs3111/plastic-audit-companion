import type { Metadata } from "next";
import { Suspense } from "react";
import AuditFlow from "@/components/audit/AuditFlow";

export const metadata: Metadata = {
  title: "Household Audit | Plastic Audit Companion",
  description: "Count and identify the plastic items in your home, room by room.",
};

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuditFlow />
    </Suspense>
  );
}
