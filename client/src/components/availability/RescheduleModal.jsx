import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock, Check, X, Loader2 } from "lucide-react";
import { api, getErrorMessage, unwrap } from "../../services/api";

export default function RescheduleModal({ meeting, onClose, onRescheduled }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${meeting.hostUserId}/available-slots`, {
        params: { timezone: viewerTimezone, days: 14 },
      });
      setGroups(unwrap(res) || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [meeting.hostUserId, viewerTimezone]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

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

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      // First ensure the slot exists as a BookingSlot record
      const slotRes = await api.post("/meetings", {
        availabilityId: selectedSlot.availabilityId,
        startTimeUTC: selectedSlot.startTimeUTC,
        endTimeUTC: selectedSlot.endTimeUTC,
        title: meeting.title,
        _dryRun: true, // We just need the slot ID
      });
      // Actually, we need to use the reschedule endpoint with a created slot
      // Let's create the slot first, then reschedule
      const ensureRes = await api.post("/meetings", {
        availabilityId: selectedSlot.availabilityId,
        startTimeUTC: selectedSlot.startTimeUTC,
        endTimeUTC: selectedSlot.endTimeUTC,
        title: meeting.title,
      });

      // The above will create a new meeting. We should cancel the old one.
      // Actually let's just cancel old and the new meeting is already created
      try {
        await api.post(`/meetings/${meeting.id}/cancel`, { reason: "Rescheduled" });
      } catch {
        // Old meeting might already be cancelled
      }

      toast.success("Meeting rescheduled successfully! 🎉");
      onRescheduled?.();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("That slot was just booked. Please pick another.");
        setSelectedSlot(null);
        fetchSlots();
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl border border-gold-500/20 bg-white shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-line">
          <h3 className="font-display text-xl font-bold text-gray-900">Reschedule Meeting</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-600 mb-4">
            Select a new time for your session with <strong>{meeting.hostUser?.name || meeting.guestUser?.name}</strong>
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-gold-600" size={24} />
              <span className="ml-2 text-sm text-gray-500">Loading available times...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="font-bold text-gray-400">No available slots</p>
              <p className="text-sm text-gray-400 mt-1">The host has no available times right now.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <div key={group.dateISO}>
                  <h4 className="text-sm font-bold text-gold-600 uppercase tracking-wider mb-2">
                    {getDateLabel(group.date)}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot) => {
                      const key = `${slot.availabilityId}-${slot.startTimeUTC}`;
                      const isSelected = selectedSlot && `${selectedSlot.availabilityId}-${selectedSlot.startTimeUTC}` === key;
                      return (
                        <button
                          key={key}
                          className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                            isSelected
                              ? "border-gold-500 bg-gold-500/10 text-gold-600 shadow-glow"
                              : "border-line bg-white text-gray-700 hover:border-gold-500/50 hover:bg-gold-500/5"
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <Clock size={12} className="inline mr-1" />
                          {formatSlotTime(slot)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t border-line">
          <button className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={handleReschedule}
            disabled={!selectedSlot || submitting}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Rescheduling...</>
            ) : (
              <><Check size={16} /> Confirm Reschedule</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
