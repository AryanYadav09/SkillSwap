import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
 Bell,
 Bookmark,
 CalendarDays,
 GraduationCap,
 LayoutDashboard,
 LogOut,
 Menu,
 MessageSquare,
 Moon,
 Phone,
 PhoneOff,
 Search,
 Sparkles,
 Star,
 Sun,
 User,
 Users,
 Video,
 X,
 Check,
} from "lucide-react";

import { logout, selectAuth } from "../features/auth/authSlice";
import { getSocket } from "../services/socket";
import { api, getErrorMessage, unwrap } from "../services/api";
import toast from "react-hot-toast";

const mainLinks = [
 { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
 { to: "/search", label: "Search", icon: Search },
 { to: "/matches", label: "Matches", icon: Users },
 { to: "/chat", label: "Chat", icon: MessageSquare },
];

const profileLinks = [
 { to: "/skills", label: "Skills", icon: Sparkles },
 { to: "/learning-skills", label: "Learning", icon: GraduationCap },
 { to: "/sessions", label: "Sessions", icon: CalendarDays },
 { to: "/reviews", label: "Reviews", icon: Star },
 { to: "/bookmarks", label: "Saved", icon: Bookmark },
 { to: "/profile", label: "Profile", icon: User },
];

function Navigation({ onNavigate, mobile = false }) {
 const links = mainLinks;

 return (
 <nav className={mobile ? "space-y-1" : "hidden lg:flex items-center space-x-2"}>
 {links.map((item) => {
 const Icon = item.icon;

 return (
 <NavLink
 key={item.to}
 to={item.to}
 onClick={onNavigate}
 className={({ isActive }) =>
 [
 "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all duration-300",
 isActive
 ? "bg-gold-500/10 text-gold-600 border border-gold-500/20 shadow-glow"
 : "text-gray-600 hover:bg-charcoal hover:text-gold-600",
 !mobile && "whitespace-nowrap"
 ].filter(Boolean).join(" ")
 }
 >
 <Icon size={16} />
 <span className={!mobile ? "hidden xl:inline" : ""}>{item.label}</span>
 </NavLink>
 );
 })}
 </nav>
 );
}

function ProfileDropdown({ onNavigate }) {
 const [open, setOpen] = useState(false);

 return (
 <div className="relative">
 <button 
 className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-gray-600 hover:bg-charcoal hover:text-gold-600 transition-all duration-300"
 onClick={() => setOpen(!open)}
 >
 <User size={16} />
 <span className="hidden xl:inline">Account & Profile</span>
 </button>
 
 {open && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
 <div className="absolute right-0 mt-2 w-56 rounded-md border border-line bg-charcoal shadow-glow-lg z-50 overflow-hidden">
 <div className="py-1">
 {profileLinks.map((item) => {
 const Icon = item.icon;
 return (
 <Link
 key={item.to}
 to={item.to}
 onClick={() => { setOpen(false); onNavigate?.(); }}
 className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-obsidian hover:text-gold-600"
 >
 <Icon size={16} />
 {item.label}
 </Link>
 );
 })}
 </div>
 </div>
 </>
 )}
 </div>
 );
}

