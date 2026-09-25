import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Check,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  PhoneOff,
  Search,
  Shield,
  Sparkles,
  Star,
  User,
  Users,
  Video,
  X,
  BookOpen,
} from "lucide-react";

import { logout, selectAuth } from "../features/auth/authSlice";
import { getSocket } from "../services/socket";
import { api, getErrorMessage, unwrap } from "../services/api";
import toast from "react-hot-toast";
import Logo from "../components/Logo";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, accessToken } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    if (!accessToken) return;
    api.get("/notifications/unread-count")
      .then((res) => {
        const data = unwrap(res);
        setUnreadCount(data?.unreadCount || 0);
      })
      .catch(() => {});
  }, [accessToken]);

  // Listen for real-time notifications
  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return undefined;

    const handler = () => {
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [accessToken]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/matches", label: "Barter Hub", icon: Users },
    { to: "/meetings", label: "Availability", icon: CalendarDays },
    { to: "/search", label: "Skill Catalog", icon: BookOpen },
    { to: "/chat", label: "Chat", icon: MessageSquare },
    { to: "/profile", label: "My Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* ── Stitch Desktop Sidebar ── */}
      <aside className="fixed left-0 top-0 bottom-0 h-screen w-72 bg-white border-r border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-50 hidden lg:flex flex-col justify-between">
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <Logo to="/dashboard" size="sm" />
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              v2.4
            </span>
          </div>

          {/* Campus status card */}
          <div className="px-5 my-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {user?.college || "Campus Peer Network"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Online Status</span>
                <span className="text-indigo-600 font-semibold truncate">{user?.department || "428 Peers"}</span>
              </div>
            </div>
          </div>

          {/* Vertical Navigation */}
          <nav className="flex flex-col gap-1 px-3 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {user?.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 mt-2 border",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 border-indigo-600"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
                  ].join(" ")
                }
              >
                <Shield size={18} className="text-indigo-600" />
                <span>Admin Command Center</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Profile summary footer card */}
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold text-sm overflow-hidden shrink-0 ring-2 ring-indigo-200">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-900 truncate">{user?.name || "Student"}</span>
              <span className="text-[11px] font-semibold text-indigo-600 truncate">
                {user?.role === "ADMIN" ? "System Admin" : `${user?.semester ? `Sem ${user.semester}` : "Level: Advanced Mentor"}`}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60">
            <span className="text-[11px] font-medium text-slate-500">Swap Rating</span>
            <span className="text-[11px] font-bold text-emerald-600">98% Positive</span>
          </div>
        </div>
      </aside>

      {/* ── Stitch Top Navigation Bar ── */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 z-40 flex items-center justify-between px-4 sm:px-6">
          {/* Left search */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
              <Search size={16} className="text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="Search skills, mentors, or course tags..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="hidden xl:flex items-center gap-1.5">
              {["Python", "CAD", "UI/UX", "Robotics"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 hover:text-slate-900 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-700">Available for Barter</span>
            </div>

            <button
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              onClick={() => setNotificationsOpen(true)}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <Link
              to="/matches"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition"
            >
              <Sparkles size={14} />
              <span>Propose Swap</span>
            </Link>

            <button
              className="flex items-center gap-1.5 p-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ── Main Page Content ── */}
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="h-full w-80 max-w-[86vw] bg-white p-5 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="mb-6 flex items-center justify-between">
                <Logo to="/dashboard" size="md" />
                <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition",
                          isActive
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-slate-700 hover:bg-slate-100",
                        ].join(" ")
                      }
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
                {user?.role === "ADMIN" && (
                  <NavLink
                    to="/admin"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 mt-2"
                  >
                    <Shield size={18} className="text-indigo-600" />
                    <span>Admin Command Center</span>
                  </NavLink>
                )}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          </aside>
        </div>
      )}

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setNotificationsOpen(false)}>
          <aside className="h-full w-96 max-w-[90vw] bg-white border-l border-slate-200 p-5 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell size={20} className="text-indigo-600" />
                Notifications
                {unreadCount > 0 && <span className="text-xs text-white bg-indigo-600 rounded-full px-2 py-0.5">{unreadCount}</span>}
              </h2>
              <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" onClick={() => setNotificationsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NotificationsPanel onClose={() => setNotificationsOpen(false)} onCountChange={(count) => setUnreadCount(count)} />
            </div>
          </aside>
        </div>
      )}

      <IncomingCallModal />
    </div>
  );
}

