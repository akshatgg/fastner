/**
 * Hero "product poster" — a composed vector illustration of real fasteners
 * (hex bolt, screw, hex nut, washer) in brushed-steel + brand orange.
 * Pure SVG so it stays razor-sharp at any size.
 */

const boltThreads = Array.from({ length: 11 }, (_, i) => 250 + i * 13);
const screwThreads = Array.from({ length: 13 }, (_, i) => 184 + i * 14);

export default function FastenerPoster({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 470"
      className={className}
      role="img"
      aria-label="Assortment of fasteners — bolts, screws, nuts and washers"
    >
      <defs>
        {/* round metal body */}
        <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6e747e" />
          <stop offset="0.32" stopColor="#eef1f4" />
          <stop offset="0.55" stopColor="#c4c9d0" />
          <stop offset="1" stopColor="#646a74" />
        </linearGradient>
        {/* flat-ish metal (heads / nut top) */}
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef1f4" />
          <stop offset="1" stopColor="#aab0b9" />
        </linearGradient>
        <linearGradient id="steelDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9aa0a9" />
          <stop offset="1" stopColor="#6b717b" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#f26a21" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f26a21" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* warm glow behind the cluster */}
      <ellipse cx="260" cy="230" rx="230" ry="190" fill="url(#glow)" />

      {/* ground shadows */}
      <ellipse cx="135" cy="406" rx="58" ry="13" fill="#000" opacity="0.28" />
      <ellipse cx="320" cy="420" rx="48" ry="11" fill="#000" opacity="0.28" />
      <ellipse cx="205" cy="372" rx="56" ry="13" fill="#000" opacity="0.22" />
      <ellipse cx="372" cy="392" rx="60" ry="14" fill="#000" opacity="0.22" />

      {/* ============ HEX BOLT (standing, side view) ============ */}
      <g>
        {/* head */}
        <path
          d="M90,70 L170,70 L180,80 L180,104 L170,114 L90,114 L80,104 L80,80 Z"
          fill="url(#steel)"
          stroke="#5a606b"
          strokeWidth="2"
        />
        <line x1="107" y1="71" x2="107" y2="113" stroke="#9aa0a9" strokeWidth="2" />
        <line x1="153" y1="71" x2="153" y2="113" stroke="#9aa0a9" strokeWidth="2" />
        {/* collar / washer face */}
        <rect x="96" y="114" width="68" height="12" rx="3" fill="url(#steelDark)" />
        {/* shank */}
        <rect x="108" y="124" width="44" height="280" rx="6" fill="url(#cyl)" />
        {/* threads (lower half) */}
        {boltThreads.map((y) => (
          <line
            key={y}
            x1="108"
            y1={y}
            x2="152"
            y2={y + 8}
            stroke="#5a606b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        {/* highlight */}
        <rect x="116" y="126" width="5" height="276" rx="2" fill="#fff" opacity="0.28" />
      </g>

      {/* ============ SCREW (standing, side view) ============ */}
      <g>
        {/* pan head */}
        <path
          d="M268,150 Q268,132 300,132 Q332,132 332,150 L332,164 L268,164 Z"
          fill="url(#steel)"
          stroke="#5a606b"
          strokeWidth="2"
        />
        {/* phillips cross */}
        <rect x="296" y="140" width="8" height="20" rx="1" fill="#5a606b" />
        <rect x="290" y="146" width="20" height="8" rx="1" fill="#5a606b" />
        {/* body + pointed tip */}
        <path
          d="M289,164 L311,164 L311,372 L300,420 L289,372 Z"
          fill="url(#cyl)"
          stroke="#5a606b"
          strokeWidth="1.5"
        />
        {/* V-threads */}
        {screwThreads.map((y) => (
          <line
            key={y}
            x1="289"
            y1={y}
            x2="311"
            y2={y + 9}
            stroke="#5a606b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        <rect x="294" y="166" width="4" height="200" rx="2" fill="#fff" opacity="0.3" />
      </g>

      {/* ============ HEX NUT (3D top view) ============ */}
      <g transform="translate(205,338)">
        {/* side walls */}
        <path
          d="M-46,0 L-23,40 L23,40 L46,0 L46,18 L23,58 L-23,58 L-46,18 Z"
          fill="url(#steelDark)"
        />
        {/* top face */}
        <polygon
          points="-23,-40 23,-40 46,0 23,40 -23,40 -46,0"
          fill="url(#steel)"
          stroke="#5a606b"
          strokeWidth="2"
        />
        {/* threaded bore */}
        <circle cx="0" cy="0" r="20" fill="#4a4f57" />
        <circle cx="0" cy="-2" r="20" fill="#5e636c" />
        <circle cx="0" cy="0" r="13" fill="#3a3e45" />
      </g>

      {/* ============ WASHER (3D ring) ============ */}
      <g transform="translate(372,366)">
        <ellipse cx="0" cy="8" rx="54" ry="26" fill="url(#steelDark)" />
        <ellipse cx="0" cy="0" rx="54" ry="26" fill="url(#steel)" stroke="#5a606b" strokeWidth="2" />
        <ellipse cx="0" cy="2" rx="24" ry="11" fill="#4a4f57" />
        <ellipse cx="0" cy="0" rx="24" ry="11" fill="#3a3e45" />
      </g>

      {/* small orange accent nut, back-left */}
      <g transform="translate(70,300) scale(0.55)" opacity="0.95">
        <polygon
          points="-23,-40 23,-40 46,0 23,40 -23,40 -46,0"
          fill="#f26a21"
          stroke="#bb3e0e"
          strokeWidth="3"
        />
        <circle cx="0" cy="0" r="18" fill="#1c1c1c" />
      </g>
    </svg>
  );
}
