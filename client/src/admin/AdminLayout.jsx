import "./admin.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";

import { adminLogout, selectAdmin } from "../features/admin/adminSlice";

const adminNavLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/skills", label: "Skills", icon: BookOpen },
  { to: "/admin/reports", label: "Reports", icon: Flag },
];

function AdminNav({ onNavigate }) {
  return (
    <nav className="admin-nav">
      {adminNavLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              ["admin-nav-link", isActive ? "admin-nav-link--active" : ""].join(" ")
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

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("skillswap_admin_theme") === "dark");
  const { admin } = useSelector(selectAdmin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleDark = () => {
    setDark((v) => {
      const next = !v;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("skillswap_admin_theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = async () => {
    await dispatch(adminLogout());
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="admin-app-bg min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar hidden lg:flex">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <span className="admin-sidebar-logo-title">SkillSwap</span>
            <span className="admin-sidebar-logo-sub">Admin Console</span>
          </div>
        </div>

        <div className="admin-sidebar-divider" />

        <div className="admin-sidebar-section-label">Navigation</div>
        <AdminNav />

        <div className="admin-sidebar-spacer" />
        <div className="admin-sidebar-divider" />

        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">
            {admin?.name?.charAt(0) ?? "A"}
          </div>
          <div className="admin-sidebar-user-info">
            <p className="admin-sidebar-user-name">{admin?.name ?? "Admin"}</p>
            <p className="admin-sidebar-user-role">Administrator</p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="admin-sidebar admin-sidebar--mobile h-full w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="admin-sidebar-logo">
                <div className="admin-sidebar-logo-icon">
                  <Shield size={18} />
                </div>
                <span className="admin-sidebar-logo-title">Admin Console</span>
              </div>
              <button
                className="admin-icon-btn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <AdminNav onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="admin-topbar">
          <button
            className="admin-icon-btn lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-400" />
            <span className="admin-topbar-title">Admin Dashboard</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="admin-icon-btn"
              onClick={toggleDark}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link to="/dashboard" className="admin-topbar-user-link">
              <Sparkles size={14} />
              <span className="hidden sm:inline">User App</span>
            </Link>

            <button
              id="admin-logout-btn"
              className="admin-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
