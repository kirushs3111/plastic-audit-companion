import type { ApiBadge } from "@/lib/gamificationApi";

export default function BadgeGrid({ badges }: { badges: ApiBadge[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`rounded-2xl border p-5 text-center transition ${
            badge.earned
              ? "bg-green-50 border-green-200"
              : "bg-white border-gray-100 opacity-80"
          }`}
        >
          <div className={`text-4xl ${badge.earned ? "" : "grayscale opacity-50"}`}>
            {badge.emoji}
          </div>
          <p className={`font-bold mt-2 ${badge.earned ? "text-green-700" : "text-gray-600"}`}>
            {badge.title}
          </p>
          <p className="text-xs text-gray-500 mt-1">{badge.description}</p>

          {!badge.earned && badge.target > 1 && (
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full"
                  style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {badge.progress} / {badge.target}
              </p>
            </div>
          )}

          {badge.earned && <p className="text-xs font-semibold text-green-600 mt-2">Earned ✓</p>}
        </div>
      ))}
    </div>
  );
}
