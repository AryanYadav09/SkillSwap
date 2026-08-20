import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Timer,
  X,
} from "lucide-react";
import { api, getErrorMessage, unwrap } from "../../services/api";
import TimezoneSelector from "./TimezoneSelector";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

const DURATIONS = [15, 30, 45, 60];
const BUFFERS = [0, 5, 10, 15];

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function TimeInput({ value, onChange, label }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <input
        type="time"
        className="input text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}

export default function AvailabilityManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "12:00",
    timezone: defaultTimezone,
    isRecurring: true,
    specificDate: "",
    meetingDuration: 30,
    bufferMinutes: 5,
  });

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/availability/me");
      setSlots(unwrap(res) || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        specificDate: form.isRecurring ? undefined : form.specificDate || undefined,
      };
      await api.post("/availability", payload);
      toast.success("Availability added");
      setShowForm(false);
      fetchSlots();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/availability/${id}`);
      toast.success("Availability removed");
      fetchSlots();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/availability/${id}/toggle`);
      toast.success("Availability toggled");
      fetchSlots();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Preview slots for the current form
  const previewSlots = (() => {
    const [startH, startM] = form.startTime.split(":").map(Number);
    const [endH, endM] = form.endTime.split(":").map(Number);
    const windowMin = (endH * 60 + endM) - (startH * 60 + startM);
    if (windowMin < form.meetingDuration) return [];

    const result = [];
    let current = startH * 60 + startM;
    while (current + form.meetingDuration <= endH * 60 + endM) {
      const sh = String(Math.floor(current / 60)).padStart(2, "0");
      const sm = String(current % 60).padStart(2, "0");
      const end = current + form.meetingDuration;
      const eh = String(Math.floor(end / 60)).padStart(2, "0");
      const em = String(end % 60).padStart(2, "0");
      result.push(`${sh}:${sm} – ${eh}:${em}`);
      current = end + form.bufferMinutes;
    }
    return result;
  })();

  // Group slots by day
  const groupedByDay = DAYS.reduce((acc, day) => {
    const daySlots = slots.filter((s) => s.dayOfWeek === day);
    if (daySlots.length) acc[day] = daySlots;
    return acc;
  }, {});

  return (
    <section className="card border border-gold-500/10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="text-gold-600" size={20} />
          My Availability
        </h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Slot</>}
        </button>
      </div>

      {/* ── Add Availability Form ── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-5 rounded-xl border border-gold-500/20 bg-slate-50 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Day</span>
              <select
                className="input"
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    form.isRecurring
                      ? "bg-gold-600 text-white shadow-sm"
                      : "bg-white border border-line text-gray-600 hover:bg-gold-500/10"
                  }`}
                  onClick={() => setForm({ ...form, isRecurring: true })}
                >
                  Recurring
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    !form.isRecurring
                      ? "bg-gold-600 text-white shadow-sm"
                      : "bg-white border border-line text-gray-600 hover:bg-gold-500/10"
                  }`}
                  onClick={() => setForm({ ...form, isRecurring: false })}
                >
                  One-time
                </button>
              </div>
            </label>
          </div>

          {!form.isRecurring && (
            <label className="grid gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Specific Date</span>
              <input
                type="date"
                className="input"
                value={form.specificDate}
                onChange={(e) => setForm({ ...form, specificDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                required={!form.isRecurring}
              />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TimeInput
              label="Start Time"
              value={form.startTime}
              onChange={(v) => setForm({ ...form, startTime: v })}
            />
            <TimeInput
              label="End Time"
              value={form.endTime}
              onChange={(v) => setForm({ ...form, endTime: v })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Timer size={12} /> Meeting Duration
              </span>
              <select
                className="input"
                value={form.meetingDuration}
                onChange={(e) => setForm({ ...form, meetingDuration: Number(e.target.value) })}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buffer Between</span>
              <select
                className="input"
                value={form.bufferMinutes}
                onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })}
              >
                {BUFFERS.map((b) => (
                  <option key={b} value={b}>{b} minutes</option>
                ))}
              </select>
            </label>
          </div>

          <TimezoneSelector
            value={form.timezone}
            onChange={(tz) => setForm({ ...form, timezone: tz })}
          />

          {/* Slot Preview */}
          {previewSlots.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Generated Slots Preview ({previewSlots.length} slots)
              </p>
              <div className="flex flex-wrap gap-2">
                {previewSlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-lg bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 text-xs font-bold text-gold-600"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Plus size={16} /> Add Availability
            </button>
          </div>
        </form>
      )}

      {/* ── Existing Availability ── */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : Object.keys(groupedByDay).length === 0 ? (
        <div className="py-10 text-center">
          <Clock className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-display text-lg font-bold text-gray-400">No availability set</p>
          <p className="text-sm text-gray-400 mt-1">
            Add your available time slots so others can book sessions with you.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(groupedByDay).map(([day, daySlots]) => (
            <div key={day}>
              <h4 className="text-sm font-bold text-gold-600 uppercase tracking-wider mb-2">
                {DAY_LABELS[day]}
              </h4>
              <div className="grid gap-2">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                      slot.isActive
                        ? "border-gold-500/20 bg-white"
                        : "border-line bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{slot.meetingDuration}min slots</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{slot.bufferMinutes}min buffer</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{slot.timezone}</span>
                        </div>
                      </div>
                      {!slot.isRecurring && slot.specificDate && (
                        <span className="pill text-xs bg-sky-500/10 text-sky-600 border-sky-500/20">
                          One-time
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 rounded-lg hover:bg-gold-500/10 text-gray-400 hover:text-gold-600 transition-colors"
                        onClick={() => handleToggle(slot.id)}
                        title={slot.isActive ? "Disable" : "Enable"}
                      >
                        {slot.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(slot.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
