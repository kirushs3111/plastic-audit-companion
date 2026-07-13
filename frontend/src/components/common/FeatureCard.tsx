type FeatureCardProps = {
  emoji: string;
  title: string;
  description: string;
};

export default function FeatureCard({
  emoji,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition duration-300">
      <div className="text-5xl mb-4">{emoji}</div>

      <h3 className="text-2xl font-bold text-green-700">
        {title}
      </h3>

      <p className="text-gray-600 mt-3">
        {description}
      </p>
    </div>
  );
}