export function AppLayout() {
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [notificationsOpen, setNotificationsOpen] = useState(false);
 const [unreadCount, setUnreadCount] = useState(0);
 const { user, accessToken } = useSelector(selectAuth);
 const dispatch = useDispatch();
 const navigate = useNavigate();

 useEffect(() => {
 document.documentElement.classList.add("dark");
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

 return (
 <div className="page-band min-h-screen bg-obsidian">
 {/* Sleek Top Navigation Bar */}
 <header className="sticky top-0 z-40 border-b border-line bg-charcoal/80 backdrop-blur-xl shadow-sm">
 <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
 <div className="flex items-center gap-6">
 <Link to="/dashboard" className="flex items-center gap-2">
 <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 text-obsidian shadow-glow">
 <Sparkles size={18} />
 </span>
 <span className="hidden sm:block font-display text-xl font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">
 SkillSwap
 </span>
 </Link>
 
 <div className="hidden h-6 w-px bg-line lg:block"></div>
 
 {/* Desktop Navigation */}
 <Navigation />
 <div className="hidden lg:block">
 <ProfileDropdown />
 </div>
 </div>

 <div className="flex items-center gap-4">
 <button className="btn btn-secondary px-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
 <Menu size={18} />
 </button>
 
 <div className="hidden min-w-0 text-right sm:block">
 <p className="truncate text-sm font-bold text-gray-900">
 {user?.name || "SkillSwap"}
 </p>
 <p className="truncate text-xs text-gold-600/70">
 {user?.college || "Exchange skills with students"}
 </p>
 </div>
 
 <button 
 className="btn border border-gold-500/30 bg-gold-500/10 px-2 sm:px-3 text-gold-600 hover:bg-gold-500/20 shadow-none relative" 
 onClick={() => { setNotificationsOpen(true); }}
 title="Notifications"
 >
 <Bell size={16} />
 {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
 </button>
 <button 
 className="btn border border-red-900/30 bg-red-900/10 px-2 sm:px-4 text-red-400 hover:bg-red-900/30 hover:border-red-900/50 hover:text-red-300 shadow-none" 
 onClick={handleLogout}
 title="Logout"
 >
 <LogOut size={16} />
 <span className="hidden sm:inline">Logout</span>
 </button>
 </div>
 </div>
 </header>

 {/* Mobile Sidebar Overlay */}
 {sidebarOpen ? (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
 <aside
 className="h-full w-80 max-w-[86vw] bg-charcoal border-r border-line p-4 shadow-glow-lg"
 onClick={(event) => event.stopPropagation()}
 >
 <div className="mb-5 flex items-center justify-between">
 <Link to="/dashboard" className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">
 SkillSwap
 </Link>
 <button className="btn btn-secondary px-2" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
 <X size={18} />
 </button>
 </div>
 <Navigation mobile={true} onNavigate={() => setSidebarOpen(false)} />
 <div className="mt-6 border-t border-line pt-4">
 <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Your Account</p>
 <nav className="space-y-1">
 {profileLinks.map((item) => {
 const Icon = item.icon;
 return (
 <NavLink
 key={item.to}
 to={item.to}
 onClick={() => setSidebarOpen(false)}
 className={({ isActive }) =>
 [
 "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all duration-300",
 isActive
 ? "bg-gold-500/10 text-gold-600 border border-gold-500/20 shadow-glow"
 : "text-gray-600 hover:bg-charcoal hover:text-gold-600"
 ].join(" ")
 }
 >
 <Icon size={16} />
 {item.label}
 </NavLink>
 );
 })}
 </nav>
 </div>
 </aside>
 </div>
 ) : null}

 {/* Notifications Side Drawer */}
 {notificationsOpen ? (
 <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setNotificationsOpen(false)}>
 <aside
 className="h-full w-96 max-w-[90vw] bg-charcoal border-l border-line p-4 shadow-glow-lg flex flex-col"
 onClick={(event) => event.stopPropagation()}
 >
 <div className="mb-5 flex items-center justify-between">
 <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
 <Bell size={20} className="text-gold-600" />
 Notifications
 {unreadCount > 0 && <span className="text-xs text-gold-600 bg-gold-500/10 rounded-full px-2 py-0.5">{unreadCount}</span>}
 </h2>
 <button className="btn btn-secondary px-2" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
 <X size={18} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto">
 <NotificationsPanel 
 onClose={() => setNotificationsOpen(false)} 
 onCountChange={(count) => setUnreadCount(count)} 
 />
 </div>
 </aside>
 </div>
 ) : null}

 <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
 <Outlet />
 </main>
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
 <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md">
 <div className="mx-4 w-full max-w-sm rounded-2xl border border-gold-500/20 bg-charcoal p-8 text-center shadow-glow-lg">
 <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gold-500/10 border border-gold-500/30">
 <Video size={32} className="text-gold-600" />
 </div>
 <p className="text-lg font-bold text-gray-900">Incoming Video Call</p>
 <p className="mt-2 text-sm text-gray-600">
 <span className="font-bold text-gold-600">{call.callerName}</span> is calling you
 </p>
 <div className="mt-8 flex items-center justify-center gap-6">
 <button
 className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-gray-900 transition hover:bg-red-600 hover:scale-110"
 onClick={reject}
 title="Reject"
 >
 <PhoneOff size={24} />
 </button>
 <button
 className="grid h-14 w-14 place-items-center rounded-full bg-green-500 text-gray-900 transition hover:bg-green-600 hover:scale-110"
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
 <div className="animate-pulse flex space-x-4">
 <div className="flex-1 space-y-4 py-1">
 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
 <div className="h-4 bg-slate-200 rounded"></div>
 </div>
 </div>
 ) : items.length === 0 ? (
 <div className="text-center py-8">
 <Bell size={32} className="mx-auto text-gray-600 mb-3" />
 <p className="text-sm text-gray-500">No notifications</p>
 <p className="text-xs text-gray-600 mt-1">You're all caught up!</p>
 </div>
 ) : (
 <div className="grid gap-2">
 {items.map((item) => {
 const Icon = getNotifIconLayout(item.type);
 return (
 <div 
 key={item.id} 
 className={`notif-card notif-item ${item.isRead ? "notif-card-read" : ""}`}
 onClick={() => handleClick(item)}
 >
 <div className="flex items-start gap-3">
 <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-500/10 text-gold-600">
 <Icon size={16} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
 <span className="text-[10px] text-gray-500 whitespace-nowrap">{notifTimeAgo(item.createdAt)}</span>
 </div>
 <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.message}</p>
 {item.type === "MATCH_REQUEST" && !item.isRead && item.entityId && (
 <div className="flex gap-2 mt-2">
 <button className="btn btn-primary text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); handleMatchAction(item.entityId, "accept", item.id); }}>
 <Check size={12} /> Accept
 </button>
 <button className="btn btn-secondary text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); handleMatchAction(item.entityId, "reject", item.id); }}>
 <X size={12} /> Reject
 </button>
 </div>
 )}
 </div>
 {!item.isRead && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-400 shadow-glow" />}
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
 <main className="page-band min-h-screen flex items-center justify-center px-4 py-8">
 <div className={`w-full transition-all duration-300 ${isRegister ? 'max-w-4xl' : 'max-w-md'}`}>
 <section className="glass rounded-2xl p-6 sm:p-10 shadow-glow-lg">
 <div className="mb-10 text-center">
 <Link to="/login" className="inline-flex items-center justify-center gap-3">
 <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-obsidian shadow-glow">
 <Sparkles size={24} />
 </span>
 <span className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">SkillSwap</span>
 </Link>
 <p className="mt-3 text-sm text-gray-600">Share your skills. Learn what you need.</p>
 </div>
 <Outlet />
 </section>
 </div>
 </main>
 );
}
