import { cn } from "@/lib/utils";

/**
 * A drawn map of the hotel's stretch of the river · hairline, bright, no
 * photograph and no landmark. The labels come in the page language.
 * Decorative geometry; the facts it shows are also written out beside it.
 */
export function RiverMap({
  labels,
  className,
}: {
  labels: { hotel: string; river: string; pier: string; bts: string; road: string };
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 440"
      role="img"
      aria-label={`${labels.hotel} · ${labels.river}`}
      className={cn("h-auto w-full", className)}
    >
      <rect width="600" height="440" fill="#F4EFE6" />
      {/* city blocks */}
      <g fill="#FBF9F5" stroke="#E5DDD0" strokeWidth="1">
        {[
          [330, 40, 90, 60], [440, 40, 120, 60], [330, 120, 60, 70], [410, 120, 150, 70],
          [350, 210, 80, 70], [450, 210, 110, 70], [370, 300, 70, 60], [460, 300, 100, 90],
          [30, 300, 90, 70], [30, 60, 70, 90],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="4" />
        ))}
      </g>
      {/* the river */}
      <path
        d="M170 -10 C 150 90, 250 150, 230 230 S 160 360, 210 450"
        fill="none"
        stroke="#C9D6D8"
        strokeWidth="78"
        strokeLinecap="round"
      />
      <path
        d="M170 -10 C 150 90, 250 150, 230 230 S 160 360, 210 450"
        fill="none"
        stroke="#9FB4B8"
        strokeWidth="1"
        strokeDasharray="2 8"
      />
      {/* Charoenkrung road */}
      <path d="M318 0 C 312 120, 340 240, 330 440" fill="none" stroke="#D8C7AC" strokeWidth="6" strokeLinecap="round" />
      {/* hotel */}
      <g>
        <circle cx="290" cy="232" r="22" fill="#1E4A3D" opacity="0.12" />
        <circle cx="290" cy="232" r="9" fill="#1E4A3D" />
        <path d="M268 232 H 262" stroke="#1E4A3D" strokeWidth="1.5" />
      </g>
      {/* pier */}
      <rect x="256" y="226" width="16" height="12" rx="2" fill="#8A5A34" />
      {/* BTS */}
      <g>
        <rect x="300" y="360" width="56" height="20" rx="10" fill="#FFFFFF" stroke="#4D6B74" strokeWidth="1" />
        <circle cx="312" cy="370" r="4" fill="#4D6B74" />
      </g>
      <g fontFamily="var(--font-text), sans-serif" fontSize="13" fill="#2A211B">
        <text x="306" y="214" fontWeight="600">{labels.hotel}</text>
        <text x="190" y="214" fill="#8A5A34" textAnchor="end">{labels.pier}</text>
        <text x="364" y="374" fill="#4D6B74">{labels.bts}</text>
        <text x="338" y="22" fill="#675B51">{labels.road}</text>
        <text x="150" y="350" fill="#4D6B74" fontStyle="italic" transform="rotate(-62 150 350)">{labels.river}</text>
      </g>
    </svg>
  );
}
