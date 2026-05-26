/**
 * Decorative line-art fasteners (hex nuts + a bolt) used as a faint
 * background motif. Uses `currentColor` so opacity/colour is set by the parent.
 */

export function HexNut({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* outer hex body */}
      <polygon points="95,50 72.5,88.97 27.5,88.97 5,50 27.5,11.03 72.5,11.03" />
      {/* chamfer + threaded bore */}
      <polygon
        points="83,50 66.5,78.6 33.5,78.6 17,50 33.5,21.4 66.5,21.4"
        strokeWidth={2}
      />
      <circle cx="50" cy="50" r="22" />
      <circle cx="50" cy="50" r="16" strokeWidth={2} strokeDasharray="3 4" />
    </svg>
  );
}

export function BoltSide({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* hex head */}
      <path d="M6 26 L18 14 H42 L42 66 H18 L6 54 Z" />
      <line x1="42" y1="14" x2="42" y2="66" strokeWidth={2} />
      {/* shank */}
      <rect x="42" y="28" width="42" height="24" rx="2" />
      {/* threaded shaft */}
      <rect x="84" y="28" width="108" height="24" rx="2" />
      {[96, 108, 120, 132, 144, 156, 168, 180].map((x) => (
        <line key={x} x1={x} y1="28" x2={x - 8} y2="52" strokeWidth={2} />
      ))}
    </svg>
  );
}
