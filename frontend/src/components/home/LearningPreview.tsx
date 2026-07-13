import PrimaryButton from "@/components/common/PrimaryButton";
import RecyclingBadge from "@/components/common/RecyclingBadge";
import { PLASTIC_TYPES } from "@/data/plasticTypes";

export default function LearningPreview() {
  return (
    <section className="py-20 px-6 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
            The Learn hub
          </p>
          <h2 className="text-4xl font-bold text-gray-800 mt-3">
            Seven codes, one triangle each
          </h2>
          <p className="text-lg text-gray-600 mt-5">
            Every plastic item is stamped with one of these seven numbers.
            Recognizing them is the first skill the audit asks for.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-14">
          {PLASTIC_TYPES.map((type) => (
            <div
              key={type.code}
              className={`rounded-2xl ${type.bgClass} p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition duration-300`}
            >
              <RecyclingBadge number={type.code} colorClass={type.colorClass} />
              <h3 className={`font-bold mt-3 ${type.colorClass}`}>
                {type.abbreviation}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{type.commonUses}</p>
            </div>
          ))}

          <div className="rounded-2xl bg-white border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-sm">
              Fun facts, quizzes and games for each type live in the full Learn
              hub.
            </p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <PrimaryButton href="/learn" variant="secondary" size="lg">
            Explore the Learn Hub
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
