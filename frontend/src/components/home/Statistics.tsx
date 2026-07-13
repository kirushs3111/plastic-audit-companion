export default function Statistics() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

        <div>
          <h2 className="text-5xl font-bold text-green-700">7</h2>
          <p className="mt-3 text-gray-600">
            Plastic Types
          </p>
        </div>

        <div>
          <h2 className="text-5xl font-bold text-green-700">100%</h2>
          <p className="mt-3 text-gray-600">
            Child Friendly
          </p>
        </div>

        <div>
          <h2 className="text-5xl font-bold text-green-700">📸</h2>
          <p className="mt-3 text-gray-600">
            Photo-Based Review
          </p>
        </div>

        <div>
          <h2 className="text-5xl font-bold text-green-700">∞</h2>
          <p className="mt-3 text-gray-600">
            Household Audits
          </p>
        </div>

      </div>
    </section>
  );
}