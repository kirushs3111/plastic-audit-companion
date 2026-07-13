type RecyclingBadgeProps = {
  /** The resin identification code, 1-7 */
  number: number;
  /** Tailwind text color utility, e.g. "text-blue-600" */
  colorClass?: string;
  size?: "sm" | "md" | "lg";
};

const DIMENSIONS: Record<NonNullable<RecyclingBadgeProps["size"]>, number> = {
  sm: 32,
  md: 44,
  lg: 60,
};

/**
 * Renders the plastic's resin identification number inside a triangle,
 * echoing the real-world stamp found on the bottom of plastic items.
 * This is the recurring visual motif for the Learn module and the
 * Audit flow's "known plastic" picker.
 */
export default function RecyclingBadge({
  number,
  colorClass = "text-gray-700",
  size = "md",
}: RecyclingBadgeProps) {
  const dimension = DIMENSIONS[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 48 48"
      className={colorClass}
      role="img"
      aria-label={`Recycling code ${number}`}
    >
      <polygon
        points="24,5 44,40 4,40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="currentColor"
      >
        {number}
      </text>
    </svg>
  );
}
