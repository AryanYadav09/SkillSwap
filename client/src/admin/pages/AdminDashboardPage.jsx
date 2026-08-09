import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Flag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi as api, getErrorMessage, unwrap } from "../adminApi";
import { useSelector } from "react-redux";
import { selectAdmin } from "../../features/admin/adminSlice";

function StatCard({ label, value, icon: Icon, color = "emerald", trend }) {
  const colorMap = {
    emerald: "admin-stat-emerald",
    blue: "admin-stat-blue",
    violet: "admin-stat-violet",
    amber: "admin-stat-amber",
    rose: "admin-stat-rose",
  };
  return (
    <div className={`admin-stat-card ${colorMap[color]}`}>
      <div className="admin-stat-icon-wrap">
        <Icon size={22} />
      </div>
      <div>
        <p className="admin-stat-label">{label}</p>
        <p className="admin-stat-value">{value ?? "—"}</p>
        {trend != null && (
          <p className="admin-stat-trend">
            <TrendingUp size={12} /> {trend} this week
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { admin } = useSelector(selectAdmin);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setData(unwrap(res)))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">Overview</p>
          <h1 className="admin-page-title">
            Welcome back, {admin?.name?.split(" ")[0] ?? "Admin"} 👋
          </h1>
          <p className="admin-page-desc">
            Here's what's happening across SkillSwap today.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="admin-stats-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="admin-stat-card admin-stat-skeleton" />
          ))}
        </div>
      ) : (
        <div className="admin-stats-grid">
          <StatCard
            label="Total Users"
            value={data?.totalUsers}
            icon={Users}
            color="emerald"
          />
          <StatCard
            label="Total Skills"
            value={data?.totalSkills}
            icon={Sparkles}
            color="blue"
          />
          <StatCard
            label="Matches"
            value={data?.totalMatches}
            icon={BarChart3}
            color="violet"
          />
          <StatCard
            label="Sessions"
            value={data?.totalSessions}
            icon={CalendarDays}
            color="amber"
          />
          <StatCard
            label="Pending Reports"
            value={data?.reportsPending}
            icon={Flag}
            color="rose"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="admin-quick-section">
        <h2 className="admin-section-heading">Quick Actions</h2>
        <div className="admin-quick-grid">
          <a href="/admin/users" className="admin-quick-card">
            <Users size={24} className="admin-quick-icon" />
            <p className="admin-quick-label">Manage Users</p>
            <p className="admin-quick-desc">Activate, ban or delete accounts</p>
          </a>
          <a href="/admin/skills" className="admin-quick-card">
            <Sparkles size={24} className="admin-quick-icon" />
            <p className="admin-quick-label">Manage Skills</p>
            <p className="admin-quick-desc">Review and remove skill catalog</p>
          </a>
          <a href="/admin/reports" className="admin-quick-card">
            <Flag size={24} className="admin-quick-icon" />
            <p className="admin-quick-label">Review Reports</p>
            <p className="admin-quick-desc">
              {data?.reportsPending
                ? `${data.reportsPending} pending`
                : "No pending reports"}
            </p>
          </a>
        </div>
      </div>

      {/* Alert if pending reports */}
      {data?.reportsPending > 0 && (
        <div className="admin-alert-banner">
          <AlertTriangle size={18} />
          <span>
            There {data.reportsPending === 1 ? "is" : "are"}{" "}
            <strong>{data.reportsPending}</strong> pending{" "}
            {data.reportsPending === 1 ? "report" : "reports"} awaiting review.
          </span>
          <a href="/admin/reports" className="admin-alert-link">
            Review now →
          </a>
        </div>
      )}
    </div>
  );
}
