import type { Group } from "@/lib/types";

// Fallback monogram for groups without a drawn icon.
// "Food Security Crew" → FS, "Animal Allies" → AA.
export function monogram(name: string): string {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Hand-drawn-ish line icons per crew, stroked in the group color.
const GROUP_ICONS: Record<string, React.ReactNode> = {
  "food-security": (
    // apple
    <>
      <path
        d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z"
        fill="currentColor"
        fillOpacity={0.3}
      />
      <path d="M10 2c1 .5 2 2 2 5" />
    </>
  ),
  housing: (
    // house
    <path d="M3.5 10 12 3.5 20.5 10V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1z" />
  ),
  environment: (
    // sprout
    <>
      <path d="M12 21v-8" />
      <path d="M12 13C12 9.2 9.2 7 5.2 7c0 4 2.8 6 6.8 6z" fill="currentColor" fillOpacity={0.3} />
      <path d="M12 10.5c0-3.2 2.3-5 5.6-5 0 3.2-2.3 5-5.6 5z" fill="currentColor" fillOpacity={0.3} />
    </>
  ),
  education: (
    // open book
    <>
      <path d="M2.5 4.5h5.5a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3h-6.5z" />
      <path d="M21.5 4.5H16a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h6.5z" />
    </>
  ),
  elders: (
    // tulip
    <>
      <path
        d="M12 13c-3.4 0-5.8-2.4-5.8-6l3 1.6L12 4l2.8 4.6 3-1.6c0 3.6-2.4 6-5.8 6z"
        fill="currentColor"
        fillOpacity={0.3}
      />
      <path d="M12 13v8" />
      <path d="M12 18.5c0-2-1.8-3-3.8-3" />
      <path d="M12 18.5c0-2 1.8-3 3.8-3" />
    </>
  ),
  animals: (
    // paw print
    <g fill="currentColor" stroke="none">
      <circle cx="5.6" cy="10.6" r="1.9" />
      <circle cx="9.6" cy="6.4" r="2.1" />
      <circle cx="14.4" cy="6.4" r="2.1" />
      <circle cx="18.4" cy="10.6" r="1.9" />
      <path d="M12 11.2c-3.1 0-5.6 2.3-5.6 5.1 0 1.7 1.4 3 3.1 3 .9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c1.7 0 3.1-1.3 3.1-3 0-2.8-2.5-5.1-5.6-5.1z" />
    </g>
  ),
};

export function GroupBadge({ group, size = 40 }: { group: Group; size?: number }) {
  const icon = GROUP_ICONS[group.id];
  return (
    <span
      aria-hidden
      className="font-display inline-flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: `${group.color}1f`,
        color: group.color,
        border: `1.5px solid ${group.color}55`,
      }}
    >
      {icon ? (
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      ) : (
        monogram(group.name)
      )}
    </span>
  );
}
