import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { api, getErrorMessage, unwrap } from "../../services/api";
import BookingModal from "./BookingModal";

export default function AvailableSlots({ userId, userName }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${userId}/available-slots`, {
        params: { timezone: viewerTimezone, days: 14 },
      });
      setGroups(unwrap(res) || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId, viewerTimezone]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleBookingComplete = () => {
    setSelectedSlot(null);
    fetchSlots();
  };

  // Label helper: "Today", "Tomorrow", or the full date
  const getDateLabel = (dateStr) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = new Intl.DateTimeFormat("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: viewerTimezone,
    }).format(today);

    const tomorrowStr = new Intl.DateTimeFormat("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: viewerTimezone,
    }).format(tomorrow);

    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrowStr) return "Tomorrow";
    return dateStr;
  };

  // Format time from the slot's local time string
  const formatSlotTime = (slot) => {
    const start = new Date(slot.startTimeUTC);
    const end = new Date(slot.endTimeUTC);
    const fmt = (d) =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: viewerTimezone,
      }).format(d);
    return `${fmt(start)} – ${fmt(end)}`;
  };

  if (loading) {
    return (
      <section className="card border border-gold-500/10">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-gold-600" size={20} />
          Available Sessions
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gold-600" size={24} />
          <span className="ml-2 text-sm text-gray-500">Loading available sessions...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="card border border-gold-500/10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="text-gold-600" size={20} />
          Available Sessions
        </h3>
        <span className="text-xs text-gray-400 font-medium">
          Times in {viewerTimezone}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="mx-auto mb-3 text-gray-300" size={36} />
          <p className="font-display text-lg font-bold text-gray-400">No available sessions</p>
          <p className="text-sm text-gray-400 mt-1">
            This user hasn't set up availability yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {groups.map((group) => (
            <div key={group.dateISO}>
              <h4 className="text-sm font-bold text-gold-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar size={14} />
                {getDateLabel(group.date)}
              </h4>
              <div className="flex flex-wrap gap-2">
                {group.slots.map((slot) => (
                  <button
                    key={`${slot.availabilityId}-${slot.startTimeUTC}`}
                    className="group relative rounded-xl border border-gold-500/20 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:border-gold-500 hover:bg-gold-500/5 hover:text-gold-600 hover:shadow-glow transition-all duration-200"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-gold-500 group-hover:text-gold-600" />
                      {formatSlotTime(slot)}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-1 group-hover:text-gold-500">
                      {slot.duration} min • Click to book
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Booking Modal ── */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          userName={userName}
          viewerTimezone={viewerTimezone}
          onClose={() => setSelectedSlot(null)}
          onBooked={handleBookingComplete}
        />
      )}
    </section>
  );
}
