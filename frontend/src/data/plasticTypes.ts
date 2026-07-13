import type { PlasticTypeSummary } from "@/types/plastic";

/**
 * The 7 resin identification codes. This is the single source of truth
 * consumed by the homepage LearningPreview, the full Learn encyclopedia
 * (Module 4), and the Audit flow's "known plastic" picker (Module 3).
 */
export const PLASTIC_TYPES: PlasticTypeSummary[] = [
  {
    code: 1,
    abbreviation: "PET",
    fullName: "Polyethylene Terephthalate",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    commonUses: "Water bottles, soda bottles, food jars",
    funFact: "The most widely recycled plastic on the planet.",
  },
  {
    code: 2,
    abbreviation: "HDPE",
    fullName: "High-Density Polyethylene",
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
    commonUses: "Milk jugs, shampoo bottles, buckets",
    funFact: "Tough enough to be recycled into park benches and pipes.",
  },
  {
    code: 3,
    abbreviation: "PVC",
    fullName: "Polyvinyl Chloride",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
    commonUses: "Pipes, cables, window frames",
    funFact: "Rarely accepted in curbside recycling bins.",
  },
  {
    code: 4,
    abbreviation: "LDPE",
    fullName: "Low-Density Polyethylene",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
    commonUses: "Grocery bags, squeeze bottles, plastic wrap",
    funFact: "Flexible enough to be turned right back into new bags.",
  },
  {
    code: 5,
    abbreviation: "PP",
    fullName: "Polypropylene",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    commonUses: "Lunch boxes, bottle caps, yogurt tubs",
    funFact: "Handles heat well, so it's used for microwave-safe containers.",
  },
  {
    code: 6,
    abbreviation: "PS",
    fullName: "Polystyrene",
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
    commonUses: "Foam cups, takeout containers, packaging",
    funFact: "Often called Styrofoam, though that's actually a brand name.",
  },
  {
    code: 7,
    abbreviation: "OTHER",
    fullName: "Other / Mixed Plastics",
    colorClass: "text-gray-600",
    bgClass: "bg-gray-100",
    commonUses: "Sunglasses, some baby bottles, mixed-material items",
    funFact: "A catch-all for plastics that don't fit codes 1 through 6.",
  },
];
