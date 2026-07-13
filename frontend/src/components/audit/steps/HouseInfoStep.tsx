"use client";

import { useState, type FormEvent } from "react";
import PrimaryButton from "@/components/common/PrimaryButton";
import StepShell from "@/components/audit/StepShell";
import type { HouseholdInfo } from "@/types/audit";

type HouseInfoStepProps = {
  initial: HouseholdInfo;
  isSubmitting: boolean;
  onSubmit: (household: HouseholdInfo) => void;
};

export default function HouseInfoStep({ initial, isSubmitting, onSubmit }: HouseInfoStepProps) {
  const [householdName, setHouseholdName] = useState(initial.householdName);
  const [address, setAddress] = useState(initial.address);
  const [city, setCity] = useState(initial.city);
  const [numberOfResidents, setNumberOfResidents] = useState(
    initial.numberOfResidents ? String(initial.numberOfResidents) : ""
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      householdName: householdName.trim(),
      address: address.trim(),
      city: city.trim(),
      numberOfResidents: numberOfResidents ? Number(numberOfResidents) : null,
    });
  }

  return (
    <StepShell
      eyebrow="Step 1"
      title="Tell us about your household"
      description="The address stays private to your account and admins - it's used for the dataset's location context, never shown publicly."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="householdName" className="block text-sm font-medium text-gray-700 mb-2">
            Household nickname
          </label>
          <input
            id="householdName"
            required
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="e.g. The Martins"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            id="address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 12 Palm Street"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            id="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Chennai"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="residents" className="block text-sm font-medium text-gray-700 mb-2">
            Number of people in the household
          </label>
          <input
            id="residents"
            type="number"
            min={1}
            max={20}
            value={numberOfResidents}
            onChange={(e) => setNumberOfResidents(e.target.value)}
            placeholder="e.g. 4"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <PrimaryButton type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Setting up..." : "Continue to Rooms"}
        </PrimaryButton>
      </form>
    </StepShell>
  );
}
