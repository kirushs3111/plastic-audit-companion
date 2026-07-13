import RecyclingBadge from "@/components/common/RecyclingBadge";
import { PLASTIC_TYPES } from "@/data/plasticTypes";
import type { ApiHunt } from "@/lib/gamificationApi";

export default function HuntList({ hunts }: { hunts: ApiHunt[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {hunts.map((hunt) => {
        const type = PLASTIC_TYPES.find((t) => t.code === hunt.plastic_code);
        if (!type) return null;

        return (
          <div
            key={hunt.plastic_code}
            className={`rounded-2xl border p-4 flex flex-col items-center text-center ${
              hunt.completed ? `${type.bgClass} border-transparent` : "bg-white border-gray-100"
            }`}
          >
            <RecyclingBadge number={type.code} colorClass={type.colorClass} size="sm" />
            <p className={`text-sm font-bold mt-2 ${type.colorClass}`}>
              Find {hunt.target} {type.abbreviation}
            </p>
            <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${type.colorClass.replace("text-", "bg-")}`}
                style={{ width: `${(hunt.progress / hunt.target) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {hunt.progress} / {hunt.target}
              {hunt.completed && " ✓"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
