import type { PlasticCode } from "@/types/plastic";

export interface LearnQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface LearnContent {
  code: PlasticCode;
  examples: string[];
  recyclingTip: string;
  quiz: LearnQuizQuestion;
}

export const LEARN_CONTENT: Record<PlasticCode, LearnContent> = {
  1: {
    code: 1,
    examples: ["Water bottles", "Soda bottles", "Peanut butter jars", "Salad dressing bottles"],
    recyclingTip:
      "Accepted in almost every curbside recycling program. Empty and rinse before recycling - caps can usually stay on.",
    quiz: {
      question: "What is PET most commonly used for?",
      options: ["Water bottles", "Pipes", "Shopping bags", "Foam cups"],
      correctIndex: 0,
    },
  },
  2: {
    code: 2,
    examples: ["Milk jugs", "Shampoo bottles", "Detergent bottles", "Buckets"],
    recyclingTip:
      "One of the easiest plastics to recycle - widely accepted and often turned into new bottles, pipes, or lumber.",
    quiz: {
      question: "HDPE is prized for being especially...",
      options: ["Transparent", "Tough and durable", "Edible", "Magnetic"],
      correctIndex: 1,
    },
  },
  3: {
    code: 3,
    examples: ["Pipes", "Window frames", "Cables", "Some shower curtains"],
    recyclingTip:
      "Rarely accepted curbside due to the chlorine it contains. Check for a specialty PVC drop-off point near you.",
    quiz: {
      question: "Why is PVC hard to recycle curbside?",
      options: [
        "It's too transparent",
        "It contains chlorine",
        "It's too lightweight",
        "It melts too easily",
      ],
      correctIndex: 1,
    },
  },
  4: {
    code: 4,
    examples: ["Grocery bags", "Squeeze bottles", "Plastic wrap", "Bread bags"],
    recyclingTip:
      "Usually not accepted in curbside bins - most grocery stores have a separate plastic-bag drop-off bin.",
    quiz: {
      question: "Where should LDPE grocery bags usually be recycled?",
      options: [
        "Curbside recycling bin",
        "Store drop-off bins",
        "Compost bin",
        "Regular trash only",
      ],
      correctIndex: 1,
    },
  },
  5: {
    code: 5,
    examples: ["Lunch boxes", "Bottle caps", "Yogurt tubs", "Straws"],
    recyclingTip:
      "Increasingly accepted curbside - check local rules, since acceptance varies more than PET or HDPE.",
    quiz: {
      question: "Why is PP often used for microwave-safe containers?",
      options: [
        "It's the cheapest plastic",
        "It handles heat well",
        "It's always clear",
        "It's biodegradable",
      ],
      correctIndex: 1,
    },
  },
  6: {
    code: 6,
    examples: ["Foam cups", "Takeout containers", "Packing peanuts", "Disposable cutlery"],
    recyclingTip:
      "Rarely recyclable curbside, especially in foam form. Reusable alternatives are the best way to cut down on PS waste.",
    quiz: {
      question: "What is polystyrene commonly known as (though it's a brand name)?",
      options: ["Tupperware", "Styrofoam", "Bakelite", "Teflon"],
      correctIndex: 1,
    },
  },
  7: {
    code: 7,
    examples: ["Sunglasses", "Some baby bottles", "Multi-layer packaging", "CDs"],
    recyclingTip:
      "A catch-all category with no single recycling path - when in doubt, check with your local facility.",
    quiz: {
      question: "What does resin code 7 ('OTHER') usually mean?",
      options: [
        "It's always compostable",
        "It's a mix or a plastic outside codes 1-6",
        "It's always PET",
        "It's not really plastic",
      ],
      correctIndex: 1,
    },
  },
};
