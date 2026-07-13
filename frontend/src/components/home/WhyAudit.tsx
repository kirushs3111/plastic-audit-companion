import PrimaryButton from "@/components/common/PrimaryButton";

type Reason = {
  emoji: string;
  title: string;
  description: string;
};

const REASONS: Reason[] = [
  {
    emoji: "🏠",
    title: "See your own footprint",
    description:
      "Most people can't name the plastics in their own kitchen. A 15-minute room-by-room count turns guesswork into a real household picture.",
  },
  {
    emoji: "🔬",
    title: "Feed real research",
    description:
      "Every submitted audit adds to a dataset researchers and recycling planners can actually use, not just another form nobody reads.",
  },
  {
    emoji: "🧒",
    title: "Teach kids by doing",
    description:
      "Sorting the recycling bin means more once a child has held a PET bottle and a PP lunchbox and knows why they're different.",
  },
];

export default function WhyAudit() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Why bother counting plastic
          </p>
          <h2 className="text-4xl font-bold text-gray-800 mt-3">
            A recycling bin hides more than it shows
          </h2>
          <p className="text-lg text-gray-600 mt-5">
            National recycling statistics are built from estimates. PAC replaces
            the estimate with an actual count, one household at a time, while
            teaching the people doing the counting what they&apos;re looking at.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-300 p-8"
            >
              <div className="text-4xl">{reason.emoji}</div>
              <h3 className="text-xl font-bold text-gray-800 mt-4">
                {reason.title}
              </h3>
              <p className="text-gray-600 mt-3">{reason.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <PrimaryButton href="/audit" size="lg">
            Start Your Household Audit
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
