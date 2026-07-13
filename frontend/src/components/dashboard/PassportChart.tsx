"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import type { ApiHouseholdPassport } from "@/lib/gamificationApi";

const BAR_COLORS: Record<number, string> = {
  1: "#2563eb",
  2: "#16a34a",
  3: "#ea580c",
  4: "#9333ea",
  5: "#d97706",
  6: "#dc2626",
  7: "#6b7280",
};

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function PassportChart({ passport }: { passport: ApiHouseholdPassport }) {
  if (passport.months.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
        No submitted audits with known plastic types yet for {passport.household_name}.
      </div>
    );
  }

  const chartData = passport.months.map((month) => {
    const row: Record<string, string | number> = { month: formatMonth(month.month) };
    for (const entry of month.by_plastic_type) {
      const type = PLASTIC_TYPES.find((t) => t.code === entry.plastic_code);
      if (type) row[type.abbreviation] = entry.quantity;
    }
    return row;
  });

  const typesPresent = Array.from(
    new Set(passport.months.flatMap((m) => m.by_plastic_type.map((e) => e.plastic_code)))
  ).sort((a, b) => a - b);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {passport.months.length === 1
          ? "One audit so far - submit another to start seeing change over time."
          : `${passport.months.length} months of audits for ${passport.household_name}.`}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {typesPresent.map((code) => {
            const type = PLASTIC_TYPES.find((t) => t.code === code)!;
            return (
              <Bar
                key={code}
                dataKey={type.abbreviation}
                stackId="plastics"
                fill={BAR_COLORS[code]}
                radius={typesPresent[typesPresent.length - 1] === code ? [6, 6, 0, 0] : undefined}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
