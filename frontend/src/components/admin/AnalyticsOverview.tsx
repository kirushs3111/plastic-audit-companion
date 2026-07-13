"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PrimaryButton from "@/components/common/PrimaryButton";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import { ROOMS } from "@/data/rooms";
import { downloadCsvExport, downloadPhotosZip, type ApiAdminOverview } from "@/lib/adminApi";

function plasticLabel(code: number): string {
  return PLASTIC_TYPES.find((t) => t.code === code)?.abbreviation ?? `Code ${code}`;
}

function roomLabel(roomId: string): string {
  return ROOMS.find((r) => r.id === roomId)?.label ?? roomId;
}

export default function AnalyticsOverview({
  overview,
  token,
}: {
  overview: ApiAdminOverview;
  token: string;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingPhotos, setIsExportingPhotos] = useState(false);
  const [photosExportError, setPhotosExportError] = useState<string | null>(null);

  const plasticData = overview.by_plastic_type.map((row) => ({
    name: plasticLabel(row.plastic_code),
    quantity: row.total_quantity,
  }));

  const roomData = overview.by_room.map((row) => ({
    name: roomLabel(row.room),
    quantity: row.total_quantity,
  }));

  async function handleExport() {
    setExportError(null);
    setIsExporting(true);
    try {
      await downloadCsvExport(token);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePhotosExport() {
    setPhotosExportError(null);
    setIsExportingPhotos(true);
    try {
      await downloadPhotosZip(token);
    } catch {
      setPhotosExportError("Export failed. Please try again.");
    } finally {
      setIsExportingPhotos(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Households" value={overview.total_households} />
        <StatCard label="Submitted Audits" value={overview.submitted_audit_sessions} />
        <StatCard label="Items Counted" value={overview.total_items} />
        <StatCard
          label="Awaiting Review"
          value={overview.pending_review_count}
          highlight={overview.pending_review_count > 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Most Common Plastic Type</h2>
          {plasticData.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={plasticData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Most Common Room</h2>
          {roomData.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roomData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-gray-800">Dataset Export</h2>
            <p className="text-sm text-gray-500 mt-1">
              One row per plastic entry - household, room, item, type and quantity.
            </p>
          </div>
          <div className="text-right">
            <PrimaryButton onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Preparing..." : "Download CSV"}
            </PrimaryButton>
            {exportError && <p className="text-sm text-red-600 mt-2">{exportError}</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-gray-800">Photo Export</h2>
            <p className="text-sm text-gray-500 mt-1">
              Every uploaded photo as a ZIP, organized into one folder per household.
            </p>
          </div>
          <div className="text-right">
            <PrimaryButton
              onClick={handlePhotosExport}
              disabled={isExportingPhotos}
              variant="secondary"
            >
              {isExportingPhotos ? "Zipping..." : "Download Photos"}
            </PrimaryButton>
            {photosExportError && (
              <p className="text-sm text-red-600 mt-2">{photosExportError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <p className={`text-3xl font-bold ${highlight ? "text-amber-600" : "text-gray-800"}`}>
        {value}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
