import { Link } from "react-router-dom";

export default function Logo({
  size = "md",
  showText = true,
  to,
  className = "",
  textClassName = "",
}) {
  const sizeMap = {
    sm: {
      svgSize: 32,
      text: "text-lg",
      gap: "gap-2",
    },
    md: {
      svgSize: 38,
      text: "text-xl",
      gap: "gap-2.5",
    },
    lg: {
      svgSize: 52,
      text: "text-3xl",
      gap: "gap-3",
    },
  };

  const config = sizeMap[size] || sizeMap.md;

  const logoMark = (
    <svg
      width={config.svgSize}
      height={config.svgSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      <defs>
        <linearGradient id="logo-stitch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="60%" stopColor="#3525cd" />
          <stop offset="100%" stopColor="#00687a" />
        </linearGradient>
        <linearGradient id="logo-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="logo-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c3c0ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#57dffe" stopOpacity="0.5" />
        </linearGradient>
        <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3525cd" floodOpacity="0.3" />
        </filter>
      </defs>

      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logo-stitch-grad)" filter="url(#logo-shadow)" />
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logo-sheen)" />
      <rect x="2.5" y="2.5" width="43" height="43" rx="11.5" stroke="url(#logo-stroke)" strokeWidth="1" fill="none" />

      <g fill="#FFFFFF">
        {/* Central 4-pointed Barter Sparkle */}
        <path d="M 21 12 Q 21 24 33 24 Q 21 24 21 36 Q 21 24 9 24 Q 21 24 21 12 Z" opacity="0.98" />
        {/* Reciprocal Top-Right Sparkle in Mint */}
        <path d="M 33 8.5 Q 33 14 38.5 14 Q 33 14 33 19.5 Q 33 14 27.5 14 Q 33 14 33 8.5 Z" fill="#6ffbbe" />
        {/* Ambient Cyan Accent Dot */}
        <circle cx="12" cy="33" r="1.5" fill="#acedff" opacity="0.9" />
      </g>
    </svg>
  );

  const content = (
    <div className={`group inline-flex items-center ${config.gap} ${className}`}>
      {logoMark}
      {showText && (
        <span
          className={`font-display ${config.text} font-black tracking-tight text-slate-900 select-none ${textClassName}`}
        >
          Skill<span className="text-indigo-600">Swap</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
