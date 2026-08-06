/**
 * Step artwork for the "How it works" section.
 *
 * Drawn in the same technical-drawing language as `FastenerArt` — mono-line
 * strokes, `currentColor` for the body of the drawing so the parent sets the
 * steel grey, and the brand red reserved for the one element that carries the
 * step's meaning (the dimension callout, the chosen nut, the moving crate).
 * That restraint is the point: one red thing per drawing, everything else quiet.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** Step 01 — a bolt under a dimension callout: "tell us the size you need". */
export function SpecDrawing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <g {...STROKE}>
        {/* hex head */}
        <path d="M12 34 L22 26 H40 V74 H22 L12 66 Z" />
        <line x1="40" y1="26" x2="40" y2="74" strokeWidth={2} />
        {/* shank + threaded shaft */}
        <rect x="40" y="42" width="28" height="16" rx="2" />
        <rect x="68" y="42" width="66" height="16" rx="2" />
        {[76, 85, 94, 103, 112, 121, 130].map((x) => (
          <line key={x} x1={x} y1="42" x2={x - 6} y2="58" strokeWidth={2} />
        ))}
        {/* extension lines dropping to the dimension rule */}
        <line
          x1="12"
          y1="78"
          x2="12"
          y2="96"
          strokeWidth={1.5}
          strokeDasharray="3 4"
        />
        <line
          x1="134"
          y1="62"
          x2="134"
          y2="96"
          strokeWidth={1.5}
          strokeDasharray="3 4"
        />
      </g>
      {/* The measurement itself — the thing the customer tells us. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-500"
      >
        <line x1="12" y1="92" x2="134" y2="92" />
        <path d="M20 86 L12 92 L20 98" />
        <path d="M126 86 L134 92 L126 98" />
      </g>
    </svg>
  );
}

/** Step 02 — three sizes on the bench, the right one picked out. */
export function SelectDrawing({ className }: { className?: string }) {
  /** Hex nut path for a given centre and radius. */
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <g {...STROKE}>
        {/* the sizes we didn't pick */}
        <polygon points={hex(28, 60, 20)} />
        <circle cx="28" cy="60" r="9" strokeWidth={2} />
        <polygon points={hex(132, 60, 16)} />
        <circle cx="132" cy="60" r="7" strokeWidth={2} />
      </g>
      {/* The specified nut — larger, drawn in full, ringed as the recommendation. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
        className="text-brand-500"
      >
        <polygon points={hex(80, 56, 26)} />
        <polygon points={hex(80, 56, 19)} strokeWidth={2} />
        <circle cx="80" cy="56" r="12" strokeWidth={2} />
        <circle
          cx="80"
          cy="56"
          r="35"
          strokeWidth={2}
          strokeDasharray="5 6"
          opacity={0.7}
        />
      </g>
    </svg>
  );
}

/** Step 03 — the crate leaving, on the clock. */
export function DispatchDrawing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <g {...STROKE}>
        {/* crate: front face + lid in a shallow isometric */}
        <path d="M46 52 H130 V96 H46 Z" />
        <path d="M46 52 L62 36 H146 L130 52 Z" />
        <path d="M130 52 L146 36 V80 L130 96 Z" />
        {/* strapping */}
        <line x1="88" y1="52" x2="88" y2="96" strokeWidth={2} />
        <line x1="46" y1="74" x2="130" y2="74" strokeWidth={2} />
      </g>
      {/* Motion + the clock face: delivered to the timeline, not "sometime". */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-500"
      >
        <line x1="8" y1="62" x2="32" y2="62" />
        <line x1="14" y1="76" x2="34" y2="76" />
        <line x1="20" y1="90" x2="36" y2="90" />
        <circle cx="118" cy="30" r="17" />
        <path d="M118 20 V30 L125 35" />
      </g>
    </svg>
  );
}
