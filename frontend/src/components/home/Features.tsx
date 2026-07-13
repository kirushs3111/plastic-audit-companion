import FeatureCard from "@/components/common/FeatureCard";

export default function Features() {
  return (
    <section className="max-w-7xl mx-auto py-20 px-6">
      <h2 className="text-4xl font-bold text-center text-green-700 mb-12">
        What You Can Do
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <FeatureCard
          emoji="📚"
          title="Learn Plastics"
          description="Understand all 7 plastic types with pictures, examples, quizzes and fun facts."
        />

        <FeatureCard
          emoji="📸"
          title="Photo Review"
          description="Don't recognize a plastic? Photograph it and a reviewer identifies it for you - no guessing."
        />

        <FeatureCard
          emoji="🏠"
          title="Household Audit"
          description="Count and organize plastics room by room with an easy child-friendly interface."
        />

        <FeatureCard
          emoji="📊"
          title="Smart Reports"
          description="Generate household summaries and contribute to a national plastic database."
        />
      </div>
    </section>
  );
}