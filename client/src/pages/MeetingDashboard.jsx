import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  RefreshCw,
  Video,
  X,
  UserRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { selectAuth } from "../features/auth/authSlice";
import { api, getErrorMessage, unwrap } from "../services/api";
import { getSocket } from "../services/socket";
import RescheduleModal from "../components/availability/RescheduleModal";

const TABS = [
  { key: "SCHEDULED", label: "Upcoming Swaps", icon: Calendar },
  { key: "COMPLETED", label: "Completed History", icon: CalendarCheck },
  { key: "CANCELLED", label: "Cancelled", icon: CalendarX },
];

export default function MeetingDashboard() {
  const { user, accessToken } = useSelector(selectAuth);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("SCHEDULED");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [duration, setDuration] = useState(60);
  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/meetings", { params: { status: tab } });
      const data = unwrap(res);
      setMeetings(data?.items || data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return;
    const handler = () => fetchMeetings();
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [accessToken, fetchMeetings]);

  const cancelMeeting = async (id) => {
    try {
      await api.post(`/meetings/${id}/cancel`, { reason: "User cancelled" });
      toast.success("Meeting cancelled");
      fetchMeetings();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const formatDate = (d) =>
    new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: viewerTimezone,
    }).format(new Date(d));

  const formatTime = (d) =>
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: viewerTimezone,
    }).format(new Date(d));

  const getOtherUser = (meeting) =>
    meeting.hostUserId === user?.id ? meeting.guestUser : meeting.hostUser;

  const statusColors = {
    SCHEDULED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
    COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    NO_SHOW: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stitch Scheduler Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200/90">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute right-64 -bottom-20 w-64 h-64 rounded-full bg-cyan-400/5 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg ring-2 ring-indigo-200">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 font-display">{user?.name}</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  {user?.college || "Campus Peer Network"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Times shown in IST (UTC+5:30) • Synced with campus academic timetable
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDuration(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  duration === 30 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Minutes
              </button>
              <button
                type="button"
                onClick={() => setDuration(60)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  duration === 60 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                60 Minutes (Standard Barter)
              </button>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
              <span className="material-symbols-outlined text-[15px]">lock_clock</span>
              <span>1 Barter Credit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Availability Controls + Meetings Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Weekly Load Quotient & Recurring Presets (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Weekly Load Quotient Card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Weekly Barter Load</span>
              <span className="text-xs text-emerald-600 font-bold">
                {meetings.length} of 6 slots booked
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (meetings.length / 6) * 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Optimal balance for coursework</span>
              <span className="text-indigo-600 font-semibold">
                {Math.round(Math.min(100, (meetings.length / 6) * 100))}% Capacity
              </span>
            </div>
          </div>

          {/* Availability Settings Widget */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Availability</h3>
                <p className="text-xs text-slate-500">Recurring swap windows</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Active
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-lg">sync_saved_locally</span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Calendar Sync</p>
                  <p className="text-[10px] text-slate-500">Google Calendar & Campus Portal</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                Connected
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Presets</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toast.success("Preset applied: Evening 4pm-7pm")}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                >
                  After Classes (4pm-7pm)
                </button>
                <button
                  type="button"
                  onClick={() => toast.success("Preset applied: Weekend 10am-2pm")}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                >
                  Weekend Deep Dive (10am-2pm)
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-600 text-2xl">balance</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-indigo-900">1:1 Mutual Barter Balance</span>
                <span className="text-[11px] text-slate-600 leading-tight">
                  You give 1 hr, your partner gives 1 hr. Zero currency transaction.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scheduled Meetings Feed (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    tab === key
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setTab(key)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <button
              className="btn btn-secondary text-xs self-start sm:self-auto"
              onClick={fetchMeetings}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="card py-12 text-center bg-white border border-slate-200">
              <Calendar className="mx-auto mb-3 text-slate-300" size={40} />
              <p className="font-display text-lg font-bold text-slate-800">
                No {tab.toLowerCase()} meetings
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                {tab === "SCHEDULED"
                  ? "Propose a barter or book available sessions to begin exchanging skills."
                  : `Your ${tab.toLowerCase()} exchange sessions will be logged here.`}
              </p>
              {tab === "SCHEDULED" && (
                <Link to="/search" className="btn btn-primary mt-4 inline-flex text-xs">
                  <Sparkles size={14} /> Discover Peers
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => {
                const other = getOtherUser(meeting);
                const isHost = meeting.hostUserId === user?.id;

                return (
                  <article
                    key={meeting.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                          {other?.profileImage ? (
                            <img className="h-full w-full rounded-xl object-cover" src={other.profileImage} alt="" />
                          ) : (
                            other?.name?.charAt(0) || <UserRound size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{meeting.title || "Skill Barter Exchange"}</p>
                          <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                            with {other?.name || "Peer"}
                            <span className="text-slate-400 font-normal ml-1">
                              ({isHost ? "Host" : "Guest"})
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className={`pill text-[11px] font-bold border ${statusColors[meeting.status]}`}>
                        {meeting.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Calendar size={12} className="text-indigo-600" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{formatDate(meeting.startTime)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Clock size={12} className="text-indigo-600" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                        </p>
                      </div>
                    </div>

                    {meeting.status === "SCHEDULED" && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                        <Link
                          to={`/meeting/${meeting.meetingToken}`}
                          className="btn btn-primary text-xs flex items-center gap-1.5"
                        >
                          <Video size={14} /> Join Video Classroom
                        </Link>
                        <button
                          className="btn btn-secondary text-xs"
                          onClick={() => setRescheduleTarget(meeting)}
                        >
                          <RefreshCw size={13} /> Reschedule
                        </button>
                        <button
                          className="btn btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200 text-xs"
                          onClick={() => cancelMeeting(meeting.id)}
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    )}

                    {meeting.status === "CANCELLED" && meeting.cancelReason && (
                      <p className="text-xs text-slate-400 italic">
                        Reason: {meeting.cancelReason}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          meeting={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null);
            fetchMeetings();
          }}
        />
      )}
    </div>
  );
}
