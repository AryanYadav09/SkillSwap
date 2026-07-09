import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  User,
  Users,
  Video,
  X,
} from "lucide-react";

import { logout, selectAuth } from "../features/auth/authSlice";
import { getSocket } from "../services/socket";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: Search },
  { to: "/skills", label: "Skills", icon: Sparkles },
  { to: "/learning-skills", label: "Learning", icon: GraduationCap },
  { to: "/matches", label: "Matches", icon: Users },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/sessions", label: "Sessions", icon: CalendarDays },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/bookmarks", label: "Saved", icon: Bookmark },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { to: "/admin/users", label: "Users", icon: ShieldCheck },
  { to: "/admin/skills", label: "Admin Skills", icon: Sparkles },
  { to: "/admin/reports", label: "Reports", icon: Bell },
];

function Navigation({ onNavigate }) {
  const { user } = useSelector(selectAuth);
  const links = user?.role === "ADMIN" ? [...mainLinks, ...adminLinks] : mainLinks;

  return (
    <nav className="space-y-1">
      {links.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition",
                isActive
                  ? "bg-forest text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-forest dark:text-slate-300 dark:hover:bg-slate-800",
              ].join(" ")
            }
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("skillswap_theme") === "dark");
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("skillswap_theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-band min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-line bg-white/90 px-4 py-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:block">
        <Link to="/dashboard" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-forest text-white">
            <Sparkles size={21} />
          </span>
          <span>
            <span className="block font-display text-2xl font-bold leading-none text-ink dark:text-white">
              SkillSwap
            </span>
            <span className="text-xs font-bold text-muted">Peer skill barter</span>
          </span>
        </Link>
        <Navigation />
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <aside
            className="h-full w-80 max-w-[86vw] bg-white p-4 shadow-soft dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <Link to="/dashboard" className="font-display text-2xl font-bold text-ink dark:text-white">
                SkillSwap
              </Link>
              <button className="btn btn-secondary px-2" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <Navigation onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-3">
            <button className="btn btn-secondary px-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink dark:text-white">
                {user?.name || "SkillSwap"}
              </p>
              <p className="truncate text-xs text-muted dark:text-slate-400">
                {user?.college || "Exchange skills with students"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="btn btn-secondary px-2" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="btn btn-secondary px-2 sm:px-4" onClick={handleLogout}>
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
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
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-forest/20">
          <Video size={32} className="text-forest" />
        </div>
        <p className="text-lg font-bold text-white">Incoming Video Call</p>
        <p className="mt-2 text-sm text-slate-400">
          <span className="font-bold text-white">{call.callerName}</span> is calling you
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600 hover:scale-110"
            onClick={reject}
            title="Reject"
          >
            <PhoneOff size={24} />
          </button>
          <button
            className="grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white transition hover:bg-green-600 hover:scale-110"
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

export function AuthLayout() {
  return (
    <main className="page-band min-h-screen px-4 py-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-forest/20 bg-white/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-forest">
              Student barter network
            </p>
            <h1 className="font-display text-6xl font-bold leading-tight text-ink">
              Trade what you know. Learn what you need.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              A clean workspace for matching skills, chatting, scheduling sessions, and building trust through reviews.
            </p>
          </div>
        </section>

        <section className="glass rounded-lg p-5 sm:p-6">
          <Link to="/login" className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-forest text-white">
              <Sparkles size={20} />
            </span>
            <span className="font-display text-2xl font-bold text-ink">SkillSwap</span>
          </Link>
          <Outlet />
        </section>
      </div>
    </main>
  );
}
