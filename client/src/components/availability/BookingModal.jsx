import { useState } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock, Check, X, Loader2, Globe } from "lucide-react";
import { api, getErrorMessage, unwrap } from "../../services/api";

export default function BookingModal({ slot, userName, viewerTimezone, onClose, onBooked }) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("Skill Exchange Session");

  const startDate = new Date(slot.startTimeUTC);
  const endDate = new Date(slot.endTimeUTC);

  const formatDate = (d) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: viewerTimezone,
    }).format(d);

  const formatTime = (d) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: viewerTimezone,
    }).format(d);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await api.post("/meetings", {
        availabilityId: slot.availabilityId,
        startTimeUTC: slot.startTimeUTC,
        endTimeUTC: slot.endTimeUTC,
        title,
      });
      toast.success("Session booked successfully! 🎉");
      onBooked?.();
    } catch (err) {
      const message = getErrorMessage(err);
      if (err.response?.status === 409) {
        toast.error("This slot was just booked by another user. Please select a different time.");
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-gold-500/20 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-gray-900">Confirm Booking</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gold-500/5 border border-gold-500/10">
            <div className="p-2 rounded-lg bg-gold-500/10">
              <Calendar className="text-gold-600" size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Session with {userName || slot.hostName}</p>
              <p className="text-sm text-gray-600 mt-1">{formatDate(startDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-line">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-gold-600" />
                <span className="text-xs font-bold text-gray-500 uppercase">Time</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatTime(startDate)} – {formatTime(endDate)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-line">
              <div className="flex items-center gap-2 mb-1">
                <Globe size={14} className="text-gold-600" />
                <span className="text-xs font-bold text-gray-500 uppercase">Timezone</span>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">
                {viewerTimezone}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-line text-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Duration</span>
            <p className="text-lg font-bold text-gold-600">{slot.duration} minutes</p>
          </div>

          {/* Session title */}
          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session Title (optional)</span>
            <input
              className="input text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Mentoring Session"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="btn btn-secondary flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Booking...</>
            ) : (
              <><Check size={16} /> Confirm Booking</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