function IncomingCallModal() {
  const { accessToken } = useSelector(selectAuth);
  const navigate = useNavigate();
  const [call, setCall] = useState(null);

  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return undefined;

    const onIncoming = ({ callerId, callerName, sessionId }) => {
      setCall({ callerId, callerName, sessionId });
    };

    socket.on("call:incoming", onIncoming);
    return () => socket.off("call:incoming", onIncoming);
  }, [accessToken]);

  const accept = () => {
    if (!call) return;
    navigate(
      `/meeting/${call.sessionId}?target=${call.callerId}&name=${encodeURIComponent(call.callerName)}&role=callee`
    );
    setCall(null);
  };

  const reject = () => {
    const socket = getSocket(accessToken);
    if (socket && call) {
      socket.emit("call:reject", { callerId: call.callerId });
    }
    setCall(null);
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-indigo-50 border border-indigo-200">
          <Video size={32} className="text-indigo-600" />
        </div>
        <p className="text-lg font-bold text-slate-900">Incoming Video Call</p>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-bold text-indigo-600">{call.callerName}</span> is calling you for a barter session
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 hover:scale-105"
            onClick={reject}
            title="Reject"
          >
            <PhoneOff size={24} />
          </button>
          <button
            className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600 hover:scale-105"
            onClick={accept}
            title="Accept"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

function getNotifIconLayout(type) {
  switch (type) {
    case "MATCH_REQUEST": case "MATCH_ACCEPTED": case "MATCH_REJECTED": return Users;
    case "SESSION_SCHEDULED": case "SESSION_ACCEPTED": case "SESSION_REJECTED": return CalendarDays;
    case "NEW_MESSAGE": return MessageSquare;
    case "REVIEW_ADDED": return Star;
    default: return Bell;
  }
}

function notifTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(date));
}

function NotificationsPanel({ onClose, onCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useSelector(selectAuth);
  const navigate = useNavigate();

  const loadNotifications = () => {
    api.get("/notifications")
      .then((res) => {
        const data = unwrap(res);
        setItems(data?.items || []);
        if (onCountChange) onCountChange(data?.unreadCount || 0);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen for real-time new notifications
  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return undefined;
    const handler = (notif) => {
      setItems((prev) => [notif, ...prev]);
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [accessToken]);

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
      if (onCountChange) onCountChange(0);
      toast.success("Marked all as read");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const markOne = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setItems((prev) => prev.map((i) => i.id === notifId ? { ...i, isRead: true } : i));
      if (onCountChange) {
        const remaining = items.filter((i) => !i.isRead && i.id !== notifId).length;
        onCountChange(remaining);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMatchAction = async (matchId, action, notifId) => {
    try {
      await api.patch(`/matches/${matchId}/${action}`);
      toast.success(`Match request ${action}ed`);
      await markOne(notifId);
      
      if (action === "accept") {
        try {
          const res = await api.post("/sessions", {
            matchRequestId: matchId,
            title: "Instant Skill Exchange",
            description: "Immediate session started after match acceptance.",
            sessionDate: new Date().toISOString(),
            duration: 60
          });
          const session = res.data?.data || res.data;
          if (session && session.meetingId) {
            navigate(`/meeting/${session.meetingId}`);
          }
        } catch(sessionErr) {
          navigate(`/sessions?matchId=${matchId}`);
        }
        if (onClose) onClose();
      } else {
        loadNotifications();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClick = async (item) => {
    if (!item.isRead) markOne(item.id);
    
    if (item.type === "NEW_MESSAGE" && item.entityId) { 
      navigate(`/chat/${item.entityId}`); 
      onClose?.(); 
    } else if (item.type?.startsWith("SESSION_") && item.entityId) { 
      try {
        const res = await api.get(`/sessions/${item.entityId}`);
        const session = res.data?.data || res.data;
        if (session && session.meetingId) {
          navigate(`/meeting/${session.meetingId}`);
        } else {
          navigate("/sessions");
        }
      } catch (e) {
        navigate("/sessions");
      }
      onClose?.(); 
    } else if (item.type?.startsWith("MATCH_")) { 
      navigate("/matches"); 
      onClose?.(); 
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <button className="btn btn-secondary w-full text-xs" onClick={markAll}>
        <Check size={14} /> Mark all read
      </button>
      {loading ? (
        <div className="animate-pulse space-y-3 py-2">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <Bell size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">No notifications</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => {
            const Icon = getNotifIconLayout(item.type);
            return (
              <div 
                key={item.id} 
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  item.isRead ? "bg-white border-slate-100 text-slate-600" : "bg-indigo-50/50 border-indigo-100 text-slate-900"
                }`}
                onClick={() => handleClick(item)}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{notifTimeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                    {item.type === "MATCH_REQUEST" && !item.isRead && item.entityId && (
                      <div className="flex gap-2 mt-2">
                        <button className="btn btn-primary text-xs px-2.5 py-1" onClick={(e) => { e.stopPropagation(); handleMatchAction(item.entityId, "accept", item.id); }}>
                          <Check size={12} /> Accept
                        </button>
                        <button className="btn btn-secondary text-xs px-2.5 py-1" onClick={(e) => { e.stopPropagation(); handleMatchAction(item.entityId, "reject", item.id); }}>
                          <X size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {!item.isRead && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className={`w-full transition-all duration-300 relative z-10 ${isRegister ? 'max-w-4xl' : 'max-w-md'}`}>
        <section className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/90">
          <div className="mb-8 text-center">
            <Logo to="/login" size="lg" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Share your skills. Learn what you need.</p>
          </div>
          <Outlet />
        </section>
      </div>
    </main>
  );
}
