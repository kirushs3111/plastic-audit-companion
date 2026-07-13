import type { ReactElement } from "react";

type JourneyStageProps = {
  color: string;
  bg: string;
};

function BottleIcon({ color, bg }: JourneyStageProps) {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx="50" cy="50" r="46" fill={bg} />
      <path
        d="M42 20h16v10l6 8v40a4 4 0 01-4 4H40a4 4 0 01-4-4V38l6-8z"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="42" y="16" width="16" height="6" rx="1" fill={color} />
      <line x1="38" y1="55" x2="62" y2="55" stroke={color} strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function CollectedIcon({ color, bg }: JourneyStageProps) {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx="50" cy="50" r="46" fill={bg} />
      <path
        d="M28 42h44l-4 30a4 4 0 01-4 3.5H36A4 4 0 0132 72z"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line x1="26" y1="42" x2="74" y2="42" stroke={color} strokeWidth="3" />
      <line x1="42" y1="30" x2="58" y2="30" stroke={color} strokeWidth="3" />
      <line x1="42" y1="30" x2="34" y2="42" stroke={color} strokeWidth="3" />
      <line x1="58" y1="30" x2="66" y2="42" stroke={color} strokeWidth="3" />
      <circle cx="42" cy="52" r="3" fill={color} />
      <circle cx="52" cy="58" r="3" fill={color} />
      <circle cx="60" cy="50" r="3" fill={color} />
    </svg>
  );
}

function PelletsIcon({ color, bg }: JourneyStageProps) {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx="50" cy="50" r="46" fill={bg} />
      {[
        [35, 40],
        [50, 35],
        [64, 42],
        [40, 55],
        [58, 58],
        [46, 68],
        [62, 66],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill={color} opacity={0.85} />
      ))}
    </svg>
  );
}

function ThreadIcon({ color, bg }: JourneyStageProps) {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx="50" cy="50" r="46" fill={bg} />
      <path
        d="M25 35c10 0 10 10 20 10s10-10 20-10 10 10 20 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25 50c10 0 10 10 20 10s10-10 20-10 10 10 20 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25 65c10 0 10 10 20 10s10-10 20-10 10 10 20 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShirtIcon({ color, bg }: JourneyStageProps) {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx="50" cy="50" r="46" fill={bg} />
      <path
        d="M38 28l12 8 12-8 12 10-8 8v34a2 2 0 01-2 2H36a2 2 0 01-2-2V46l-8-8z"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Stage {
  Icon: (props: JourneyStageProps) => ReactElement;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const STAGES: Stage[] = [
  {
    Icon: BottleIcon,
    title: "1. The Bottle",
    description:
      "A PET bottle finishes its job - maybe it held water, maybe soda. Empty and rinsed, it's ready for its next step instead of a landfill.",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    Icon: CollectedIcon,
    title: "2. Collected & Sorted",
    description:
      "At a recycling facility, bottles are sorted by resin type - that's what the number in the triangle is for - then cleaned and shredded into flakes.",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    Icon: PelletsIcon,
    title: "3. Melted into Pellets",
    description:
      "The flakes are melted down and formed into small pellets - a raw material manufacturers can use to make almost anything out of PET again.",
    color: "#d97706",
    bg: "#fffbeb",
  },
  {
    Icon: ThreadIcon,
    title: "4. Spun into Thread",
    description:
      "Melted and extruded through tiny holes, the pellets become thin strands of polyester fiber - the same fiber used in a huge range of fabrics.",
    color: "#9333ea",
    bg: "#faf5ff",
  },
  {
    Icon: ShirtIcon,
    title: "5. Woven into Clothing",
    description:
      "That fiber gets spun into yarn and woven into fabric. A single bottle can contribute to a t-shirt, a jacket lining, or even carpet backing.",
    color: "#dc2626",
    bg: "#fef2f2",
  },
];

export default function PlasticJourneyDiagram() {
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-2">
      {STAGES.map((stage, index) => (
        <div key={stage.title} className="flex items-center flex-1">
          <div className="flex flex-col items-center text-center flex-1">
            <stage.Icon color={stage.color} bg={stage.bg} />
            <h3 className="font-bold text-gray-800 mt-3 text-sm">{stage.title}</h3>
            <p className="text-xs text-gray-500 mt-2">{stage.description}</p>
          </div>

          {index < STAGES.length - 1 && (
            <span
              className="hidden sm:block text-gray-300 text-2xl mx-1 shrink-0"
              aria-hidden="true"
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
