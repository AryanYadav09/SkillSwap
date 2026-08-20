import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Video,
  X,
  UserRound,
} from "lucide-react";
import { selectAuth } from "../features/auth/authSlice";
import { api, getErrorMessage, unwrap } from "../services/api";
import { getSocket } from "../services/socket";
import RescheduleModal from "../components/availability/RescheduleModal";

const TABS = [
  { key: "SCHEDULED", label: "Upcoming", icon: Calendar },
  { key: "COMPLETED", label: "Completed", icon: CalendarCheck },
  { key: "CANCELLED", label: "Cancelled", icon: CalendarX },
];

export default function MeetingDashboard() {
  const { user, accessToken } = useSelector(selectAuth);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("SCHEDULED");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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

  // Real-time updates
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
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: viewerTimezone,
    }).format(new Date(d));

  const formatTime = (d) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: viewerTimezone,
    }).format(new Date(d));

  const getOtherUser = (meeting) =>
    meeting.hostUserId === user?.id ? meeting.guestUser : meeting.hostUser;

  const statusColors = {
    SCHEDULED: "bg-green-500/10 text-green-600 border-green-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    COMPLETED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
    NO_SHOW: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label mb-2">Scheduled</p>
          <h1 className="section-title">My Meetings</h1>
        </div>
        <button className="btn btn-secondary" onClick={fetchMeetings}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-line bg-slate-50 p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              tab === key
                ? "bg-gradient-to-r from-gold-600 to-gold-500 text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-white"
            }`}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
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
        <div className="card py-10 text-center">
          <Calendar className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-display text-xl font-bold text-gray-400">
            No {tab.toLowerCase()} meetings
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">
            {tab === "SCHEDULED"
              ? "Browse users and book available sessions to get started."
              : `Your ${tab.toLowerCase()} meetings will appear here.`}
          </p>
          {tab === "SCHEDULED" && (
            <Link to="/search" className="btn btn-primary mt-4 inline-flex">
              Find Users
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.map((meeting) => {
            const other = getOtherUser(meeting);
            const isHost = meeting.hostUserId === user?.id;

            return (
              <article
                key={meeting.id}
                className="card border border-gold-500/10 hover:border-gold-500/30 transition-all duration-200"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/10 text-gold-600 font-bold text-sm">
                      {other?.profileImage ? (
                        <img className="h-full w-full rounded-xl object-cover" src={other.profileImage} alt="" />
                      ) : (
                        other?.name?.charAt(0) || <UserRound size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{meeting.title}</p>
                      <p className="text-sm text-gold-600 font-semibold">
                        with {other?.name || "User"}
                        <span className="text-gray-400 font-normal ml-1">
                          ({isHost ? "Host" : "Guest"})
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className={`pill text-xs font-bold ${statusColors[meeting.status]}`}>
                    {meeting.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-line">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar size={12} className="text-gold-600" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatDate(meeting.startTime)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-line">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock size={12} className="text-gold-600" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Time</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {meeting.status === "SCHEDULED" && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                    <Link
                      to={`/meeting/${meeting.meetingToken}`}
                      className="btn btn-primary"
                    >
                      <Video size={16} /> Join Meeting
                    </Link>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setRescheduleTarget(meeting)}
                    >
                      <RefreshCw size={14} /> Reschedule
                    </button>
                    <button
                      className="btn btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200"
                      onClick={() => cancelMeeting(meeting.id)}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}

                {meeting.status === "CANCELLED" && meeting.cancelReason && (
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Reason: {meeting.cancelReason}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
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
    </>
  );
}
