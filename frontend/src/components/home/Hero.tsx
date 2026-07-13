import PrimaryButton from "@/components/common/PrimaryButton";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-6">
      <h1 className="text-6xl font-extrabold text-green-700">
        Learn • Identify • Audit
      </h1>

      <p className="text-xl text-gray-600 mt-6 max-w-3xl">
        Empower families and children to identify plastic types, count household
        plastics, and contribute to a nationwide plastic audit.
      </p>

      <div className="mt-10 flex gap-5">
        <PrimaryButton href="/audit" size="lg">
          Start Audit
        </PrimaryButton>

        <PrimaryButton href="/learn" variant="secondary" size="lg">
          Learn Plastics
        </PrimaryButton>
      </div>
    </section>
  );
}
