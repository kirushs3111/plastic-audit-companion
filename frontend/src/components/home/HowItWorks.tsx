export default function HowItWorks() {
  const steps = [
    "Choose a room",
    "Select the plastic item",
    "Identify the plastic type",
    "Photograph it if you're unsure",
    "Count the quantity",
    "Submit your household audit",
  ];

  return (
    <section className="py-20 bg-green-50">
      <div className="max-w-5xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center text-green-700 mb-14">
          How It Works
        </h2>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-6 bg-white rounded-2xl shadow p-6"
            >
              <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>

              <p className="text-lg">{step}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}