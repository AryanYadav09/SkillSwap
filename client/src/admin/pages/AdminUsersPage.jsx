import { useEffect, useState } from "react";
import {
  Ban,
  CheckCircle,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi as api, getErrorMessage, unwrap } from "../adminApi";

function UserRow({ user, onAction }) {
  return (
    <div className="admin-table-row">
      <div className="admin-user-avatar">
        {user.profileImage ? (
          <img src={user.profileImage} alt="" className="admin-user-avatar-img" />
        ) : (
          <span>{user.name?.charAt(0) ?? "?"}</span>
        )}
      </div>
      <div className="admin-user-info">
        <p className="admin-user-name">{user.name}</p>
        <p className="admin-user-email">{user.email}</p>
        <p className="admin-user-meta">
          {user.college} · Sem {user.semester} ·{" "}
          <span
            className={`admin-status-pill admin-status-${(user.status ?? "ACTIVE").toLowerCase()}`}
          >
            {user.status ?? "ACTIVE"}
          </span>
        </p>
      </div>
      <div className="admin-row-actions">
        <button
          id={`activate-${user.id}`}
          className="admin-action-btn admin-action-activate"
          onClick={() => onAction(user.id, "ACTIVE")}
          title="Activate"
        >
          <CheckCircle size={15} />
          <span className="hidden sm:inline">Activate</span>
        </button>
        <button
          id={`ban-${user.id}`}
          className="admin-action-btn admin-action-ban"
          onClick={() => onAction(user.id, "BANNED")}
          title="Ban"
        >
          <Ban size={15} />
          <span className="hidden sm:inline">Ban</span>
        </button>
        <button
          id={`delete-${user.id}`}
          className="admin-action-btn admin-action-delete"
          onClick={() => onAction(user.id, "DELETE")}
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((v) => v + 1);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/users")
      .then((res) => setUsers(unwrap(res)?.items ?? unwrap(res) ?? []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  const handleAction = async (id, action) => {
    try {
      if (action === "DELETE") {
        if (!window.confirm("Permanently delete this user?")) return;
        await api.delete(`/admin/users/${id}`);
        toast.success("User deleted");
      } else {
        await api.patch(`/admin/users/${id}/status`, { status: action });
        toast.success(`User ${action === "ACTIVE" ? "activated" : "banned"}`);
      }
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">Administration</p>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-desc">
            {users.length} total users registered on SkillSwap.
          </p>
        </div>
        <button
          id="admin-users-reload"
          className="admin-btn-secondary"
          onClick={reload}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="admin-search-wrap">
        <Search size={16} className="admin-search-icon" />
        <input
          id="admin-users-search"
          className="admin-search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-skeleton-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="admin-skeleton-row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <UserRound size={40} className="admin-empty-icon" />
          <p className="admin-empty-title">No users found</p>
          <p className="admin-empty-desc">Try a different search term.</p>
        </div>
      ) : (
        <div className="admin-table">
          {filtered.map((user) => (
            <UserRow key={user.id} user={user} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
