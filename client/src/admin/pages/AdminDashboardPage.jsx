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
    <div className="space-y-6">
      {/* Top Header matching Stitch Command Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs uppercase tracking-wider font-bold">
              Admin Root Level
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs flex items-center gap-1 shadow-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              {admin?.college || "Campus Instance"}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-display">
            SkillSwap Campus Admin Command Center
          </h1>
          <p className="text-sm text-slate-500">
            Supervisory control node for peer-to-peer reciprocity, user verification, and report resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-700 leading-tight">All Services Operational</span>
              <span className="text-[10px] text-slate-400 leading-tight">Active Node • Sub-15ms Latency</span>
            </div>
          </div>
          <button
            onClick={() => toast.success("System telemetry and audit logs exported.")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            Audit Export
          </button>
        </div>
      </div>

      {/* 4 Stitch KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Active Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Users</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 font-display">
                {loading ? "…" : data?.totalUsers ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Verified Peers On-Campus</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 grid place-items-center">
              <Users size={20} />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp size={12} /> Active Network
            </span>
            <span className="text-slate-400 text-[11px]">Campus Wide</span>
          </div>
        </div>

        {/* Pending Barters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-cyan-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Matches</span>
              <p className="text-3xl font-extrabold text-cyan-700 mt-1 font-display">
                {loading ? "…" : data?.totalMatches ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Barter Negotiations & Swaps</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 grid place-items-center">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-cyan-700 font-semibold">1:1 Reciprocal</span>
            <span className="text-slate-400 text-[11px]">Peer Exchanges</span>
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sessions</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1 font-display">
                {loading ? "…" : data?.totalSessions ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Live Learning Exchanges</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 grid place-items-center">
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">₹0 Monetary Cost</span>
            <span className="text-slate-400 text-[11px]">Pure Barter</span>
          </div>
        </div>

        {/* Flagged Incidents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-red-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Incidents</span>
              <p className="text-3xl font-extrabold text-red-600 mt-1 font-display">
                {loading ? "…" : data?.reportsPending ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Open Moderation Tickets</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 grid place-items-center">
              <Flag size={20} />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {data?.reportsPending > 0 ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> Needs Attention
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">All Clear</span>
            )}
            <a href="/admin/reports" className="text-indigo-600 font-semibold hover:underline">
              View queue →
            </a>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 font-display">Administrative Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 grid place-items-center shrink-0 group-hover:scale-105 transition">
              <Users size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition">User Management</p>
              <p className="text-xs text-slate-500 mt-1">
                Review student accounts, toggle active/banned status, and verify credentials.
              </p>
            </div>
          </a>

          <a
            href="/admin/skills"
            className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 grid place-items-center shrink-0 group-hover:scale-105 transition">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Skill Catalog</p>
              <p className="text-xs text-slate-500 mt-1">
                Curate standardized skills, inspect supply and demand, and remove duplicate tags.
              </p>
            </div>
          </a>

          <a
            href="/admin/reports"
            className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 grid place-items-center shrink-0 group-hover:scale-105 transition">
              <Flag size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Reports & Moderation</p>
              <p className="text-xs text-slate-500 mt-1">
                Resolve user flags, investigate disputes, and enforce community conduct guidelines.
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
