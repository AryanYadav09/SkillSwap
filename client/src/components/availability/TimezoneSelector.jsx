import { useState, useMemo } from "react";
import { Globe } from "lucide-react";

const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function TimezoneSelector({ value, onChange, className = "" }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const allTimezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return COMMON_TIMEZONES;
    }
  }, []);

  const filtered = useMemo(() => {
    if (!search) return COMMON_TIMEZONES;
    const q = search.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(q));
  }, [search, allTimezones]);

  const currentOffset = useMemo(() => {
    if (!value) return "";
    try {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: value,
        timeZoneName: "shortOffset",
      }).format(now);
      const match = formatted.match(/GMT[+-]\d+/);
      return match ? ` (${match[0]})` : "";
    } catch {
      return "";
    }
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <label className="grid gap-1.5">
        <span className="label flex items-center gap-1.5">
          <Globe size={14} /> Timezone
        </span>
        <div
          className="input cursor-pointer flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">
            {value ? `${value}${currentOffset}` : "Select timezone..."}
          </span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </label>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-line bg-white shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-line">
            <input
              className="input w-full text-sm"
              placeholder="Search timezones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">No timezones found</p>
            ) : (
              filtered.map((tz) => (
                <button
                  key={tz}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 transition-colors ${
                    value === tz ? "bg-gold-500/10 text-gold-600 font-bold" : "text-gray-700"
                  }`}
                  onClick={() => {
                    onChange(tz);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {tz}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
