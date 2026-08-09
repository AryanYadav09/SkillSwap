import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Flag,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi as api, getErrorMessage, unwrap } from "../adminApi";

const STATUS_COLORS = {
  PENDING: "admin-report-pending",
  RESOLVED: "admin-report-resolved",
  REJECTED: "admin-report-rejected",
};

const STATUS_ICONS = {
  PENDING: Clock,
  RESOLVED: CheckCircle,
  REJECTED: XCircle,
};

function ReportCard({ report, onUpdate }) {
  const StatusIcon = STATUS_ICONS[report.status] ?? Clock;

  return (
    <div className={`admin-report-card admin-report-card--${(report.status ?? "PENDING").toLowerCase()}`}>
      <div className="admin-report-card-header">
        <div className="admin-report-reason-wrap">
          <AlertTriangle size={16} className="admin-report-icon" />
          <span className="admin-report-reason">{report.reason}</span>
        </div>
        <span className={`admin-status-pill ${STATUS_COLORS[report.status] ?? "admin-report-pending"}`}>
          <StatusIcon size={12} />
          {report.status}
        </span>
      </div>

      <p className="admin-report-desc">{report.description}</p>

      <div className="admin-report-meta">
        {report.reporter && (
          <span>
            Reported by:{" "}
            <strong className="admin-report-user">{report.reporter.name}</strong>
          </span>
        )}
        {report.reportedUser && (
          <span>
            Against:{" "}
            <strong className="admin-report-user">{report.reportedUser.name}</strong>
          </span>
        )}
      </div>

      {report.status === "PENDING" && (
        <div className="admin-report-actions">
          <button
            id={`resolve-${report.id}`}
            className="admin-action-btn admin-action-activate"
            onClick={() => onUpdate(report.id, "RESOLVED")}
          >
            <CheckCircle size={15} />
            Resolve
          </button>
          <button
            id={`reject-${report.id}`}
            className="admin-action-btn admin-action-ban"
            onClick={() => onUpdate(report.id, "REJECTED")}
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((v) => v + 1);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/reports")
      .then((res) => setReports(unwrap(res)?.items ?? unwrap(res) ?? []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  const handleUpdate = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}/status`, { status });
      toast.success(`Report ${status.toLowerCase()}`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = reports.filter((r) => {
    const matchFilter = filter === "ALL" || r.status === filter;
    const matchSearch =
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedUser?.name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    ALL: reports.length,
    PENDING: reports.filter((r) => r.status === "PENDING").length,
    RESOLVED: reports.filter((r) => r.status === "RESOLVED").length,
    REJECTED: reports.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">Safety</p>
          <h1 className="admin-page-title">Report Management</h1>
          <p className="admin-page-desc">
            {counts.PENDING} pending · {counts.RESOLVED} resolved · {counts.REJECTED} rejected
          </p>
        </div>
        <button
          id="admin-reports-reload"
          className="admin-btn-secondary"
          onClick={reload}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="admin-filter-tabs">
        {["ALL", "PENDING", "RESOLVED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            id={`filter-${tab.toLowerCase()}`}
            className={`admin-filter-tab ${filter === tab ? "admin-filter-tab--active" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="admin-search-wrap">
        <Search size={16} className="admin-search-icon" />
        <input
          id="admin-reports-search"
          className="admin-search-input"
          placeholder="Search reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Reports */}
      {loading ? (
        <div className="admin-skeleton-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-skeleton-row admin-skeleton-tall" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <Flag size={40} className="admin-empty-icon" />
          <p className="admin-empty-title">No reports found</p>
          <p className="admin-empty-desc">Try changing the filter or search term.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
