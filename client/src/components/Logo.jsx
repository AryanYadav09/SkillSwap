import { Sparkles } from "lucide-react";
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
      box: "h-7 w-7 rounded-md",
      icon: 14,
      text: "text-lg",
    },
    md: {
      box: "h-9 w-9 rounded-md",
      icon: 18,
      text: "text-xl",
    },
    lg: {
      box: "h-12 w-12 rounded-xl",
      icon: 24,
      text: "text-3xl",
    },
  };

  const config = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid ${config.box} place-items-center bg-gradient-to-br from-gold-400 to-gold-600 text-obsidian shadow-glow shrink-0`}
      >
        <Sparkles size={config.icon} />
      </span>
      {showText && (
        <span
          className={`font-display ${config.text} font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600 ${textClassName}`}
        >
          SkillSwap
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
